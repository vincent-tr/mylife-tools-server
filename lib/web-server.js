'use strict';

const path          = require('path');
const http          = require('http');
const express       = require('express');
const bodyParser    = require('body-parser');
const favicon       = require('serve-favicon');
const enableDestroy = require('server-destroy');

const { createLogger } = require('./logging');
const { getDefine } = require('./defines');
const { getConfig } = require('./config');
const { getArg } = require('./cli');

const log = createLogger('mylife:tools:server:web-server');

exports.runWebServer = ({ config = getConfig('webServer'), dev = getArg('dev'), webpackConfig, apiCreator } = {}) => {
  const app = express();
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json({ limit: '100mb' }));

  const publicDirectory = path.resolve(getDefine('baseDirectory'), 'public');

  log.info(`using public directoy : ${publicDirectory}`);

  if(dev) {
    setupDev(app, webpackConfig);
  }

  app.use(favicon(path.resolve(publicDirectory, 'images/favicon.ico')));
  apiCreator(app); // TODO: async
  app.use(express.static(publicDirectory));

  const server = http.createServer(app);
  enableDestroy(server);
  server.listen(config); // TODO: async
  log.info(`server created : ${JSON.stringify(config)}`);

  process.on('SIGINT', terminate);
  process.on('SIGTERM', terminate);

  function terminate() {
    log.info('server close');
    server.destroy();
    server.close(() => process.exit()); // TODO: async
  }
};

function setupDev(app, webpackConfig) {
  log.info('setup webpack dev middleware');

  const webpack              = require('webpack');
  const webpackDevMiddleware = require('webpack-dev-middleware');
  const webpackHotMiddleware = require('webpack-hot-middleware');

  const { createWebpackConfig } = require('./build');

  webpackConfig = webpackConfig || createWebpackConfig({ dev: true });

  const compiler = webpack(webpackConfig);
  app.use(webpackDevMiddleware(compiler, { publicPath: webpackConfig.output.publicPath }));
  app.use(webpackHotMiddleware(compiler));
}
