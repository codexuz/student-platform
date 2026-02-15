"use client";

import { Box, Heading, Text, Circle, Table } from "@chakra-ui/react";
import type { QuestionComponentProps } from "../types";
import { getQuestionRange } from "../types";

/**
 * MATCHING_INFORMATION — grid-based matching (e.g., Questions 14-17).
 * Rows = sub-questions, Columns = paragraph labels A-F.
 * User selects one paragraph per question.
 */
export default function MatchingInformation({
  question,
  answers,
  onAnswer,
  disabled = false,
  showResults = false,
}: QuestionComponentProps) {
  const [startNum, endNum] = getQuestionRange(question);
  const subQuestions = question.questions ?? [];

  // Derive column headers from options or headingOptions
  const columnLabels = deriveColumnLabels(question);

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

      <Box overflowX="auto">
        <Table.Root size="sm" variant="outline">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader
                width="50%"
                bg="gray.50"
                _dark={{ bg: "gray.700" }}
              />
              {columnLabels.map((label) => (
                <Table.ColumnHeader
                  key={label}
                  textAlign="center"
                  fontWeight="bold"
                  bg="gray.50"
                  _dark={{ bg: "gray.700" }}
                  px={3}
                >
                  {label}
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {subQuestions.map((sub) => {
              const qNum = sub.questionNumber ?? 0;
              const selected = answers[qNum] ?? "";
              const isCorrect = showResults && selected === sub.correctAnswer;

              return (
                <Table.Row key={qNum}>
                  <Table.Cell>
                    <Box display="flex" alignItems="start" gap={2}>
                      <Text
                        fontWeight="bold"
                        color="blue.600"
                        _dark={{ color: "blue.400" }}
                        flexShrink={0}
                      >
                        {qNum}.
                      </Text>
                      <Text fontSize="sm">{sub.questionText}</Text>
                    </Box>
                  </Table.Cell>

                  {columnLabels.map((label) => {
                    const isSelected = selected === label;
                    const optCorrect =
                      showResults && label === sub.correctAnswer;
                    // optWrong available for future result styling

                    return (
                      <Table.Cell key={label} textAlign="center">
                        <Circle
                          size="22px"
                          mx="auto"
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
                              : optCorrect
                                ? "green.100"
                                : "transparent"
                          }
                          cursor={disabled ? "default" : "pointer"}
                          onClick={() => !disabled && onAnswer(qNum, label)}
                          _hover={disabled ? {} : { borderColor: "blue.400" }}
                          transition="all 0.15s"
                        >
                          {isSelected && <Circle size="8px" bg="white" />}
                        </Circle>
                      </Table.Cell>
                    );
                  })}
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  );
}

function deriveColumnLabels(
  question: QuestionComponentProps["question"],
): string[] {
  // From options array
  if (question.options?.length) {
    return question.options
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      .map((o) => o.optionKey);
  }

  // From headingOptions
  if (question.headingOptions) {
    return Object.keys(question.headingOptions).sort();
  }

  // Default A-F
  return ["A", "B", "C", "D", "E", "F"];
}
