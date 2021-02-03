const path = require("path");
const webpack = require("webpack")
const dotenv = require('dotenv');
const sveltePreprocess = require("svelte-preprocess")
const preprocess = sveltePreprocess({ typescript: true })
const ExtractCssChunks = require("extract-css-chunks-webpack-plugin")

if (!process.env.NODE_ENV) dotenv.config({
  path: path.join(__dirname, '.env')
})

const mode = process.env.NODE_ENV || "development"
const dev = mode === "development"
const isProductionMode = mode === "production"

console.info(`Compiling in '${mode}' mode`, {
  NODE_ENV: process.env.NODE_ENV,
  isProductionMode,
})

module.exports = {
  mode,
  devServer: {
    contentBase: "./dist",
    hot: !isProductionMode,
    historyApiFallback: true,
    proxy: {
      "/.netlify/functions": {
        target: "http://localhost:9000",
        pathRewrite: { "^/.netlify/functions": "" },
      },
    },
  },
  devtool: isProductionMode ? false : "inline-source-map",
  entry: {
    "simple-comment": ["./src/dist/js/simple-comment.ts", "./src/dist/css/simple-comment.scss"]
  },
  module: {
    rules: [
      {
        test: /\.svelte$/,
        use: {
          loader: "svelte-loader-hot",
          options: {
            dev,
            preprocess,
            emitCss: isProductionMode,
            hotReload: !isProductionMode,
            hotOptions: {
              noPreserveState: false,
              noPreserveStateKey: "@!hmr",
              noReload: false,
              optimistic: false,
              acceptAccessors: true,
              acceptNamedExports: true,
            },
          },
        },
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: ExtractCssChunks.loader,
            options: { hmr: !isProductionMode },
          },
          "css-loader",
          "sass-loader",
        ],
      },
      {
        test: /\.ts$/,
        use: "ts-loader"
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg|otf)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[path][name].[ext]",
              context: "./src/static"
            },
          },],
      },],
  },
  output: {
    path: __dirname + "/dist",
    filename: "[name].js",
    chunkFilename: "[name].[id].js",
  },
  plugins: [
    new webpack.EnvironmentPlugin(['SIMPLE_COMMENT_API_URL']),
    new ExtractCssChunks({
      filename: "[name].css",
      chunkFilename: "[id].css",
    }),
  ],
  resolve: {
    alias: {
      svelte: path.resolve("node_modules",
        "svelte"),
    },
    extensions: [
      ".mjs",
      ".js",
      ".svelte",
      ".ts"
    ],
    mainFields: [
      "svelte",
      "browser",
      "module", "main"]
  },
};
