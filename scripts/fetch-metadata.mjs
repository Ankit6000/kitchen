import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pipeline } from "node:stream/promises";

const METADATA_URL =
  "https://raw.githubusercontent.com/xsalazar/emoji-kitchen-backend/main/app/metadata.json";
const targetPath = resolve("public", "metadata.json");

async function hasUsableMetadata() {
  if (!existsSync(targetPath)) {
    return false;
  }

  const metadataStats = await stat(targetPath);
  return metadataStats.size > 1024;
}

if (await hasUsableMetadata()) {
  console.log(`metadata already present at ${targetPath}`);
  process.exit(0);
}

mkdirSync(dirname(targetPath), { recursive: true });

console.log(`downloading metadata to ${targetPath}`);
const response = await fetch(METADATA_URL);

if (!response.ok || !response.body) {
  throw new Error(`metadata download failed with status ${response.status}`);
}

await pipeline(response.body, createWriteStream(targetPath));
console.log("metadata download complete");
