"use client";

import { Box, Heading, Text } from "@chakra-ui/react";
import type { ReadingPassageProps } from "./types";
import { useTestTheme } from "./TestThemeContext";

/**
 * Left panel — reading passage with scrollable content.
 */
export default function ReadingPassage({
  content,
  title,
}: ReadingPassageProps) {
  const { colors } = useTestTheme();

  return (
    <Box h="100%" display="flex" flexDirection="column">
      {/* Passage content */}
      <Box
        flex={1}
        overflowY="auto"
        px={{ base: 4, md: 6 }}
        py={4}
        bg={colors.panelBg}
        css={{
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            background: "#cbd5e0",
            borderRadius: "3px",
          },
        }}
      >
        {title && (
          <Heading size="md" mb={4} fontWeight="bold" color={colors.text}>
            {title}
          </Heading>
        )}

        {content && (
          <Box
            className="reading-passage"
            dangerouslySetInnerHTML={{ __html: content }}
            css={{
              "& p": {
                fontSize: "0.9rem",
                lineHeight: "1.75",
                marginBottom: "1rem",
                color: colors.text,
              },
              "& h1, & h2, & h3, & h4": {
                fontWeight: "bold",
                marginBottom: "0.5rem",
                marginTop: "1rem",
                color: colors.text,
              },
              "& h2": { fontSize: "1.1rem" },
              "& h3": { fontSize: "1rem" },
              "& strong, & b": { fontWeight: "bold" },
              "& em, & i": { fontStyle: "italic" },
              "& ul, & ol": {
                paddingLeft: "1.5rem",
                marginBottom: "1rem",
              },
              "& li": {
                fontSize: "0.9rem",
                lineHeight: "1.75",
                marginBottom: "0.25rem",
                color: colors.text,
              },
              "& blockquote": {
                borderLeft: "3px solid #cbd5e0",
                paddingLeft: "1rem",
                marginBottom: "1rem",
                fontStyle: "italic",
                color: "#718096",
              },
              "& table": {
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "1rem",
              },
              "& th, & td": {
                border: "1px solid #e2e8f0",
                padding: "0.5rem",
                fontSize: "0.85rem",
              },
              "& th": {
                backgroundColor: colors.hoverBg,
                fontWeight: "bold",
                color: colors.text,
              },
              "& td": {
                color: colors.text,
              },
            }}
          />
        )}

        {!content && (
          <Text color="gray.400" fontStyle="italic" textAlign="center" py={10}>
            No passage content available
          </Text>
        )}
      </Box>
    </Box>
  );
}
