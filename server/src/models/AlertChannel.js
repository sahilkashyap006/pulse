
const mongoose = require("mongoose");

const alertChannelSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["email", "telegram"],
      required: true,
    },

    target: {
      type: String,
      required: true,
      trim: true,
    },

    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AlertChannel", alertChannelSchema);
