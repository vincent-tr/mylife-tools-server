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

exports.runWebServer = async (...args) => {
  try {
    const server = await setupServer(...args);
    await waitForSignals('SIGINT', 'SIGTERM');
    await terminateServer(server);
  } catch(err) {
    log.error(err.stack);
  }

  process.exit();
};

async function setupServer({ config = getConfig('webServer'), dev = getArg('dev'), webpackConfig, apiCreator } = {}) {
  const app = express();
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json({ limit: '100mb' }));

  const publicDirectory = path.resolve(getDefine('baseDirectory'), 'public');

  log.info(`using public directoy : ${publicDirectory}`);

  app.use(favicon(path.resolve(publicDirectory, 'images/favicon.ico')));
  await apiCreator(app, express);
  app.use(express.static(publicDirectory));

  let indexLoader;
  if(dev) {
    indexLoader = setupDev(app, webpackConfig);
  }

  app.use(historyApiFallback(publicDirectory, indexLoader));

  const server = http.createServer(app);
  enableDestroy(server);
  await asyncCall(cb => server.listen(config, cb));
  log.info(`server created : ${JSON.stringify(config)}`);

  return server;
}

async function terminateServer(server) {
  log.info('server close');
  await asyncCall(cb => server.destroy(cb));
}

async function waitForSignals(...signals) {
  return new Promise(resolve => {
    for (const sig of signals) {
      process.on(sig, resolve);
    }
  });
}

async function asyncCall(target) {
  return new Promise((resolve, reject) => target((err, res) => (err ? reject(err) : resolve(res))));
}

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
