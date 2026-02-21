"use client";

import { useState, useCallback } from "react";
import { Box, Flex, Text, Splitter, useSplitter } from "@chakra-ui/react";
import TestHeader from "./TestHeader";
import PartNavigation from "./PartNavigation";
import ReadingPassage from "./ReadingPassage";
import QuestionPanel from "./QuestionPanel";
import HighlightablePanel from "./HighlightablePanel";
import { TestThemeProvider, useTestTheme } from "./TestThemeContext";
import type { PartData, AnswerMap, TestSessionState } from "./types";
import { getAllQuestionNumbers } from "./types";

interface ReadingTestLayoutProps {
  parts: PartData[];
  timerMinutes?: number; // default 60
  /** Auto-start timer immediately (for mock tests) */
  autoStart?: boolean;
  onSubmit?: (answers: AnswerMap) => void | Promise<void>;
  /** Called when answers change (for auto-save tracking) */
  onAnswerChange?: (answers: AnswerMap) => void;
  /** Called when user switches parts (good moment to save progress) */
  onSaveProgress?: (answers: AnswerMap) => void;
  /** Called when timer finishes (for mock test redirect) */
  onFinish?: () => void;
  /** Called when Start button is clicked (e.g. to create an attempt) */
  onStartAttempt?: () => void;
}

/**
 * Full-page reading test layout with:
 * - TestHeader (top)
 * - Split view: ReadingPassage (left) | QuestionPanel (right)
 * - PartNavigation (bottom)
 */
export default function ReadingTestLayout(props: ReadingTestLayoutProps) {
  return (
    <TestThemeProvider>
      <ReadingTestLayoutInner {...props} />
    </TestThemeProvider>
  );
}

function ReadingTestLayoutInner({
  parts,
  timerMinutes = 60,
  autoStart = false,
  onSubmit,
  onAnswerChange,
  onSaveProgress,
  onStartAttempt,
}: ReadingTestLayoutProps) {
  const [state, setState] = useState<TestSessionState>({
    answers: {},
    currentPartIndex: 0,
    currentQuestionNumber: null,
    timerSeconds: timerMinutes * 60,
    isTimerRunning: autoStart,
    isStarted: autoStart,
    isSubmitted: false,
  });

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleStart = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isStarted: true,
      isTimerRunning: true,
    }));
    onStartAttempt?.();
  }, [onStartAttempt]);

  const handleAnswer = useCallback(
    (questionNumber: number, answer: string) => {
      setState((prev) => {
        const newAnswers = { ...prev.answers, [questionNumber]: answer };
        onAnswerChange?.(newAnswers);
        return {
          ...prev,
          answers: newAnswers,
          currentQuestionNumber: questionNumber,
        };
      });
    },
    [onAnswerChange],
  );

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

    // Scroll to the question
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
    setState((prev) => ({
      ...prev,
      isTimerRunning: false,
      isSubmitted: true,
    }));
    onSubmit?.(state.answers);
  }, [onSubmit, state.answers]);

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

  // ─── Current part data ──────────────────────────────────────────────────

  const { colors, fontScale } = useTestTheme();

  const currentPart = parts[state.currentPartIndex];

  const splitter = useSplitter({
    defaultSize: [50, 50],
    panels: [{ id: "passage" }, { id: "questions", minSize: 20 }],
  });

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
      {/* Header */}
      <TestHeader
        initialTimerSeconds={state.timerSeconds}
        isTimerRunning={state.isTimerRunning}
        isStarted={state.isStarted}
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
        {currentPart.instruction && (
          <Text fontSize="sm" color={colors.textSecondary}>
            {currentPart.instruction}
          </Text>
        )}
      </Box>

      {/* Main split view */}
      <Splitter.RootProvider value={splitter} flex={1} overflow="hidden">
        {/* Left — Reading Passage */}
        <Splitter.Panel id="passage">
          <Box
            h="100%"
            display={{
              base: state.currentQuestionNumber ? "none" : "block",
              lg: "block",
            }}
            overflow="hidden"
          >
            <HighlightablePanel>
              <ReadingPassage
                content={currentPart.content}
                title={currentPart.title}
              />
            </HighlightablePanel>
          </Box>
        </Splitter.Panel>

        <Splitter.ResizeTrigger
          id="passage:questions"
          display={{ base: "none", lg: "flex" }}
        />

        {/* Right — Questions */}
        <Splitter.Panel id="questions">
          <Box
            h="100%"
            display={{
              base: state.currentQuestionNumber ? "block" : "none",
              lg: "block",
            }}
            overflow="hidden"
          >
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
        </Splitter.Panel>
      </Splitter.RootProvider>

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
