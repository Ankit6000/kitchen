import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function Footer() {
  return (
    <div>
      <Box component="footer" sx={{ px: 2, pb: 3, pt: 1 }}>
        <Stack
          spacing={1}
          direction="row"
          justifyContent="center"
          sx={{
            alignItems: "center",
            backgroundColor: "rgba(255, 251, 245, 0.66)",
            border: "1px solid rgba(146, 116, 78, 0.14)",
            borderRadius: 999,
            margin: "0 auto",
            maxWidth: "fit-content",
            px: 2,
            py: 1,
          }}
        >
          <Typography
            align="center"
            color="text.secondary"
            sx={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
            variant="caption"
          >
            Ankit
          </Typography>
          <Typography
            align="center"
            color="text.secondary"
            sx={{ opacity: 0.7 }}
            variant="caption"
          >
            /
          </Typography>
          <Typography
            align="center"
            sx={{ fontFamily: '"Fraunces", serif', lineHeight: 1 }}
            variant="caption"
          >
            EmojiMix Keyboard
          </Typography>
        </Stack>
      </Box>
    </div>
  );
}
