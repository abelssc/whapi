const { app } = require("electron");
const fs = require("fs");
const path = require("path");

// Carpeta segura del usuario (ej: AppData/Roaming/TuApp/logs.txt en Windows)
const logFile = path.join(app.getPath("userData"), "logs.txt");

function logToFile(message) {
  const timestamp = new Date().toISOString();
  const finalMessage = `[${timestamp}] ${message}\n`;

  try {
    fs.appendFileSync(logFile, finalMessage, { encoding: "utf8" });
  } catch (err) {
    console.error("Error writing log:", err);
  }
}

const originalLog = console.log;
console.log = (...args) => {
  const msg = args.map(a => (typeof a === "object" ? JSON.stringify(a) : a)).join(" ");
  logToFile(msg);
  originalLog(...args);
};

module.exports = { logToFile };
