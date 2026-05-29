import { chmodSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const uploadsDir = join(process.cwd(), "public", "uploads");

mkdirSync(uploadsDir, { recursive: true });

try {
  chmodSync(uploadsDir, 0o777);
} catch {
  // Some local filesystems ignore chmod; the folder only needs to exist there.
}
