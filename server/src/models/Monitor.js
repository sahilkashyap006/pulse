
const mongoose = require("mongoose");

const monitorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

    method: {
      type: String,
      enum: ["GET", "HEAD", "POST"],
      default: "GET",
    },

    expectedStatus: {
      type: Number,
      default: 200,
    },

    intervalSec: {
      type: Number,
      enum: [60, 300, 600],
      default: 300,
    },

    status: {
      type: String,
      enum: ["active", "paused"],
      default: "active",
    },

    lastCheckedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Monitor", monitorSchema);



