import type {
  EmojiData,
  EmojiMetadataIndex,
  EmojiSummaryData,
} from "./types";

let cachedMetadataIndex: EmojiMetadataIndex | null = null;
let cachedPrintableEmojiMap: Map<string, string> | null = null;
let cachedEmojiDetails = new Map<string, EmojiData>();

export async function loadMetadata(): Promise<void> {
  if (cachedMetadataIndex) {
    return;
  }

  const res = await fetch(`${import.meta.env.BASE_URL}metadata/index.json`);
  if (!res.ok) {
    throw new Error(`Failed to load metadata: ${res.status}`);
  }

  cachedMetadataIndex = (await res.json()) as EmojiMetadataIndex;
  cachedPrintableEmojiMap = null;
}

export async function loadEmojiData(emojiCodepoint: string): Promise<void> {
  if (cachedEmojiDetails.has(emojiCodepoint)) {
    return;
  }

  const res = await fetch(
    `${import.meta.env.BASE_URL}metadata/data/${emojiCodepoint}.json`,
  );
  if (!res.ok) {
    throw new Error(`Failed to load emoji detail: ${res.status}`);
  }

  cachedEmojiDetails.set(emojiCodepoint, (await res.json()) as EmojiData);
}

export async function preloadEmojiData(
  emojiCodepoints: Array<string>,
): Promise<void> {
  const uniqueCodepoints = Array.from(
    new Set(emojiCodepoints.filter((emojiCodepoint) => emojiCodepoint !== "")),
  );

  await Promise.all(uniqueCodepoints.map((emojiCodepoint) => loadEmojiData(emojiCodepoint)));
}

export function hasEmojiData(emojiCodepoint: string): boolean {
  return cachedEmojiDetails.has(emojiCodepoint);
}

export function toPrintableEmoji(emojiCodepoint: string): string {
  return String.fromCodePoint(
    ...emojiCodepoint.split("-").map((p) => parseInt(`0x${p}`)),
  );
}

export function toEmojiCodepoint(emoji: string): string {
  return Array.from(emoji)
    .map((character) =>
      character.codePointAt(0)!.toString(16).toLowerCase().padStart(4, "0"),
    )
    .join("-");
}

function getSupportedPrintableEmojiMap(): Map<string, string> {
  if (!cachedMetadataIndex) {
    throw new Error("Metadata not loaded");
  }

  if (!cachedPrintableEmojiMap) {
    cachedPrintableEmojiMap = new Map(
      cachedMetadataIndex.knownSupportedEmoji.map((emojiCodepoint) => [
        toPrintableEmoji(emojiCodepoint),
        emojiCodepoint,
      ]),
    );
  }

  return cachedPrintableEmojiMap;
}

export function extractSupportedEmojiFromInput(value: string): Array<string> {
  const printableEmojiMap = getSupportedPrintableEmojiMap();
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const matches: Array<string> = [];

  for (const { segment } of segmenter.segment(value)) {
    const supportedEmoji = printableEmojiMap.get(segment);
    if (supportedEmoji) {
      matches.push(supportedEmoji);
    }
  }

  return matches;
}

export function getNotoEmojiUrl(emojiCodepoint: string): string {
  return `https://raw.githubusercontent.com/googlefonts/noto-emoji/main/svg/emoji_u${emojiCodepoint
    .split("-")
    .filter((x) => x !== "fe0f")
    .map((x) => x.padStart(4, "0"))
    .join("_")}.svg`;
}

export function getEmojiSummary(emojiCodepoint: string): EmojiSummaryData {
  if (!cachedMetadataIndex) {
    throw new Error("Metadata not loaded");
  }

  return cachedMetadataIndex.summaries[emojiCodepoint];
}

export function getEmojiData(emojiCodepoint: string): EmojiData {
  const data = cachedEmojiDetails.get(emojiCodepoint);
  if (!data) {
    throw new Error("Emoji detail not loaded");
  }

  return data;
}

export function getSupportedEmoji(): Array<string> {
  if (!cachedMetadataIndex) {
    throw new Error("Metadata not loaded");
  }

  return cachedMetadataIndex.knownSupportedEmoji;
}

export function searchSupportedEmoji(query: string): Array<string> {
  if (!cachedMetadataIndex) {
    throw new Error("Metadata not loaded");
  }

  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length === 0) {
    return [];
  }

  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);

  return cachedMetadataIndex.knownSupportedEmoji.filter((emojiCodepoint) => {
    const emojiData = cachedMetadataIndex!.summaries[emojiCodepoint];
    const haystack = [
      emojiData.alt,
      ...emojiData.keywords,
      toPrintableEmoji(emojiCodepoint),
    ]
      .join(" ")
      .toLowerCase();

    return queryTerms.every((term) => haystack.includes(term));
  });
}
