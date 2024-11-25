// scripts/copy-cname.js
import { copyFileSync } from "fs";
import { join } from "path";

try {
  copyFileSync(
    join(process.cwd(), "CNAME"),
    join(process.cwd(), "dist", "CNAME")
  );
  console.log("CNAME file copied successfully");
} catch (err) {
  console.error("Error copying CNAME file:", err);
  process.exit(1);
}
