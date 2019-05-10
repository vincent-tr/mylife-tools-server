'use strict';

const cli = require('./cli');
const logging = require('./logging');
const config = require('./config');

exports.cli = cli;
exports.logging = logging;
exports.config = config;

exports.init = ({ applicationName, baseDirectory }) => {
  logging.init(applicationName);
  config.init(baseDirectory);
};

// argparse ou yargs ?
