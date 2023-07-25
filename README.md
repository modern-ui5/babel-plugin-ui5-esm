# babel-plugin-ui5-esm

A Babel plugin that transforms ES module-style UI5 imports into UI5-compatible
code.

This plugin works weĺl with the
[official UI5 TypeScript types](https://sap.github.io/ui5-typescript/) and is
also compatible with Webpack, thus enables you to develop UI5 applications using
modern tools.

## Install

```sh
npm install --save-dev babel-plugin-ui5-esm
```

Add it to your Babel configuration:

```ts
{
  ...
  "plugins": ["ui5-esm"],
  ...
}
```

## How Does it Work?

This plugin will detect any imports that start with `sap/` and transforms it
into an import of a temporary module with a top-level await call to
`sap.ui.require`. For example, say we have the following import:

```ts
import Button from "sap/m/Button";
```

It will be transformed into something equivalent to:

```ts
import Button from "./tmpModuleButton.js";
```

where `tmpModuleButton.js` looks like:

```ts
export default await new Promise((resolve) =>
  sap.ui.require(["sap/m/Button"], (Button) => resolve(Button))
);
```

Of course, no new files will be written, but instead we will be transforming it
into a Data URI representation that can be imported.

Dynamic imports are also supported and will be directly transformed into a
`Promise`.

## Why Not Use [babel-plugin-transform-modules-ui5](https://github.com/ui5-community/babel-plugin-transform-modules-ui5/tree/main)?

babel-plugin-transform-modules-ui5 will try to rewrite all ES module-style
imports/exports into UI5-style requires/defines which will result in subtle
differences in expected behavior. The transformed code will not be ES modules
anymore, thus cannot be imported normally by other ES modules.

This plugin will not change the static imports directly into `sap.ui.define`
calls, but tries to write ES module code that also works with UI5, therefore the
transformed code will still be ES modules and won't break standards-compliant
tooling that depend on ES modules, such as TypeScript, Webpack, etc.
