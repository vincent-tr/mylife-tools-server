'use strict';

const { createLogger } = require('./logging');

const logger = createLogger('mylife:tools:server:service-manager');

class ServiceManager {
  constructor() {
    this._services = [];
    this._servicesByName = new Map();
  }

  add(Service) {
    const service = new Service();
    const { name } = service;
    if(this._servicesByName.get(name)) {
      throw new Error(`service name duplicate: ${name}`);
    }

    this._services.push(service);
    this._servicesByName.set(name, service);
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

  getService(name) {
    const service = this._servicesByName.get(name);
    if(!service) {
      throw new Error(`Service not found: ${name}`);
    }

    return service;
  }
}

let manager;

exports.getService = name => manager.getService(name);

exports.runTask = runTask;

exports.runServices = async(options) => {
  const task = () => waitForSignals('SIGINT', 'SIGTERM');
  await runTask({ task, ...options });
};

async function runTask({ services, task, ...options }) {
  try {
    manager = new ServiceManager();
    for(const service of services) {
      manager.add(service);
    }

    await manager.init(options);
    await task();
    await manager.terminate();
    manager = null;

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
