import type { EmojiData, EmojiMetadata } from "./types";

let cachedMetadata: EmojiMetadata | null = null;
let cachedPrintableEmojiMap: Map<string, string> | null = null;

/**
 * Loads emoji metadata from the server (lazy-loaded to avoid blocking initial bundle).
 * Safe to call multiple times; subsequent calls resolve immediately with cached data.
 */
export async function loadMetadata(): Promise<void> {
  if (cachedMetadata) {
    return;
  }

  // Loaded via the `./public` directory and shipped with GitHub pages
  var res = await fetch(`${import.meta.env.BASE_URL}metadata.json`);
  if (!res.ok) {
    throw new Error(`Failed to load metadata: ${res.status}`);
  }

  cachedMetadata = (await res.json()) as EmojiMetadata;
  cachedPrintableEmojiMap = null;
  return;
}

/**
 * Converts an emoji codepoint into a printable emoji used for log statements
 */
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
  if (!cachedMetadata) {
    throw new Error("Metadata not loaded");
  }

  if (!cachedPrintableEmojiMap) {
    cachedPrintableEmojiMap = new Map(
      cachedMetadata.knownSupportedEmoji.map((emojiCodepoint) => [
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

/**
 * Converts an emoji codepoint into a static github reference image url
 */
export function getNotoEmojiUrl(emojiCodepoint: string): string {
  return `https://raw.githubusercontent.com/googlefonts/noto-emoji/main/svg/emoji_u${emojiCodepoint
    .split("-")
    .filter((x) => x !== "fe0f")
    .map((x) => x.padStart(4, "0")) // Handle ©️ and ®️
    .join("_")}.svg`;
}

export function getEmojiData(emojiCodepoint: string): EmojiData {
  if (!cachedMetadata) {
    throw new Error("Metadata not loaded");
  }

  return cachedMetadata.data[emojiCodepoint];
}

export function getSupportedEmoji(): Array<string> {
  if (!cachedMetadata) {
    throw new Error("Metadata not loaded");
  }

  return cachedMetadata.knownSupportedEmoji;
}

export function searchSupportedEmoji(query: string): Array<string> {
  if (!cachedMetadata) {
    throw new Error("Metadata not loaded");
  }

  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length === 0) {
    return [];
  }

  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);

  return cachedMetadata.knownSupportedEmoji.filter((emojiCodepoint) => {
    const emojiData = cachedMetadata!.data[emojiCodepoint];
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
