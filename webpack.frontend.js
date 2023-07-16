const path = require("path")
const webpack = require("webpack")
const dotenv = require("dotenv")
const CopyWebpackPlugin = require("copy-webpack-plugin")
const sveltePreprocess = require("svelte-preprocess")

const mode = "development"

dotenv.config({
  path: path.join(__dirname, ".env"),
})

module.exports = {
  stats: {
    // Examine all modules
    modules: true,
    // Display bailout reasons
    optimizationBailout: true,
  },
  devServer: {
    static: path.join(__dirname, "dist"),
    compress: true,
    port: 5000,
  },
  devtool: "inline-source-map",
  entry: {
    "simple-comment": path.resolve(__dirname, "src/simple-comment.ts"),
    "svelte": path.resolve(__dirname, "src/svelte.ts"),
    "svelte-login": path.resolve(__dirname, "src/svelte-login.ts"),
    "simple-comment-login": path.resolve(
      __dirname,
      "src/simple-comment-login.ts"
    ),
    "all-comments": path.resolve(__dirname, "src/all-comments.ts"),
  },
  mode,
  module: {
    rules: [
      {
        test: /\.svelte$/,
        use: {
          loader: "svelte-loader",
          options: {
            emitCss: false,
            hotReload: false,
            preprocess: sveltePreprocess(),
          },
        },
      },
      {
        test: /\.ts$/,
        loader: "ts-loader",
        exclude: [/node_modules/, /tests/],
        options: { configFile: "tsconfig.frontend.json" },
      },
      {
        test: /node_modules\/svelte\/.*\.mjs$/,
        resolve: { fullySpecified: false },
      },
    ],
  },
  output: { filename: "js/[name].js", path: path.resolve(__dirname, "dist") },
  plugins: [
    new CopyWebpackPlugin({ patterns: [{ from: "src/static", to: "." }] }),
    new webpack.EnvironmentPlugin(["SIMPLE_COMMENT_API_URL"]),
  ],
  resolve: {
    alias: { svelte: path.resolve("node_modules", "svelte") },
    conditionNames: ["svelte"],
    extensions: [".ts", ".tsx", ".js", ".svelte"],
  },
}
