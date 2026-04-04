/**
 * Runs ui-ux-pro-max design-system generation when the skill exists locally
 * (.cursor is often gitignored). Output: docs/design-system/
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillScript = path.join(root, ".cursor", "skills", "ui-ux-pro-max", "scripts", "search.py");
const outDir = path.join(root, "docs", "design-system");

if (!fs.existsSync(skillScript)) {
  console.warn(
    "[design-system] Skill script not found at .cursor/skills/ui-ux-pro-max/scripts/search.py",
  );
  console.warn(
    "[design-system] Commit already includes docs/design-system/MASTER.md; install Cursor skills locally to regenerate.",
  );
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });

function runPython(exe) {
  return spawnSync(
    exe,
    [
      skillScript,
      "streaming TV dark living room launcher OLED focus",
      "--design-system",
      "--persist",
      "-p",
      "Orange TV",
      "-o",
      outDir,
    ],
    { cwd: root, stdio: "inherit", shell: false },
  );
}

let result = runPython("python");
if (result.error || result.status !== 0) {
  result = runPython("py");
}

if (result.status === 0) {
  const nested = path.join(outDir, "design-system", "orange-tv", "MASTER.md");
  const flat = path.join(outDir, "MASTER.md");
  if (fs.existsSync(nested)) {
    fs.copyFileSync(nested, flat);
    fs.rmSync(path.join(outDir, "design-system"), { recursive: true, force: true });
    console.log("[design-system] Flattened MASTER.md to docs/design-system/MASTER.md");
  }
}

process.exit(result.status ?? 1);
