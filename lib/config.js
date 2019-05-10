'use strict';

const path = require('path');
const readConfig = require('read-config');
const deepFreeze = require('deep-freeze');
const { getArg } = require('./cli');

let appDirectory;
let config;

exports.init = (baseDirectory) => {
  appDirectory = baseDirectory;
};

exports.getConfig = () => {
  if(!config) {
    config = loadConfig();
  }
  return config;
};

function loadConfig() {
  const configFile = getArg('config') || path.join(appDirectory, 'conf/config.json');
  const result = readConfig(configFile);
  deepFreeze(result);
  return result;
}
