'use strict';

const { createLogger } = require('./logging');

const logger = createLogger('mylife:tools:server:service-manager');

class ServiceManager {
  constructor() {
    this._services = [];
  }

  add(Service) {
    this._services.push(new Service());
  }

  async init(options) {
    for(const service of this._services) {
      await service.init(options);
    }
  }

  async terminate() {
    const services = [...this._services];
    services.reverse();
    for(const service of services) {
      await service.terminate();
    }
  }
}

exports.runTask = runTask;

exports.runServices = async(options) => {
  const task = () => waitForSignals('SIGINT', 'SIGTERM');
  await runTask({ task, ...options });
};

async function runTask({ services, task, ...options }) {
  try {
    const manager = new ServiceManager();
    for(const service of services) {
      manager.add(service);
    }

    await manager.init(options);
    await task();
    await manager.terminate();

    process.exit();

  } catch(err) {
    logger.error(err.stack);
    process.exit(1);
  }
}

async function waitForSignals(...signals) {
  return new Promise(resolve => {
    for (const sig of signals) {
      process.on(sig, resolve);
    }
  });
}
