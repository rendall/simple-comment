// const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin
const CopyWebpackPlugin = require("copy-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const TerserPlugin = require("terser-webpack-plugin")
const path = require("path")
const sveltePreprocess = require("svelte-preprocess")
const webpack = require("webpack")
// const LicensePlugin = require('webpack-license-plugin')

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
    client: { overlay: false },
    compress: true,
    port: 5000,
    static: path.join(__dirname, "dist"),
  },
  devtool: "source-map",
  entry: {
    "simple-comment": path.resolve(__dirname, "src/simple-comment.ts"),
    "svelte": path.resolve(__dirname, "src/svelte.ts"),
    "simple-comment-style": path.resolve(
      __dirname,
      "src/scss/simple-comment-style.scss"
    ),
  },
  module: {
    rules: [
      {
        test: /\.svelte$/,
        use: {
          loader: "svelte-loader",
          options: {
            compilerOptions: { dev: !isProduction },
            emitCss: true,
            hotReload: false,
            preprocess: [sveltePreprocess()],
          },
        },
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              url: false,
            },
          },
          "sass-loader",
        ],
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              url: false,
            },
          },
        ],
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
  optimization: {
    minimize: false,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          mangle: false, // Note `mangle: false`
        },
      }),
    ],
  },
  plugins: [
    // new LicensePlugin(),
    // new BundleAnalyzerPlugin({ generateStatsFile: true }),
    new CopyWebpackPlugin({ patterns: [{ from: "src/static", to: "." }] }),
    new MiniCssExtractPlugin({ filename: "css/[name].css" }),
    new webpack.EnvironmentPlugin(["SIMPLE_COMMENT_API_URL"]),
  ],
  resolve: {
    alias: { svelte: path.resolve("node_modules", "svelte") },
    conditionNames: ["svelte"],
    extensions: [".ts", ".tsx", ".js", ".svelte"],
  },
}
