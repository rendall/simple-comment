var path = require("path");

module.exports = {
  mode: "production",
  entry: path.resolve(__dirname, "src/dist/js/simple-comment.ts"),
  devtool: "inline-source-map",
  output: {
    path: path.resolve(__dirname, "dist/js"),
    filename: "simple-comment.js"
  },
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, loader: "ts-loader" }
    ]
  }
};
