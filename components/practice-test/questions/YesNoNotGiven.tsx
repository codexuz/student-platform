"use client";

import { Box, Heading, Text, VStack, HStack, Circle } from "@chakra-ui/react";
import type { QuestionComponentProps } from "../types";
import { getQuestionRange } from "../types";

const OPTIONS = ["YES", "NO", "NOT GIVEN"] as const;

/**
 * YES_NO_NOT_GIVEN — same layout as TFNG but with Yes/No options.
 */
export default function YesNoNotGiven({
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
          Do the following statements agree with the views of the writer? Choose{" "}
          <strong>YES</strong> if the statement agrees with the views of the
          writer, choose <strong>NO</strong> if the statement contradicts the
          views of the writer, or choose <strong>NOT GIVEN</strong> if it is
          impossible to say what the writer thinks about this.
        </Text>
      )}

      <VStack align="stretch" gap={5}>
        {subQuestions.map((sub) => {
          const qNum = sub.questionNumber ?? 0;
          const selected = answers[qNum] ?? "";
          const isCorrect = showResults && selected === sub.correctAnswer;

          return (
            <Box key={qNum}>
              <HStack align="start" mb={3} gap={3}>
                <Circle
                  size="28px"
                  bg="red.50"
                  color="red.600"
                  _dark={{ bg: "red.900", color: "red.300" }}
                  fontSize="sm"
                  fontWeight="bold"
                  flexShrink={0}
                  mt="2px"
                >
                  {qNum}
                </Circle>
                <Box
                  fontSize="sm"
                  lineHeight="tall"
                  dangerouslySetInnerHTML={{ __html: sub.questionText ?? "" }}
                  css={{
                    "& p": { marginBottom: "0.25rem" },
                    "& strong": { fontWeight: "bold" },
                  }}
                />
              </HStack>

              <VStack align="stretch" gap={2} pl={10}>
                {OPTIONS.map((opt) => {
                  const isSelected = selected === opt;
                  const optCorrect = showResults && opt === sub.correctAnswer;
                  const optWrong = showResults && isSelected && !isCorrect;

                  return (
                    <HStack
                      key={opt}
                      gap={3}
                      cursor={disabled ? "default" : "pointer"}
                      onClick={() => !disabled && onAnswer(qNum, opt)}
                      p={2}
                      borderRadius="md"
                      bg={
                        optCorrect
                          ? "green.50"
                          : optWrong
                            ? "red.50"
                            : "transparent"
                      }
                      _dark={{
                        bg: optCorrect
                          ? "green.900"
                          : optWrong
                            ? "red.900"
                            : "transparent",
                      }}
                      _hover={
                        disabled
                          ? {}
                          : { bg: "gray.50", _dark: { bg: "gray.700" } }
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
                              : "red.500"
                            : "gray.300"
                        }
                        bg={
                          isSelected
                            ? showResults
                              ? isCorrect
                                ? "green.500"
                                : "red.500"
                              : "red.500"
                            : "transparent"
                        }
                        transition="all 0.15s"
                      >
                        {isSelected && <Circle size="8px" bg="white" />}
                      </Circle>
                      <Text
                        fontSize="sm"
                        fontWeight={isSelected ? "medium" : "normal"}
                      >
                        {opt}
                      </Text>
                    </HStack>
                  );
                })}
              </VStack>
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}
