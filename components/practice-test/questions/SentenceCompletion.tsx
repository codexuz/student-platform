"use client";

import { Box, Heading, Text, Input, VStack, HStack } from "@chakra-ui/react";
import type { QuestionComponentProps } from "../types";
import { BLANK_PATTERN, getQuestionRange } from "../types";

/**
 * SENTENCE_COMPLETION — fill blanks within sentences (e.g., Questions 18-22).
 * Each sub-question is a full sentence with one blank to fill.
 */
export default function SentenceCompletion({
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

      <VStack align="stretch" gap={4}>
        {subQuestions.map((sub) => {
          const qNum = sub.questionNumber ?? 0;
          const answer = answers[qNum] ?? "";
          const text = sub.questionText ?? "";
          const isCorrect =
            showResults &&
            answer.toLowerCase().trim() ===
              (sub.correctAnswer ?? "").toLowerCase().trim();
          const isWrong = showResults && !!answer && !isCorrect;

          return (
            <HStack
              key={qNum}
              align="baseline"
              flexWrap="wrap"
              gap={0}
              fontSize="sm"
              lineHeight="2"
            >
              {renderSentenceWithBlank(
                text,
                qNum,
                answer,
                onAnswer,
                disabled,
                !!isCorrect,
                isWrong,
              )}
            </HStack>
          );
        })}
      </VStack>
    </Box>
  );
}

function renderSentenceWithBlank(
  text: string,
  questionNumber: number,
  answer: string,
  onAnswer: (qNum: number, val: string) => void,
  disabled: boolean,
  isCorrect: boolean,
  isWrong: boolean,
) {
  const match = BLANK_PATTERN.exec(text);
  BLANK_PATTERN.lastIndex = 0;

  const inputEl = (
    <Input
      size="xs"
      width="120px"
      display="inline-block"
      mx={1}
      textAlign="center"
      borderWidth="1px"
      borderColor={isCorrect ? "green.500" : isWrong ? "red.500" : "gray.300"}
      borderRadius="md"
      bg={isCorrect ? "green.50" : isWrong ? "red.50" : "white"}
      _dark={{
        bg: isCorrect ? "green.900" : isWrong ? "red.900" : "gray.700",
        borderColor: isCorrect ? "green.400" : isWrong ? "red.400" : "gray.600",
      }}
      placeholder={String(questionNumber)}
      value={answer}
      onChange={(e) => onAnswer(questionNumber, e.target.value)}
      disabled={disabled}
      fontWeight="medium"
      verticalAlign="baseline"
    />
  );

  if (match) {
    const before = text.slice(0, match.index);
    const after = text.slice(match.index + match[0].length);
    return (
      <>
        <Text as="span">{before}</Text>
        {inputEl}
        <Text as="span">{after}</Text>
      </>
    );
  }

  return (
    <>
      <Text as="span">{text} </Text>
      {inputEl}
    </>
  );
}
