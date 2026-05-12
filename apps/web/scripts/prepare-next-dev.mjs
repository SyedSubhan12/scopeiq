import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

fs.rmSync(path.join(root, ".next"), { recursive: true, force: true });
fs.mkdirSync(path.join(root, ".next/static/development"), { recursive: true });
