
require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const monitorWorker = require("./workers/monitorWorker");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Pulse API running on port ${PORT}`);
    console.log("Monitor worker started");
  });
};

startServer();
