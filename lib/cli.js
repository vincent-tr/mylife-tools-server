'use strict';

const yargs = require('yargs');

let argv;

function getArgs() {
  if(!argv) {
    argv = yargs.argv;
  }
  return argv;

}

exports.getArgs = getArgs;

exports.getArg = (name, defaultValue) => {
  const value = getArgs()[name];
  return value === undefined ? defaultValue : value;
}
