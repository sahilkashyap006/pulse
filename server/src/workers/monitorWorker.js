
const { Worker } = require("bullmq");
const redisConnection = require("../config/redis");

const Monitor = require("../models/Monitor");
const Check = require("../models/Check");
const Incident = require("../models/Incident");

const monitorWorker = new Worker(
  "monitor-checks",
  async (job) => {
    const { monitorId } = job.data;

    const monitor = await Monitor.findById(monitorId);

    if (!monitor || monitor.status !== "active") {
      return;
    }

    const startTime = Date.now();
    let statusCode = null;
    let error = null;

    try {
      const response = await fetch(monitor.url, {
        method: monitor.method,
        signal: AbortSignal.timeout(10000),
      });

      statusCode = response.status;
    } catch (err) {
      error = err.message;
    }

    const responseTimeMs = Date.now() - startTime;
    const ok = statusCode === monitor.expectedStatus && error === null;

    await Check.create({
      monitorId: monitor._id,
      ok,
      statusCode,
      responseTimeMs,
      error,
    });
    
    
// INCIDENT MANAGEMENT

const openIncident = await Incident.findOne({
  monitorId: monitor._id,
  resolvedAt: null,
});

if (!ok && !openIncident) {
  // Create an incident when the website goes DOWN
  await Incident.create({
    monitorId: monitor._id,
    startedAt: new Date(),
    reason: error || `Unexpected status code: ${statusCode}`,
  });

  console.log(`INCIDENT OPENED: ${monitor.url}`);
}

if (ok && openIncident) {
  // Resolve the incident when the website comes back UP
  openIncident.resolvedAt = new Date();
  await openIncident.save();

  console.log(`INCIDENT RESOLVED: ${monitor.url}`);
}

    await Monitor.findByIdAndUpdate(monitor._id, {
      lastCheckedAt: new Date(),
    });

    console.log(
      `Checked ${monitor.url}: ${ok ? "UP" : "DOWN"} (${responseTimeMs}ms)`
    );
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

monitorWorker.on("failed", (job, err) => {
  console.error(`Monitor job ${job?.id} failed:`, err.message);
});

module.exports = monitorWorker;
