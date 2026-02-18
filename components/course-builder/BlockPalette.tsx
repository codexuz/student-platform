"use client";

import { Box, Text } from "@chakra-ui/react";
import type { BlockType } from "./types";

interface Props {
  onAddBlock: (type: BlockType) => void;
  hasActiveLesson: boolean;
}

const paletteItems: { icon: string; label: string; type: BlockType }[] = [
  { icon: "🎬", label: "Video", type: "video" },
  { icon: "🖼️", label: "Image", type: "image" },
  { icon: "📝", label: "Text", type: "paragraph" },
  { icon: "✨", label: "Heading", type: "heading" },
  { icon: "</>", label: "Embed", type: "embed" },
  { icon: "📄", label: "File", type: "document" },
  { icon: "📖", label: "IELTS", type: "ielts_practice" },
];

export default function BlockPalette({ onAddBlock, hasActiveLesson }: Props) {
  return (
    <Box
      w="72px"
      bg="white"
      _dark={{ bg: "gray.800" }}
      borderLeftWidth="1px"
      display="flex"
      flexDirection="column"
      alignItems="center"
      pt={4}
      gap={1}
      flexShrink={0}
    >
      {paletteItems.map((item) => (
        <Box
          key={item.type + item.label}
          as="button"
          w="56px"
          px={1}
          py={2.5}
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={1}
          rounded="md"
          cursor={hasActiveLesson ? "pointer" : "not-allowed"}
          color="gray.500"
          _dark={{ color: "gray.400" }}
          fontSize="xs"
          fontWeight="600"
          _hover={
            hasActiveLesson
              ? {
                  bg: "blue.50",
                  color: "blue.600",
                  _dark: { bg: "blue.900", color: "blue.300" },
                }
              : {}
          }
          transition="all 0.15s"
          opacity={hasActiveLesson ? 1 : 0.4}
          onClick={() => hasActiveLesson && onAddBlock(item.type)}
        >
          <Text fontSize="xl">{item.icon}</Text>
          <Text>{item.label}</Text>
        </Box>
      ))}
    </Box>
  );
}
