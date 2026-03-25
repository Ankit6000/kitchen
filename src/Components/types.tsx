export interface EmojiMetadata {
  knownSupportedEmoji: Array<string>;
  data: {
    [emojiCodepoint: string]: EmojiData;
  };
}

export interface EmojiMetadataIndex {
  knownSupportedEmoji: Array<string>;
  summaries: {
    [emojiCodepoint: string]: EmojiSummaryData;
  };
}

export interface EmojiSummaryData {
  alt: string;
  keywords: Array<string>;
  emojiCodepoint: string;
  gBoardOrder: number;
}

export interface EmojiData extends EmojiSummaryData {
  combinations: { [otherEmojiCodepoint: string]: Array<EmojiCombination> };
}

export interface EmojiCombination {
  gStaticUrl: string;
  alt: string;
  leftEmoji: string;
  leftEmojiCodepoint: string;
  rightEmoji: string;
  rightEmojiCodepoint: string;
  date: string;
  isLatest: boolean;
  gBoardOrder: number;
}

export interface MouseCoordinates {
  mouseX: number;
  mouseY: number;
}
