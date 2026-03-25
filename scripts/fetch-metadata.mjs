import { existsSync, mkdirSync } from "node:fs";
import { readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const METADATA_URL =
  "https://raw.githubusercontent.com/xsalazar/emoji-kitchen-backend/main/app/metadata.json";
const metadataDir = resolve("public", "metadata");
const indexPath = resolve(metadataDir, "index.json");
const dataDir = resolve(metadataDir, "data");
const tempPath = resolve("public", "metadata.download.json");

async function hasUsableMetadata() {
  if (!existsSync(indexPath)) {
    return false;
  }

  const metadataStats = await stat(indexPath);
  return metadataStats.size > 1024;
}

if (await hasUsableMetadata()) {
  console.log(`metadata index already present at ${indexPath}`);
  process.exit(0);
}

mkdirSync(dirname(tempPath), { recursive: true });
mkdirSync(dataDir, { recursive: true });

console.log(`downloading metadata to ${tempPath}`);
const response = await fetch(METADATA_URL);

if (!response.ok) {
  throw new Error(`metadata download failed with status ${response.status}`);
}

const rawText = await response.text();
await writeFile(tempPath, rawText, "utf8");

console.log("splitting metadata into index + detail files");
const parsed = JSON.parse(rawText);

const summaries = {};
for (const [emojiCodepoint, emojiData] of Object.entries(parsed.data)) {
  summaries[emojiCodepoint] = {
    alt: emojiData.alt,
    keywords: emojiData.keywords,
    emojiCodepoint: emojiData.emojiCodepoint,
    gBoardOrder: emojiData.gBoardOrder,
  };

  await writeFile(
    resolve(dataDir, `${emojiCodepoint}.json`),
    JSON.stringify(emojiData),
    "utf8",
  );
}

await writeFile(
  indexPath,
  JSON.stringify({
    knownSupportedEmoji: parsed.knownSupportedEmoji,
    summaries,
  }),
  "utf8",
);

await rm(tempPath, { force: true });
console.log("metadata split complete");
