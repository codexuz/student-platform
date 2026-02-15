"use client";

import { Box, Heading, Text, VStack, HStack, Circle } from "@chakra-ui/react";
import { Check } from "lucide-react";
import type { QuestionComponentProps } from "../types";
import { getQuestionRange } from "../types";

/**
 * MULTIPLE_ANSWER — multi-select checkboxes.
 * Answer stored as comma-separated option keys, e.g. "A,C,E".
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

  const toggleOption = (qNum: number, optKey: string) => {
    const current = answers[qNum] ?? "";
    const selected = current ? current.split(",") : [];
    const idx = selected.indexOf(optKey);
    if (idx >= 0) {
      selected.splice(idx, 1);
    } else {
      selected.push(optKey);
    }
    onAnswer(qNum, selected.sort().join(","));
  };

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
        <Text
          fontSize="sm"
          mb={4}
          color="gray.700"
          _dark={{ color: "gray.300" }}
        >
          {question.instruction}
        </Text>
      )}

      <VStack align="stretch" gap={6}>
        {subQuestions.length > 0 ? (
          subQuestions.map((sub) => {
            const qNum = sub.questionNumber ?? 0;
            const selectedKeys = (answers[qNum] ?? "")
              .split(",")
              .filter(Boolean);

            return (
              <Box key={qNum}>
                <HStack align="start" mb={3} gap={3}>
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
                  <Text fontSize="sm" lineHeight="tall">
                    {sub.questionText}
                  </Text>
                </HStack>

                <VStack align="stretch" gap={2} pl={10}>
                  {globalOptions
                    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                    .map((opt) => {
                      const isSelected = selectedKeys.includes(opt.optionKey);
                      const optCorrect = showResults && opt.isCorrect;
                      const optWrong =
                        showResults && isSelected && !opt.isCorrect;

                      return (
                        <HStack
                          key={opt.optionKey}
                          gap={3}
                          cursor={disabled ? "default" : "pointer"}
                          onClick={() =>
                            !disabled && toggleOption(qNum, opt.optionKey)
                          }
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
                          <Box
                            w="20px"
                            h="20px"
                            borderWidth="2px"
                            borderRadius="sm"
                            borderColor={
                              isSelected
                                ? showResults
                                  ? opt.isCorrect
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
                                  ? opt.isCorrect
                                    ? "green.500"
                                    : "red.500"
                                  : "blue.500"
                                : "transparent"
                            }
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            transition="all 0.15s"
                            flexShrink={0}
                          >
                            {isSelected && <Check size={12} color="white" />}
                          </Box>
                          <Text
                            fontSize="sm"
                            fontWeight={isSelected ? "medium" : "normal"}
                          >
                            {opt.optionText}
                          </Text>
                        </HStack>
                      );
                    })}
                </VStack>
              </Box>
            );
          })
        ) : (
          // Single question with multiple answers
          <Box>
            {question.questionText && (
              <Text fontSize="sm" fontWeight="medium" mb={3}>
                {question.questionText}
              </Text>
            )}
            <VStack align="stretch" gap={2}>
              {globalOptions
                .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                .map((opt) => {
                  const qNum = question.questionNumber ?? startNum;
                  const selectedKeys = (answers[qNum] ?? "")
                    .split(",")
                    .filter(Boolean);
                  const isSelected = selectedKeys.includes(opt.optionKey);

                  return (
                    <HStack
                      key={opt.optionKey}
                      gap={3}
                      cursor={disabled ? "default" : "pointer"}
                      onClick={() =>
                        !disabled && toggleOption(qNum, opt.optionKey)
                      }
                      p={2}
                      borderRadius="md"
                      _hover={
                        disabled
                          ? {}
                          : { bg: "gray.50", _dark: { bg: "gray.700" } }
                      }
                      transition="background 0.15s"
                    >
                      <Box
                        w="20px"
                        h="20px"
                        borderWidth="2px"
                        borderRadius="sm"
                        borderColor={isSelected ? "blue.500" : "gray.300"}
                        bg={isSelected ? "blue.500" : "transparent"}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        transition="all 0.15s"
                        flexShrink={0}
                      >
                        {isSelected && <Check size={12} color="white" />}
                      </Box>
                      <Text fontSize="sm">{opt.optionText}</Text>
                    </HStack>
                  );
                })}
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
