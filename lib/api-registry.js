'use strict';

const { createLogger } = require('./logging');
const { registerService } = require('./service-manager');

const logger = createLogger('mylife:tools:server:api-registry');

class Service {
  constructor(meta) {
    Object.assign(this, meta);
    if(!this.name) {
      throw new Error('Missing name');
    }

    this.methods = new Map();
  }

  findMethod(name) {
    return this.methods.get(name);
  }
}

class Method {
  constructor(service, name, impl) {
    this.service = service;
    this.name = name;

    const list = Array.isArray(impl) ? [ ... impl ] : [ impl ];
    this.callee = list.pop();
    const decorators = list.reverse();

    for(const decorator of decorators) {
      decorator(this);
    }
  }

  async call(...args) {
    return await this.callee(...args);
  }
}

class ApiRegistry {
  constructor() {
    this.services = {};
  }

  async init({ apiServices }) {
    if(apiServices) {
      this.registerServices(apiServices);
    }
  }

  async terminate() {
    for(const key of Object.keys(this.services)) {
      logger.debug(`Deleting service '${key}'`);
      delete this.services[key];
    }
  }

  lookup(serviceName, methodName) {
    const service = this.services[serviceName];
    if(!service) {
      throw new Error(`Service '${serviceName}' does not exist`);
    }

    const method = service.findMethod(methodName);
    if(!method) {
      throw new Error(`Method '${methodName} does not exist on service '${service.name}'`);
    }

    return method;
  }

  registerService(simpl) {
    const service = new Service(simpl.meta);
    if(this.services[service.name]) {
      throw new Error(`Service '${service.name}' already exists`);
    }

    for(const [ key, mimpl ] of Object.entries(simpl)) {
      if(key === 'meta') { continue; }
      const method = new Method(service, key, mimpl);
      service.methods.set(key, method);
    }

    logger.debug(`Registering service '${service.name}'`);
    this.services[service.name] = service;
  }

  registerServices(impls) {
    for(const impl of impls) {
      this.registerService(impl);
    }
  }
}

ApiRegistry.serviceName = 'api-registry';

registerService(ApiRegistry);

exports.createDecoratorGroup = (...decorators) => method => {
  for(const decorator of decorators) {
    decorator(method);
  }
};

exports.decorators = require('./api/decorators');
