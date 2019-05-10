'use strict';

const winston = require('winston');
const { getArg } = require('./cli');

let initialMeta;
let initialLevel;

exports.init = (applicationName) => {
  initialMeta = { application: applicationName };
  initialLevel = getArg('loglevel', 'info');
};

exports.createLogger = (namespace, options = {}) => winston.createLogger({
  defaultMeta: { ...initialMeta, namespace, ...options },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(info => `${info.timestamp} - ${info.namespace} [${info.level}] ${info.message}`)
      ),
      level: initialLevel
    }),
  ]
});
