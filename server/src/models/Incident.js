
const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
  {
    monitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Monitor",
      required: true,
    },

    startedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    reason: {
      type: String,
      default: "Health check failed",
    },

    alertsSent: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

incidentSchema.index({ monitorId: 1, startedAt: -1 });

module.exports = mongoose.model("Incident", incidentSchema);

