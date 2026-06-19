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
          solid: { value: { base: "{colors.brand.500}", _dark: "{colors.brand.500}" } },
          contrast: { value: "white" },
          fg: { value: { base: "{colors.brand.700}", _dark: "{colors.brand.200}" } },
          muted: { value: { base: "{colors.brand.100}", _dark: "{colors.brand.800}" } },
          subtle: { value: { base: "{colors.brand.50}", _dark: "{colors.brand.900}" } },
          emphasized: { value: { base: "{colors.brand.300}", _dark: "{colors.brand.400}" } },
          focusRing: { value: { base: "{colors.brand.500}", _dark: "{colors.brand.500}" } },
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
