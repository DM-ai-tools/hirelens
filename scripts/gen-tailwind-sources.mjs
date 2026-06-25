import { readdirSync, statSync, writeFileSync, readFileSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const globalsDir = join(root, "src", "app");
const srcDir = join(root, "src");
const outFile = join(root, "src", "app", "globals.css");
const startMarker = "/* tailwind-sources:start";
const endMarker = "/* tailwind-sources:end */";

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, files);
    } else if (entry.endsWith(".tsx")) {
      files.push(full);
    }
  }
  return files;
}

const dirs = new Set(
  walk(srcDir).map((file) => relative(globalsDir, dirname(file)).replace(/\\/g, "/"))
);

const sources = [...dirs]
  .sort()
  .map((dir) => {
    const path = dir === "" ? "./*.tsx" : `${dir}/*.tsx`;
    return `@source "${path}";`;
  })
  .join("\n");

const header = `${startMarker} — run: node scripts/gen-tailwind-sources.mjs */\n`;
const block = `${header}${sources}\n${endMarker}\n`;

const globals = readFileSync(outFile, "utf8");
const start = globals.indexOf(startMarker);
const end = globals.indexOf(endMarker);
if (start === -1 || end === -1) {
  throw new Error("tailwind-sources markers missing in globals.css");
}
const updated =
  globals.slice(0, start) + block + globals.slice(end + endMarker.length);
writeFileSync(outFile, updated);
console.log(`Updated ${dirs.size} @source entries in ${outFile}`);
