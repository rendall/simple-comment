const path = require("path");
const webpack = require("webpack")
const dotenv = require('dotenv');
dotenv.config({
  path: path.join(__dirname, '.env')
})

module.exports = {
  mode: "production",
  entry: [path.resolve(__dirname, "src/dist/js/simple-comment.ts")],
  devtool: "inline-source-map",
  output: {
    filename: "simple-comment.js",
    path: path.resolve(__dirname, "dist/js")
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: "ts-loader" }
    ]
  },
  plugins: [
    new webpack.EnvironmentPlugin(['SIMPLE_COMMENT_API_URL'])
  ]
};
