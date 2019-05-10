'use strict';

const winston = require('winston');
const { getArg } = require('./cli');
const { getDefine } = require('./defines');

exports.createLogger = (namespace, options = {}) => {
  const application = getDefine('applicationName');
  const level = getArg('loglevel', 'info');

  return winston.createLogger({
    defaultMeta: { application, namespace, ...options },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.printf(info => `${info.timestamp} - ${info.namespace} [${info.level}] ${info.message}`)
        ),
        level
      }),
    ]
  });
};
