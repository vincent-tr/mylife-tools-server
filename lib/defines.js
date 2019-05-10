'use strict';

const deepFreeze = require('deep-freeze');

let defines;

exports.init = (values) => {
  defines = values;
  deepFreeze(defines);
}

exports.getDefines = () => defines;

exports.getDefine = (name) => {
  const value = defines[name];
  if(value === undefined) {
    throw new Error(`Missing define : ${name}`);
  }
  return value;
};
