const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const path = require("path")

module.exports = {
  mode: "development",
  entry: {
    "simple-comment-style": path.resolve(
      __dirname,
      "src/scss/simple-comment-style.scss"
    ),
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "src", "static", "css"),
  },
  plugins: [new MiniCssExtractPlugin({ filename: "[name].css" })],
}
