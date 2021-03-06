'use strict';

const { createLogger } = require('./logging');
const { registerService } = require('./service-manager');

const logger = createLogger('mylife:tools:server:task-queue');

class Timer {
  constructor() {
    this.begin = process.hrtime();
  }

  elapsed() {
    const diff = process.hrtime(this.begin);
    return diff[0] * 1e3 + diff[1] / 1e6;
  }
}

class TaskQueue {

  constructor(id) {
    this.id = id;
    this.head = this.tail = null;
    this.closing = false;
    this.closed = false;
    this.running = false;
  }

  async close() {
    if(!this.running) {
      this.closed = true;
      return;
    }

    this.closing = true;
    await this._waitClose();
    this.closing = false;
    this.closed = true;
  }

  async _waitClose() {
    return new Promise(resolve => { this.pendingCloseCb = resolve; });
  }

  add(name, func) {
    if(this.closing || this.closed) {
      throw new Error(`Cannot add tasks while closing on queue '${this.id}'`);
    }

    const task = {
      name,
      func,
      next : null
    };

    if(this.tail) {
      this.tail.next = task;
      this.tail = task;
    } else {
      this.head = this.tail = task;
    }

    if(!this.running) {
      this._startNext();
    }
  }

  _startNext() {
    this.running = true;

    const task = this.head;
    this.head = task.next;
    if(!this.head) {
      this.tail = null;
    }
    task.next = null;

    // no catch, already done in _runOne
    this._runOne(task).then(() => {

      if(this.head) {
        return this._startNext();
      }

      this.running = false;
      if(this.pendingCloseCb) {
        this.pendingCloseCb();
      }
    });
  }

  async _runOne(task) {

    try {
      logger.debug(`Queue '${this.id}' : Task begin : ${task.name}`);

      const timer = new Timer();
      await task.func();
      const elapsed = timer.elapsed();

      logger.debug(`Queue '${this.id}' : Task end : ${task.name} (elapsed : ${elapsed.toFixed(2)}ms)`);
    } catch(err) {
      logger.error(`Queue '${this.id}' : Task error on ${task.name}: ${err.stack}`);
    }
  }
}

class TaskQueueManager {
  constructor() {
    this._queues = new Map();
  }

  async init() {
  }

  async terminate() {
    for(const id of Array.from(this._queues.keys())) {
      await this.closeQueue(id);
    }
  }

  createQueue(id) {
    if(this._queues.get(id)) {
      throw new Error(`Cannot create queue ${id}: already exists`);
    }

    this._queues.set(id, new TaskQueue(id));
  }

  async closeQueue(id) {
    const queue = this._queues.get(id);
    if(!queue) {
      throw new Error(`Cannot close queue ${id}: does not exists`);
    }

    await queue.close();
    this._queues.delete(id);
  }

  getQueue(id) {
    const queue = this._queues.get(id);
    if(!queue) {
      throw new Error(`Cannot get queue ${id}: does not exists`);
    }

    return queue;
  }
}

TaskQueueManager.serviceName = 'task-queue-manager';

registerService(TaskQueueManager);
