'use strict';

const webpack = require('webpack');

const { createWebpackConfig } = require('./webpack-config');

exports.createWebpackConfig = createWebpackConfig;

exports.runBundle = function () {

  const webpackConfig = createWebpackConfig();
  const compiler = webpack(webpackConfig);

  compiler.run((err, stats) => {
    if (err || stats.hasErrors()) {
      console.log('boom');
    }
    console.log('finish');
  });

};
