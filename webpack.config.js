const path = require("path");
const webpack = require("webpack")
const dotenv = require('dotenv');
dotenv.config({
  path: path.join(__dirname, '.env')
})

module.exports = {
  mode: "production",
  entry: { "simple-comment": path.resolve(__dirname, "src/dist/js/simple-comment.ts"), "all-comments": path.resolve(__dirname, "src/dist/js/all-comments.ts") },
  devtool: "inline-source-map",
  output: {
    filename: '[name].js',
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
