"use client";

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  NativeSelect,
} from "@chakra-ui/react";
import type { QuestionComponentProps } from "../types";
import { getQuestionRange } from "../types";

/**
 * MATCHING_HEADINGS — select a heading for each paragraph/section.
 * Uses dropdown selects.
 */
export default function MatchingHeadings({
  question,
  answers,
  onAnswer,
  disabled: _d = false,
  showResults = false,
}: QuestionComponentProps) {
  void _d; // used in NativeSelect.Root
  const [startNum, endNum] = getQuestionRange(question);
  const subQuestions = question.questions ?? [];

  // Headings from headingOptions or options
  const headings = deriveHeadings(question);

  return (
    <Box>
      <Heading size="md" mb={2}>
        Questions {startNum}-{endNum}
      </Heading>

      {question.instruction && (
        <Text
          fontSize="sm"
          mb={4}
          color="gray.700"
          _dark={{ color: "gray.300" }}
        >
          {question.instruction}
        </Text>
      )}

      {/* Heading list */}
      {headings.length > 0 && (
        <Box
          mb={4}
          p={3}
          bg="gray.50"
          _dark={{ bg: "gray.700" }}
          borderRadius="md"
        >
          <Text
            fontSize="xs"
            fontWeight="bold"
            mb={2}
            textTransform="uppercase"
            color="gray.500"
          >
            List of Headings
          </Text>
          <VStack align="stretch" gap={1}>
            {headings.map(([key, text]) => (
              <Text key={key} fontSize="sm">
                <strong>{key}</strong> &nbsp; {text}
              </Text>
            ))}
          </VStack>
        </Box>
      )}

      <VStack align="stretch" gap={3}>
        {subQuestions.map((sub) => {
          const qNum = sub.questionNumber ?? 0;
          const selected = answers[qNum] ?? "";
          const isCorrect = showResults && selected === sub.correctAnswer;
          const isWrong = showResults && selected && !isCorrect;

          return (
            <HStack key={qNum} align="center" gap={3}>
              <Text
                fontWeight="bold"
                color="blue.600"
                _dark={{ color: "blue.400" }}
                flexShrink={0}
              >
                {qNum}.
              </Text>
              <Text fontSize="sm" flex={1}>
                {sub.questionText}
              </Text>
              <NativeSelect.Root size="sm" width="100px" flexShrink={0}>
                <NativeSelect.Field
                  value={selected}
                  onChange={(e) => onAnswer(qNum, e.target.value)}
                  _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
                  borderColor={
                    showResults
                      ? isCorrect
                        ? "green.500"
                        : isWrong
                          ? "red.500"
                          : "gray.300"
                      : "gray.300"
                  }
                >
                  <option value="">—</option>
                  {headings.map(([key]) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </HStack>
          );
        })}
      </VStack>
    </Box>
  );
}

function deriveHeadings(
  question: QuestionComponentProps["question"],
): [string, string][] {
  if (question.headingOptions) {
    return Object.entries(question.headingOptions).sort(([a], [b]) =>
      a.localeCompare(b),
    );
  }
  if (question.options?.length) {
    return question.options
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      .map((o) => [o.optionKey, o.optionText] as [string, string]);
  }
  return [];
}
