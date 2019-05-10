'use strict';

const { createLogger } = require('./logging');
const { getDefine } = require('./defines');
const { getConfig } = require('./config');
const { getArg } = require('./cli');

const log = createLogger('mylife:tools:server:web-server');

exports.runWebServer = ({ config = getConfig('webServer'), dev = getArg('dev') } = {}) => {
  const app = express();
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json({ limit: '100mb' }));

  const publicDirectory = path.resolve(getDefine('baseDirectory'), 'public');

  log.info(`using public directoy : ${publicDirectory}`);

  if(dev) {
    log.info('setup webpack dev middleware');
    app.use(webpackMiddleware(webpack(webpackConfig), { publicPath: webpackConfig.output.publicPath }));
  }

  app.use(favicon(path.join(publicDirectory, 'images/favicon.ico')));
  app.use('/api', createApi());
  app.use(serveStatic(publicDirectory));

  const server = http.Server(app);
  server.listen(config);
  log.info(`server created : ${JSON.stringify(config)}`);

  process.on('SIGINT', terminate);
  process.on('SIGTERM', terminate);

  function terminate() {
    log.info('server close');
    server.close(() => process.exit());
  }
};
