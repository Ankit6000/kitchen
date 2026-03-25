import { ImageListItem } from "@mui/material";
import { Dispatch } from "react";
import {
  getEmojiData,
  getEmojiSummary,
  getNotoEmojiUrl,
  getSupportedEmoji,
  hasEmojiData,
} from "./utils";

export default function RightEmojiList({
  handleRightEmojiClicked,
  rightSearchResults,
  selectedLeftEmoji,
  selectedRightEmoji,
}: {
  handleRightEmojiClicked: Dispatch<string>;
  rightSearchResults: Array<string>;
  selectedLeftEmoji: string;
  selectedRightEmoji: string;
}) {
  var knownSupportedEmoji = getSupportedEmoji();
  var hasSelectedLeftEmoji = selectedLeftEmoji !== "";

  // If we have search results, filter the top-level items down
  if (rightSearchResults.length > 0) {
    knownSupportedEmoji = knownSupportedEmoji.filter((emoji) =>
      rightSearchResults.includes(emoji)
    );
  }

  // If we have a selectedLeftEmoji, save the valid combinations for that emoji
  var possibleEmoji: Array<string> = [];
  if (hasSelectedLeftEmoji && hasEmojiData(selectedLeftEmoji)) {
    const data = getEmojiData(selectedLeftEmoji);
    possibleEmoji = Object.keys(data.combinations);
  }

  return knownSupportedEmoji.map((emojiCodepoint) => {
    const data = getEmojiSummary(emojiCodepoint);
    // Every right-hand emoji is valid unless we have a selected left-hand emoji
    // In which case, we need to explicitly check if it's a valid combination
    var isValidCombo = true;
    if (hasSelectedLeftEmoji && hasEmojiData(selectedLeftEmoji)) {
      isValidCombo = possibleEmoji.includes(emojiCodepoint);
    } else if (hasSelectedLeftEmoji) {
      isValidCombo = false;
    }

    return (
      <div key={data.alt}>
        <ImageListItem
          onClick={(_) =>
            hasSelectedLeftEmoji && isValidCombo
              ? handleRightEmojiClicked(emojiCodepoint)
              : null
          }
          sx={{
            p: 0.5,
            borderRadius: 2,
            opacity: (_) => {
              if (!hasSelectedLeftEmoji) {
                return 0.1;
              }

              return isValidCombo ? 1 : 0.1;
            },
            backgroundColor: (theme) =>
              selectedRightEmoji === emojiCodepoint
                ? theme.palette.action.selected
                : theme.palette.background.default,
            "&:hover": {
              backgroundColor: (theme) => {
                if (hasSelectedLeftEmoji) {
                  return theme.palette.action.hover;
                }
              },
            },
          }}
        >
          <img
            loading="lazy"
            width="32px"
            height="32px"
            alt={data.alt}
            src={getNotoEmojiUrl(emojiCodepoint)}
          />
        </ImageListItem>
      </div>
    );
  });
}
