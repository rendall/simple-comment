import * as dotenv from "dotenv"
const path = require("path")
const miniCssExtractPlugin = require("mini-css-extract-plugin")
const sveltePreprocess = require("svelte-preprocess")
const webpack = require("webpack")

dotenv.config({
  path: path.join(__dirname, ".env")
})

const mode = process.env.NODE_ENV || "development"

module.exports = {
  mode,
  entry: {
    "simple-comment-svelte": path.resolve(
      __dirname,
      "src/dist/js/simple-comment-svelte.ts"
    )
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
      {
        test: /\.ts$/,
        loader: "ts-loader",
        // options: { configFile: "tsconfig.json" },
        exclude: /node_modules/
      },
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
        exclude: [],
        use: {
          loader: "svelte-loader",
          options: {
            preprocess: sveltePreprocess({
              /* options */
            })
          }
        }
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
