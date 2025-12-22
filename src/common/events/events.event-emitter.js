const { EventEmitter } = require("events");
const configs = require("../../../configs");

const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(configs.maxEventListeners);

module.exports = eventEmitter;
