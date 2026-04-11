"use client";

import { useCallback, useMemo } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Badge,
  HStack,
  VStack,
  Switch,
  Circle,
  Separator,
  IconButton,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  CheckCircle2,
  Maximize2,
  XCircle,
} from "lucide-react";
import type { QuestionResult, PartInfo, RawQuestionGroup, RawOption } from "./types";

// ─── Header ───────────────────────────────────────────────────────────────

export function ReviewHeader({
  onBack,
  showCorrectAnswers,
  onToggleCorrect,
  onToggleFullscreen,
}: {
  onBack: () => void;
  showCorrectAnswers: boolean;
  onToggleCorrect: (v: boolean) => void;
  onToggleFullscreen: () => void;
}) {
  return (
    <Flex
      h="14"
      px={{ base: 2, md: 4 }}
      alignItems="center"
      justifyContent="space-between"
      bg="white"
      _dark={{ bg: "gray.800" }}
      borderBottomWidth="1px"
      borderColor="gray.200"
      position="sticky"
      top={0}
      zIndex={20}
    >
      {/* Left */}
      <HStack gap={2}>
        <Button variant="ghost" size="sm" onClick={onBack} px={2}>
          <ArrowLeft size={16} />
          <Text ml={1} display={{ base: "none", sm: "inline" }}>
            Back to Results
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
        >
          IELTS
        </Badge>
      </HStack>

      {/* Right */}
      <HStack gap={2}>
        <HStack gap={1}>
          <Switch.Root
            checked={showCorrectAnswers}
            onCheckedChange={(e) => onToggleCorrect(e.checked)}
            colorPalette="orange"
          >
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
          <Text fontSize="sm" display={{ base: "none", sm: "inline" }}>
            Show Correct Answers
          </Text>
        </HStack>
        <IconButton
          variant="ghost"
          size="sm"
          aria-label="Fullscreen"
          onClick={onToggleFullscreen}
        >
          <Maximize2 size={16} />
        </IconButton>
      </HStack>
    </Flex>
  );
}

// ─── Questions List for Review ────────────────────────────────────────────

const GAP_FILL_TYPES = [
  "NOTE_COMPLETION",
  "SHORT_ANSWER",
  "SENTENCE_COMPLETION",
  "SUMMARY_COMPLETION",
  "TABLE_COMPLETION",
  "FLOW_CHART_COMPLETION",
  "DIAGRAM_LABELLING",
  "PLAN_MAP_LABELLING",
  "SUMMARY_COMPLETION_DRAG_DROP",
];

