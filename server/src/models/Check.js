
const mongoose = require("mongoose");

const checkSchema = new mongoose.Schema(
  {
    monitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Monitor",
      required: true,
    },

    ts: {
      type: Date,
      default: Date.now,
      required: true,
    },

    ok: {
      type: Boolean,
      required: true,
    },

    statusCode: {
      type: Number,
      default: null,
    },

    responseTimeMs: {
      type: Number,
      default: null,
    },

    error: {
      type: String,
      default: null,
    },
  },
  {
    versionKey: false,
  }
);

checkSchema.index({ monitorId: 1, ts: -1 });

module.exports = mongoose.model("Check", checkSchema);
