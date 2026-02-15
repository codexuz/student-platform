"use client";

import { Box, HStack, Text, IconButton } from "@chakra-ui/react";
import { Highlighter, Trash2 } from "lucide-react";
import type { PopupState } from "./useHighlighter";

interface HighlightPopupProps {
  popup: PopupState;
  onHighlight: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

/**
 * Floating popup that appears on text selection (Highlight action)
 * or on clicking an existing highlight (Delete Highlight action).
 */
export default function HighlightPopup({
  popup,
  onHighlight,
  onDelete,
  onClose,
}: HighlightPopupProps) {
  if (!popup.visible) return null;

  return (
    <>
      {/* Invisible backdrop to close popup on outside click */}
      <Box position="fixed" inset={0} zIndex={40} onClick={onClose} />

      {/* Popup — stop all event bubbling to prevent container's handleMouseUp */}
      <Box
        position="absolute"
        left={`${popup.x}px`}
        top={`${popup.y}px`}
        transform="translateX(-50%)"
        zIndex={50}
        bg="white"
        _dark={{ bg: "gray.700", borderColor: "gray.600" }}
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="lg"
        shadow="lg"
        py={1}
        px={1}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {popup.highlightId ? (
          /* Delete existing highlight */
          <HStack
            gap={2}
            px={2}
            py={1.5}
            cursor="pointer"
            borderRadius="md"
            _hover={{ bg: "gray.50", _dark: { bg: "gray.600" } }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(popup.highlightId!);
            }}
          >
            <Trash2 size={16} />
            <Text fontSize="sm" fontWeight="medium" whiteSpace="nowrap">
              Delete Highlight
            </Text>
          </HStack>
        ) : (
          /* New highlight action */
          <HStack
            gap={0}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onHighlight();
            }}
            cursor="pointer"
          >
            <IconButton
              aria-label="Highlight"
              variant="ghost"
              size="sm"
              borderRadius="md"
            >
              <Highlighter size={16} />
            </IconButton>
            <Text
              fontSize="sm"
              fontWeight="medium"
              px={2}
              py={1}
              borderRadius="md"
              _hover={{ bg: "gray.50", _dark: { bg: "gray.600" } }}
            >
              Highlight
            </Text>
          </HStack>
        )}
      </Box>
    </>
  );
}
