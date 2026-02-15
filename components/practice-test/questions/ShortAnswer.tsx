"use client";

import {
  Box,
  Heading,
  Text,
  Input,
  VStack,
  HStack,
  Circle,
} from "@chakra-ui/react";
import type { QuestionComponentProps } from "../types";
import { getQuestionRange } from "../types";

/**
 * SHORT_ANSWER — brief text input for each sub-question.
 */
export default function ShortAnswer({
  question,
  answers,
  onAnswer,
  disabled = false,
  showResults = false,
}: QuestionComponentProps) {
  const [startNum, endNum] = getQuestionRange(question);
  const subQuestions = question.questions ?? [];

  return (
    <Box>
      {startNum === endNum ? (
        <Heading size="md" mb={2}>
          Question {startNum}
        </Heading>
      ) : (
        <Heading size="md" mb={2}>
          Questions {startNum}-{endNum}
        </Heading>
      )}

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

      <VStack align="stretch" gap={4}>
        {subQuestions.map((sub) => {
          const qNum = sub.questionNumber ?? 0;
          const answer = answers[qNum] ?? "";
          const isCorrect =
            showResults &&
            answer.toLowerCase().trim() ===
              (sub.correctAnswer ?? "").toLowerCase().trim();
          const isWrong = showResults && answer && !isCorrect;

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
              <Box flex={1}>
                {sub.questionText && (
                  <Text fontSize="sm" mb={2}>
                    {sub.questionText}
                  </Text>
                )}
                <Input
                  size="sm"
                  maxWidth="300px"
                  borderColor={
                    isCorrect ? "green.500" : isWrong ? "red.500" : "gray.300"
                  }
                  bg={isCorrect ? "green.50" : isWrong ? "red.50" : "white"}
                  _dark={{
                    bg: isCorrect
                      ? "green.900"
                      : isWrong
                        ? "red.900"
                        : "gray.700",
                    borderColor: isCorrect
                      ? "green.400"
                      : isWrong
                        ? "red.400"
                        : "gray.600",
                  }}
                  value={answer}
                  onChange={(e) => onAnswer(qNum, e.target.value)}
                  disabled={disabled}
                  placeholder="Type your answer"
                />
              </Box>
            </HStack>
          );
        })}
      </VStack>
    </Box>
  );
}
