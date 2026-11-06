
const express = require("express");
const router = express.Router();

const Monitor = require("../models/Monitor");
const Check = require("../models/Check");
const Incident = require("../models/Incident");

const authMiddleware = require("../middleware/authMiddleware");
const monitorQueue = require("../queues/monitorQueue");

const {
  createMonitorSchema,
  updateMonitorSchema,
} = require("../validators/monitorValidator");

// Remove scheduled repeat jobs for a monitor

// Remove a monitor's scheduled job
const removeMonitorSchedule = async (monitorId) => {
  await monitorQueue.removeJobScheduler(`monitor-${monitorId}`);
};

// Schedule recurring checks for an active monitor
const scheduleMonitor = async (monitor) => {
  if (monitor.status !== "active") return;

  await monitorQueue.upsertJobScheduler(
    `monitor-${monitor._id}`,
    {
      every: monitor.intervalSec * 1000,
    },
    {
      name: "check-website",
      data: {
        monitorId: monitor._id.toString(),
      },
    }
  );
};

// All monitor routes require authentication
router.use(authMiddleware);

// GET all monitors
router.get("/", async (req, res) => {
  try {
    const monitors = await Monitor.find({
      userId: req.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: monitors.length,
      monitors,
    });
  } catch (error) {
    console.error("Fetch monitors error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch monitors",
    });
  }
});

// CREATE a monitor
router.post("/", async (req, res) => {
  try {
    const result = createMonitorSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        errors: result.error.issues.map((issue) => issue.message),
      });
    }

    const monitor = await Monitor.create({
      ...result.data,
      userId: req.userId,
    });

    await scheduleMonitor(monitor);

    return res.status(201).json({
      success: true,
      message: "Monitor created successfully",
      monitor,
    });
  } catch (error) {
    console.error("Create monitor error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create monitor",
    });
  }
});

// UPDATE a monitor
router.put("/:id", async (req, res) => {
  try {
    const result = updateMonitorSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        errors: result.error.issues.map((issue) => issue.message),
      });
    }

    const monitor = await Monitor.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.userId,
      },
      { $set: result.data },
      { returnDocument: "after", runValidators: true }
    );

    if (!monitor) {
      return res.status(404).json({
        success: false,
        message: "Monitor not found",
      });
    }

    // Remove old schedule and create the updated schedule
    await removeMonitorSchedule(monitor._id.toString());
    await scheduleMonitor(monitor);

    // Trigger an immediate check
    if (monitor.status === "active") {
      await monitorQueue.add(
        "check-website",
        { monitorId: monitor._id.toString() }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Monitor updated successfully",
      monitor,
    });
  } catch (error) {
    console.error("Update monitor error:", error.message);

    return res.status(400).json({
      success: false,
      message: "Invalid monitor ID or update failed",
    });
  }
});

// DELETE a monitor
router.delete("/:id", async (req, res) => {
  try {
    const monitor = await Monitor.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!monitor) {
      return res.status(404).json({
        success: false,
        message: "Monitor not found",
      });
    }

    // Remove scheduled checks before deleting
    await removeMonitorSchedule(monitor._id.toString());

    await Monitor.findByIdAndDelete(monitor._id);

    return res.status(200).json({
      success: true,
      message: "Monitor deleted successfully",
    });
  } catch (error) {
    console.error("Delete monitor error:", error.message);

    return res.status(400).json({
      success: false,
      message: "Invalid monitor ID or delete failed",
    });
  }
});

// PAUSE or RESUME a monitor
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "paused"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be active or paused",
      });
    }

    const monitor = await Monitor.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.userId,
      },
      { $set: { status } },
      { returnDocument: "after", runValidators: true }
    );

    if (!monitor) {
      return res.status(404).json({
        success: false,
        message: "Monitor not found",
      });
    }

    // Remove previous schedule
    await removeMonitorSchedule(monitor._id.toString());

    // Create a new schedule only if active
    await scheduleMonitor(monitor);

    return res.status(200).json({
      success: true,
      message: `Monitor ${status === "paused" ? "paused" : "resumed"} successfully`,
      monitor,
    });
  } catch (error) {
    console.error("Update monitor status error:", error.message);

    return res.status(400).json({
      success: false,
      message: "Invalid monitor ID or status update failed",
    });
  }
});

// GET check history
router.get("/:id/checks", async (req, res) => {
  try {
    const monitor = await Monitor.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!monitor) {
      return res.status(404).json({
        success: false,
        message: "Monitor not found",
      });
    }

    const checks = await Check.find({
      monitorId: monitor._id,
    })
      .sort({ ts: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      count: checks.length,
      checks,
    });
  } catch (error) {
    console.error("Fetch check history error:", error.message);

    return res.status(400).json({
      success: false,
      message: "Failed to fetch check history",
    });
  }
});

// GET incidents
router.get("/:id/incidents", async (req, res) => {
  try {
    const monitor = await Monitor.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!monitor) {
      return res.status(404).json({
        success: false,
        message: "Monitor not found",
      });
    }

    const incidents = await Incident.find({
      monitorId: monitor._id,
    }).sort({ startedAt: -1 });

    return res.status(200).json({
      success: true,
      count: incidents.length,
      incidents,
    });
  } catch (error) {
    console.error("Fetch incidents error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch incidents",
    });
  }
});

// GET uptime statistics
router.get("/:id/stats", async (req, res) => {
  try {
    const monitor = await Monitor.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!monitor) {
      return res.status(404).json({
        success: false,
        message: "Monitor not found",
      });
    }

    const totalChecks = await Check.countDocuments({
      monitorId: monitor._id,
    });

    const successfulChecks = await Check.countDocuments({
      monitorId: monitor._id,
      ok: true,
    });

    const failedChecks = totalChecks - successfulChecks;

    const uptimePercentage =
      totalChecks === 0
        ? 0
        : (successfulChecks / totalChecks) * 100;

    const responseTime = await Check.aggregate([
      {
        $match: {
          monitorId: monitor._id,
          responseTimeMs: { $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          averageResponseTime: { $avg: "$responseTimeMs" },
        },
      },
    ]);

    const averageResponseTime =
      responseTime.length > 0
        ? Math.round(responseTime[0].averageResponseTime)
        : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalChecks,
        successfulChecks,
        failedChecks,
        uptimePercentage: Number(uptimePercentage.toFixed(2)),
        averageResponseTimeMs: averageResponseTime,
      },
    });
  } catch (error) {
    console.error("Fetch monitor statistics error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch monitor statistics",
    });
  }
});

module.exports = router;
