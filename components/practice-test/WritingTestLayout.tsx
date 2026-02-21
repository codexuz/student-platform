"use client";

import { useState, useCallback } from "react";
import {
  Box,
  Flex,
  Text,
  Splitter,
  useSplitter,
  Textarea,
  IconButton,
  Image,
  HStack,
} from "@chakra-ui/react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import TestHeader from "./TestHeader";
import HighlightablePanel from "./HighlightablePanel";
import { TestThemeProvider, useTestTheme } from "./TestThemeContext";

// ─── Types ────────────────────────────────────────────────────────────────

export interface WritingPartData {
  id: string;
  partLabel: string; // "Part 1", "Part 2"
  task: string; // "TASK_1" | "TASK_2"
  prompt?: string; // HTML prompt
  image_url?: string;
  min_words?: number;
  suggested_time?: number;
}

interface WritingTestLayoutProps {
  parts: WritingPartData[];
  timerMinutes?: number; // default 60
  /** Auto-start timer immediately (for mock tests) */
  autoStart?: boolean;
  onSubmit?: (essays: Record<string, string>) => void | Promise<void>;
  /** Called when essays change (for auto-save tracking) */
  onEssayChange?: (essays: Record<string, string>) => void;
  /** Called when user switches parts (good moment to save progress) */
  onSaveProgress?: (essays: Record<string, string>) => void;
  /** Called when timer finishes (for mock test redirect) */
  onFinish?: () => void;
  /** Called when Start button is clicked (e.g. to create an attempt) */
  onStartAttempt?: () => void;
}

/** Essay state per part */
type EssayMap = Record<string, string>;

/**
 * Full-page writing test layout with:
 * - TestHeader (top)
 * - Split view: Prompt + Image (left) | Textarea with word count (right)
 * - Part navigation (bottom)
 */
export default function WritingTestLayout(props: WritingTestLayoutProps) {
  return (
    <TestThemeProvider>
      <WritingTestLayoutInner {...props} />
    </TestThemeProvider>
  );
}

