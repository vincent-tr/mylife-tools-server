'use strict';

const path          = require('path');
const fs            = require('fs');
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

  app.use(favicon(path.resolve(publicDirectory, 'images/favicon.ico')));
  apiCreator(app); // TODO: async
  app.use(express.static(publicDirectory));

  let indexLoader;
  if(dev) {
    indexLoader = setupDev(app, webpackConfig);
  }

  app.use(historyApiFallback(publicDirectory, indexLoader));

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
  const devMiddleware = webpackDevMiddleware(compiler, { publicPath: webpackConfig.output.publicPath });

  app.use(devMiddleware);
  app.use(webpackHotMiddleware(compiler));

  return callback => devMiddleware.fileSystem.readFile(path.join(webpackConfig.output.path, 'index.html'), callback);
}

function historyApiFallback(
  publicDirectory,
  indexLoader = createDefaultIndexLoader(publicDirectory)
) {
  return (req, res) => {
    indexLoader((err, content) => {
      if(err) {
        log.error(err);
        res.status(500).json(err.stack).end();
        return;
      }

      res.end(content);
    });
  };
}

function createDefaultIndexLoader(publicDirectory) {
  let content;

  return callback => {
    if(!content) {
      content = fs.readFileSync(path.join(publicDirectory, 'index.html'));
    }

    return callback(null, content);
  }
}
