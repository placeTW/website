// src/theme.ts
import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  styles: {
    global: {
      "html, body": {
        fontSize: ["12px", "14px", "18px"], // Smaller on mobile, normal on large
        lineHeight: "tall",
      },
      p: {
        fontSize: ["12px", "14px", "16px"], // Smaller paragraph on mobile
      },
      h1: {
        fontSize: ["20px", "24px", "32px"], // Smaller heading 1 on mobile
      },
      h2: {
        fontSize: ["18px", "22px", "28px"], // Smaller heading 2 on mobile
      },
      h3: {
        fontSize: ["16px", "20px", "24px"], // Smaller heading 3 on mobile
      },
    },
  },
  breakpoints: {
    sm: "30em",  // Small devices (480px and up)
    md: "48em",  // Medium devices (768px and up)
    lg: "62em",  // Large devices (992px and up)
    xl: "80em",  // Extra large devices (1200px and up)
  },
});

export default theme;
