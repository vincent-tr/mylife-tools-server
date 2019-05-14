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
} = {}) {

  const common = {
    entry: [ 'babel-polyfill', entryPoint ],
    output: {
      path: outputPath
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
              [ require.resolve('@babel/preset-env'), { targets : 'last 2 versions' } ],
              require.resolve('@babel/preset-react')
            ],
            plugins: [
              require.resolve('@babel/plugin-proposal-export-default-from'),
              require.resolve('@babel/plugin-proposal-export-namespace-from'),
              require.resolve('@babel/plugin-proposal-class-properties')
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
    ],
    resolve: {
      modules: ['node_modules', path.resolve(__dirname, '../../node_modules')]
    },
    resolveLoader: {
      modules: ['node_modules', path.resolve(__dirname, '../../node_modules')]
    }
  };

  if(dev) {
    return merge(common, {
      mode: 'development',
      entry: ['webpack-hot-middleware/client'],
      output: {
        filename: '[name].[hash].js'
      },
      plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin()
      ],
      devtool: 'inline-cheap-module-source-map'
    });
  }

  return merge(common, {
    mode: 'production',
    output: {
      filename: '[name].[contenthash].js'
    },
    devtool: 'source-map'
  });
};
