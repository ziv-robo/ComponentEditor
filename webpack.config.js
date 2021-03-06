const path = require("path");
const webpack = require("webpack");
const CleanWebpackPlugin = require('clean-webpack-plugin');
const NodemonPlugin = require( 'nodemon-webpack-plugin' )

const outputDirectory = 'dist';

module.exports = {
  entry: './src/client/app.js',
  output: {
    path: path.join(__dirname, outputDirectory),
    filename: 'bundle.js'
  },
  module: {
    rules: [{
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader: 'url-loader?limit=100000'
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin([outputDirectory]),
    new NodemonPlugin({
      watch: ['./src', './dist'],
      script: './src/server/index.js',
      verbose: true,
      ignore: ['*.js.map'],
    })
  ]
};