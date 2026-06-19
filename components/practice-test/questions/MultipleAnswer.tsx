"use client";

import { Box, Heading, Text, VStack, HStack } from "@chakra-ui/react";
import { Check } from "lucide-react";
import type { QuestionComponentProps } from "../types";
import { getQuestionRange } from "../types";

/**
 * MULTIPLE_ANSWER — multi-select checkboxes.
 *
 * When sub-questions exist (e.g. Q21 + Q22), each sub-question expects
 * exactly ONE selected option.  Total selections = subQuestions.length.
 * Once the limit is reached, unchecked options are disabled.
 */
export default function MultipleAnswer({
  question,
  answers,
  onAnswer,
  disabled = false,
  showResults = false,
}: QuestionComponentProps) {
  const [startNum, endNum] = getQuestionRange(question);
  const subQuestions = question.questions ?? [];
  const globalOptions = question.options ?? [];

  /* ── selection limit ── */
  const subQNums = subQuestions
    .map((sq) => sq.questionNumber ?? 0)
    .sort((a, b) => a - b);
  const maxSelections = subQNums.length || 1;

  /* ── gather every selected key across sub-question slots ── */
  const allSelectedKeys: string[] = [];
  if (subQNums.length > 0) {
    for (const qn of subQNums) {
      const v = answers[qn];
      if (v) allSelectedKeys.push(v);
    }
  } else {
    const qn = question.questionNumber ?? startNum;
    const v = answers[qn] ?? "";
    if (v) allSelectedKeys.push(...v.split(",").filter(Boolean));
  }

  const atLimit = allSelectedKeys.length >= maxSelections;

  /* ── toggle handler ── */
  const handleToggle = (optKey: string) => {
    if (disabled) return;

    const idx = allSelectedKeys.indexOf(optKey);
    let next: string[];

    if (idx >= 0) {
      next = allSelectedKeys.filter((k) => k !== optKey);
    } else {
      if (atLimit) return; // can't select more
      next = [...allSelectedKeys, optKey];
    }

    /* distribute selections into sub-question slots */
    if (subQNums.length > 0) {
      for (let i = 0; i < subQNums.length; i++) {
        onAnswer(subQNums[i], next[i] ?? "");
      }
    } else {
      const qn = question.questionNumber ?? startNum;
      onAnswer(qn, next.sort().join(","));
    }
  };

  /* ── question text (from sub-questions or parent) ── */
  const questionText =
    subQuestions.find((sq) => sq.questionText)?.questionText ??
    question.questionText ??
    "";

  /* ── render ── */
  return (
    <Box>
      {startNum === endNum ? (
        <Heading size="md" mb={2} fontWeight="bold">
          Question {startNum}
        </Heading>
      ) : (
        <Heading size="md" mb={2} fontWeight="bold">
          Questions {startNum}-{endNum}
        </Heading>
      )}

      {question.instruction && (
        <Box
          mb={3}
          dangerouslySetInnerHTML={{ __html: question.instruction }}
          css={{
            "& p": { marginBottom: "0.25rem" },
            "& strong": { fontWeight: "bold" },
          }}
        />
      )}

      {questionText && (
        <Box
          mb={3}
          lineHeight="tall"
          fontWeight="medium"
          dangerouslySetInnerHTML={{ __html: questionText }}
          css={{
            "& p": { marginBottom: "0.25rem" },
            "& strong": { fontWeight: "bold" },
          }}
        />
      )}

      <VStack align="stretch" gap={0}>
        {globalOptions
          .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
          .map((opt) => {
            const isSelected = allSelectedKeys.includes(opt.optionKey);
            const optCorrect = showResults && opt.isCorrect;
            const isOptionDisabled =
              disabled || (!isSelected && atLimit && !showResults);

            /* ── row colours ── */
            let checkBorder: string;
            let checkBg: string;
            let rowBg: string;

            if (showResults) {
              if (optCorrect) {
                checkBorder = "var(--test-correct-border)";
                checkBg = isSelected ? "var(--test-correct-border)" : "transparent";
                rowBg = "var(--test-correct-bg)";
              } else if (isSelected) {
                checkBorder = "var(--test-wrong-border)";
                checkBg = "var(--test-wrong-border)";
                rowBg = "var(--test-wrong-bg)";
              } else {
                checkBorder = "var(--test-border)";
                checkBg = "transparent";
                rowBg = "transparent";
              }
            } else if (isSelected) {
              checkBorder = "var(--test-accent)";
              checkBg = "var(--test-accent)";
              rowBg = "var(--test-hover-bg)";
            } else {
              checkBorder = "var(--test-border)";
              checkBg = "transparent";
              rowBg = "transparent";
            }

            return (
              <HStack
                key={opt.optionKey}
                gap={3}
                cursor={isOptionDisabled ? "default" : "pointer"}
                onClick={() => !isOptionDisabled && handleToggle(opt.optionKey)}
                px={3}
                py={2.5}
                borderRadius="md"
                bg={rowBg}
                opacity={isOptionDisabled && !showResults ? 0.5 : 1}
                _hover={
                  isOptionDisabled
                    ? {}
                    : { bg: isSelected ? rowBg : "var(--test-hover-bg)" }
                }
                transition="background 0.15s, opacity 0.15s"
                borderBottomWidth="1px"
                borderColor="var(--test-border)"
              >
                {/* checkbox */}
                <Box
                  w="20px"
                  h="20px"
                  borderWidth="2px"
                  borderRadius="4px"
                  borderColor={checkBorder}
                  bg={checkBg}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  transition="all 0.15s"
                  flexShrink={0}
                >
                  {isSelected && (
                    <Check size={13} color="var(--test-panel-bg, white)" strokeWidth={3} />
                  )}
                </Box>

                {/* label */}
                <Text lineHeight="tall">
                  {opt.optionKey} {opt.optionText}
                </Text>
              </HStack>
            );
          })}
      </VStack>
    </Box>
  );
}
