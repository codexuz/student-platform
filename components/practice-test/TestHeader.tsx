"use client";

import { useState } from "react";
import {
  Flex,
  HStack,
  Text,
  Badge,
  Button,
  IconButton,
} from "@chakra-ui/react";
import { ArrowLeft, Maximize2, Bell, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import type { TestHeaderProps } from "./types";
import { formatTime } from "./types";
import { useTestTheme } from "./TestThemeContext";
import OptionsModal from "./OptionsModal";

/**
 * Top header bar for the practice test view.
 * Shows: Back | IELTS badge | Test ID | Timer | Start | Action icons
 */
export default function TestHeader({
  timerSeconds,
  isStarted,
  onStart,
  onToggleFullscreen,
}: TestHeaderProps) {
  const router = useRouter();
  const { colors } = useTestTheme();
  const [optionsOpen, setOptionsOpen] = useState(false);

  return (
    <>
      <Flex
        h="14"
        px={{ base: 2, md: 4 }}
        alignItems="center"
        justifyContent="space-between"
        bg={colors.headerBg}
        borderBottomWidth="1px"
        borderColor={colors.border}
        position="sticky"
        top={0}
        zIndex={20}
      >
        {/* Left — Back + IELTS badge */}
        <HStack gap={3}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            px={2}
            color={colors.text}
            _hover={{ bg: colors.hoverBg }}
          >
            <ArrowLeft size={18} />
            <Text ml={1} display={{ base: "none", sm: "inline" }}>
              Back
            </Text>
          </Button>

          <Badge
            bg="red.500"
            color="white"
            px={3}
            py={1}
            borderRadius="md"
            fontWeight="bold"
            fontSize="sm"
            lineHeight="1"
          >
            IELTS
          </Badge>
        </HStack>

        {/* Center — Timer */}
        <HStack gap={3}>
          <Text
            fontWeight="bold"
            fontSize="lg"
            fontVariantNumeric="tabular-nums"
            letterSpacing="wider"
            color={colors.text}
          >
            {formatTime(timerSeconds)}
          </Text>

          {!isStarted && (
            <Button
              size="sm"
              colorPalette="red"
              borderRadius="full"
              px={5}
              onClick={onStart}
              fontWeight="semibold"
            >
              Start
            </Button>
          )}
        </HStack>

        {/* Right — Action icons */}
        <HStack gap={0}>
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Fullscreen"
            onClick={onToggleFullscreen}
            color={colors.text}
            _hover={{ bg: colors.hoverBg }}
          >
            <Maximize2 size={18} />
          </IconButton>
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Notifications"
            color={colors.text}
            _hover={{ bg: colors.hoverBg }}
          >
            <Bell size={18} />
          </IconButton>
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Menu"
            onClick={() => setOptionsOpen(true)}
            color={colors.text}
            _hover={{ bg: colors.hoverBg }}
          >
            <Menu size={18} />
          </IconButton>
        </HStack>
      </Flex>

      {/* Options modal */}
      <OptionsModal
        isOpen={optionsOpen}
        onClose={() => setOptionsOpen(false)}
      />
    </>
  );
}
