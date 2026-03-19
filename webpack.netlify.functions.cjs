const path = require("path")
const fs = require("fs")
const webpack = require("webpack")

const mode = process.env.NODE_ENV ?? "production"
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
    hints: false,
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
  plugins: [
    new webpack.IgnorePlugin({
      checkResource(resource, context) {
        const ignores = [
          ["@mongodb-js/zstd", "mongodb/lib"],
          ["aws-crt", "@aws-sdk/util-user-agent-node/dist-es"],
          ["gcp-metadata", "mongodb-client-encryption/lib/providers"],
          ["kerberos", "mongodb/lib"],
          ["mongodb-client-encryption", "mongodb/lib"],
          ["snappy", "mongodb/lib"],
        ]
        const normalizedContext = (context ?? "").replace(/\\/g, "/")

        return ignores.some(
          ([i, c]) => resource === i && normalizedContext.endsWith(c)
        )
      },
    }),
  ],
}

module.exports = config
