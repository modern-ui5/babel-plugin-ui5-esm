import type { PluginObj } from "@babel/core";
import type { ImportSpecifier, Identifier } from "@babel/types";

type Babel = typeof import("@babel/core");

export default function ({ types: t, template }: Babel): PluginObj {
  return {
    name: "babel-plugin-ui5-esm",
    visitor: {
      ImportDeclaration(path) {
        const { node } = path;

        if (
          node.source.type === "StringLiteral" &&
          node.source.value.startsWith("sap/")
        ) {
          // Rewrite static sap/* imports into a top-level-await module awaiting
          // on an sap.ui.require call

          node.source.value =
            "data:text/javascript;charset=utf-8," +
            `export default await new Promise(r=>sap.ui.require(${JSON.stringify(
              [node.source.value]
            )},r))`;

          // Convert star imports into a default import and named imports into a
          // default import with destructuring

          if (node.specifiers[0]?.type === "ImportNamespaceSpecifier") {
            node.specifiers = [
              t.importDefaultSpecifier(
                t.identifier(node.specifiers[0].local.name)
              ),
            ];
          } else {
            const namedSpecifiers = node.specifiers.filter(
              (node): node is ImportSpecifier & { imported: Identifier } =>
                node.type === "ImportSpecifier" &&
                node.imported.type === "Identifier"
            );

            if (namedSpecifiers.length > 0) {
              const importIdentifier =
                node.specifiers.find(
                  (node) => node.type === "ImportDefaultSpecifier"
                )?.local.name ?? `__tmp${Math.random().toString().slice(2)}`;

              node.specifiers = [
                t.importDefaultSpecifier(t.identifier(importIdentifier)),
              ];

              path.insertAfter(
                template.ast(`
                  const {
                    ${namedSpecifiers
                      .map((node) =>
                        node.imported.name === node.local.name
                          ? node.local.name
                          : `${node.imported.name}: ${node.local.name}`
                      )
                      .join(", ")}
                  } = ${importIdentifier};
                `)
              );
            }
          }
        }
      },

      CallExpression(path) {
        const { node } = path;

        if (
          node.callee.type === "Import" &&
          node.arguments[0]?.type === "StringLiteral" &&
          node.arguments[0].value.startsWith("sap/")
        ) {
          const ui5Id = node.arguments[0].value;

          // Replace dynamic imports with a promisified sap.ui.require call

          path.replaceWith(
            template.expression.ast(`
              new Promise(resolve => 
                sap.ui.require(
                  ${JSON.stringify([ui5Id])}, 
                  result => resolve(Object.assign(result, { default: result }))
                )
              )
            `)
          );
        }
      },
    },
  };
}
