import ContentCopy from "@mui/icons-material/ContentCopy";
import Download from "@mui/icons-material/Download";
import LoadingButton from "@mui/lab/LoadingButton";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Fab from "@mui/material/Fab";
import Fade from "@mui/material/Fade";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import ImageList from "@mui/material/ImageList";
import ImageListItem, {
  imageListItemClasses,
} from "@mui/material/ImageListItem";
import InputBase from "@mui/material/InputBase";
import Menu from "@mui/material/Menu";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import saveAs from "file-saver";
import JSZip from "jszip";
import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import LeftEmojiList from "./left-emoji-list";
import MobileEmojiList from "./mobile-emoji-list";
import RightEmojiList from "./right-emoji-list";
import Search from "./search";
import { MouseCoordinates } from "./types";
import {
  extractSupportedEmojiFromInput,
  getEmojiData,
  getNotoEmojiUrl,
  getSupportedEmoji,
  loadMetadata,
  toPrintableEmoji,
} from "./utils";

export default function Kitchen() {
  // Metadata loaded gate (lazy-loaded to keep initial bundle small)
  const [metadataReady, setMetadataReady] = useState(false);
  const [metadataError, setMetadataError] = useState<Error | null>(null);

  // Selection helpers
  var [selectedLeftEmoji, setSelectedLeftEmoji] = useState("");
  var [selectedRightEmoji, setSelectedRightEmoji] = useState("");

  // Mobile helpers
  const [leftEmojiSelected, setLeftEmojiSelected] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(
    window.innerHeight <= 512,
  );
  const [selectedMode, setSelectedMode] = useState("type");
  const [copyFeedback, setCopyFeedback] = useState("");
  const [typedEmojiInput, setTypedEmojiInput] = useState("");
  const [isTypeComposerExpanded, setIsTypeComposerExpanded] = useState(true);

  // Downloading helpers
  const [bulkDownloadMenu, setBulkDownloadMenu] = useState<
    MouseCoordinates | undefined
  >();
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

  // Search results helpers
  const [leftSearchResults, setLeftSearchResults] = useState<Array<string>>([]);
  const [rightSearchResults, setRightSearchResults] = useState<Array<string>>(
    [],
  );
  const [mobileSearchResults, setMobileSearchResults] = useState<Array<string>>(
    [],
  );

  // Search terms helpers
  const [leftUuid, setLeftUuid] = useState<string>(uuidv4());
  const [rightUuid, setRightUuid] = useState<string>(uuidv4());
  const [mobileUuid, setMobileUuid] = useState<string>(uuidv4());

  // Lazy-load metadata so the large JSON is not in the initial bundle
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        await loadMetadata();
        setMetadataReady(true);
      } catch (e) {
        setMetadataReady(false);
        setMetadataError(e instanceof Error ? e : new Error(String(e)));
      }
    };

    fetchMetadata();
  }, []);

  /**
   * 📱 Mobile handler to naively detect if we're on a phone or not
   */
  function handleWindowWidthChange() {
    window.innerWidth <= 768 ? setIsMobile(true) : setIsMobile(false);
  }
  useEffect(() => {
    window.addEventListener("resize", handleWindowWidthChange);
    return () => {
      window.removeEventListener("resize", handleWindowWidthChange);
    };
  }, []);

  /**
   * 📱 Mobile handler to naively detect if we're on a phone or not
   */
  function handleWindowHeightChange() {
    window.innerHeight <= 512
      ? setIsKeyboardOpen(true)
      : setIsKeyboardOpen(false);
  }
  useEffect(() => {
    window.addEventListener("resize", handleWindowHeightChange);
    return () => {
      window.removeEventListener("resize", handleWindowHeightChange);
    };
  }, []);

  /**
   * 📱 Mobile handler to set a random combination on load (after metadata is ready)
   */
  useEffect(() => {
    // Wait until we have the metadata available
    if (!metadataReady) {
      return;
    }

    if (isMobile) {
      handleFullEmojiRandomize();
    }
  }, [isMobile, metadataReady]);

  /**
   * 📱 Mobile handler to reset state when resizing window smaller to trigger mobile view
   */
  useEffect(() => {
    // Wait until we have the metadata available
    if (!metadataReady) {
      return;
    }

    // Leaving mobile view should always be a subset of desktop functionality
    if (!isMobile) {
      return;
    }

    if (selectedLeftEmoji === "" && selectedRightEmoji !== "") {
      handleLeftEmojiRandomize();
    } else if (selectedLeftEmoji !== "" && selectedRightEmoji === "") {
      handleRightEmojiRandomize();
    } else if (selectedLeftEmoji === "" && selectedRightEmoji === "") {
      handleFullEmojiRandomize();
    }
  }, [isMobile, metadataReady]);

  /**
   * 🖨️ Handler to show the little chip when copying a combination on mobile from the browse tab
   */
  useEffect(() => {
    if (copyFeedback !== "") {
      setTimeout(() => {
        setCopyFeedback("");
      }, 1000);
    }
  }, [copyFeedback]);

  useEffect(() => {
    if (selectedMode !== "type") {
      return;
    }

    if (typedEmojiInput.trim() !== "") {
      setIsTypeComposerExpanded(false);
    } else {
      setIsTypeComposerExpanded(true);
    }
  }, [selectedMode, typedEmojiInput]);

  /**
   * 👈 Handler when an emoji is selected from the left-hand list
   */
  const handleLeftEmojiClicked = (clickedEmoji: string) => {
    if (isMobile) {
      // Don't allow columns unselect on mobile
      if (selectedLeftEmoji !== clickedEmoji) {
        setSelectedLeftEmoji(clickedEmoji);
      }
    } else {
      // If we're unsetting the left column, clear the right column too
      if (selectedLeftEmoji === clickedEmoji) {
        setSelectedLeftEmoji("");
        setSelectedRightEmoji("");
      }
      // Else we clicked another left emoji while both are selected, set the left column as selected and clear right column
      else if (selectedRightEmoji !== "") {
        setSelectedLeftEmoji(clickedEmoji);
        setSelectedRightEmoji("");
      } else {
        setSelectedLeftEmoji(clickedEmoji);
      }
    }
  };

  /**
   * 🎲 Handler when left-hand randomize button clicked
   */
  const handleLeftEmojiRandomize = () => {
    if (isMobile) {
      // On mobile, use the right emoji as a base and select a random left emoji from the supported list
      const data = getEmojiData(selectedRightEmoji);
      const possibleLeftEmoji = Object.keys(data.combinations).filter(
        (codepoint) => codepoint !== selectedLeftEmoji, // Don't randomly choose the same left emoji
      );

      const randomLeftEmoji =
        possibleLeftEmoji[Math.floor(Math.random() * possibleLeftEmoji.length)];

      setSelectedLeftEmoji(randomLeftEmoji);
      setLeftEmojiSelected(true); // If you click random on the left emoji, select that one
    } else {
      // Since we're selecting a new left emoji, clear out the right emoji
      var possibleEmoji: Array<string>;

      // Pick a random emoji from all possible emoji
      possibleEmoji = getSupportedEmoji().filter(
        (codepoint) => codepoint !== selectedLeftEmoji,
      );

      const randomEmoji =
        possibleEmoji[Math.floor(Math.random() * possibleEmoji.length)];
      setSelectedLeftEmoji(randomEmoji);
      setSelectedRightEmoji("");
    }
  };

  /**
   * 👉 Handler when an emoji is selected from the right-hand list
   */
  const handleRightEmojiClicked = (clickedEmoji: string) => {
    if (isMobile) {
      // Don't allow column unselect on mobile
      if (selectedRightEmoji !== clickedEmoji) {
        setSelectedRightEmoji(clickedEmoji);
      }
    } else {
      setSelectedRightEmoji(
        clickedEmoji === selectedRightEmoji ? "" : clickedEmoji,
      );
    }
  };

  /**
   * 🎲 Handle right-hand randomize button clicked
   */
  const handleRightEmojiRandomize = () => {
    const data = getEmojiData(selectedLeftEmoji);
    const possibleEmoji = Object.keys(data.combinations).filter(
      (codepoint) => codepoint !== selectedRightEmoji, // Don't randomly choose the same right emoji
    );

    const randomEmoji =
      possibleEmoji[Math.floor(Math.random() * possibleEmoji.length)];

    setSelectedRightEmoji(randomEmoji);

    if (isMobile) {
      setLeftEmojiSelected(false);
    }
  };

  /**
   * 🎲 Handle full randomize button clicked
   */
  const handleFullEmojiRandomize = () => {
    const knownSupportedEmoji = getSupportedEmoji();
    const randomLeftEmoji =
      knownSupportedEmoji[
        Math.floor(Math.random() * knownSupportedEmoji.length)
      ];

    const data = getEmojiData(randomLeftEmoji);
    const possibleRightEmoji = Object.keys(data.combinations).filter(
      (codepoint) => codepoint !== randomLeftEmoji,
    );

    const randomRightEmoji =
      possibleRightEmoji[Math.floor(Math.random() * possibleRightEmoji.length)];

    setSelectedLeftEmoji(randomLeftEmoji);
    setSelectedRightEmoji(randomRightEmoji);

    if (isMobile) {
      setMobileSearchResults([]);
      setMobileUuid(uuidv4());
    } else {
      setLeftSearchResults([]);
      setLeftUuid(uuidv4());
      setRightSearchResults([]);
      setRightUuid(uuidv4());
    }
  };

  /**
   * 💭 Helper function to open the bulk download menu
   */
  const handleBulkImageDownloadMenuOpen = (event: React.MouseEvent) => {
    event.preventDefault();
    setBulkDownloadMenu(
      bulkDownloadMenu === undefined
        ? {
            mouseX: event.clientX - 2,
            mouseY: event.clientY - 4,
          }
        : undefined,
    );
  };

  /**
   * 💾 Handle bulk combination downloads
   */
  const handleBulkImageDownload = async () => {
    try {
      // See: https://github.com/Stuk/jszip/issues/369
      // See: https://github.com/Stuk/jszip/issues/690
      const currentDate = new Date();
      const dateWithOffset = new Date(
        currentDate.getTime() - currentDate.getTimezoneOffset() * 60000,
      );
      (JSZip as any).defaults.date = dateWithOffset;

      const zip = new JSZip();
      const data = getEmojiData(selectedLeftEmoji);
      const photoZip = zip.folder(data.alt)!;

      setIsBulkDownloading(true);

      const combinations = Object.values(data.combinations)
        .flat()
        .filter((c) => c.isLatest);
      for (var i = 0; i < combinations.length; i++) {
        const combination = combinations[i];
        const image = await fetch(combination.gStaticUrl);
        const imageBlob = await image.blob();
        photoZip.file(`${combination.alt}.png`, imageBlob);
      }

      const archive = await zip.generateAsync({ type: "blob" });
      saveAs(archive, data.alt);

      setBulkDownloadMenu(undefined);
      setIsBulkDownloading(false);
    } catch (e) {
      setBulkDownloadMenu(undefined);
      setIsBulkDownloading(false);
    }
  };

  /**
   * 💾 Handle single combination downloads
   */
  const handleImageDownload = () => {
    var combination = getEmojiData(selectedLeftEmoji).combinations[
      selectedRightEmoji
    ].filter((c) => c.isLatest)[0];

    saveAs(combination.gStaticUrl, combination.alt);
  };

  /**
   * 💾 Handle single image copy-to-clipboard
   */
  const handleImageCopy = async (url?: string, alt?: string) => {
    if (!url) {
      const selectedCombination = getEmojiData(selectedLeftEmoji).combinations[
        selectedRightEmoji
      ]?.filter((c) => c.isLatest)[0];

      url = selectedCombination?.gStaticUrl;
      alt = selectedCombination?.alt;
    }

    if (!url) {
      setCopyFeedback("No image");
      return;
    }

    try {
      if (
        !("clipboard" in navigator) ||
        !("write" in navigator.clipboard) ||
        typeof ClipboardItem === "undefined"
      ) {
        throw new Error("Clipboard image copy unavailable");
      }

      const image = await fetch(url);
      const imageBlob = await image.blob();

      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": imageBlob,
        }),
      ]);

      setCopyFeedback("Copied");
    } catch (error) {
      saveAs(url, alt ?? "emoji-kitchen");
      setCopyFeedback("Downloaded");
      console.log(error);
    }
  };

  // If we have an error, show that first
  if (metadataError) {
    return (
      <Container
        maxWidth="sm"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
        }}
      >
        <Typography color="error" gutterBottom>
          Failed to load emoji data 🙈
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {metadataError ? metadataError.message : "We'll be right back"}
        </Typography>
      </Container>
    );
  }

  // If we're still loading the metadata, show the loader
  if (!metadataReady) {
    return (
      <Container
        maxWidth="xl"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
        }}
      >
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Loading emoji data...
        </Typography>
        <CircularProgress size={32} />
      </Container>
    );
  }

  // See: https://caniuse.com/async-clipboard
  var hasClipboardSupport =
    !!navigator.clipboard && "write" in navigator.clipboard;
  var middleList;
  var combination;
  var showOneCombo = false;
  const typedEmojiMatches =
    isMobile && metadataReady
      ? extractSupportedEmojiFromInput(typedEmojiInput).slice(0, 2)
      : [];
  const typedLeftEmoji = typedEmojiMatches[0] ?? "";
  const typedRightEmoji = typedEmojiMatches[1] ?? "";
  const typedLeftEmojiData =
    typedLeftEmoji !== "" ? getEmojiData(typedLeftEmoji) : undefined;
  const typedAllCombinations = typedLeftEmojiData
    ? Object.values(typedLeftEmojiData.combinations)
        .flat()
        .filter((combo) => combo.isLatest)
        .sort((c1, c2) => c1.gBoardOrder - c2.gBoardOrder)
    : [];
  const typedExactCombination =
    typedLeftEmojiData && typedRightEmoji !== ""
      ? typedLeftEmojiData.combinations[typedRightEmoji]?.filter(
          (combo) => combo.isLatest,
        )[0]
      : undefined;
  const typedRenderedCombinations = typedExactCombination
    ? [
        typedExactCombination,
        ...typedAllCombinations.filter(
          (combo) => combo.alt !== typedExactCombination.alt,
        ),
      ]
    : typedAllCombinations;
  const typedEmojiSummary = typedEmojiMatches.map((emojiCodepoint) => ({
    codepoint: emojiCodepoint,
    emoji: toPrintableEmoji(emojiCodepoint),
    alt: getEmojiData(emojiCodepoint).alt,
  }));
  const quickKeyboardEmoji = [
    "1f602",
    "1f970",
    "1f60d",
    "1f525",
    "1f44d",
    "1f923",
    "1f63b",
    "1f47b",
    "1f436",
    "1f34e",
    "1f31e",
    "2764-fe0f",
  ]
    .filter((emojiCodepoint) => getSupportedEmoji().includes(emojiCodepoint))
    .map((emojiCodepoint) => ({
      codepoint: emojiCodepoint,
      emoji: toPrintableEmoji(emojiCodepoint),
      alt: getEmojiData(emojiCodepoint).alt,
    }));

  const handleQuickEmojiInsert = (emoji: string) => {
    setTypedEmojiInput((currentInput) => `${currentInput}${emoji}`);
  };

  const handleTypedInputBackspace = () => {
    const graphemes = Array.from(
      new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(
        typedEmojiInput,
      ),
      ({ segment }) => segment,
    );

    graphemes.pop();
    setTypedEmojiInput(graphemes.join(""));
  };

  const frostedPanelSx = {
    background:
      "linear-gradient(180deg, rgba(255, 251, 245, 0.92) 0%, rgba(249, 242, 230, 0.82) 100%)",
    border: "1px solid rgba(146, 116, 78, 0.16)",
    boxShadow: "0 22px 56px rgba(83, 63, 35, 0.12)",
  };

  const softInsetSx = {
    background:
      "linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(248, 239, 225, 0.76) 100%)",
    border: "1px solid rgba(146, 116, 78, 0.14)",
    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.72)",
  };

  // Middle list logic (could be better)
  if (isMobile) {
    if (selectedMode === "type") {
      middleList = typedRenderedCombinations.map((typedCombination) => {
        const isExactMatch =
          typedExactCombination?.alt === typedCombination.alt;

        return (
          <ButtonBase
            key={typedCombination.alt}
            onClick={(_) =>
              handleImageCopy(typedCombination.gStaticUrl, typedCombination.alt)
            }
            sx={{
              p: 0.5,
              borderRadius: 2,
              border: (theme) =>
                isExactMatch
                  ? `2px solid ${theme.palette.primary.main}`
                  : "2px solid transparent",
              "&:hover": {
                backgroundColor: (theme) => {
                  return theme.palette.action.hover;
                },
              },
            }}
          >
            <ImageListItem>
              <img
                loading="lazy"
                width="256px"
                height="256px"
                alt={typedCombination.alt}
                src={typedCombination.gStaticUrl}
              />
            </ImageListItem>
          </ButtonBase>
        );
      });
    } else if (selectedLeftEmoji === "" || selectedRightEmoji === "") {
      middleList = <div></div>;
    } else if (selectedMode === "combine") {
      showOneCombo = true;

      // First figure out what your "base" should be
      var baseEmoji = leftEmojiSelected
        ? selectedLeftEmoji
        : selectedRightEmoji;
      var otherEmoji = leftEmojiSelected
        ? selectedRightEmoji
        : selectedLeftEmoji;

      // Get the possible combinations for that base
      var combinations = getEmojiData(baseEmoji).combinations;

      // If we're switching out of the browse mode, the resulting leftover combination may no longer be valid
      // If so, generate a random pair and set the "other" appropriately
      if (!Object.keys(combinations).includes(otherEmoji)) {
        var possibleEmoji = Object.keys(combinations);
        var otherEmoji =
          possibleEmoji[Math.floor(Math.random() * possibleEmoji.length)];

        // Reset the "other" to a random valid combo
        if (leftEmojiSelected) {
          setSelectedRightEmoji(otherEmoji);
        } else {
          setSelectedLeftEmoji(otherEmoji);
        }
      }

      combination = combinations[otherEmoji].filter((c) => c.isLatest)[0];

      middleList = (
        <ImageListItem>
          <img alt={combination.alt} src={combination.gStaticUrl} />
        </ImageListItem>
      );
    } else {
      // Browse combination browser on mobile
      var baseEmoji = leftEmojiSelected
        ? selectedLeftEmoji
        : selectedRightEmoji;
      middleList = Object.values(getEmojiData(baseEmoji).combinations)
        .flat()
        .filter((combination) => combination.isLatest)
        .sort((c1, c2) => c1.gBoardOrder - c2.gBoardOrder)
        .map((combination) => {
          return (
            <ButtonBase
              onClick={(_) => handleImageCopy(combination.gStaticUrl)}
              sx={{
                p: 0.5,
                borderRadius: 2,
                "&:hover": {
                  backgroundColor: (theme) => {
                    return theme.palette.action.hover;
                  },
                },
              }}
            >
              <ImageListItem key={combination.alt}>
                <img
                  loading="lazy"
                  width="256px"
                  height="256px"
                  alt={combination.alt}
                  src={combination.gStaticUrl}
                />
              </ImageListItem>
            </ButtonBase>
          );
        });
    }
  } else {
    // Neither are selected, show left list, empty middle list, and disable right list
    if (selectedLeftEmoji === "" && selectedRightEmoji === "") {
      middleList = <div></div>;
    }
    // Left emoji is selected, but not right, show the full list of combinations
    else if (selectedLeftEmoji !== "" && selectedRightEmoji === "") {
      middleList = Object.values(getEmojiData(selectedLeftEmoji).combinations)
        .flat()
        .filter((combination) => combination.isLatest)
        .sort((c1, c2) => c1.gBoardOrder - c2.gBoardOrder)
        .map((combination) => {
          return (
            <ImageListItem key={combination.alt}>
              <img
                loading="lazy"
                width="256px"
                height="256px"
                alt={combination.alt}
                src={combination.gStaticUrl}
              />
            </ImageListItem>
          );
        });
    }
    // Both are selected, show the single combo
    else {
      showOneCombo = true;
      combination = getEmojiData(selectedLeftEmoji).combinations[
        selectedRightEmoji
      ].filter((c) => c.isLatest)[0];

      middleList = (
        <ImageListItem>
          <img alt={combination.alt} src={combination.gStaticUrl} />
        </ImageListItem>
      );
    }
  }

  // Render mobile view
  if (isMobile) {
    return (
      <Container
        maxWidth="xl"
        sx={{
          flexGrow: "1",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          mt: 0,
          position: "relative",
          height: "100dvh",
          minWidth: "320px",
          px: { xs: 0.75, sm: 1.5 },
          pt: 1.25,
        }}
      >
        <Box
          sx={{
            overflowY: "auto",
            flexGrow: "1",
            width: "100%",
          }}
        >
          <Paper
            hidden={selectedMode !== "type" && isKeyboardOpen}
            sx={{
              ...frostedPanelSx,
              position: "sticky",
              top: 10,
              zIndex: 2,
              mx: 0.5,
              mb: 1.25,
              p: "18px",
              borderRadius: 6,
              justifyContent: "center",
            }}
          >
            <Stack direction="column" spacing={1} alignItems="center">
              <ToggleButtonGroup
                color="primary"
                exclusive
                onChange={(_, value) => {
                  if (value) {
                    setSelectedMode(value);
                  }
                }}
                size="small"
                sx={{
                  backgroundColor: "rgba(255,255,255,0.72)",
                  borderRadius: 999,
                  p: 0.5,
                }}
                value={selectedMode}
              >
                <ToggleButton
                  sx={{ border: 0, borderRadius: 999, px: 1.5 }}
                  value="type"
                >
                  Type
                </ToggleButton>
                <ToggleButton
                  sx={{ border: 0, borderRadius: 999, px: 1.5 }}
                  value="combine"
                >
                  Combine
                </ToggleButton>
                <ToggleButton
                  sx={{ border: 0, borderRadius: 999, px: 1.5 }}
                  value="browse"
                >
                  Browse
                </ToggleButton>
              </ToggleButtonGroup>

              {selectedMode === "type" ? (
                <Stack direction="column" spacing={1} sx={{ width: "100%" }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      ...frostedPanelSx,
                      p: "10px 12px",
                      borderRadius: 5,
                    }}
                  >
                    <Stack direction="column" spacing={1}>
                      <Stack
                        alignItems="center"
                        direction="row"
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Typography variant="subtitle2">
                          Emoji Keyboard
                        </Typography>
                        <ButtonBase
                          onClick={() =>
                            setIsTypeComposerExpanded((current) => !current)
                          }
                          sx={{
                            ...softInsetSx,
                            borderRadius: 999,
                            px: 1.5,
                            py: 0.5,
                            typography: "caption",
                          }}
                        >
                          {isTypeComposerExpanded ? "Hide" : "Edit"}
                        </ButtonBase>
                      </Stack>
                      <Typography
                        color="text.secondary"
                        sx={{ fontSize: "0.78rem", px: 0.5 }}
                      >
                        Pick two emoji, then tap any mix below to copy it.
                      </Typography>
                      <Paper
                        elevation={0}
                        sx={{
                          ...softInsetSx,
                          alignItems: "center",
                          borderRadius: 999,
                          display: "flex",
                          gap: 1,
                          p: "8px 10px",
                        }}
                        >
                          <InputBase
                            autoCapitalize="off"
                            autoCorrect="off"
                            inputMode="text"
                            onFocus={() => setIsTypeComposerExpanded(true)}
                            multiline
                            onChange={(
                              event: React.ChangeEvent<HTMLInputElement>,
                            ) => {
                              setTypedEmojiInput(event.target.value);
                          }}
                          placeholder="Type or paste 2 emoji"
                          sx={{
                            fontSize: "1.4rem",
                            fontWeight: 700,
                            width: "100%",
                          }}
                          value={typedEmojiInput}
                        />
                        <Chip
                          label={`${typedEmojiMatches.length}/2`}
                          size="small"
                          sx={{
                            minWidth: 46,
                            "& .MuiChip-label": {
                              fontWeight: 800,
                            },
                          }}
                        />
                      </Paper>
                      {isTypeComposerExpanded ? (
                        <>
                          <Box
                            sx={{
                              display: "grid",
                              gap: 1,
                              gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
                            }}
                          >
                            {quickKeyboardEmoji.map((quickEmoji) => (
                              <ButtonBase
                                key={quickEmoji.codepoint}
                                onClick={() =>
                                  handleQuickEmojiInsert(quickEmoji.emoji)
                                }
                                sx={{
                                  ...softInsetSx,
                                  aspectRatio: "1 / 1",
                                  borderRadius: 3,
                                  fontFamily:
                                    "Noto Emoji, Apple Color Emoji, sans-serif",
                                  fontSize: "1.5rem",
                                  lineHeight: 1,
                                }}
                                title={quickEmoji.alt}
                              >
                                {quickEmoji.emoji}
                              </ButtonBase>
                            ))}
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <ButtonBase
                              onClick={handleTypedInputBackspace}
                              sx={{
                                ...softInsetSx,
                                borderRadius: 999,
                                flex: 1,
                                px: 2,
                                py: 1,
                                typography: "button",
                              }}
                            >
                              Delete
                            </ButtonBase>
                            <ButtonBase
                              onClick={() => setTypedEmojiInput("")}
                              sx={{
                                ...softInsetSx,
                                borderRadius: 999,
                                flex: 1,
                                px: 2,
                                py: 1,
                                typography: "button",
                              }}
                            >
                              Clear
                            </ButtonBase>
                          </Stack>
                        </>
                      ) : (
                        <Stack direction="row" spacing={1}>
                          <ButtonBase
                            onClick={handleTypedInputBackspace}
                            sx={{
                              ...softInsetSx,
                              borderRadius: 999,
                              flex: 1,
                              px: 2,
                              py: 1,
                              typography: "button",
                            }}
                          >
                            Delete
                          </ButtonBase>
                          <ButtonBase
                            onClick={() => {
                              setTypedEmojiInput("");
                              setIsTypeComposerExpanded(true);
                            }}
                            sx={{
                              ...softInsetSx,
                              borderRadius: 999,
                              flex: 1,
                              px: 2,
                              py: 1,
                              typography: "button",
                            }}
                          >
                            Clear
                          </ButtonBase>
                        </Stack>
                      )}
                    </Stack>
                  </Paper>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      justifyContent: "center",
                      flexWrap: "wrap",
                      gap: 1,
                      minHeight: "40px",
                      width: "100%",
                    }}
                  >
                    {typedEmojiSummary.length > 0 ? (
                      typedEmojiSummary.map((item) => (
                        <Chip
                          key={`${item.codepoint}-summary`}
                          label={`${item.emoji} ${item.alt
                            .replace(/ emoji$/i, "")
                            .replace(/^emoji kitchen: /i, "")}`}
                          sx={{
                            backgroundColor: "rgba(255,255,255,0.84)",
                            border: "1px solid rgba(146, 116, 78, 0.12)",
                            maxWidth: "100%",
                            "& .MuiChip-label": {
                              display: "block",
                              maxWidth: 120,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            },
                          }}
                        />
                      ))
                    ) : (
                      <>
                        <Chip label="Pick emoji 1" variant="outlined" />
                        <Chip label="Pick emoji 2" variant="outlined" />
                      </>
                    )}
                  </Stack>
                  {isTypeComposerExpanded ? (
                    <>
                      <Typography
                        color="text.secondary"
                        textAlign="center"
                        variant="body2"
                        sx={{ fontSize: "0.83rem", px: 1 }}
                      >
                        Type one emoji to browse. Type two to pin the exact mix
                        first.
                      </Typography>
                      <Typography textAlign="center" variant="body2">
                        {typedEmojiMatches.length === 0
                          ? "Waiting for emoji input"
                          : typedEmojiMatches.length === 1
                            ? `Detected ${typedEmojiMatches
                                .map((emojiCodepoint) =>
                                  getEmojiData(emojiCodepoint).alt,
                                )
                                .join(" + ")}`
                            : typedExactCombination
                              ? `Detected ${typedEmojiMatches
                                  .map((emojiCodepoint) =>
                                    getEmojiData(emojiCodepoint).alt,
                                  )
                                  .join(" + ")}`
                              : "That pair has no direct mashup, so showing all mashups for the first emoji"}
                      </Typography>
                      <Paper
                        variant="outlined"
                        sx={{
                          ...softInsetSx,
                          borderRadius: 4,
                          p: 1.5,
                        }}
                      >
                        <Typography variant="subtitle2">
                          Add To Home Screen
                        </Typography>
                        <Typography
                          color="text.secondary"
                          sx={{ fontSize: "0.82rem" }}
                          variant="body2"
                        >
                          Safari {" > "} Share {" > "} Add to Home Screen.
                        </Typography>
                      </Paper>
                    </>
                  ) : (
                    <Typography
                      color="text.secondary"
                      textAlign="center"
                      variant="body2"
                      sx={{ fontSize: "0.82rem", px: 1 }}
                    >
                      Tap Edit to reopen the full picker.
                    </Typography>
                  )}
                  {typedExactCombination && isTypeComposerExpanded ? (
                    <ImageList cols={1} sx={{ m: 0, width: "100%" }}>
                      <ButtonBase
                        onClick={(_) =>
                          handleImageCopy(
                            typedExactCombination.gStaticUrl,
                            typedExactCombination.alt,
                          )
                        }
                        sx={{
                          p: 0.5,
                          borderRadius: 2,
                        }}
                      >
                        <ImageListItem>
                          <img
                            alt={typedExactCombination.alt}
                            src={typedExactCombination.gStaticUrl}
                          />
                        </ImageListItem>
                      </ButtonBase>
                    </ImageList>
                  ) : null}
                </Stack>
              ) : selectedMode === "combine" ? (
                <Grid container columns={14} spacing={2}>
                  <Grid size={4}>
                    <Stack direction="column">
                      <Paper
                        elevation={0}
                        onClick={() => setLeftEmojiSelected(true)}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          flexShrink: 0,
                          marginBottom: "4px",
                          backgroundColor: (theme) =>
                            leftEmojiSelected
                              ? theme.palette.action.selected
                              : theme.palette.background.default,
                          "&:hover": {
                            backgroundColor: (theme) =>
                              theme.palette.action.hover,
                          },
                        }}
                      >
                        {selectedLeftEmoji !== "" ? (
                          <img
                            style={{
                              aspectRatio: 1,
                              padding: "8px",
                            }}
                            loading="lazy"
                            alt={getEmojiData(selectedLeftEmoji).alt}
                            src={getNotoEmojiUrl(
                              getEmojiData(selectedLeftEmoji).emojiCodepoint,
                            )}
                          />
                        ) : null}
                      </Paper>
                      <IconButton
                        onClick={handleLeftEmojiRandomize}
                        sx={{
                          width: "fit-content",
                          marginX: "auto",
                        }}
                      >
                        <Typography
                          sx={{
                            textAlign: "center",
                            fontFamily:
                              "Noto Emoji, Apple Color Emoji, sans-serif",
                            height: "24px",
                            width: "24px",
                          }}
                        >
                          🎲
                        </Typography>
                      </IconButton>
                    </Stack>
                  </Grid>

                  <Grid
                    alignItems="center"
                    display="flex"
                    justifyContent="center"
                    paddingBottom="45px"
                    size={1}
                    textAlign="center"
                  >
                    <Typography>+</Typography>
                  </Grid>

                  <Grid size={4}>
                    <Stack direction="column" justifyContent="center">
                      <Paper
                        elevation={0}
                        onClick={() => setLeftEmojiSelected(false)}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          marginBottom: "4px",
                          backgroundColor: (theme) =>
                            leftEmojiSelected
                              ? theme.palette.background.default
                              : theme.palette.action.selected,
                          "&:hover": {
                            backgroundColor: (theme) =>
                              theme.palette.action.hover,
                          },
                        }}
                      >
                        {selectedRightEmoji !== "" ? (
                          <img
                            style={{
                              aspectRatio: 1,
                              padding: "8px",
                            }}
                            loading="lazy"
                            alt={getEmojiData(selectedRightEmoji).alt}
                            src={getNotoEmojiUrl(
                              getEmojiData(selectedRightEmoji).emojiCodepoint,
                            )}
                          />
                        ) : null}
                      </Paper>
                      <IconButton
                        onClick={handleRightEmojiRandomize}
                        sx={{
                          width: "fit-content",
                          marginX: "auto",
                        }}
                      >
                        <Typography
                          sx={{
                            textAlign: "center",
                            fontFamily:
                              "Noto Emoji, Apple Color Emoji, sans-serif",
                            height: "24px",
                            width: "24px",
                          }}
                        >
                          🎲
                        </Typography>
                      </IconButton>
                    </Stack>
                  </Grid>

                  <Grid
                    alignItems="center"
                    display="flex"
                    justifyContent="center"
                    paddingBottom="45px"
                    size={1}
                    textAlign="center"
                  >
                    <Typography>=</Typography>
                  </Grid>

                  <Grid size={4}>
                    <Stack direction="column" justifyContent="center">
                      <Paper
                        elevation={0}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          marginBottom: "4px",
                        }}
                      >
                        {showOneCombo ? (
                          <div style={{ display: "flex", padding: "8px" }}>
                            <img
                              style={{
                                aspectRatio: 1,
                                maxHeight: "100%",
                                width: "100%",
                              }}
                              loading="lazy"
                              alt={combination!.alt}
                              src={combination!.gStaticUrl}
                            />
                          </div>
                        ) : null}
                      </Paper>
                      <IconButton
                        onClick={(_) => handleImageCopy()}
                        sx={{
                          height: "40px",
                          width: "40px",
                          marginX: "auto",
                        }}
                      >
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Grid>
                </Grid>
              ) : (
                <ImageList cols={4} sx={{ height: "300px", width: "auto" }}>
                  {middleList}
                </ImageList>
              )}

              <Fade in={copyFeedback !== ""} timeout={250}>
                <Chip
                  sx={{ position: "absolute", bottom: 20 }}
                  label={copyFeedback}
                  size="small"
                  color="primary"
                />
              </Fade>
            </Stack>
          </Paper>

          {selectedMode === "type" ? (
            <Paper
              elevation={3}
              sx={{
                ...frostedPanelSx,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                minHeight: "38vh",
                mt: 1,
                pb: 2,
                pt: 1.5,
                mx: 0.5,
              }}
            >
              <Stack spacing={1} sx={{ px: 1.5 }}>
                <Box
                  sx={{
                    alignSelf: "center",
                    bgcolor: "action.disabled",
                    borderRadius: 999,
                    height: 5,
                    width: 44,
                  }}
                />
                <Stack
                  alignItems="center"
                  direction="row"
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Typography
                    sx={{ fontFamily: '"Fraunces", serif', lineHeight: 1.1 }}
                    variant="subtitle1"
                  >
                    Sticker Tray
                  </Typography>
                  <Chip
                    label={`${typedRenderedCombinations.length} results`}
                    size="small"
                    sx={{
                      backgroundColor: "rgba(255,255,255,0.88)",
                      border: "1px solid rgba(146, 116, 78, 0.12)",
                      flexShrink: 0,
                    }}
                  />
                </Stack>
                {typedEmojiMatches.length === 0 ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      ...softInsetSx,
                      borderRadius: 4,
                      p: 2,
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="subtitle2">
                      Start with any emoji
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Type or tap an emoji above to open its mashup tray.
                    </Typography>
                  </Paper>
                ) : null}
                {typedEmojiMatches.length === 1 ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      ...softInsetSx,
                      borderRadius: 4,
                      p: 2,
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="subtitle2">
                      Choose one more emoji if you want an exact mix
                    </Typography>
                    <Typography
                      color="text.secondary"
                      sx={{ fontSize: "0.82rem" }}
                      variant="body2"
                    >
                      For now, showing all mashups for{" "}
                      {typedEmojiSummary[0]?.emoji ?? "that emoji"}.
                    </Typography>
                  </Paper>
                ) : null}
                <ImageList cols={2} gap={8} sx={{ m: 0, width: "auto" }}>
                  {middleList}
                </ImageList>
              </Stack>
            </Paper>
          ) : (
            <>
              <Search
                isMobile={isMobile}
                setSearchResults={setMobileSearchResults}
                uuid={mobileUuid}
              />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(8, 1fr)",
                    sm: "repeat(8, 1fr)",
                    md: "repeat(8, 1fr)",
                    lg: "repeat(9, 1fr)",
                    xl: "repeat(10, 1fr)",
                  },
                  [`& .${imageListItemClasses.root}`]: {
                    display: "flex",
                  },
                }}
              >
                <MobileEmojiList
                  handleEmojiClicked={
                    leftEmojiSelected
                      ? handleLeftEmojiClicked
                      : handleRightEmojiClicked
                  }
                  searchResults={mobileSearchResults}
                  selectedEmoji={
                    leftEmojiSelected ? selectedLeftEmoji : selectedRightEmoji
                  }
                  selectedOtherEmoji={
                    leftEmojiSelected ? selectedRightEmoji : selectedLeftEmoji
                  }
                  selectedMode={selectedMode}
                />
              </Box>

              <Fab
                color="primary"
                onClick={handleFullEmojiRandomize}
                sx={{
                  position: "absolute",
                  bottom: 20,
                  right: "10%",
                  zIndex: 1,
                }}
              >
                <Typography
                  sx={{
                    textAlign: "center",
                    fontFamily: "Noto Emoji, Apple Color Emoji, sans-serif",
                    height: "24px",
                  }}
                >
                  🎲
                </Typography>
              </Fab>
            </>
          )}
        </Box>
      </Container>
    );
  }
  // Render desktop view
  return (
    <Container
      maxWidth="xl"
      sx={{
        flexGrow: "1",
        display: "flex",
        flexDirection: "row",
        overflowY: "auto",
        mt: 0,
        px: 2,
        py: 1.5,
        gap: 2,
        position: "relative",
      }}
    >
      {/* Left Emoji Column */}
      <Box
        sx={{
          ...frostedPanelSx,
          overflowY: "auto",
          justifyItems: "center",
          flexGrow: "1",
          width: "33%",
          borderRadius: 6,
          px: 0.5,
          py: 1,
        }}
      >
        {/* Left Search */}
        <Search
          handleRandomize={handleLeftEmojiRandomize}
          isMobile={isMobile}
          selectedEmoji={selectedLeftEmoji}
          setSearchResults={setLeftSearchResults}
          uuid={leftUuid}
        />

        {/* Left Emoji List */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(3, 1fr)",
              sm: "repeat(5, 1fr)",
              md: "repeat(7, 1fr)",
              lg: "repeat(9, 1fr)",
              xl: "repeat(10, 1fr)",
            },
            [`& .${imageListItemClasses.root}`]: {
              display: "flex",
            },
          }}
        >
          <LeftEmojiList
            handleBulkImageDownloadMenuOpen={handleBulkImageDownloadMenuOpen}
            handleLeftEmojiClicked={handleLeftEmojiClicked}
            leftSearchResults={leftSearchResults}
            selectedLeftEmoji={selectedLeftEmoji}
          />
        </Box>

        {/* Bulk Download Menu */}
        {selectedLeftEmoji !== "" ? (
          <Menu
            open={bulkDownloadMenu !== undefined}
            onClose={() => setBulkDownloadMenu(undefined)}
            anchorReference="anchorPosition"
            anchorPosition={
              bulkDownloadMenu !== undefined
                ? {
                    top: bulkDownloadMenu.mouseY,
                    left: bulkDownloadMenu.mouseX,
                  }
                : undefined
            }
          >
            <LoadingButton
              loading={isBulkDownloading}
              loadingPosition="start"
              onClick={handleBulkImageDownload}
              startIcon={<Download fontSize="small" />}
              sx={{ mx: 1 }}
            >
              Bulk Download
            </LoadingButton>
          </Menu>
        ) : undefined}
      </Box>

      {/* Middle Emoji Column */}
      <Fab
        color="primary"
        onClick={handleFullEmojiRandomize}
        sx={{
          position: "absolute",
          bottom: 28,
          right: "35.8%",
          zIndex: 1,
          boxShadow: "0 18px 32px rgba(217, 119, 6, 0.28)",
        }}
      >
        <Typography
          sx={{
            textAlign: "center",
            fontFamily: "Noto Emoji, Apple Color Emoji, sans-serif",
            height: "24px",
          }}
        >
          🎲
        </Typography>
      </Fab>
      <Box
        sx={{
          ...frostedPanelSx,
          mx: 3,
          overflowY: "auto",
          justifyItems: "center",
          flexGrow: "1",
          width: "33%",
          position: "relative",
          display: showOneCombo ? "flex" : null,
          alignItems: showOneCombo ? "center" : null,
          borderRadius: 6,
          px: 0.5,
          py: 1,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(1, 1fr)",
              sm: showOneCombo ? "repeat(1, 1fr)" : "repeat(2, 1fr)",
              md: showOneCombo ? "repeat(1, 1fr)" : "repeat(3, 1fr)",
            },
            [`& .${imageListItemClasses.root}`]: {
              display: "flex",
            },
          }}
        >
          {middleList}
          {showOneCombo && hasClipboardSupport ? (
            <Container
              sx={{ display: "flex", justifyContent: "center", pt: 2 }}
            >
              <IconButton onClick={(_) => handleImageCopy()}>
                <ContentCopy />
              </IconButton>
            </Container>
          ) : null}

          {showOneCombo && !hasClipboardSupport ? (
            <Container
              sx={{ display: "flex", justifyContent: "center", pt: 2 }}
            >
              <IconButton onClick={handleImageDownload}>
                <Download />
              </IconButton>
            </Container>
          ) : null}
        </Box>
      </Box>

      {/* Right Emoji Column */}
      <Box
        sx={{
          ...frostedPanelSx,
          overflowY: "auto",
          justifyItems: "center",
          flexGrow: "1",
          width: "33%",
          borderRadius: 6,
          px: 0.5,
          py: 1,
        }}
      >
        {/* Right Search */}
        <Search
          disabled={selectedLeftEmoji === ""}
          handleRandomize={handleRightEmojiRandomize}
          isMobile={isMobile}
          selectedEmoji={selectedRightEmoji}
          setSearchResults={setRightSearchResults}
          uuid={rightUuid}
        />

        {/* Right Emoji List */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(3, 1fr)",
              sm: "repeat(5, 1fr)",
              md: "repeat(7, 1fr)",
              lg: "repeat(9, 1fr)",
              xl: "repeat(10, 1fr)",
            },
            [`& .${imageListItemClasses.root}`]: {
              display: "flex",
            },
          }}
        >
          <RightEmojiList
            handleRightEmojiClicked={handleRightEmojiClicked}
            rightSearchResults={rightSearchResults}
            selectedLeftEmoji={selectedLeftEmoji}
            selectedRightEmoji={selectedRightEmoji}
          />
        </Box>
      </Box>
    </Container>
  );
}

