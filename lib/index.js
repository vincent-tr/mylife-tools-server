'use strict';

const defines = require('./defines');
const cli = require('./cli');
const logging = require('./logging');
const config = require('./config');

Object.assign(exports, defines, cli, logging, config);