function WritingTestLayoutInner({
  parts,
  timerMinutes = 60,
  autoStart = false,
  onSubmit,
  onEssayChange,
  onStartAttempt,
}: WritingTestLayoutProps) {
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [essays, setEssays] = useState<EssayMap>({});
  const [timerSeconds] = useState(timerMinutes * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(autoStart);
  const [isStarted, setIsStarted] = useState(autoStart);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleStart = useCallback(() => {
    setIsStarted(true);
    setIsTimerRunning(true);
    onStartAttempt?.();
  }, [onStartAttempt]);

  const handleEssayChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      const partId = parts[currentPartIndex]?.id;
      if (partId) {
        setEssays((prev) => {
          const newEssays = { ...prev, [partId]: text };
          onEssayChange?.(newEssays);
          return newEssays;
        });
      }
    },
    [currentPartIndex, parts, onEssayChange],
  );

  const handlePartChange = useCallback((index: number) => {
    setCurrentPartIndex(index);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentPartIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentPartIndex((prev) => Math.min(parts.length - 1, prev + 1));
  }, [parts.length]);

  const handleSubmit = useCallback(() => {
    setIsTimerRunning(false);
    setIsSubmitted(true);
    onSubmit?.(essays);
  }, [onSubmit, essays]);

  // ─── Timer end → auto-submit ────────────────────────────────────────────

  const handleTimerEnd = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  // ─── Computed ───────────────────────────────────────────────────────────

  const { colors, fontScale } = useTestTheme();
  const currentPart = parts[currentPartIndex];

  const getWordCount = (partId: string) => {
    const text = essays[partId] || "";
    if (!text.trim()) return 0;
    return text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
  };

  const splitter = useSplitter({
    defaultSize: [50, 50],
    panels: [{ id: "prompt" }, { id: "editor", minSize: 20 }],
  });

  if (!currentPart) return null;

  const wordCount = getWordCount(currentPart.id);

  return (
    <Flex
      direction="column"
      h="100vh"
      bg={colors.bg}
      style={{ fontSize: `${fontScale}rem` }}
    >
      {/* Header */}
      <TestHeader
        initialTimerSeconds={timerSeconds}
        isTimerRunning={isTimerRunning}
        isStarted={isStarted}
        onStart={handleStart}
        onTimerEnd={handleTimerEnd}
        onToggleFullscreen={handleToggleFullscreen}
        onSubmit={handleSubmit}
      />

      {/* Part header — full width above the split view */}
      <Box
        px={4}
        py={3}
        bg={colors.bg}
        borderBottomWidth="1px"
        borderColor={colors.border}
        flexShrink={0}
      >
        <Text fontWeight="bold" fontSize="sm" color={colors.text}>
          {currentPart.partLabel}
        </Text>
        <Text fontSize="sm" color={colors.textSecondary}>
          {currentPart.suggested_time &&
            `You should spend about ${currentPart.suggested_time} minutes on this task. `}
          {currentPart.min_words &&
            `Write at least ${currentPart.min_words} words.`}
        </Text>
      </Box>

      {/* Main split view */}
      <Splitter.RootProvider value={splitter} flex={1} overflow="hidden">
        {/* Left — Prompt + Image */}
        <Splitter.Panel id="prompt">
          <Box h="100%" overflow="hidden">
            <HighlightablePanel>
              <Box
                h="100%"
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
                {/* Prompt text (HTML) */}
                {currentPart.prompt && (
                  <Box
                    className="writing-prompt"
                    dangerouslySetInnerHTML={{ __html: currentPart.prompt }}
                    mb={6}
                    css={{
                      "& p": {
                        fontSize: "0.95rem",
                        lineHeight: "1.75",
                        marginBottom: "1rem",
                        color: colors.text,
                        fontWeight: "600",
                      },
                      "& h1, & h2, & h3, & h4": {
                        fontWeight: "bold",
                        marginBottom: "0.5rem",
                        marginTop: "1rem",
                        color: colors.text,
                      },
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
                    }}
                  />
                )}

                {/* Image (charts/graphs for Task 1) */}
                {currentPart.image_url && (
                  <Box textAlign="center" mt={2}>
                    <Image
                      src={currentPart.image_url}
                      alt="Task image"
                      maxH="500px"
                      mx="auto"
                      borderRadius="md"
                    />
                  </Box>
                )}
              </Box>
            </HighlightablePanel>
          </Box>
        </Splitter.Panel>

        <Splitter.ResizeTrigger
          id="prompt:editor"
          display={{ base: "none", lg: "flex" }}
        />

        {/* Right — Textarea editor */}
        <Splitter.Panel id="editor">
          <Box
            h="100%"
            display="flex"
            flexDirection="column"
            bg={colors.panelBg}
            borderLeftWidth={{ lg: "1px" }}
            borderColor={colors.border}
          >
            <Box
              flex={1}
              display="flex"
              flexDirection="column"
              px={{ base: 4, md: 6 }}
              py={4}
            >
              <Textarea
                value={essays[currentPart.id] || ""}
                onChange={handleEssayChange}
                placeholder=""
                flex={1}
                resize="none"
                fontSize="0.95rem"
                lineHeight="1.8"
                fontFamily="inherit"
                borderWidth="1px"
                borderColor={colors.border}
                bg={colors.bg}
                color={colors.text}
                _focus={{
                  borderColor: colors.accentColor ?? "#007AFF",
                  outline: "none",
                  boxShadow: "none",
                }}
                _placeholder={{ color: colors.textSecondary }}
                disabled={!isStarted || isSubmitted}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                css={{
                  "&::-webkit-scrollbar": { width: "6px" },
                  "&::-webkit-scrollbar-track": { background: "transparent" },
                  "&::-webkit-scrollbar-thumb": {
                    background: "#cbd5e0",
                    borderRadius: "3px",
                  },
                }}
              />

              {/* Word count */}
              <Flex justify="flex-end" mt={2}>
                <Text
                  fontSize="sm"
                  color={colors.textSecondary}
                  fontWeight="medium"
                >
                  Words: {wordCount}
                </Text>
              </Flex>
            </Box>
          </Box>
        </Splitter.Panel>
      </Splitter.RootProvider>

      {/* Bottom navigation */}
      <WritingPartNavigation
        parts={parts}
        currentPartIndex={currentPartIndex}
        onPartChange={handlePartChange}
        onPrev={handlePrev}
        onNext={handleNext}
        onSubmit={handleSubmit}
        isStarted={isStarted}
      />
    </Flex>
  );
}

