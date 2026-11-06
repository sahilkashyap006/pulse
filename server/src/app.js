const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const monitorRoutes = require("./routes/monitorRoutes");
const app = express();
const authRoutes = require("./routes/authRoutes");
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Pulse API is running!",
  });
});
app.use("/api/monitors", monitorRoutes);
app.use("/api/auth", authRoutes);
module.exports = app;