import { pluginTester } from "babel-plugin-tester";
import plugin from "../dist/main.js";

pluginTester({
  plugin,
  tests: [
    {
      title: "Static default imports",
      code: `
        import Button from "sap/m/Button";
        import Dialog from "sap/m/Dialog";
      `,
      output: `
        import Button from 'data:text/javascript;charset=utf-8,export default await new Promise(r=>sap.ui.require(["sap/m/Button"],r))';
        import Dialog from 'data:text/javascript;charset=utf-8,export default await new Promise(r=>sap.ui.require(["sap/m/Dialog"],r))';
      `,
    },
    {
      title: "Static named imports",
      code: `
        import Button, { ButtonType } from "sap/m/Button";
        import Dialog, { DialogType as DiagType } from "sap/m/Dialog";
      `,
      output: `
        import Button from 'data:text/javascript;charset=utf-8,export default await new Promise(r=>sap.ui.require(["sap/m/Button"],r))';
        const { ButtonType } = Button;
        import Dialog from 'data:text/javascript;charset=utf-8,export default await new Promise(r=>sap.ui.require(["sap/m/Dialog"],r))';
        const { DialogType: DiagType } = Dialog;
      `,
    },
    {
      title: "Static star imports",
      code: `
        import * as lib from "sap/m/library";
      `,
      output: `
        import lib from 'data:text/javascript;charset=utf-8,export default await new Promise(r=>sap.ui.require(["sap/m/library"],r))';
      `,
    },
    {
      title: "Dynamic imports",
      code: `
        const Button = (await import("sap/m/Button")).default;
      `,
      output: `
        const Button = (
          await new Promise((resolve) =>
            sap.ui.require(["sap/m/Button"], (result) =>
              resolve(
                Object.assign(result, {
                  default: result,
                })
              )
            )
          )
        ).default;
      `,
    },
  ],
});
