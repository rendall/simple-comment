// const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin
const CopyWebpackPlugin = require("copy-webpack-plugin")
const LicensePlugin = require("webpack-license-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const TerserPlugin = require("terser-webpack-plugin")
const path = require("path")
const sveltePreprocess = require("svelte-preprocess")
const webpack = require("webpack")

const dotenv = require("dotenv")

dotenv.config({
  path: path.join(__dirname, ".env"),
})

const mode = process.env.NODE_ENV ?? "development"
const isProduction = mode === "production"

console.info(
  `frontend bundled in '${mode}' mode. isProduction: ${isProduction}`
)

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
            emitCss: isProduction,
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
    minimize: isProduction,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          mangle: isProduction,
          compress: isProduction,
        },
      }),
    ],
  },
  plugins: [
    // new BundleAnalyzerPlugin({ generateStatsFile: true, mode: "json", openAnalyzer:false }),
    new CopyWebpackPlugin({ patterns: [{ from: "src/static", to: "." }] }),
    new LicensePlugin(),
    new MiniCssExtractPlugin({ filename: "css/[name].css" }),
    new webpack.EnvironmentPlugin(["SIMPLE_COMMENT_API_URL"]),
  ],
  resolve: {
    alias: { svelte: path.resolve("node_modules", "svelte") },
    conditionNames: ["svelte"],
    extensions: [".ts", ".tsx", ".js", ".svelte"],
  },
}
