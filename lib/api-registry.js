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

const decorators = exports.decorators = {};
const services = {};

const registerDecorator = exports.registerDecorator = (name, impl) => {
  if(decorators[name]) {
    throw new Error(`Decorator '${name}' already exists`);
  }

  logger.debug(`Registering decorator '${name}'`);
  decorators[name] = impl;
};

const loadDecorators = () => {
  const lookupPath = path.join(__dirname, 'decorators');
  logger.debug(`Looking for decorators in '${lookupPath}'`);

  for(const name of fs.readdirSync(lookupPath)) {
    logger.debug(`Loading decorators file '${name}'`);
    const content = require(path.join(lookupPath, name));

    for(const [ key, value ] of Object.entries(content)) {
      registerDecorator(key, value);
    }
  }
};

const registerPublicService = exports.registerPublicService = simpl => {
  const service = new Service(simpl.meta);
  if(services[service.name]) {
    throw new Error(`Service '${service.name}' already exists`);
  }

  for(const [ key, mimpl ] of Object.entries(simpl)) {
    if(key === 'meta') { continue; }
    const method = new Method(service, key, mimpl);
    service.methods.set(key, method);
  }

  logger.debug(`Registering service '${service.name}'`);
  services[service.name] = service;
};

const loadPublicServices = () => {
  const lookupPath = path.join(__dirname, 'public');
  logger.debug(`Looking for public services in '${lookupPath}'`);

  for(const fname of fs.readdirSync(lookupPath)) {
    logger.debug(`Loading public service file '${fname}'`);
    const impl = require(path.join(lookupPath, fname));
    registerPublicService(impl);
  }
};

exports.ApiRegistry = class ApiRegistry {
  async init() {
    loadDecorators();
    loadPublicServices();
  }

  async terminate() {
    for(const key of Object.keys(services)) {
      logger.debug(`Deleting service '${key}'`);
      delete services[key];
    }

    for(const key of Object.keys(decorators)) {
      logger.debug(`Deleting decorator '${key}'`);
      delete decorators[key];
    }
  }

  lookup(serviceName, methodName) {
    const service = services[serviceName];
    if(!service) {
      throw new Error(`Service '${serviceName}' does not exist`);
    }

    const method = service.findMethod(methodName);
    if(!method) {
      throw new Error(`Method '${methodName} does not exist on service '${service.name}'`);
    }

    return method;
  }

  get name() {
    return 'api-registry';
  }
};
