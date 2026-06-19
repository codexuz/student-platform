"use client";

import { Box, VStack, Separator } from "@chakra-ui/react";
import QuestionRenderer from "./QuestionRenderer";
import type { QuestionPanelProps } from "./types";
import { useTestTheme } from "./TestThemeContext";

/**
 * Right panel — scrollable list of question groups for the current part.
 * Each question group is rendered by QuestionRenderer.
 */
export default function QuestionPanel({
  questions,
  answers,
  onAnswer,
  disabled = false,
  showResults = false,
  // highlightedQuestion reserved for future scroll-to highlighting
}: QuestionPanelProps) {
  const { colors, fontScale } = useTestTheme();

  return (
    <Box
      h="100%"
      overflowY="auto"
      px={{ base: 4, md: 6 }}
      py={4}
      bg={colors.panelBg}
      color={colors.text}
      fontSize={`calc(1rem * ${fontScale})`}
      style={{
        "--test-input-bg": colors.inputBg,
        "--test-hover-bg": colors.hoverBg,
        "--test-border": colors.border,
        "--test-accent": colors.accentColor,
        "--test-correct-bg": colors.bg === "#111111" ? "var(--chakra-colors-green-900)" : "var(--chakra-colors-green-50)",
        "--test-wrong-bg": colors.bg === "#111111" ? "var(--chakra-colors-red-900)" : "var(--chakra-colors-red-50)",
        "--test-correct-border": colors.bg === "#111111" ? "var(--chakra-colors-green-400)" : "var(--chakra-colors-green-500)",
        "--test-wrong-border": colors.bg === "#111111" ? "var(--chakra-colors-red-400)" : "var(--chakra-colors-red-500)",
        "--test-panel-bg": colors.panelBg,
      } as React.CSSProperties}
      css={{
        "& select, & option": {
          backgroundColor: colors.inputBg,
          color: colors.inputText,
        },
        "&::-webkit-scrollbar": { width: "6px" },
        "&::-webkit-scrollbar-track": { background: "transparent" },
        "&::-webkit-scrollbar-thumb": {
          background: "#cbd5e0",
          borderRadius: "3px",
        },
      }}
    >
      <VStack align="stretch" gap={6}>
        {questions.map((question, idx) => (
          <Box key={question.id ?? idx}>
            {/* Anchor element for scrolling to question groups */}
            {question.questions?.map((sub) => (
              <Box
                key={sub.questionNumber}
                id={`question-${sub.questionNumber}`}
                position="relative"
                top="-80px"
                visibility="hidden"
                h={0}
              />
            ))}

            <QuestionRenderer
              question={question}
              answers={answers}
              onAnswer={onAnswer}
              disabled={disabled}
              showResults={showResults}
            />

            {idx < questions.length - 1 && <Separator mt={6} />}
          </Box>
        ))}
      </VStack>
    </Box>
  );
}
