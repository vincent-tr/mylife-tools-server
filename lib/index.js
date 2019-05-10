'use strict';

const logging = require('./logging');
const config = require('./config');

exports.logging = logging;
exports.config = config;

exports.init = ({ applicationName, baseDirectory }) => {
  logging.init(applicationName);
  config.init(baseDirectory);
};

// argparse
