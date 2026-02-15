"use client";

import { Box, Heading, Text, Input, Table } from "@chakra-ui/react";
import type { QuestionComponentProps } from "../types";
import { BLANK_PATTERN, getQuestionRange } from "../types";

/**
 * TABLE_COMPLETION — fill blanks within a table structure.
 * Uses tableData from the question, or falls back to sub-questions.
 */
export default function TableCompletion({
  question,
  answers,
  onAnswer,
  disabled = false,
  showResults = false,
}: QuestionComponentProps) {
  const [startNum, endNum] = getQuestionRange(question);
  const subQuestions = question.questions ?? [];
  const tableData = question.tableData;

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

      {tableData ? (
        <TableFromData
          tableData={tableData}
          subQuestions={subQuestions}
          answers={answers}
          onAnswer={onAnswer}
          disabled={disabled}
          showResults={showResults}
        />
      ) : (
        <FallbackList
          subQuestions={subQuestions}
          answers={answers}
          onAnswer={onAnswer}
          disabled={disabled}
          showResults={showResults}
        />
      )}
    </Box>
  );
}

// Render a table from tableData with blanks
function TableFromData({
  tableData,
  subQuestions,
  answers,
  onAnswer,
  disabled,
  showResults,
}: {
  tableData: { headers: string[]; rows: string[][] };
  subQuestions: QuestionComponentProps["question"]["questions"];
  answers: QuestionComponentProps["answers"];
  onAnswer: QuestionComponentProps["onAnswer"];
  disabled: boolean;
  showResults: boolean;
}) {
  // Map sub-questions by their number for lookup
  const subMap = new Map(
    (subQuestions ?? []).map((s) => [s.questionNumber ?? 0, s]),
  );

  // Track which question number we're on as we encounter blanks
  let blankCounter = 0;
  const allNums = (subQuestions ?? [])
    .map((s) => s.questionNumber ?? 0)
    .sort((a, b) => a - b);

  return (
    <Box overflowX="auto">
      <Table.Root size="sm" variant="outline">
        <Table.Header>
          <Table.Row>
            {tableData.headers.map((h, i) => (
              <Table.ColumnHeader
                key={i}
                bg="gray.50"
                _dark={{ bg: "gray.700" }}
              >
                {h}
              </Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {tableData.rows.map((row, ri) => (
            <Table.Row key={ri}>
              {row.map((cell, ci) => {
                const hasBlank = BLANK_PATTERN.test(cell);
                BLANK_PATTERN.lastIndex = 0;

                if (hasBlank && blankCounter < allNums.length) {
                  const qNum = allNums[blankCounter];
                  blankCounter++;
                  const answer = answers[qNum] ?? "";
                  const sub = subMap.get(qNum);
                  const isCorrect =
                    showResults &&
                    answer.toLowerCase().trim() ===
                      (sub?.correctAnswer ?? "").toLowerCase().trim();
                  const isWrong = showResults && !!answer && !isCorrect;

                  return (
                    <Table.Cell key={ci}>
                      {renderCellWithBlank(
                        cell,
                        qNum,
                        answer,
                        onAnswer,
                        disabled,
                        !!isCorrect,
                        isWrong,
                      )}
                    </Table.Cell>
                  );
                }

                return (
                  <Table.Cell key={ci}>
                    <Text fontSize="sm">{cell}</Text>
                  </Table.Cell>
                );
              })}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

// Fallback: render sub-questions as simple inputs
function FallbackList({
  subQuestions,
  answers,
  onAnswer,
  disabled,
  showResults,
}: {
  subQuestions: QuestionComponentProps["question"]["questions"];
  answers: QuestionComponentProps["answers"];
  onAnswer: QuestionComponentProps["onAnswer"];
  disabled: boolean;
  showResults: boolean;
}) {
  return (
    <Box>
      {(subQuestions ?? []).map((sub) => {
        const qNum = sub.questionNumber ?? 0;
        const answer = answers[qNum] ?? "";
        const text = sub.questionText ?? "";
        const isCorrect =
          showResults &&
          answer.toLowerCase().trim() ===
            (sub.correctAnswer ?? "").toLowerCase().trim();
        const isWrong = showResults && !!answer && !isCorrect;

        return (
          <Box
            key={qNum}
            mb={3}
            display="flex"
            alignItems="baseline"
            flexWrap="wrap"
            gap={1}
            fontSize="sm"
          >
            <Text as="span" fontWeight="bold" color="blue.600" mr={1}>
              {qNum}.
            </Text>
            {renderCellWithBlank(
              text,
              qNum,
              answer,
              onAnswer,
              disabled,
              !!isCorrect,
              isWrong,
            )}
          </Box>
        );
      })}
    </Box>
  );
}

function renderCellWithBlank(
  text: string,
  qNum: number,
  answer: string,
  onAnswer: (qn: number, val: string) => void,
  disabled: boolean,
  isCorrect: boolean,
  isWrong: boolean,
) {
  const match = BLANK_PATTERN.exec(text);
  BLANK_PATTERN.lastIndex = 0;

  const input = (
    <Input
      size="xs"
      width="110px"
      display="inline-block"
      mx={1}
      textAlign="center"
      borderColor={isCorrect ? "green.500" : isWrong ? "red.500" : "gray.300"}
      bg={isCorrect ? "green.50" : isWrong ? "red.50" : "white"}
      _dark={{
        bg: isCorrect ? "green.900" : isWrong ? "red.900" : "gray.700",
        borderColor: isCorrect ? "green.400" : isWrong ? "red.400" : "gray.600",
      }}
      placeholder={String(qNum)}
      value={answer}
      onChange={(e) => onAnswer(qNum, e.target.value)}
      disabled={disabled}
      verticalAlign="baseline"
    />
  );

  if (match) {
    const before = text.slice(0, match.index);
    const after = text.slice(match.index + match[0].length);
    return (
      <>
        <Text as="span" fontSize="sm">
          {before}
        </Text>
        {input}
        <Text as="span" fontSize="sm">
          {after}
        </Text>
      </>
    );
  }

  return (
    <>
      <Text as="span" fontSize="sm">
        {text}{" "}
      </Text>
      {input}
    </>
  );
}
