#!/usr/bin/env node

'use strict';

require('../init')({
  baseDirectory: process.cwd(),
  //applicationName: null
});

const { runBundle } = require('../lib/build');

runBundle();
