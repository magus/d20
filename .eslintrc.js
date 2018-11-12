const OFF = 0;
const WARN = 1;
const ERROR = 2;

module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  parser: "babel-eslint",
  extends: [
    "eslint:recommended",
    "plugin:react/recommended"
  ],
  parserOptions: {
    ecmaVersion: 9,
    ecmaFeatures: {
      jsx: true
    },
    sourceType: "module"
  },
  plugins: ["react", "flowtype"],
  rules: {
    "no-console": OFF,
    "flowtype/define-flow-type": [1],

    "react/prop-types": OFF,
    "react/jsx-uses-vars": [2],
    "react/display-name": OFF,
  }
}
