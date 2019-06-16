'use strict';

const path = require('path');
const fs   = require('fs');

const { createLogger } = require('./logging');

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

exports.ApiRegistry = class ApiRegistry {
  constructor() {
    this.services = {};
  }

  async init({ apiPublicServices, apiPublicServicesPath }) {
    if(apiPublicServices) {
      this.registerPublicServices(apiPublicServices);
    }
    if(apiPublicServicesPath) {
      this.loadPublicServices(apiPublicServicesPath);
    }
  }

  async terminate() {
    for(const key of Object.keys(this.services)) {
      logger.debug(`Deleting service '${key}'`);
      delete this.services[key];
    }

    for(const key of Object.keys(this.decorators)) {
      logger.debug(`Deleting decorator '${key}'`);
      delete this.decorators[key];
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

  registerPublicService(simpl) {
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

  registerPublicServices(impls) {
    for(const impl of impls) {
      this.registerPublicService(impl);
    }
  }

  // load separatly to keep logs per file
  loadPublicServices(publicServicesPath) {
    logger.debug(`Looking for public services in '${publicServicesPath}'`);

    for(const fname of fs.readdirSync(publicServicesPath)) {
      logger.debug(`Loading public service file '${fname}'`);
      const impl = require(path.join(publicServicesPath, fname));
      this.registerPublicService(impl);
    }
  }

  get name() {
    return 'api-registry';
  }
};

exports.createDecoratorGroup = (...decorators) => method => {
  for(const decorator of decorators) {
    decorator(method);
  }
};