export function ReviewQuestionsList({
  questions,
  showCorrectAnswers,
  hideFromPassage = false,
  rawQuestionGroups,
}: {
  questions: QuestionResult[];
  showCorrectAnswers: boolean;
  hideFromPassage?: boolean;
  rawQuestionGroups?: RawQuestionGroup[];
}) {
  const groups = groupQuestionsByType(questions);

  // Build lookup: questionNumber → RawQuestionGroup
  const rawGroupMap = useMemo(() => {
    if (!rawQuestionGroups?.length) return new Map<number, RawQuestionGroup>();
    const map = new Map<number, RawQuestionGroup>();
    for (const rg of rawQuestionGroups) {
      if (rg.questions.length > 0) {
        for (const sq of rg.questions) {
          map.set(sq.questionNumber, rg);
        }
      }
      map.set(rg.questionNumber, rg);
    }
    return map;
  }, [rawQuestionGroups]);

  return (
    <VStack align="stretch" gap={6}>
      {groups.map((group, gIdx) => {
        const firstRawGroup = rawGroupMap.get(
          group.questions[0]?.questionNumber,
        );

        // Use instruction from raw data if available
        const rawInstruction = firstRawGroup?.instruction
          ?.replace(/<p>\s*<\/p>/g, "")
          .trim();
        const hasRawInstruction =
          rawInstruction && rawInstruction.length > 0;

        const isInlineGapFill =
          GAP_FILL_TYPES.includes(group.type) && group.sharedText;

        return (
          <Box key={gIdx}>
            <Heading size="sm" mb={1}>
              Questions {group.startNum}-{group.endNum}
            </Heading>

            {hasRawInstruction ? (
              <Box
                fontSize="sm"
                color="gray.500"
                mb={4}
                dangerouslySetInnerHTML={{ __html: rawInstruction }}
                css={{
                  "& p": { margin: 0 },
                  "& strong": { fontWeight: "bold" },
                }}
              />
            ) : (
              <Text fontSize="sm" color="gray.500" mb={4}>
                {getInstructionForType(group.type)}
              </Text>
            )}

            {/* Heading options list for MATCHING_HEADINGS */}
            {group.type === "MATCHING_HEADINGS" &&
              firstRawGroup?.headingOptions &&
              Object.keys(firstRawGroup.headingOptions).length > 0 && (
                <Box
                  mb={4}
                  p={3}
                  bg="gray.50"
                  _dark={{ bg: "gray.700" }}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="gray.200"
                >
                  <Text fontSize="sm" fontWeight="semibold" mb={2}>
                    List of Headings
                  </Text>
                  <VStack align="stretch" gap={1}>
                    {Object.entries(firstRawGroup.headingOptions)
                      .sort(([a], [b]) => {
                        const romanOrder = ["i","ii","iii","iv","v","vi","vii","viii","ix","x","xi","xii"];
                        return romanOrder.indexOf(a) - romanOrder.indexOf(b);
                      })
                      .map(([key, text]) => (
                        <Flex key={key} gap={2} fontSize="sm" align="baseline">
                          <Text fontWeight="bold" flexShrink={0} minW="24px">
                            {key}
                          </Text>
                          <Text>{text}</Text>
                        </Flex>
                      ))}
                  </VStack>
                </Box>
              )}

            {isInlineGapFill ? (
              <>
                {/* For drag-drop, show available option pool */}
                {group.type === "SUMMARY_COMPLETION_DRAG_DROP" &&
                  firstRawGroup?.options?.length && (
                    <Flex gap={2} flexWrap="wrap" mb={4}>
                      {(firstRawGroup.options ?? []).map((opt) => (
                        <Badge
                          key={opt.optionKey}
                          px={2}
                          py={1}
                          borderRadius="md"
                          variant="outline"
                          colorPalette="gray"
                          fontSize="xs"
                        >
                          <Text as="span" fontWeight="bold" mr={1}>
                            {opt.optionKey}.
                          </Text>
                          {opt.optionText}
                        </Badge>
                      ))}
                    </Flex>
                  )}

                <Box
                  dangerouslySetInnerHTML={{
                    __html: buildInlineGapFillHtml(
                      group.sharedText!,
                      group.questions,
                      showCorrectAnswers,
                    ),
                  }}
                  fontSize="sm"
                  lineHeight="2"
                  css={{
                    "& p": { marginBottom: "0.5em" },
                    "& strong": { fontWeight: "bold" },
                    "& em": { fontStyle: "italic" },
                    "& ul, & ol": {
                      paddingLeft: "1.5em",
                      marginBottom: "0.5em",
                    },
                  }}
                />
              </>
            ) : (
              <>
                {group.sharedText && (
                  <Box
                    mb={4}
                    dangerouslySetInnerHTML={{ __html: group.sharedText }}
                    fontSize="sm"
                    lineHeight="1.7"
                    css={{
                      "& p": { marginBottom: "0.5em" },
                      "& strong": { fontWeight: "bold" },
                      "& ul, & ol": {
                        paddingLeft: "1.5em",
                        marginBottom: "0.5em",
                      },
                    }}
                  />
                )}

                <VStack align="stretch" gap={3}>
                  {group.questions.map((qr) => (
                    <ReviewQuestionItem
                      key={qr.questionId}
                      question={qr}
                      questionType={group.type}
                      showCorrectAnswers={showCorrectAnswers}
                      hideFromPassage={hideFromPassage}
                      rawOptions={
                        rawGroupMap.get(qr.questionNumber)?.options
                      }
                      headingOptions={
                        rawGroupMap.get(qr.questionNumber)?.headingOptions
                      }
                    />
                  ))}
                </VStack>
              </>
            )}

            {gIdx < groups.length - 1 && <Separator mt={6} />}
          </Box>
        );
      })}
    </VStack>
  );
}

