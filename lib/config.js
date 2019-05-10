'use strict';

const path = require('path');
const readConfig = require('read-config');
const deepFreeze = require('deep-freeze');

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
  const result = readConfig(path.join(appDirectory, 'conf/config.json'));
  deepFreeze(result);
  return result;
}
