import fs from "fs";
import path from "path";

const src = path.join(process.cwd(), "..", "landing page.txt");
const text = fs.readFileSync(src, "utf8");
const match = text.match(/<img src="data:image\/png;base64,([^"]+)"/);
if (!match) {
  console.error("Logo not found");
  process.exit(1);
}

const outDir = path.join(process.cwd(), "public", "brand");
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, "dotmappers-logo.png");
fs.writeFileSync(out, Buffer.from(match[1], "base64"));
console.log("Saved", out, fs.statSync(out).size, "bytes");