// ─── Single Question Review Item ──────────────────────────────────────────

function ReviewQuestionItem({
  question,
  questionType,
  showCorrectAnswers,
  hideFromPassage = false,
  rawOptions,
  headingOptions,
}: {
  question: QuestionResult;
  questionType: string;
  showCorrectAnswers: boolean;
  hideFromPassage?: boolean;
  rawOptions?: RawOption[];
  headingOptions?: Record<string, string>;
}) {
  const { questionNumber, userAnswer, correctAnswer, isCorrect, questionText } =
    question;
  const answered = userAnswer != null && userAnswer !== "";
  const correct = isCorrect === true;
  const wrong = isCorrect === false;

  const isInputType = [
    "NOTE_COMPLETION",
    "SHORT_ANSWER",
    "SENTENCE_COMPLETION",
    "SUMMARY_COMPLETION",
    "TABLE_COMPLETION",
    "FLOW_CHART_COMPLETION",
    "DIAGRAM_LABELLING",
    "PLAN_MAP_LABELLING",
  ].includes(questionType);

  const isSelectionType = [
    "TRUE_FALSE_NOT_GIVEN",
    "YES_NO_NOT_GIVEN",
    "MULTIPLE_CHOICE",
    "MULTIPLE_ANSWER",
    "MATCHING_HEADINGS",
    "MATCHING_INFORMATION",
    "MATCHING_FEATURES",
    "MATCHING_SENTENCE_ENDINGS",
    "SUMMARY_COMPLETION_DRAG_DROP",
  ].includes(questionType);

  const hasOptions = rawOptions && rawOptions.length > 0;

  // Synthesize options for TFNG / YNNG when not provided from API
  const resolvedOptions: RawOption[] | undefined = hasOptions
    ? rawOptions
    : questionType === "TRUE_FALSE_NOT_GIVEN"
      ? [
          { optionKey: "TRUE", optionText: "TRUE", isCorrect: correctAnswer?.toUpperCase() === "TRUE" },
          { optionKey: "FALSE", optionText: "FALSE", isCorrect: correctAnswer?.toUpperCase() === "FALSE" },
          { optionKey: "NOT GIVEN", optionText: "NOT GIVEN", isCorrect: correctAnswer?.toUpperCase() === "NOT GIVEN" },
        ]
      : questionType === "YES_NO_NOT_GIVEN"
        ? [
            { optionKey: "YES", optionText: "YES", isCorrect: correctAnswer?.toUpperCase() === "YES" },
            { optionKey: "NO", optionText: "NO", isCorrect: correctAnswer?.toUpperCase() === "NO" },
            { optionKey: "NOT GIVEN", optionText: "NOT GIVEN", isCorrect: correctAnswer?.toUpperCase() === "NOT GIVEN" },
          ]
        : undefined;

  const isTfngYnng =
    questionType === "TRUE_FALSE_NOT_GIVEN" ||
    questionType === "YES_NO_NOT_GIVEN";

  const hasResolvedOptions = resolvedOptions && resolvedOptions.length > 0;

  return (
    <Flex
      id={`review-question-${questionNumber}`}
      align="flex-start"
      gap={3}
      py={2}
    >
      <Circle
        size="28px"
        bg={correct ? "green.500" : wrong ? "red.500" : "gray.400"}
        color="white"
        fontSize="xs"
        fontWeight="bold"
        flexShrink={0}
        mt={0.5}
      >
        {questionNumber}
      </Circle>

      <Box flex={1}>
        {questionText && !isInputType && (
          <Text
            fontSize="sm"
            mb={2}
            dangerouslySetInnerHTML={{ __html: questionText }}
          />
        )}

        {isInputType && (
          <Flex align="center" gap={2} flexWrap="wrap">
            <Box
              px={3}
              py={1.5}
              borderWidth="2px"
              borderColor={
                correct ? "green.400" : wrong ? "red.400" : "gray.300"
              }
              borderRadius="md"
              bg={correct ? "green.50" : wrong ? "red.50" : "gray.50"}
              _dark={{
                bg: correct
                  ? "green.900/30"
                  : wrong
                    ? "red.900/30"
                    : "gray.700",
              }}
              minW="80px"
              fontSize="sm"
            >
              {answered ? userAnswer : "N/A"}
            </Box>
            {showCorrectAnswers && !correct && (
              <Text fontSize="sm" color="green.600" fontWeight="semibold">
                (Correct:{" "}
                <Text as="span" fontWeight="bold" textDecoration="underline">
                  {correctAnswer}
                </Text>
                )
              </Text>
            )}
            {correct && (
              <CheckCircle2 size={16} color="var(--chakra-colors-green-500)" />
            )}
            {(wrong || !answered) && (
              <Badge colorPalette="red" fontSize="xs">
                Wrong
              </Badge>
            )}
          </Flex>
        )}

        {/* Selection types WITH full options from raw data */}
        {isSelectionType && hasResolvedOptions && (
          <Box>
            <VStack align="stretch" gap={1.5} mt={1}>
              {resolvedOptions.map((opt) => {
                const isSelected =
                  userAnswer?.toUpperCase() === opt.optionKey.toUpperCase();
                const isCorrectOpt =
                  opt.isCorrect ||
                  correctAnswer?.toUpperCase() ===
                    opt.optionKey.toUpperCase();

                let borderCol = "gray.200";
                let bgCol = "transparent";
                if (isSelected && isCorrectOpt) {
                  borderCol = "green.400";
                  bgCol = "green.50";
                } else if (isSelected && !isCorrectOpt) {
                  borderCol = "red.400";
                  bgCol = "red.50";
                } else if (isCorrectOpt && showCorrectAnswers) {
                  borderCol = "green.300";
                  bgCol = "green.50";
                }

                return (
                  <Flex
                    key={opt.optionKey}
                    align="center"
                    gap={2}
                    px={3}
                    py={2}
                    borderRadius="md"
                    borderWidth="1.5px"
                    borderColor={borderCol}
                    bg={bgCol}
                    _dark={{
                      borderColor: borderCol,
                      bg:
                        isSelected && isCorrectOpt
                          ? "green.900/30"
                          : isSelected && !isCorrectOpt
                            ? "red.900/30"
                            : isCorrectOpt && showCorrectAnswers
                              ? "green.900/20"
                              : "transparent",
                    }}
                  >
                    <Circle
                      size={isTfngYnng ? "18px" : "24px"}
                      borderWidth="2px"
                      borderColor={
                        isSelected
                          ? isCorrectOpt
                            ? "green.500"
                            : "red.500"
                          : isCorrectOpt && showCorrectAnswers
                            ? "green.400"
                            : "gray.300"
                      }
                      bg={
                        isSelected
                          ? isCorrectOpt
                            ? "green.500"
                            : "red.500"
                          : "transparent"
                      }
                      color={isSelected ? "white" : "gray.600"}
                      fontSize="xs"
                      fontWeight="bold"
                      flexShrink={0}
                    >
                      {isTfngYnng ? "" : opt.optionKey}
                    </Circle>
                    <Text fontSize="sm" flex={1} fontWeight={isSelected ? "semibold" : "normal"}>
                      {opt.optionText}
                    </Text>
                    {isSelected && isCorrectOpt && (
                      <CheckCircle2
                        size={16}
                        color="var(--chakra-colors-green-500)"
                      />
                    )}
                    {isSelected && !isCorrectOpt && (
                      <XCircle
                        size={16}
                        color="var(--chakra-colors-red-500)"
                      />
                    )}
                    {!isSelected && isCorrectOpt && showCorrectAnswers && (
                      <CheckCircle2
                        size={16}
                        color="var(--chakra-colors-green-500)"
                      />
                    )}
                  </Flex>
                );
              })}
            </VStack>
          </Box>
        )}

        {/* Selection types WITHOUT options (fallback) */}
        {isSelectionType && !hasResolvedOptions && (
          <Box>
            <Flex align="center" gap={2} mb={1} flexWrap="wrap">
              <Text fontSize="sm" color={answered ? undefined : "gray.400"}>
                Your answer:{" "}
                <Text as="span" fontWeight="semibold">
                  {answered ? userAnswer : "N/A"}
                </Text>
                {answered && headingOptions && userAnswer && headingOptions[userAnswer] && (
                  <Text as="span" color="gray.500" fontWeight="normal">
                    {" — "}{headingOptions[userAnswer]}
                  </Text>
                )}
              </Text>
              {correct && (
                <CheckCircle2
                  size={14}
                  color="var(--chakra-colors-green-500)"
                />
              )}
              {(wrong || !answered) && (
                <Badge colorPalette="red" fontSize="xs">
                  Wrong
                </Badge>
              )}
            </Flex>

            {showCorrectAnswers && !correct && (
              <Text fontSize="sm" color="green.600">
                Correct answer:{" "}
                <Text as="span" fontWeight="bold">
                  {correctAnswer}
                </Text>
                {headingOptions && correctAnswer && headingOptions[correctAnswer] && (
                  <Text as="span" fontWeight="normal">
                    {" — "}{headingOptions[correctAnswer]}
                  </Text>
                )}
              </Text>
            )}

            {question.fromPassage && showCorrectAnswers && !hideFromPassage && (
              <Box
                mt={2}
                p={2}
                bg="blue.50"
                _dark={{ bg: "blue.900/30" }}
                borderRadius="md"
                borderLeftWidth="3px"
                borderLeftColor="blue.400"
              >
                <Text
                  fontSize="xs"
                  color="blue.600"
                  fontWeight="semibold"
                  mb={0.5}
                >
                  From passage:
                </Text>
                <Text fontSize="xs" fontStyle="italic">
                  {question.fromPassage}
                </Text>
              </Box>
            )}
          </Box>
        )}

        {question.explanation && showCorrectAnswers && (
          <Box
            mt={2}
            p={2}
            bg="yellow.50"
            _dark={{ bg: "yellow.900/30" }}
            borderRadius="md"
          >
            <Text
              fontSize="xs"
              color="yellow.700"
              fontWeight="semibold"
              mb={0.5}
            >
              Explanation:
            </Text>
            <Text fontSize="xs">{question.explanation}</Text>
          </Box>
        )}
      </Box>
    </Flex>
  );
}

