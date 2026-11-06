
const { Queue } = require("bullmq");
const redisConnection = require("../config/redis");

const monitorQueue = new Queue("monitor-checks", {
  connection: redisConnection,
});

module.exports = monitorQueue;

