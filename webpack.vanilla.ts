import * as dotenv from "dotenv"
const path = require("path")
const webpack = require("webpack")
dotenv.config({
  path: path.join(__dirname, ".env")
})

module.exports = {
  mode: "production",
  entry: {
    "simple-comment": path.resolve(__dirname, "src/dist/js/simple-comment.ts"),
  },
  devtool: "inline-source-map",
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist/js")
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [{
      test: /\.ts$/,
      loader: "ts-loader",
      options: { configFile: "tsconfig.vanilla.json" },
      exclude: /node_modules/
    }]
  },
  plugins: [new webpack.EnvironmentPlugin(["SIMPLE_COMMENT_API_URL"])]
}