// ─── Part Navigation for Review ───────────────────────────────────────────

export function ReviewPartNavigation({
  parts,
  currentPartIndex,
  onPartChange,
  questionResults,
  onScrollToQuestion,
}: {
  parts: PartInfo[];
  currentPartIndex: number;
  onPartChange: (idx: number) => void;
  questionResults: QuestionResult[];
  onScrollToQuestion?: (questionNumber: number) => void;
}) {
  if (parts.length === 0) return null;

  return (
    <Flex
      bg="white"
      _dark={{ bg: "gray.800" }}
      borderTopWidth="1px"
      borderColor="gray.300"
      flexShrink={0}
      h="auto"
      minH="11"
      overflowX="auto"
    >
      {parts.map((part, idx) => {
        const partQuestions = questionResults.filter(
          (qr) =>
            qr.questionNumber >= part.questionRange[0] &&
            qr.questionNumber <= part.questionRange[1],
        );
        const correctCount = partQuestions.filter(
          (q) => q.isCorrect === true,
        ).length;
        const totalCount = partQuestions.length;
        const isActive = idx === currentPartIndex;

        return (
          <Flex
            key={part.id}
            flex={1}
            align="center"
            px={{ base: 2, md: 3 }}
            py={1.5}
            gap={2}
            cursor="pointer"
            onClick={() => onPartChange(idx)}
            borderRightWidth={idx < parts.length - 1 ? "1px" : "0px"}
            borderRightColor="gray.200"
            bg={isActive ? "white" : "gray.50"}
            _dark={{
              bg: isActive ? "gray.800" : "gray.850",
              borderRightColor: "gray.700",
            }}
            borderTopWidth={isActive ? "3px" : "0px"}
            borderTopColor="blue.500"
            transition="all 0.15s"
            minW="0"
          >
            {/* Part label */}
            <Text
              fontSize="xs"
              fontWeight={isActive ? "bold" : "medium"}
              color={isActive ? "gray.900" : "gray.500"}
              _dark={{ color: isActive ? "white" : "gray.400" }}
              flexShrink={0}
              whiteSpace="nowrap"
            >
              {part.partLabel}
            </Text>

            {/* Question number squares (only on active part) */}
            {isActive && partQuestions.length > 0 && (
              <HStack gap={0.5} flexWrap="wrap" flexShrink={1} minW="0">
                {partQuestions.map((q) => {
                  const correct = q.isCorrect === true;
                  const wrong = q.isCorrect === false;
                  const answered = q.userAnswer != null && q.userAnswer !== "";

                  let bg = "transparent";
                  let borderCol = "gray.300";
                  let textCol = "gray.500";

                  if (correct) {
                    bg = "transparent";
                    borderCol = "green.400";
                    textCol = "green.600";
                  } else if (wrong) {
                    bg = "transparent";
                    borderCol = "red.400";
                    textCol = "red.600";
                  } else if (!answered) {
                    bg = "transparent";
                    borderCol = "gray.300";
                    textCol = "gray.400";
                  }

                  return (
                    <Flex
                      key={q.questionNumber}
                      w="22px"
                      h="22px"
                      align="center"
                      justify="center"
                      borderWidth="1.5px"
                      borderColor={borderCol}
                      borderRadius="sm"
                      bg={bg}
                      fontSize="2xs"
                      fontWeight="semibold"
                      color={textCol}
                      cursor="pointer"
                      _hover={{ bg: "gray.100", _dark: { bg: "gray.700" } }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onScrollToQuestion?.(q.questionNumber);
                      }}
                      flexShrink={0}
                    >
                      {q.questionNumber}
                    </Flex>
                  );
                })}
              </HStack>
            )}

            {/* Score count */}
            {!isActive && totalCount > 0 && (
              <Text
                fontSize="xs"
                color="gray.400"
                _dark={{ color: "gray.500" }}
                whiteSpace="nowrap"
              >
                {correctCount} of {totalCount}
              </Text>
            )}
            {isActive && totalCount > 0 && (
              <Text
                fontSize="xs"
                color="gray.500"
                _dark={{ color: "gray.400" }}
                whiteSpace="nowrap"
                flexShrink={0}
              >
                {correctCount} of {totalCount}
              </Text>
            )}
          </Flex>
        );
      })}
    </Flex>
  );
}

