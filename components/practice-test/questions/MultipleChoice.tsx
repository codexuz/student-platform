"use client";

import { Box, Heading, Text, VStack, HStack, Circle } from "@chakra-ui/react";
import type { QuestionComponentProps } from "../types";
import { getQuestionRange } from "../types";

/**
 * MULTIPLE_CHOICE — single-select radio buttons (e.g., Questions 37-38).
 * Each sub-question has a set of options (A, B, C, D).
 */
export default function MultipleChoice({
  question,
  answers,
  onAnswer,
  disabled = false,
  showResults = false,
}: QuestionComponentProps) {
  const [startNum, endNum] = getQuestionRange(question);
  const subQuestions = question.questions ?? [];
  const globalOptions = question.options ?? [];

  return (
    <Box>
      {/* Group header */}
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
          mb={4}
          dangerouslySetInnerHTML={{ __html: question.instruction }}
          css={{
            "& p": { marginBottom: "0.25rem" },
            "& strong": { fontWeight: "bold" },
          }}
        />
      )}

      <VStack align="stretch" gap={6}>
        {subQuestions.length > 0 ? (
          subQuestions.map((sub) => {
            const qNum = sub.questionNumber ?? 0;
            const selected = answers[qNum] ?? "";

            return (
              <SingleQuestion
                key={qNum}
                questionNumber={qNum}
                questionText={sub.questionText ?? ""}
                options={globalOptions}
                selected={selected}
                correctAnswer={sub.correctAnswer ?? ""}
                onAnswer={onAnswer}
                disabled={disabled}
                showResults={showResults}
              />
            );
          })
        ) : (
          // No sub-questions — treat the group itself as a single question
          <SingleQuestion
            questionNumber={question.questionNumber ?? startNum}
            questionText={question.questionText ?? ""}
            options={globalOptions}
            selected={answers[question.questionNumber ?? startNum] ?? ""}
            correctAnswer=""
            onAnswer={onAnswer}
            disabled={disabled}
            showResults={showResults}
          />
        )}
      </VStack>
    </Box>
  );
}

function SingleQuestion({
  questionNumber,
  questionText,
  options,
  selected,
  correctAnswer,
  onAnswer,
  disabled,
  showResults,
}: {
  questionNumber: number;
  questionText: string;
  options: QuestionComponentProps["question"]["options"];
  selected: string;
  correctAnswer: string;
  onAnswer: (qn: number, val: string) => void;
  disabled: boolean;
  showResults: boolean;
}) {
  const isCorrect = showResults && selected === correctAnswer;
  const sortedOptions = [...(options ?? [])].sort(
    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
  );

  return (
    <Box>
      {/* Question text */}
      <HStack align="start" mb={3} gap={3}>
        <Circle
          size="28px"
          bg="var(--test-hover-bg)"
          color="red.600"
          fontWeight="bold"
          flexShrink={0}
          mt="2px"
        >
          {questionNumber}
        </Circle>
        <Box
          lineHeight="tall"
          dangerouslySetInnerHTML={{ __html: questionText }}
          css={{
            "& p": { marginBottom: "0.25rem" },
            "& strong": { fontWeight: "bold" },
          }}
        />
      </HStack>

      {/* Options */}
      <VStack align="stretch" gap={2} pl={10}>
        {sortedOptions.map((opt) => {
          const optValue = opt.optionKey;
          const isSelected = selected === optValue;
          const optCorrect = showResults && opt.isCorrect;
          const optWrong = showResults && isSelected && !isCorrect;

          return (
            <HStack
              key={optValue}
              gap={3}
              cursor={disabled ? "default" : "pointer"}
              onClick={() => !disabled && onAnswer(questionNumber, optValue)}
              p={2}
              borderRadius="md"
              bg={optCorrect ? "var(--test-correct-bg)" : optWrong ? "var(--test-wrong-bg)" : "var(--test-input-bg)"}
              _hover={
                disabled ? {} : { bg: "var(--test-hover-bg)" }
              }
              transition="background 0.15s"
            >
              <Circle
                size="20px"
                borderWidth="2px"
                borderColor={
                  isSelected
                    ? showResults
                      ? isCorrect
                        ? "green.500"
                        : "red.500"
                      : "blue.500"
                    : optCorrect
                      ? "green.500"
                      : "gray.300"
                }
                bg={
                  isSelected
                    ? showResults
                      ? isCorrect
                        ? "green.500"
                        : "red.500"
                      : "blue.500"
                    : "transparent"
                }
                transition="all 0.15s"
              >
                {isSelected && <Circle size="8px" bg="var(--test-panel-bg, white)" />}
              </Circle>
              <Text fontWeight={isSelected ? "medium" : "normal"}>
                {opt.optionText}
              </Text>
            </HStack>
          );
        })}
      </VStack>
    </Box>
  );
}
