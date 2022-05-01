const path = require('path');
const fs = require('fs');

const mode = process.env.nodeEnv ?? "development";
const entry = fs.readdirSync('./src/functions')
    .filter(filename => filename.endsWith(".ts"))
    .reduce((entry, filename) => ({ ...entry, [filename.replace(/\.ts$/, '')]: `./src/functions/${filename}` }), {});

const config = {
    mode,
    entry,
    resolve: {
        extensions: [".ts", ".js"],
    },
    module: {
        rules: [{
            test: /\.ts$/,
            loader: 'ts-loader',
            exclude: /node_modules/
        }
        ]
    },
    target: "node",
    output: {
        path: path.resolve(__dirname, "functions"),
        filename: "[name].js",
        libraryTarget: "commonjs"
    },
    optimization: {
        nodeEnv: "production"
    },
    bail: true,
    devtool: false,
    stats: {
        colors: true
    }
};

module.exports = config;
