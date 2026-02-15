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
          fontSize="sm"
          mb={3}
          color="gray.700"
          _dark={{ color: "gray.300" }}
          dangerouslySetInnerHTML={{ __html: question.instruction }}
          css={{
            "& p": { marginBottom: "0.25rem" },
            "& strong": { fontWeight: "bold" },
          }}
        />
      )}

      {questionText && (
        <Text fontSize="sm" mb={3} lineHeight="tall" fontWeight="medium">
          {questionText}
        </Text>
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
            let rowBgDark: string;

            if (showResults) {
              if (optCorrect) {
                checkBorder = "#16a34a";
                checkBg = isSelected ? "#16a34a" : "transparent";
                rowBg = "#dcfce7";
                rowBgDark = "green.900";
              } else if (isSelected) {
                checkBorder = "#b91c1c";
                checkBg = "#b91c1c";
                rowBg = "#fee2e2";
                rowBgDark = "red.900";
              } else {
                checkBorder = "#9ca3af";
                checkBg = "transparent";
                rowBg = "transparent";
                rowBgDark = "transparent";
              }
            } else if (isSelected) {
              checkBorder = "#b91c1c";
              checkBg = "#b91c1c";
              rowBg = "#fee2e2";
              rowBgDark = "red.900";
            } else {
              checkBorder = "#9ca3af";
              checkBg = "transparent";
              rowBg = "transparent";
              rowBgDark = "transparent";
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
                _dark={{ bg: rowBgDark, borderColor: "gray.700" }}
                _hover={
                  isOptionDisabled
                    ? {}
                    : {
                        bg: isSelected ? rowBg : "#f3f4f6",
                        _dark: {
                          bg: isSelected ? rowBgDark : "gray.700",
                        },
                      }
                }
                transition="background 0.15s, opacity 0.15s"
                borderBottomWidth="1px"
                borderColor="gray.100"
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
                    <Check size={13} color="white" strokeWidth={3} />
                  )}
                </Box>

                {/* label */}
                <Text fontSize="sm" lineHeight="tall">
                  {opt.optionText || opt.optionKey}
                </Text>
              </HStack>
            );
          })}
      </VStack>
    </Box>
  );
}
