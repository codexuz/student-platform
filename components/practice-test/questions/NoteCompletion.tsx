"use client";

import { useMemo } from "react";
import { Box, Heading, Input } from "@chakra-ui/react";
import type { QuestionComponentProps } from "../types";
import { getQuestionRange } from "../types";

/**
 * Regex that matches blanks in text content.
 */
const BLANK_RE = /_{3,}(?:\u00a0)?|\{blank\}|\{answer\}|\[blank\]/gi;

/**
 * Strip HTML tags, decode common entities, and split into logical lines.
 * Each <li> or <p> becomes its own line.
 */
function htmlToLines(html: string): string[] {
  // Insert a line-break marker at block boundaries
  let s = html.replace(/<\/li>/gi, "\n");
  s = s.replace(/<\/p>/gi, "\n");
  s = s.replace(/<br\s*\/?>/gi, "\n");

  // Strip block-level tags but KEEP inline formatting and heading tags
  s = s.replace(/<(?!\/?(strong|b|em|i|h[1-6])\b)[^>]+>/gi, "");

  // Decode &nbsp; to space (keep other entities — they render fine in HTML)
  s = s.replace(/&nbsp;/gi, " ");

  // Split into lines, trim each, drop empty
  return s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/**
 * NOTE_COMPLETION — structured notes with inline blanks.
 *
 * Rendering strategy:
 *  1. Convert HTML questionText into plain-text lines.
 *  2. For each line, split on blank markers.
 *  3. Interleave React <Input> elements mapped to sub-question numbers.
 */
export default function NoteCompletion({
  question,
  answers,
  onAnswer,
  disabled = false,
  showResults = false,
}: QuestionComponentProps) {
  const [startNum, endNum] = getQuestionRange(question);
  const subQuestions = useMemo(
    () => question.questions ?? [],
    [question.questions],
  );

  // Ordered question numbers for each blank slot
  const orderedNums = useMemo(
    () =>
      [...subQuestions]
        .sort(
          (a, b) =>
            (a.order ?? a.questionNumber ?? 0) -
            (b.order ?? b.questionNumber ?? 0),
        )
        .map((s) => s.questionNumber ?? 0),
    [subQuestions],
  );

  // Build a lookup: questionNumber → correctAnswer
  const correctMap = useMemo(() => {
    const m: Record<number, string> = {};
    for (const s of subQuestions) {
      if (s.questionNumber != null) m[s.questionNumber] = s.correctAnswer ?? "";
    }
    return m;
  }, [subQuestions]);

  // Parse HTML into plain-text lines
  const htmlContent = question.questionText ?? "";
  const lines = useMemo(() => htmlToLines(htmlContent), [htmlContent]);

  // Pre-compute a global blank index → question number mapping.
  // Each line may have 0, 1, or more blanks; we walk through lines
  // sequentially to assign question numbers.
  const linesWithSegments = useMemo(() => {
    let globalBlankIdx = 0;
    return lines.map((line) => {
      const parts = line.split(BLANK_RE);
      const blankCount = parts.length - 1;
      const qNums: number[] = [];
      for (let i = 0; i < blankCount; i++) {
        qNums.push(orderedNums[globalBlankIdx] ?? 0);
        globalBlankIdx++;
      }
      return { parts, qNums };
    });
  }, [lines, orderedNums]);

  return (
    <Box>
      {/* Section header */}
      <Heading size="md" mb={2}>
        Questions {startNum}-{endNum}
      </Heading>

      {/* Instruction (rendered as HTML) */}
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
            "& h1": {
              fontSize: "1.5em",
              fontWeight: "bold",
              marginBottom: "0.5rem",
            },
            "& h2": {
              fontSize: "1.25em",
              fontWeight: "bold",
              marginBottom: "0.5rem",
            },
            "& h3": {
              fontSize: "1.1em",
              fontWeight: "bold",
              marginBottom: "0.25rem",
            },
            "& h4": {
              fontSize: "1em",
              fontWeight: "bold",
              marginBottom: "0.25rem",
            },
            "& h5": {
              fontSize: "0.9em",
              fontWeight: "bold",
              marginBottom: "0.25rem",
            },
            "& h6": {
              fontSize: "0.85em",
              fontWeight: "bold",
              marginBottom: "0.25rem",
            },
          }}
        />
      )}

      {/* Lines of notes with inline inputs */}
      <Box
        display="flex"
        flexDirection="column"
        gap={1}
        css={{
          "& h1": {
            fontSize: "1.5em",
            fontWeight: "bold",
            marginBottom: "0.25rem",
            display: "block",
            width: "100%",
          },
          "& h2": {
            fontSize: "1.25em",
            fontWeight: "bold",
            marginBottom: "0.25rem",
            display: "block",
            width: "100%",
          },
          "& h3": {
            fontSize: "1.1em",
            fontWeight: "bold",
            marginBottom: "0.15rem",
            display: "block",
            width: "100%",
          },
          "& h4": {
            fontSize: "1em",
            fontWeight: "bold",
            marginBottom: "0.15rem",
            display: "block",
            width: "100%",
          },
          "& h5": {
            fontSize: "0.9em",
            fontWeight: "bold",
            marginBottom: "0.15rem",
            display: "block",
            width: "100%",
          },
          "& h6": {
            fontSize: "0.85em",
            fontWeight: "bold",
            marginBottom: "0.15rem",
            display: "block",
            width: "100%",
          },
        }}
      >
        {linesWithSegments.map(({ parts, qNums }, lineIdx) => (
          <Box
            key={lineIdx}
            fontSize="sm"
            lineHeight="2.4"
            color="gray.800"
            _dark={{ color: "gray.200" }}
          >
            {parts.map((textPart, partIdx) => (
              <span key={partIdx}>
                {/* Inline input before this text segment (except for first) */}
                {partIdx > 0 && (
                  <BlankInput
                    questionNumber={qNums[partIdx - 1]}
                    answer={answers[qNums[partIdx - 1]] ?? ""}
                    correctAnswer={correctMap[qNums[partIdx - 1]] ?? ""}
                    onAnswer={onAnswer}
                    disabled={disabled}
                    showResults={showResults}
                  />
                )}
                <span dangerouslySetInnerHTML={{ __html: textPart }} />
              </span>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ─── Inline blank input ────────────────────────────────────────────────────

function BlankInput({
  questionNumber,
  answer,
  correctAnswer,
  onAnswer,
  disabled,
  showResults,
}: {
  questionNumber: number;
  answer: string;
  correctAnswer: string;
  onAnswer: (qNum: number, val: string) => void;
  disabled: boolean;
  showResults: boolean;
}) {
  const isCorrect =
    showResults &&
    answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
  const isWrong = showResults && !!answer && !isCorrect;

  return (
    <Input
      size="xs"
      width="100px"
      height="28px"
      display="inline-block"
      mx={1}
      textAlign="center"
      borderWidth="1px"
      borderColor={
        showResults
          ? isCorrect
            ? "green.500"
            : isWrong
              ? "red.500"
              : "gray.300"
          : "gray.300"
      }
      borderRadius="md"
      bg={
        showResults
          ? isCorrect
            ? "green.50"
            : isWrong
              ? "red.50"
              : "white"
          : "white"
      }
      _dark={{
        bg: showResults
          ? isCorrect
            ? "green.900"
            : isWrong
              ? "red.900"
              : "gray.700"
          : "gray.700",
        borderColor: showResults
          ? isCorrect
            ? "green.400"
            : isWrong
              ? "red.400"
              : "gray.600"
          : "gray.600",
      }}
      placeholder={String(questionNumber)}
      value={answer}
      onChange={(e) => onAnswer(questionNumber, e.target.value)}
      disabled={disabled}
      fontWeight="medium"
      verticalAlign="middle"
      fontSize="sm"
    />
  );
}
