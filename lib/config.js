'use strict';

const path = require('path');
const readConfig = require('read-config');
const deepFreeze = require('deep-freeze');
const { getArg } = require('./cli');
const { getDefine } = require('./defines');

let config;

exports.getConfigs = getConfigs;

function getConfigs() {
  if(!config) {
    config = loadConfig();
  }
  return config;
}

exports.getConfig = (name, defaultValue) => {
  const value = getConfigs()[name];
  return value === undefined ? defaultValue : value;
};

function loadConfig() {
  const configFile = getArg('config') || path.join(getDefine('baseDirectory'), 'conf/config.json');
  const result = readConfig(configFile);
  deepFreeze(result);
  return result;
}
