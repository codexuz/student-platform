"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import TestHeader from "./TestHeader";
import PartNavigation from "./PartNavigation";
import QuestionPanel from "./QuestionPanel";
import HighlightablePanel from "./HighlightablePanel";
import AudioPlayOverlay from "./AudioPlayOverlay";
import { TestThemeProvider, useTestTheme } from "./TestThemeContext";
import type { PartData, AnswerMap, TestSessionState } from "./types";
import { getAllQuestionNumbers } from "./types";

export interface ListeningTestLayoutProps {
  parts: PartData[];
  timerMinutes?: number; // default 30
  /** URL for the full listening audio */
  audioUrl?: string;
  /** Per-part audio URLs (fallback when no full audio) */
  partAudioUrls?: Record<number, string>;
  onSubmit?: (answers: AnswerMap) => void;
}

/**
 * Full-page listening test layout with:
 * - AudioPlayOverlay (initial — click Play to start)
 * - TestHeader (top)
 * - Full-width QuestionPanel (no split view)
 * - PartNavigation (bottom)
 */
export default function ListeningTestLayout(props: ListeningTestLayoutProps) {
  return (
    <TestThemeProvider>
      <ListeningTestLayoutInner {...props} />
    </TestThemeProvider>
  );
}

function ListeningTestLayoutInner({
  parts,
  timerMinutes = 30,
  audioUrl,
  partAudioUrls,
  onSubmit,
}: ListeningTestLayoutProps) {
  const [state, setState] = useState<TestSessionState>({
    answers: {},
    currentPartIndex: 0,
    currentQuestionNumber: null,
    timerSeconds: timerMinutes * 60,
    isTimerRunning: false,
    isStarted: false,
    isSubmitted: false,
  });

  const [showOverlay, setShowOverlay] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ─── Timer ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (state.isTimerRunning && state.timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.timerSeconds <= 1) {
            clearInterval(timerRef.current!);
            return { ...prev, timerSeconds: 0, isTimerRunning: false };
          }
          return { ...prev, timerSeconds: prev.timerSeconds - 1 };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.isTimerRunning, state.timerSeconds]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // ─── Audio helpers ──────────────────────────────────────────────────────

  const getCurrentAudioUrl = useCallback(() => {
    // Prefer full audio, fallback to per-part audio
    if (audioUrl) return audioUrl;
    if (partAudioUrls && partAudioUrls[state.currentPartIndex] != null) {
      return partAudioUrls[state.currentPartIndex];
    }
    return null;
  }, [audioUrl, partAudioUrls, state.currentPartIndex]);

  const playAudio = useCallback(() => {
    const url = getCurrentAudioUrl();
    if (!url) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(console.error);
  }, [getCurrentAudioUrl]);

  // ─── Handlers ───────────────────────────────────────────────────────────

  /** Called when user clicks Play on the overlay */
  const handlePlayOverlay = useCallback(() => {
    setShowOverlay(false);
    setState((prev) => ({
      ...prev,
      isStarted: true,
      isTimerRunning: true,
    }));
    // Start audio playback
    playAudio();
  }, [playAudio]);

  /** Fallback Start button in header (if overlay was dismissed) */
  const handleStart = useCallback(() => {
    setShowOverlay(false);
    setState((prev) => ({
      ...prev,
      isStarted: true,
      isTimerRunning: true,
    }));
    playAudio();
  }, [playAudio]);

  const handleAnswer = useCallback((questionNumber: number, answer: string) => {
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionNumber]: answer },
      currentQuestionNumber: questionNumber,
    }));
  }, []);

  const handlePartChange = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      currentPartIndex: index,
      currentQuestionNumber: null,
    }));
  }, []);

  const handleQuestionClick = useCallback((questionNumber: number) => {
    setState((prev) => ({
      ...prev,
      currentQuestionNumber: questionNumber,
    }));

    const el = document.getElementById(`question-${questionNumber}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handlePrev = useCallback(() => {
    setState((prev) => {
      const currentPart = parts[prev.currentPartIndex];
      if (!currentPart) return prev;

      const allNums = getAllQuestionNumbers(currentPart.questions);
      const currentIdx = prev.currentQuestionNumber
        ? allNums.indexOf(prev.currentQuestionNumber)
        : -1;

      if (currentIdx > 0) {
        const prevNum = allNums[currentIdx - 1];
        const el = document.getElementById(`question-${prevNum}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        return { ...prev, currentQuestionNumber: prevNum };
      }

      // Go to previous part
      if (prev.currentPartIndex > 0) {
        const prevPartIdx = prev.currentPartIndex - 1;
        const prevPartNums = getAllQuestionNumbers(
          parts[prevPartIdx].questions,
        );
        const lastNum = prevPartNums[prevPartNums.length - 1] ?? null;
        return {
          ...prev,
          currentPartIndex: prevPartIdx,
          currentQuestionNumber: lastNum,
        };
      }

      return prev;
    });
  }, [parts]);

  const handleNext = useCallback(() => {
    setState((prev) => {
      const currentPart = parts[prev.currentPartIndex];
      if (!currentPart) return prev;

      const allNums = getAllQuestionNumbers(currentPart.questions);
      const currentIdx = prev.currentQuestionNumber
        ? allNums.indexOf(prev.currentQuestionNumber)
        : -1;

      if (currentIdx < allNums.length - 1) {
        const nextNum = allNums[currentIdx + 1];
        const el = document.getElementById(`question-${nextNum}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        return { ...prev, currentQuestionNumber: nextNum };
      }

      // Go to next part
      if (prev.currentPartIndex < parts.length - 1) {
        const nextPartIdx = prev.currentPartIndex + 1;
        const nextPartNums = getAllQuestionNumbers(
          parts[nextPartIdx].questions,
        );
        const firstNum = nextPartNums[0] ?? null;
        return {
          ...prev,
          currentPartIndex: nextPartIdx,
          currentQuestionNumber: firstNum,
        };
      }

      return prev;
    });
  }, [parts]);

  const handleSubmit = useCallback(() => {
    // Pause audio on submit
    if (audioRef.current) {
      audioRef.current.pause();
    }

    setState((prev) => ({
      ...prev,
      isTimerRunning: false,
      isSubmitted: true,
    }));
    onSubmit?.(state.answers);
  }, [onSubmit, state.answers]);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  // ─── Current part data ──────────────────────────────────────────────────

  const { colors, fontScale } = useTestTheme();
  const currentPart = parts[state.currentPartIndex];

  if (!currentPart) {
    return null;
  }

  return (
    <Flex
      direction="column"
      h="100vh"
      bg={colors.bg}
      style={{ fontSize: `${fontScale}rem` }}
    >
      {/* Audio play overlay (shown initially) */}
      {showOverlay && <AudioPlayOverlay onPlay={handlePlayOverlay} />}

      {/* Header */}
      <TestHeader
        timerSeconds={state.timerSeconds}
        isTimerRunning={state.isTimerRunning}
        isStarted={state.isStarted}
        onStart={handleStart}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Part header */}
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
        {currentPart.instruction && (
          <Text fontSize="sm" color={colors.textSecondary}>
            {currentPart.instruction}
          </Text>
        )}
      </Box>

      {/* Full-width question panel (no split view for listening) */}
      <Box flex={1} overflow="hidden">
        <HighlightablePanel>
          <QuestionPanel
            questions={currentPart.questions}
            answers={state.answers}
            onAnswer={handleAnswer}
            disabled={!state.isStarted || state.isSubmitted}
            showResults={state.isSubmitted}
            highlightedQuestion={state.currentQuestionNumber}
          />
        </HighlightablePanel>
      </Box>

      {/* Bottom navigation */}
      <PartNavigation
        parts={parts}
        currentPartIndex={state.currentPartIndex}
        currentQuestionNumber={state.currentQuestionNumber}
        answers={state.answers}
        onPartChange={handlePartChange}
        onQuestionClick={handleQuestionClick}
        onPrev={handlePrev}
        onNext={handleNext}
        onSubmit={handleSubmit}
        isStarted={state.isStarted}
      />
    </Flex>
  );
}
