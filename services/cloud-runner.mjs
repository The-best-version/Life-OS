#!/usr/bin/env node
/**
 * cloud-runner.mjs — 24/7 Cloud Orchestrator for 2027 Life OS
 *
 * Runs both the Life OS Sync Server and the Telegram Bot concurrently
 * on any cloud provider (Render, Railway, Koyeb, Fly.io, or VPS).
 *
 * - Automatically detects assigned cloud PORT
 * - Binds to 0.0.0.0 for incoming health checks & web traffic
 * - Connects the Telegram Bot to the internal sync server instance
 * - Auto-restarts the bot if an unhandled network error occurs
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const SYNC_SERVER = join(HERE, "local-sync-server.js");
const BOT_SCRIPT = join(HERE, "telegram-bot.js", "bot.js");

const PORT = process.env.PORT || "47615";
const HOST = "0.0.0.0";
const LOCAL_ORIGIN = `http://127.0.0.1:${PORT}`;

console.log("=================================================");
console.log("  🚀 Life OS — 24/7 Cloud Runner Started         ");
console.log(`  🌐 Public Port: ${PORT} (binding ${HOST})       `);
console.log(`  🔗 Internal Sync: ${LOCAL_ORIGIN}              `);
console.log("=================================================");

let syncProcess = null;
let botProcess = null;
let isShuttingDown = false;

function startSyncServer() {
  console.log("[Cloud Runner] Starting Sync Server...");
  const env = {
    ...process.env,
    PORT: String(PORT),
    HOST: HOST,
  };

  syncProcess = spawn(process.execPath, [SYNC_SERVER], {
    cwd: ROOT,
    env,
    stdio: "inherit",
  });

  syncProcess.on("exit", (code, signal) => {
    if (isShuttingDown) return;
    console.error(`[Cloud Runner] ⚠️ Sync Server exited with code ${code} / signal ${signal}. Restarting in 3s...`);
    setTimeout(startSyncServer, 3000);
  });
}

function startBot() {
  console.log("[Cloud Runner] Starting Telegram Bot...");
  const env = {
    ...process.env,
    LIFEOS_ORIGIN: LOCAL_ORIGIN,
  };

  botProcess = spawn(process.execPath, [BOT_SCRIPT], {
    cwd: join(HERE, "telegram-bot.js"),
    env,
    stdio: "inherit",
  });

  botProcess.on("exit", (code, signal) => {
    if (isShuttingDown) return;
    console.error(`[Cloud Runner] ⚠️ Telegram Bot exited with code ${code} / signal ${signal}. Restarting in 5s...`);
    setTimeout(startBot, 5000);
  });
}

// Start Sync Server first
startSyncServer();

// Give the sync server 1.5s to open the port before launching the bot
setTimeout(startBot, 1500);

function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log("\n[Cloud Runner] Stopping all services...");
  if (botProcess) botProcess.kill("SIGTERM");
  if (syncProcess) syncProcess.kill("SIGTERM");
  setTimeout(() => process.exit(0), 1000);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
