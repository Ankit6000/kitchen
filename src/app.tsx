import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Footer from "./Components/footer";
import Kitchen from "./Components/kitchen";

const theme = createTheme({
  shape: {
    borderRadius: 18,
  },
  palette: {
    mode: "light",
    primary: {
      main: "#d97706",
      light: "#fbbf24",
      dark: "#92400e",
    },
    secondary: {
      main: "#0f766e",
      light: "#5eead4",
      dark: "#115e59",
    },
    background: {
      default: "#f7f1e3",
      paper: "rgba(255, 251, 245, 0.82)",
    },
    text: {
      primary: "#1f2937",
      secondary: "#5b6474",
    },
    divider: "rgba(146, 116, 78, 0.18)",
  },
  typography: {
    fontFamily: '"Manrope", "Segoe UI", sans-serif',
    h1: {
      fontFamily: '"Fraunces", serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Fraunces", serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: '"Fraunces", serif',
      fontWeight: 700,
    },
    h4: {
      fontFamily: '"Fraunces", serif',
      fontWeight: 700,
    },
    h5: {
      fontFamily: '"Fraunces", serif',
      fontWeight: 700,
    },
    h6: {
      fontFamily: '"Fraunces", serif',
      fontWeight: 700,
    },
    button: {
      fontWeight: 700,
      textTransform: "none",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "radial-gradient(circle at top left, rgba(251, 191, 36, 0.18), transparent 30%), radial-gradient(circle at top right, rgba(94, 234, 212, 0.18), transparent 28%), linear-gradient(180deg, #fbf6ec 0%, #f4ebda 100%)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(18px)",
          backgroundImage: "none",
        },
      },
    },
  },
});

export default function App() {
  if (window.self === window.top) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          background:
            "radial-gradient(circle at top left, rgba(249, 168, 37, 0.12), transparent 24%), radial-gradient(circle at bottom right, rgba(13, 148, 136, 0.12), transparent 26%)",
        }}
      >
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Kitchen />
        </ThemeProvider>
        <Footer />
      </div>
    );
  }
}