// ─── Writing Part Navigation ───────────────────────────────────────────────

interface WritingPartNavProps {
  parts: WritingPartData[];
  currentPartIndex: number;
  onPartChange: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isStarted: boolean;
}

function WritingPartNavigation({
  parts,
  currentPartIndex,
  onPartChange,
  onPrev,
  onNext,
  onSubmit,
  isStarted,
}: WritingPartNavProps) {
  const { colors } = useTestTheme();

  return (
    <Flex
      h="auto"
      minH="52px"
      px={{ base: 2, md: 4 }}
      py={2}
      alignItems="center"
      justifyContent="space-between"
      bg={colors.navBg}
      borderTopWidth="1px"
      borderColor={colors.border}
      position="sticky"
      bottom={0}
      zIndex={20}
      gap={3}
    >
      {/* Part tabs */}
      <HStack
        gap={4}
        flex={1}
        overflowX="auto"
        py={0.5}
        css={{
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
        }}
      >
        {parts.map((part, idx) => {
          const isActive = idx === currentPartIndex;

          return (
            <HStack key={part.id} gap={2} flexShrink={0}>
              <Box
                cursor="pointer"
                onClick={() => onPartChange(idx)}
                display="flex"
                alignItems="center"
                gap={1.5}
                py={1}
              >
                <Text
                  fontWeight="bold"
                  fontSize="sm"
                  color={isActive ? colors.text : colors.textSecondary}
                  whiteSpace="nowrap"
                  transition="color 0.15s"
                >
                  {part.partLabel}
                </Text>
              </Box>

              {/* Separator */}
              {idx < parts.length - 1 && (
                <Box w="1px" h="24px" bg={colors.border} ml={1} />
              )}
            </HStack>
          );
        })}
      </HStack>

      {/* Navigation controls */}
      <HStack gap={1} flexShrink={0}>
        <IconButton
          variant="ghost"
          size="sm"
          aria-label="Previous task"
          onClick={onPrev}
          borderRadius="full"
          color={colors.textSecondary}
          _hover={{ bg: colors.hoverBg, color: colors.text }}
          disabled={currentPartIndex === 0}
        >
          <ChevronLeft size={20} />
        </IconButton>
        <IconButton
          variant="ghost"
          size="sm"
          aria-label="Next task"
          onClick={onNext}
          borderRadius="full"
          color={colors.textSecondary}
          _hover={{ bg: colors.hoverBg, color: colors.text }}
          disabled={currentPartIndex === parts.length - 1}
        >
          <ChevronRight size={20} />
        </IconButton>

        <IconButton
          variant="outline"
          size="sm"
          aria-label="Submit test"
          onClick={onSubmit}
          borderRadius="full"
          color={isStarted ? "green.600" : "gray.400"}
          borderColor={isStarted ? "green.300" : "gray.300"}
          _hover={
            isStarted ? { bg: "green.50", borderColor: "green.400" } : undefined
          }
          disabled={!isStarted}
        >
          <Check size={18} />
        </IconButton>
      </HStack>
    </Flex>
  );
}
