const path = require("path")
const sveltePreprocess = require("svelte-preprocess")
const webpack = require("webpack")
const CopyWebpackPlugin = require("copy-webpack-plugin")

// const LicensePlugin = require('webpack-license-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const dotenv = require("dotenv")

dotenv.config({
  path: path.join(__dirname, ".env"),
})

const mode = process.env.NODE_ENV ?? "development"
const isProduction = mode === "production"

module.exports = {
  mode,
  performance: {
    hints: isProduction ? "warning" : false,
  },
  stats: {
    // Examine all modules
    modules: true,
    // Display bailout reasons
    optimizationBailout: true,
  },
  devServer: {
    client: { overlay: false, },
    compress: true,
    port: 5000,
    static: path.join(__dirname, "dist"),
  },
  devtool: "source-map",
  entry: {
    "simple-comment": path.resolve(__dirname, "src/simple-comment.ts"),
    "svelte": path.resolve(__dirname, "src/svelte.ts"),
    "svelte-login": path.resolve(__dirname, "src/svelte-login.ts"),
    "simple-comment-login": path.resolve( __dirname, "src/simple-comment-login.ts"),
    "simple-comment-style": path.resolve(__dirname, "src/scss/simple-comment-style.scss"),
  },
  module: {
    rules: [
      {
        test: /\.svelte$/,
        use: {
          loader: "svelte-loader",
          options: {
            compilerOptions: { dev: !isProduction, },
            emitCss: false,
            hotReload: false,
            preprocess: sveltePreprocess(),
          },
        },
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader'
        ]
      }, 
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              url: false, // necessary if you use url('/path/to/some/asset.png|jpg|gif')
            }
          }
        ]
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
    // new LicensePlugin(),
    new MiniCssExtractPlugin({ filename: 'css/[name].css' }),
    new webpack.EnvironmentPlugin(["SIMPLE_COMMENT_API_URL"]),
  ],
  resolve: {
    alias: { svelte: path.resolve("node_modules", "svelte") },
    conditionNames: ["svelte"],
    extensions: [".ts", ".tsx", ".js", ".svelte"],
  },
}
