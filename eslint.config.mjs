import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    rules: {
      "no-redeclare": "warn",
      "no-unused-vars": "off",
      "react/no-typos": "warn",
      "react/prop-types": "off",
      "react/no-danger": "error",
      "react/display-name": "warn",
      "react/jsx-fragments": "error",
      "react/button-has-type": "error",
      "react/jsx-pascal-case": "error",
      "react/no-children-prop": "error",
      "react/self-closing-comp": "warn",
      "react/react-in-jsx-scope": "off",
      "react/jsx-no-script-url": "error",
      "react/jsx-no-leaked-render": "off",
      "react/no-unused-prop-types": "error",
      "react/jsx-no-useless-fragment": "warn",
      "react/jsx-curly-brace-presence": "warn",
      "react/no-danger-with-children": "error",
      "react/prefer-stateless-function": "error",
      "react/jsx-one-expression-per-line": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn"],
      "react/no-unstable-nested-components": ["error", { allowAsProps: true }],
      "react/destructuring-assignment": [
        "error",
        "always",
        { destructureInSignature: "always" },
      ],
      "react/jsx-key": [
        "error",
        {
          checkFragmentShorthand: true,
          checkKeyMustBeforeSpread: true,
          warnOnDuplicates: true,
        },
      ],
    }
  }
]);

export default eslintConfig;
