import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function loadLocalEnv() {
  const currentFile = fileURLToPath(import.meta.url);
  const rootDir = path.resolve(path.dirname(currentFile), "..");

  for (const filename of [".env.local", ".env"]) {
    const targetPath = path.join(rootDir, filename);

    if (!fs.existsSync(targetPath)) {
      continue;
    }

    const contents = fs.readFileSync(targetPath, "utf8");
    const lines = contents.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();

      if (!process.env[key]) {
        process.env[key] = rawValue;
      }
    }
  }
}
