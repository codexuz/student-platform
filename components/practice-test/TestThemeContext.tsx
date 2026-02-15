"use client";

import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from "react";

// ─── Types ─────────────────────────────────────────────────────────────────

export type ContrastMode =
  | "black-on-white"
  | "white-on-black"
  | "yellow-on-black";
export type TextSizeMode = "small" | "medium" | "large";

export interface TestTheme {
  contrastMode: ContrastMode;
  textSize: TextSizeMode;
  setContrastMode: (mode: ContrastMode) => void;
  setTextSize: (size: TextSizeMode) => void;
  /** Resolved CSS values for the current contrast mode */
  colors: ThemeColors;
  /** Resolved font size scale factor */
  fontScale: number;
}

export interface ThemeColors {
  bg: string;
  panelBg: string;
  text: string;
  textSecondary: string;
  border: string;
  headerBg: string;
  navBg: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  accentColor: string;
  hoverBg: string;
}

// ─── Color Palettes ────────────────────────────────────────────────────────

const COLOR_PALETTES: Record<ContrastMode, ThemeColors> = {
  "black-on-white": {
    bg: "#f9fafb", // gray.50
    panelBg: "#ffffff",
    text: "#1a202c", // gray.800
    textSecondary: "#718096", // gray.500
    border: "#e2e8f0", // gray.200
    headerBg: "#ffffff",
    navBg: "#ffffff",
    inputBg: "#ffffff",
    inputBorder: "#e2e8f0",
    inputText: "#1a202c",
    accentColor: "#007AFF",
    hoverBg: "#f7fafc",
  },
  "white-on-black": {
    bg: "#111111",
    panelBg: "#1a1a2e",
    text: "#e2e8f0",
    textSecondary: "#a0aec0",
    border: "#2d3748",
    headerBg: "#0d0d1a",
    navBg: "#0d0d1a",
    inputBg: "#2d3748",
    inputBorder: "#4a5568",
    inputText: "#e2e8f0",
    accentColor: "#63b3ed",
    hoverBg: "#2d3748",
  },
  "yellow-on-black": {
    bg: "#111111",
    panelBg: "#1a1a1a",
    text: "#f6c543",
    textSecondary: "#d4a843",
    border: "#333333",
    headerBg: "#0d0d0d",
    navBg: "#0d0d0d",
    inputBg: "#2a2a2a",
    inputBorder: "#f6c543",
    inputText: "#f6c543",
    accentColor: "#f6c543",
    hoverBg: "#2a2a2a",
  },
};

const FONT_SCALE: Record<TextSizeMode, number> = {
  small: 0.85,
  medium: 1,
  large: 1.2,
};

// ─── Context ───────────────────────────────────────────────────────────────

const TestThemeContext = createContext<TestTheme | null>(null);

export function TestThemeProvider({ children }: { children: ReactNode }) {
  const [contrastMode, setContrastMode] =
    useState<ContrastMode>("black-on-white");
  const [textSize, setTextSize] = useState<TextSizeMode>("medium");

  const value = useMemo<TestTheme>(
    () => ({
      contrastMode,
      textSize,
      setContrastMode,
      setTextSize,
      colors: COLOR_PALETTES[contrastMode],
      fontScale: FONT_SCALE[textSize],
    }),
    [contrastMode, textSize],
  );

  return (
    <TestThemeContext.Provider value={value}>
      {children}
    </TestThemeContext.Provider>
  );
}

export function useTestTheme(): TestTheme {
  const ctx = useContext(TestThemeContext);
  if (!ctx) {
    // Fallback — outside provider, return defaults
    return {
      contrastMode: "black-on-white",
      textSize: "medium",
      setContrastMode: () => {},
      setTextSize: () => {},
      colors: COLOR_PALETTES["black-on-white"],
      fontScale: 1,
    };
  }
  return ctx;
}
