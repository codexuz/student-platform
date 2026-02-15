"use client";

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  NativeSelect,
  Circle,
} from "@chakra-ui/react";
import type { QuestionComponentProps } from "../types";
import { getQuestionRange } from "../types";

/**
 * MATCHING_SENTENCE_ENDINGS — match sentence beginnings to endings.
 * Each sub-question selects a sentence ending from the options list.
 */
export default function MatchingSentenceEndings({
  question,
  answers,
  onAnswer,
  disabled: _d = false,
  showResults = false,
}: QuestionComponentProps) {
  void _d; // used in NativeSelect.Root
  const [startNum, endNum] = getQuestionRange(question);
  const subQuestions = question.questions ?? [];
  const options = question.options ?? [];
  const sortedOptions = [...options].sort(
    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
  );

  return (
    <Box>
      <Heading size="md" mb={2}>
        Questions {startNum}-{endNum}
      </Heading>

      {question.instruction && (
        <Box
          fontSize="sm"
          mb={4}
          color="gray.700"
          _dark={{ color: "gray.300" }}
          dangerouslySetInnerHTML={{ __html: question.instruction }}
          css={{
            "& p": { marginBottom: "0.25rem" },
            "& strong": { fontWeight: "bold" },
          }}
        />
      )}

      {/* Sentence endings list */}
      {sortedOptions.length > 0 && (
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
            Sentence Endings
          </Text>
          <VStack align="stretch" gap={1}>
            {sortedOptions.map((opt) => (
              <Text key={opt.optionKey} fontSize="sm">
                <strong>{opt.optionKey}</strong> &nbsp; {opt.optionText}
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
            <HStack key={qNum} align="start" gap={3}>
              <Circle
                size="28px"
                bg="blue.50"
                color="blue.700"
                _dark={{ bg: "blue.900", color: "blue.300" }}
                fontSize="sm"
                fontWeight="bold"
                flexShrink={0}
                mt="2px"
              >
                {qNum}
              </Circle>
              <Text fontSize="sm" flex={1} lineHeight="tall">
                {sub.questionText}
              </Text>
              <NativeSelect.Root size="sm" width="80px" flexShrink={0}>
                <NativeSelect.Field
                  value={selected}
                  onChange={(e) => onAnswer(qNum, e.target.value)}
                  _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
                  borderColor={
                    isCorrect ? "green.500" : isWrong ? "red.500" : undefined
                  }
                >
                  <option value="">—</option>
                  {sortedOptions.map((opt) => (
                    <option key={opt.optionKey} value={opt.optionKey}>
                      {opt.optionKey}
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
