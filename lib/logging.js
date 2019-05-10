'use strict';

const winston = require('winston');

let initialMeta;

exports.init = (application) => {
  initialMeta = {
    application
  };
};

exports.createLogger = (namespace, options = {}) => winson.createLogger({
  defaultMeta: { ...initialMeta, ...options },
  transports: [
    new winston.transports.Console({ format: winston.format.simple(), level: 'info' }),
  ]
});
