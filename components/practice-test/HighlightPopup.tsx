"use client";

import { Box, HStack, Text, IconButton } from "@chakra-ui/react";
import { Trash2, MessageSquarePlus } from "lucide-react";
import type { PopupState } from "./useHighlighter";

interface HighlightPopupProps {
  popup: PopupState;
  onHighlight: (color: string) => void;
  onDelete: (id: string) => void;
  onAddComment: (id: string) => void;
  onClose: () => void;
}

const HIGHLIGHT_COLORS = [
  { value: "#fef08a", label: "Yellow" },
  { value: "#bbf7d0", label: "Green" },
  { value: "#fbcfe8", label: "Pink" },
  { value: "#bfdbfe", label: "Blue" },
];

/**
 * Floating popup that appears on text selection (Highlight action)
 * or on clicking an existing highlight (Delete Highlight action).
 */
export default function HighlightPopup({
  popup,
  onHighlight,
  onDelete,
  onAddComment,
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
          /* Existing highlight actions */
          <HStack gap={1} px={1}>
            <IconButton
              aria-label="Add/Edit Comment"
              variant="ghost"
              size="sm"
              borderRadius="md"
              title="Add/Edit Comment"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddComment(popup.highlightId!);
              }}
            >
              <MessageSquarePlus size={16} />
            </IconButton>
            <IconButton
              aria-label="Delete Highlight"
              variant="ghost"
              size="sm"
              borderRadius="md"
              title="Delete Highlight"
              color="red.500"
              _hover={{ bg: "red.50", _dark: { bg: "red.900" } }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(popup.highlightId!);
              }}
            >
              <Trash2 size={16} />
            </IconButton>
          </HStack>
        ) : (
          /* New highlight action (Color Picker) */
          <HStack gap={2} px={2} py={1}>
            {HIGHLIGHT_COLORS.map((c) => (
              <Box
                key={c.value}
                w="24px"
                h="24px"
                borderRadius="full"
                bg={c.value}
                cursor="pointer"
                borderWidth="1px"
                borderColor="gray.300"
                _hover={{ transform: "scale(1.1)" }}
                transition="transform 0.1s"
                title={c.label}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onHighlight(c.value);
                }}
              />
            ))}
            <Box w="1px" h="16px" bg="gray.300" />
            <IconButton
              aria-label="Add Comment"
              variant="ghost"
              size="sm"
              borderRadius="md"
              title="Add Comment"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // We default to yellow color and immediately trigger comment flow
                onAddComment("new-highlight-comment");
              }}
            >
              <MessageSquarePlus size={16} />
            </IconButton>
          </HStack>
        )}
      </Box>
    </>
  );
}
