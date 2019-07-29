'use strict';

const { createLogger } = require('./logging');

const logger = createLogger('mylife:tools:server:service-manager');

let services;

function findService(name) {
  if(!services) {
    const { ApiRegistry } = require('./api-registry');
    const { Database } = require('./database');
    const { IO } = require('./io');
    const { SessionManager } = require('./session-manager');
    const { TaskQueue } = require('./task-queue');
    const { WebServer } = require('./web-server');
    const { MetadataManager } = require('./metadata-manager');

    services = {
      [ApiRegistry.serviceName]: ApiRegistry,
      [Database.serviceName]: Database,
      [IO.serviceName]: IO,
      [SessionManager.serviceName]: SessionManager,
      [TaskQueue.serviceName]: TaskQueue,
      [WebServer.serviceName]: WebServer,
      [MetadataManager.serviceName]: MetadataManager
    }
  }

  return services[name];
}

class ServiceManager {
  constructor() {
    this._services = [];
    this._servicesByName = new Map();
  }

  add(serviceName) {
    const Service = findService(serviceName);
    if(!Service) {
      throw new Error(`Unknown service name: ${serviceName}`);
    }
    if(this._servicesByName.get(serviceName)) {
      throw new Error(`service name duplicate: ${serviceName}`);
    }

    const service = new Service();
    service.serviceName = Service.serviceName;
    service.dependencies = Service.dependencies;

    this._services.push(service);
    this._servicesByName.set(serviceName, service);

    logger.debug(`Service added: ${serviceName}`);

    return service;
  }

  async init(options) {
    for(const service of this._services) {
      this._resolveDependencies(service);
    }

    for(const service of this._services) {
      await service.init(options);
    }
  }

  _resolveDependencies(service) {
      for(const dependency of service.dependencies || []) {
      if(this._servicesByName.get(dependency)) {
        continue;
      }

      if(!findService(dependency)) {
        throw new Error(`Unknown dependency ${dependency} for service ${service.name}`);
      }

      const service = this.add(dependency);
      this._resolveDependencies(service);
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
