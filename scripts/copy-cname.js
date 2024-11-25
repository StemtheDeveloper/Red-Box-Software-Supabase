import { copyFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  // Copy CNAME
  copyFileSync(
    join(__dirname, "..", "CNAME"),
    join(__dirname, "..", "dist", "CNAME")
  );
  console.log("✅ CNAME file copied successfully");

  // Copy 404.html
  copyFileSync(
    join(__dirname, "..", "public", "404.html"),
    join(__dirname, "..", "dist", "404.html")
  );
  console.log("✅ 404.html file copied successfully");
} catch (err) {
  console.error("❌ Error copying files:", err);
  process.exit(1);
}
