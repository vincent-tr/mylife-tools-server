'use strict';

const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const { getDefine } = require('../defines');
const { getArg } = require('../cli');

exports.createWebpackConfig = function ({
  outputPath = path.join(getDefine('baseDirectory'), 'public/dist'),
  entryPoint = path.join(getDefine('baseDirectory'), 'public/src/main.js'),
  htmlTemplate = path.join(getDefine('baseDirectory'), 'public/src/index.html'),
  dev = getArg('dev')
}) {

  const common = {
    entry: [ 'babel-polyfill', entryPoint ],
    output: {
      path: outputPath,
      filename: '[name].[contenthash].js'
    },
    module : {
      rules : [{
        // TODO: https://webpack.js.org/plugins/mini-css-extract-plugin/#minimizing-for-production
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      }, {
        // TODO: // TODO: https://webpack.js.org/plugins/mini-css-extract-plugin/#minimizing-for-production
        test: /\.scss$/,
        use: [
          'style-loader', // creates style nodes from JS strings
          'css-loader', // translates CSS into CommonJS
          'sass-loader' // compiles Sass to CSS, using Node Sass by default
        ]
      }, {
        test : /\.js$/,
        use : [{
          loader : 'babel-loader',
          //include : [ entryPoint ],
          query : {
            presets: [
              [ '@babel/env', { targets : 'last 2 versions' } ],
              '@babel/react'
            ],
            plugins: [
              '@babel/plugin-proposal-export-default-from',
              '@babel/plugin-proposal-export-namespace-from',
              '@babel/plugin-proposal-class-properties'
            ]
          }
        }]
      }, {
        test: /\.(png|jpg|gif|svg|eot|woff|woff2|ttf|ico)$/,
        use: [ 'file-loader' ]
      }]
    },
    plugins: [
      new CleanWebpackPlugin(),
      new webpack.DefinePlugin({
        'process.env': {
          //DEBUG: JSON.stringify('mylife:tools:ui:*')
        }
      }),
      new HtmlWebpackPlugin({
        template: htmlTemplate
      })
    ]
  };

  if(dev) {
    return merge(common, {
      mode: 'development',
      devtool: 'inline-cheap-module-source-map'
    });
  }

  return merge(common, {
    mode: 'production',
    devtool: 'source-map'
  });
};
