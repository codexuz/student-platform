import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#e6f3ff" },
          100: { value: "#b3daff" },
          200: { value: "#80c2ff" },
          300: { value: "#4da9ff" },
          400: { value: "#1a91ff" },
          500: { value: "#007AFF" },
          600: { value: "#0062cc" },
          700: { value: "#004999" },
          800: { value: "#003166" },
          900: { value: "#001833" },
        },
      },
      fonts: {
        heading: { value: "var(--font-poppins), sans-serif" },
        body: { value: "var(--font-poppins), sans-serif" },
        mono: { value: "ui-monospace, monospace" },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          solid: { value: "{colors.brand.500}" },
          contrast: { value: "white" },
          fg: { value: "{colors.brand.700}" },
          muted: { value: "{colors.brand.100}" },
          subtle: { value: "{colors.brand.50}" },
          emphasized: { value: "{colors.brand.300}" },
          focusRing: { value: "{colors.brand.500}" },
        },
      },
    },
  },
  globalCss: {
    "html, body": {
      colorPalette: "brand",
    },
  },
});

export const system = createSystem(defaultConfig, config);
