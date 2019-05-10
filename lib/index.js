'use strict';

const cli = require('./cli');
const { init: loggingInit, ...logging } = require('./logging');
const { init: configInit, ...config } = require('./config');

Object.assign(exports, cli, logging, config);

exports.init = ({ applicationName, baseDirectory }) => {
  loggingInit(applicationName);
  configInit(baseDirectory);
};
