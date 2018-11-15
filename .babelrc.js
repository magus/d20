const env = process.env.BABEL_ENV || process.env.NODE_ENV;

const plugins = [
  ["babel-plugin-root-import"],
  ["babel-plugin-transform-flow-strip-types"],
  [
    "babel-plugin-styled-components",
    {
      "ssr": true,
      "displayName": true,
      "preprocess": false
    }
  ]
];

if (env === 'production') {
  plugins.push(
    ["react-intl", {
      "messagesDir": "lang/.messages/"
    }]
  );
}

module.exports = {
  "presets": [["next/babel"]],
  "plugins": plugins,
};
