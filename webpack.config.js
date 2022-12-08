const path = require("path")
const webpack = require("webpack")
const dotenv = require("dotenv")
const miniCssExtractPlugin = require("mini-css-extract-plugin")
dotenv.config({
  path: path.join(__dirname, ".env")
})
const mode = process.env.NODE_ENV || "development"
module.exports = {
  mode,
  entry: {
    "simple-comment": path.resolve(__dirname, "src/dist/js/simple-comment.ts"),
    "simple-comment-svelte": path.resolve(__dirname, "src/dist/js/simple-comment-svelte.js"),
    "all-comments": path.resolve(__dirname, "src/dist/js/all-comments.ts")
  },
  devtool: "inline-source-map",
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist/js")
  },
  resolve: {
    alias: {
      svelte: path.resolve("node_modules", "svelte")
    },
    extensions: [".ts", ".mjs", ".js", ".svelte"],
    mainFields: ["svelte", "browser", "module", "main"]
  },
  module: {
    rules: [
      { test: /\.ts$/, use: ["ts-loader"] },
      {
        test: /\.css$/,
        use: [
          miniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              url: false // necessary if you use url('/path/to/some/asset.png|jpg|gif')
            }
          }
        ]
      },
      {
        test: /\.(html|svelte)$/,
        use: "svelte-loader"
      },
      {
        // required to prevent errors from Svelte on Webpack 5+
        // q.v. https://github.com/sveltejs/template-webpack/blob/master/webpack.config.js
        test: /node_modules\/svelte\/.*\.mjs$/,
        resolve: { fullySpecified: false }
      }
    ]
  },
  plugins: [
    new webpack.EnvironmentPlugin(["SIMPLE_COMMENT_API_URL"]),
    new miniCssExtractPlugin({ filename: "[name].css" })
  ]
}
