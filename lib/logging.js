'use strict';

const winston = require('winston');

let initialMeta;

exports.init = (applicationName) => {
  initialMeta = {
    application: applicationName
  };
};

exports.createLogger = (namespace, options = {}) => winston.createLogger({
  defaultMeta: { ...initialMeta, namespace, ...options },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(info => `${info.timestamp} - ${info.namespace} [${info.level}] ${info.message}`)
      ),
      level: 'info'
    }),
  ]
});