// ─── Inline Gap-Fill HTML Builder ─────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildInlineGapFillHtml(
  html: string,
  questions: QuestionResult[],
  showCorrectAnswers: boolean,
): string {
  let qIdx = 0;
  return html.replace(/_{3,}/g, () => {
    if (qIdx >= questions.length) return "___";
    const q = questions[qIdx++];
    const answered = q.userAnswer != null && q.userAnswer !== "";
    const correct = q.isCorrect === true;
    const userText = answered ? escapeHtml(q.userAnswer!) : "N/A";
    const correctText = escapeHtml(q.correctAnswer);

    const borderColor = correct ? "#68d391" : "#fc8181";
    const bgColor = correct ? "#f0fff4" : "#fff5f5";

    let s =
      '<span style="display:inline-flex;align-items:center;gap:4px;vertical-align:middle;margin:2px 0;">';

    // User answer box
    s += `<span style="display:inline-block;padding:2px 10px;border:2px solid ${borderColor};border-radius:6px;background:${bgColor};font-weight:500;min-width:60px;font-size:inherit;">${userText}</span>`;

    // Status badge
    if (correct) {
      s +=
        '<span style="display:inline-flex;align-items:center;gap:2px;background:#c6f6d5;color:#276749;border-radius:4px;padding:1px 8px;font-size:0.8em;font-weight:600;">\u2713 Correct</span>';
    } else {
      s +=
        '<span style="display:inline-flex;align-items:center;gap:2px;background:#fed7d7;color:#9b2c2c;border-radius:4px;padding:1px 8px;font-size:0.8em;font-weight:600;">\u2715 Wrong</span>';
    }

    // Correct answer when wrong
    if (showCorrectAnswers && !correct) {
      s += `<span style="color:#276749;font-weight:600;font-size:0.9em;">(Correct: <em style="font-weight:bold;text-decoration:underline;">${correctText}</em>)</span>`;
    }

    // Question number
    s += `&nbsp;<span style="display:inline-flex;align-items:center;justify-content:center;background:${correct ? "#38a169" : "#e53e3e"};color:white;border-radius:50%;width:20px;height:20px;font-size:0.7em;font-weight:bold;">${q.questionNumber}</span>`;

    s += "</span>";
    return s;
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────

export function getQuestionNums(
  questions: {
    questionNumber?: number;
    questions?: { questionNumber?: number }[];
  }[],
): number[] {
  const nums: number[] = [];
  for (const q of questions) {
    if (q.questions?.length) {
      for (const sub of q.questions) {
        if (sub.questionNumber != null) nums.push(sub.questionNumber);
      }
    } else if (q.questionNumber != null) {
      nums.push(q.questionNumber);
    }
  }
  return nums.sort((a, b) => a - b);
}

export function useToggleFullscreen() {
  return useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);
}

// ─── Internal Helpers ─────────────────────────────────────────────────────

interface QuestionGroup {
  type: string;
  startNum: number;
  endNum: number;
  questions: QuestionResult[];
  sharedText: string | null;
}

function groupQuestionsByType(questions: QuestionResult[]): QuestionGroup[] {
  if (questions.length === 0) return [];

  const groups: QuestionGroup[] = [];
  let current: QuestionGroup | null = null;

  for (const q of questions) {
    if (!current || current.type !== q.questionType) {
      if (current) groups.push(current);
      current = {
        type: q.questionType,
        startNum: q.questionNumber,
        endNum: q.questionNumber,
        questions: [q],
        sharedText: null,
      };
    } else {
      current.endNum = q.questionNumber;
      current.questions.push(q);
    }
  }
  if (current) groups.push(current);

  for (const group of groups) {
    const inputTypes = [
      "NOTE_COMPLETION",
      "SENTENCE_COMPLETION",
      "SUMMARY_COMPLETION",
      "TABLE_COMPLETION",
      "FLOW_CHART_COMPLETION",
    ];
    if (inputTypes.includes(group.type) && group.questions[0]?.questionText) {
      group.sharedText = group.questions[0].questionText;
    }
  }

  return groups;
}

function getInstructionForType(type: string): string {
  switch (type) {
    case "TRUE_FALSE_NOT_GIVEN":
      return "Choose TRUE if the statement agrees with the information given in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.";
    case "YES_NO_NOT_GIVEN":
      return "Choose YES if the statement agrees with the views of the writer, choose NO if the statement contradicts the views of the writer, or choose NOT GIVEN if it is impossible to say what the writer thinks about this.";
    case "MATCHING_HEADINGS":
      return "Choose the correct heading for each paragraph from the list of headings below.";
    case "MATCHING_INFORMATION":
      return "Which paragraph contains the following information?";
    case "MATCHING_FEATURES":
      return "Match each statement with the correct option.";
    case "MATCHING_SENTENCE_ENDINGS":
      return "Complete each sentence with the correct ending.";
    case "NOTE_COMPLETION":
      return "Complete the notes. Write ONE WORD ONLY from the text for each answer.";
    case "SENTENCE_COMPLETION":
      return "Complete the sentences below. Write NO MORE THAN TWO WORDS from the text for each answer.";
    case "SUMMARY_COMPLETION":
      return "Complete the summary below.";
    case "SUMMARY_COMPLETION_DRAG_DROP":
      return "Complete the summary below. Choose words from the box.";
    case "MULTIPLE_CHOICE":
      return "Choose the correct answer.";
    case "MULTIPLE_ANSWER":
      return "Choose the correct answers.";
    case "SHORT_ANSWER":
      return "Answer the questions below.";
    case "TABLE_COMPLETION":
      return "Complete the table below.";
    case "FLOW_CHART_COMPLETION":
      return "Complete the flow chart below.";
    case "DIAGRAM_LABELLING":
      return "Label the diagram below.";
    default:
      return "";
  }
}
