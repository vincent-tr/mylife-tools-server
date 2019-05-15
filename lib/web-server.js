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

const logger = createLogger('mylife:tools:server:web-server');

exports.WebServer = class WebServer {
  async init(options) {
    this._server = await setupServer(options);
  }

  async terminate() {
    logger.info('server close');
    await asyncCall(cb => this._server.destroy(cb));
  }
};

async function setupServer({ config = getConfig('webServer'), dev = getArg('dev'), webpackConfig, apiCreator }) {
  const app = express();
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json({ limit: '100mb' }));

  const publicDirectory = path.resolve(getDefine('baseDirectory'), 'public');

  logger.info(`using public directoy : ${publicDirectory}`);

  app.use(favicon(path.resolve(publicDirectory, 'images/favicon.ico')));
  await apiCreator({ app, express, asyncHandler, apiHandler });
  app.use(express.static(publicDirectory));

  let indexLoader;
  if(dev) {
    indexLoader = setupDev(app, webpackConfig);
  }

  app.use(historyApiFallback(publicDirectory, indexLoader));

  const server = http.createServer(app);
  enableDestroy(server);
  await asyncCall(cb => server.listen(config, cb));
  logger.info(`server created : ${JSON.stringify(config)}`);

  return server;
}

async function asyncCall(target) {
  return new Promise((resolve, reject) => target((err, res) => (err ? reject(err) : resolve(res))));
}

function setupDev(app, webpackConfig) {
  logger.info('setup webpack dev middleware');

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
        logger.error(err);
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

function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch(err) {
      next(err);
    }
  };
}

// TODO: improve protocol/serialization
function apiHandler(handler) {
  return async (req, res) => {
    try {
      const result = await handler(req.body);
      res.json(typeof result === 'undefined' ? {} : result);
    } catch(err) {
      logger.error(err.stack);
      return res.status(500).json({ message: err.message, stack: err.stack });
    }
  };
}
