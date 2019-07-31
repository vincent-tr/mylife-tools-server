'use strict';

const { registerService, getService } = require('./service-manager');
const { createLogger } = require('./logging');
const { metadata } = require('mylife-tools-common');

const logger = createLogger('mylife:tools:server:notification-service');

class NotificationService {
  async init() {
  }

  async terminate() {
  }
}

NotificationService.serviceName = 'notification-service';

registerService(NotificationService);
