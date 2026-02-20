"use client";

import { useState, useEffect, useRef } from "react";
import {
  Flex,
  HStack,
  Text,
  Badge,
  Button,
  IconButton,
  Dialog,
  Portal,
  VStack,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  Maximize2,
  Bell,
  Menu,
  Send,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { TestHeaderProps } from "./types";
import { formatTime } from "./types";
import { useTestTheme } from "./TestThemeContext";
import OptionsModal from "./OptionsModal";

/**
 * Top header bar for the practice test view.
 * Shows: Back | IELTS badge | Test ID | Timer | Start | Action icons
 *
 * The countdown is managed **inside** this component so that the
 * per-second re-render stays isolated here and does not propagate to
 * the parent layout (which would destroy DOM-based highlights).
 */
export default function TestHeader({
  initialTimerSeconds,
  isTimerRunning,
  isStarted,
  onStart,
  onTimerEnd,
  onToggleFullscreen,
  onSubmit,
}: TestHeaderProps) {
  const router = useRouter();
  const { colors } = useTestTheme();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ─── Internal countdown ─────────────────────────────────────────────
  const [seconds, setSeconds] = useState(initialTimerSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync when the parent changes the initial value (e.g. listening review)
  useEffect(() => {
    setSeconds(initialTimerSeconds);
  }, [initialTimerSeconds]);

  useEffect(() => {
    if (isTimerRunning && seconds > 0) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            onTimerEnd?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, seconds, onTimerEnd]);

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
            {formatTime(seconds)}
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

        {/* Right — Submit + Action icons */}
        <HStack gap={1}>
          {isStarted && onSubmit && (
            <Button
              size="sm"
              colorPalette="red"
              borderRadius="full"
              px={5}
              onClick={() => setConfirmOpen(true)}
              fontWeight="semibold"
              gap={1.5}
            >
              <Send size={14} />
              Submit
            </Button>
          )}
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

      {/* Submit confirm modal */}
      <Dialog.Root
        open={confirmOpen}
        onOpenChange={(e) => setConfirmOpen(e.open)}
        placement="center"
        motionPreset="scale"
      >
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.600" />
          <Dialog.Positioner>
            <Dialog.Content
              bg={colors.headerBg}
              borderColor={colors.border}
              borderWidth="1px"
              borderRadius="xl"
              maxW="sm"
              mx={4}
            >
              <Dialog.Header
                borderBottomWidth="1px"
                borderColor={colors.border}
              >
                <Dialog.Title color={colors.text} fontSize="lg">
                  Submit Test
                </Dialog.Title>
              </Dialog.Header>

              <Dialog.Body py={6}>
                <VStack gap={3}>
                  <AlertTriangle size={36} color="#E53E3E" />
                  <Text color={colors.text} textAlign="center" fontSize="md">
                    Are you sure you want to submit your test?
                  </Text>
                  <Text
                    color={colors.textSecondary}
                    textAlign="center"
                    fontSize="sm"
                  >
                    You won&apos;t be able to change your answers after
                    submission.
                  </Text>
                </VStack>
              </Dialog.Body>

              <Dialog.Footer
                borderTopWidth="1px"
                borderColor={colors.border}
                gap={3}
              >
                <Button
                  variant="outline"
                  size="sm"
                  borderRadius="full"
                  px={5}
                  onClick={() => setConfirmOpen(false)}
                  color={colors.text}
                  borderColor={colors.border}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  colorPalette="red"
                  borderRadius="full"
                  px={5}
                  fontWeight="semibold"
                  gap={1.5}
                  onClick={() => {
                    setConfirmOpen(false);
                    onSubmit?.();
                  }}
                >
                  <Send size={14} />
                  Confirm Submit
                </Button>
              </Dialog.Footer>

              <Dialog.CloseTrigger
                asChild
                position="absolute"
                top={2}
                right={2}
              >
                <IconButton
                  variant="ghost"
                  size="sm"
                  aria-label="Close"
                  color={colors.text}
                />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
