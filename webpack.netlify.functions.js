const path = require("path")
const fs = require("fs")

const mode = process.env.NODE_ENV ?? "development"
const isProduction = mode === "production"

const entry = fs
  .readdirSync("./src/functions")
  .filter(filename => filename.endsWith(".ts"))
  .reduce(
    (entry, filename) => ({
      ...entry,
      [filename.replace(/\.ts$/, "")]: `./src/functions/${filename}`,
    }),
    {}
  )

const config = {
  mode,
  entry,
  performance: {
    hints: isProduction ? "warning" : false,
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        exclude: /node_modules/,
        options: { configFile: "tsconfig.netlify.functions.json" },
      },
    ],
  },
  target: "node",
  output: {
    path: path.resolve(__dirname, "functions"),
    filename: "[name].js",
    libraryTarget: "commonjs",
  },
  optimization: {
    nodeEnv: "production",
  },
  bail: true,
  devtool: false,
  stats: {
    colors: true,
  },
}

module.exports = config
