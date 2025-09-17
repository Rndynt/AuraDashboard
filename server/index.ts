import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀 Starting NextJS application from apps/web...");

// Change to the NextJS app directory and start the appropriate server
const nextjsPath = path.join(__dirname, "../apps/web");
const isProduction = process.env.NODE_ENV === "production";
const command = isProduction ? "start" : "dev";

console.log(`Running in ${process.env.NODE_ENV || 'development'} mode, using npm run ${command}`);

const nextProcess = spawn("npm", ["run", command], {
  cwd: nextjsPath,
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: process.env.PORT || "5000"
  }
});

nextProcess.on("error", (error) => {
  console.error("❌ Failed to start NextJS:", error);
  process.exit(1);
});

nextProcess.on("close", (code) => {
  console.log(`NextJS process exited with code ${code}`);
  process.exit(code || 0);
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("🛑 Shutting down NextJS application...");
  nextProcess.kill("SIGINT");
});

process.on("SIGTERM", () => {
  console.log("🛑 Terminating NextJS application...");
  nextProcess.kill("SIGTERM");
});
