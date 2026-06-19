"use client";

import { useEffect, useState } from "react";
import { Box, Flex, Text, Textarea, Button, IconButton } from "@chakra-ui/react";
import { X } from "lucide-react";
import { useTestTheme } from "./TestThemeContext";

interface CommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  comment: string;
  onSave: (comment: string) => void;
}

export default function CommentsDrawer({
  isOpen,
  onClose,
  comment,
  onSave,
}: CommentsDrawerProps) {
  const { colors } = useTestTheme();
  const [localComment, setLocalComment] = useState(comment);

  useEffect(() => {
    if (isOpen) {
      setLocalComment(comment);
    }
  }, [isOpen, comment]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <Box
        position="fixed"
        inset={0}
        bg="blackAlpha.400"
        zIndex={100}
        onClick={onClose}
        animation="fadeIn 0.2s"
      />
      
      {/* Drawer */}
      <Flex
        direction="column"
        position="fixed"
        top={0}
        right={0}
        bottom={0}
        w={{ base: "100%", md: "400px" }}
        bg={colors.bg}
        color={colors.text}
        zIndex={101}
        boxShadow="-4px 0 15px rgba(0, 0, 0, 0.1)"
        transform={isOpen ? "translateX(0)" : "translateX(100%)"}
        transition="transform 0.3s ease-out"
      >
        <Flex
          align="center"
          justify="space-between"
          p={4}
          borderBottomWidth="1px"
          borderColor={colors.border}
        >
          <Text fontSize="lg" fontWeight="bold">
            Highlight Comment
          </Text>
          <IconButton
            aria-label="Close"
            variant="ghost"
            onClick={onClose}
            color={colors.textSecondary}
          >
            <X size={20} />
          </IconButton>
        </Flex>

        <Box p={4} flex={1}>
          <Textarea
            value={localComment}
            onChange={(e) => setLocalComment(e.target.value)}
            placeholder="Write your notes here..."
            bg={colors.inputBg}
            borderColor={colors.inputBorder}
            color={colors.text}
            _hover={{ borderColor: colors.accentColor }}
            _focus={{ borderColor: colors.accentColor, boxShadow: `0 0 0 1px ${colors.accentColor}` }}
            minH="200px"
            resize="vertical"
          />
        </Box>

        <Flex p={4} borderTopWidth="1px" borderColor={colors.border} justify="flex-end" gap={2}>
          <Button variant="ghost" onClick={onClose} color={colors.textSecondary}>
            Cancel
          </Button>
          <Button
            bg={colors.accentColor}
            color="white"
            _hover={{ opacity: 0.9 }}
            onClick={() => {
              onSave(localComment);
              onClose();
            }}
          >
            Save Comment
          </Button>
        </Flex>
      </Flex>
    </>
  );
}
