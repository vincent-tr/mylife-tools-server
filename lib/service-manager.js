'use strict';

const { createLogger } = require('./logging');

const logger = createLogger('mylife:tools:server:service-manager');

const serviceClasses = {};

exports.registerService = Service => {
  const { serviceName } = Service;
  if(!(Service instanceof Function) || !serviceName) {
    throw new Error('Bad service provided');
  }
  if(serviceClasses[serviceName]) {
    throw new Error(`Service already exists: '${serviceName}'`);
  }

  serviceClasses[serviceName] = Service;
}

function findServiceClass(name) {
  return serviceClasses[name];
}

class ServiceManager {
  constructor() {
    this._services = [];
    this._servicesByName = new Map();
    this._initOrder = [];
  }

  add(serviceName) {
    const Service = findServiceClass(serviceName);
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

    this._computeInitOrder();

    for(const serviceName of this._initOrder) {
      const service = this._servicesByName.get(serviceName);
      await service.init(options);
    }
  }

  _resolveDependencies(service) {
      for(const dependency of service.dependencies || []) {
      if(this._servicesByName.get(dependency)) {
        continue;
      }

      if(!findServiceClass(dependency)) {
        throw new Error(`Unknown dependency ${dependency} for service ${service.name}`);
      }

      const service = this.add(dependency);
      this._resolveDependencies(service);
    }
  }

  _computeInitOrder() {
    const order = [];
    const serviceNames = this._services.map(({ serviceName }) => serviceName);
    computeInitOrder(order, this._servicesByName, serviceNames, new Set(), 0);
    this._initOrder = order;
    logger.debug(`Computed init order: [ ${order.join(', ')} ]`);
  }

  async terminate() {
    const services = [...this._initOrder];
    services.reverse();
    for(const serviceName of services) {
      const service = this._servicesByName.get(serviceName);
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

  fatal(error) {
    logger.error(`FATAL ERROR: ${error.stack}`);
    process.kill(process.pid, 'SIGTERM');
  }
}

function computeInitOrder(order, serviceMap, serviceNames, existingSet, recursiveCount) {
  if(recursiveCount > 50) {
    throw new Error('Cyclic service dependency');
  }

  for(const serviceName of serviceNames) {
    if(existingSet.has(serviceName)) {
      continue;
    }

    const { dependencies = [] } = serviceMap.get(serviceName);
    if(dependencies.length) {
      computeInitOrder(order, serviceMap, dependencies, existingSet, recursiveCount + 1);
    }

    order.push(serviceName);
    existingSet.add(serviceName);
  }
}

let manager;

exports.getService = name => manager.getService(name);
exports.fatal = err => manager.fatal(err);

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
