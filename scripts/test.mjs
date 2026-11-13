import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = mkdtempSync(join(tmpdir(), "portfolio-tests-"));

try {
  execFileSync(process.execPath, [
    join(root, "node_modules/typescript/bin/tsc"),
    "tests/board-store.test.ts", "convex/_generated/api.js",
    "--outDir", output, "--allowJs", "--module", "node16",
    "--target", "es2022", "--skipLibCheck",
  ], { cwd: root, stdio: "inherit" });
  execFileSync(process.execPath, [join(output, "tests/board-store.test.js")], {
    env: { ...process.env, NODE_PATH: join(root, "node_modules") },
    stdio: "inherit",
  });
} finally {
  rmSync(output, { recursive: true, force: true });
}
