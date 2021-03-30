#!/usr/bin/env node
const webpack = require('webpack');
const path = require('path');
const SourceMapDevToolPlugin = require('webpack').SourceMapDevToolPlugin;
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');

const cwd = process.cwd();
const command = process.argv[2] || 'build';
const package = require(`${cwd}/package.json`);

// const paths ={
//   cwd: process.cwd(),
//   input: path.resolve(cwd, 'src'),
//   build: path.resolve(cwd, 'build'),
// };

// https://github.com/swashata/wp-webpack-script/tree/master/packages/scripts
// https://github.com/chalk/chalk
// https://www.npmjs.com/package/colors
// https://www.npmjs.com/package/meow
// https://www.npmjs.com/package/commander
// https://webpack.js.org/api/node/#watching
// https://nodejs.org/en/knowledge/command-line/how-to-parse-command-line-arguments/
// https://docs.npmjs.com/cli/v7/configuring-npm/package-json#bin

// console.log(process.argv);
// build.config.js

const config = {
  entry: {
    // admin: path.resolve(__dirname, 'src/admin'),
    main: path.resolve(cwd, 'src'),
  },
  output: {
    path: path.resolve(cwd, 'build'),
    filename: '[name].dev.js',
  },
  resolve: {
    alias: {'@': path.resolve(cwd, 'src')}
  },
  devtool: false,
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {presets: [['@babel/preset-env', {targets: '> 0.5%, not IE 11, not dead'}]]}
      }
    }, {
      test: /\.(css|scss)$/,
      use: [
        {loader: MiniCssExtractPlugin.loader, options: {publicPath: ''}},
        {loader: 'css-loader'},
        {loader: 'sass-loader'},
      ]
    }, {
      test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|json|mp3|mp4|ico)$/,
      type: 'asset/resource',
      generator: {emit: false, filename: '../[path][name][ext]?[hash]'}
    }]
  }
};

const watchConfig = Object.assign({}, config, {
  name: 'watch',
  mode: 'development',
  stats: {
    all: false,
    colors: true,
    builtAt: true,
    timings: true,
    warnings: true,
    errors: true,
  },
  plugins: [
    new SourceMapDevToolPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].dev.css'
    }),
    new BrowserSyncPlugin({
      proxy: `${package.name}.test`,
      host: 'localhost',
      port: 5000,
      open: false,
      notify: false,
      files: ['build/main.js', 'images/*', '**/*.php']
    })
  ]
});

const buildConfig = Object.assign({}, config, {
  name: 'build',
  mode: 'production',
  output: {
    path: path.resolve(cwd, 'build'),
    filename: '[name].min.js',
  },
  stats: 'none',
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].min.css'
    })
  ]
});

function callback(err, stats) {
  if (err) {
    console.error(err.stack || err);
    if (err.details) {
      console.error(err.details);
    }
    return;
  }
  const info = stats.toJson();
  if (stats.hasErrors()) {
    console.error(info.errors);
  }
  if (stats.hasWarnings()) {
    console.warn(info.warnings);
  }
  // Log result...
}

const compiler = webpack([
  watchConfig,
  buildConfig
]);

switch (command) {

  case 'watch':
    compiler.watch({
      // https://webpack.js.org/configuration/watch/#watchoptions
      aggregateTimeout: 300,
      poll: undefined
    }, callback);
    break;

  case 'build':
    compiler.run((err, stats) => {
      // https://webpack.js.org/api/node/#stats-object
      // https://webpack.js.org/configuration/stats/
      console.log(stats.toJson());
      // callback(err, stats);
      compiler.close();
    });
    break;

  default:
    console.log(`Command "${command}" not found`);
}
