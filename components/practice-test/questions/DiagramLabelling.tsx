"use client";

import { useState, useRef, useCallback } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Circle,
  Image,
} from "@chakra-ui/react";
import type { QuestionComponentProps } from "../types";
import { getQuestionRange } from "../types";

/**
 * DIAGRAM_LABELLING — label a diagram with short text answers.
 *
 * The questionText HTML contains an <img> (the diagram) and a <ul> list
 * of gap-fill sentences (blanks shown as ______).  Each sub-question maps
 * to one gap.  The student types a short answer for each.
 */
export default function DiagramLabelling({
  question,
  answers,
  onAnswer,
  disabled = false,
  showResults = false,
}: QuestionComponentProps) {
  const [startNum, endNum] = getQuestionRange(question);
  const subQuestions = question.questions ?? [];

  /* ── image resize via drag handle (reused from PlanMapLabelling) ── */
  const containerRef = useRef<HTMLDivElement>(null);
  const imgPanelRef = useRef<HTMLDivElement>(null);
  const [imgWidth, setImgWidth] = useState<number | null>(null); // null = 45%
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      const panelW = imgPanelRef.current?.offsetWidth ?? 300;
      dragRef.current = {
        startX: e.clientX,
        startWidth: imgWidth ?? panelW,
      };
      setIsDragging(true);
    },
    [imgWidth],
  );

  const onHandlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const maxW = containerRef.current?.parentElement?.offsetWidth ?? 900;
    const newW = Math.min(Math.max(dragRef.current.startWidth + dx, 200), maxW);
    setImgWidth(newW);
  }, []);

  const onHandlePointerUp = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  /* ── extract image src from questionText HTML ── */
  const imgMatch = question.questionText?.match(/<img[^>]+src="([^"]+)"/);
  const imageSrc = imgMatch?.[1] ?? null;

  /* ── extract gap-fill sentences from <li> tags ── */
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  const rawHtml = question.questionText ?? "";
  const gapSentences: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = liRegex.exec(rawHtml)) !== null) {
    // strip nested tags but keep text
    const text = m[1].replace(/<[^>]*>/g, "").trim();
    if (text) gapSentences.push(text);
  }

  return (
    <Box>
      {/* Header */}
      {startNum === endNum ? (
        <Heading size="md" mb={2} fontWeight="bold">
          Question {startNum}
        </Heading>
      ) : (
        <Heading size="md" mb={2} fontWeight="bold">
          Questions {startNum}-{endNum}
        </Heading>
      )}

      {/* Instruction */}
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
            "& em": { fontStyle: "italic" },
          }}
        />
      )}

      {/* Split view: image left, questions right */}
      <HStack
        align="start"
        gap={4}
        ref={containerRef}
        flexWrap={{ base: "wrap", md: "nowrap" }}
      >
        {/* ─── Left: Diagram image ─── */}
        {imageSrc && (
          <Box
            ref={imgPanelRef}
            position="relative"
            flexShrink={0}
            width={imgWidth ? `${imgWidth}px` : "45%"}
            minW="200px"
            maxW="100%"
            transition={isDragging ? "none" : "width 0.15s ease"}
          >
            <Box
              borderRadius="lg"
              overflow="hidden"
              borderWidth="1px"
              borderColor="gray.200"
              _dark={{ borderColor: "gray.600" }}
              bg="white"
            >
              <Image
                src={imageSrc}
                alt="Diagram"
                width="100%"
                objectFit="contain"
                display="block"
                userSelect="none"
                draggable={false}
              />
            </Box>

            {/* Resize handle */}
            <Box
              position="absolute"
              bottom="0"
              right="-10px"
              top="0"
              width="20px"
              cursor="ew-resize"
              display="flex"
              alignItems="center"
              justifyContent="center"
              onPointerDown={onHandlePointerDown}
              onPointerMove={onHandlePointerMove}
              onPointerUp={onHandlePointerUp}
              onPointerCancel={onHandlePointerUp}
              touchAction="none"
              userSelect="none"
              zIndex={1}
            >
              <Box
                width="4px"
                height="40px"
                borderRadius="full"
                bg="gray.300"
                _dark={{ bg: "gray.500" }}
                _hover={{ bg: "blue.400", _dark: { bg: "blue.400" } }}
                transition="background 0.15s"
              />
            </Box>
          </Box>
        )}

        {/* ─── Right: Gap-fill questions ─── */}
        <Box flex={1} minW="0">
          <VStack align="stretch" gap={4}>
            {subQuestions.map((sub, idx) => {
              const qNum = sub.questionNumber ?? 0;
              const answer = answers[qNum] ?? "";
              const correctNorm = (sub.correctAnswer ?? "")
                .toLowerCase()
                .trim();
              const answerNorm = answer.toLowerCase().trim();
              const isCorrect = showResults && answerNorm === correctNorm;
              const isWrong = showResults && answerNorm !== "" && !isCorrect;

              // gap sentence text from <li> items if available
              const gapText = gapSentences[idx] ?? sub.questionText ?? "";

              // split on blanks (underscores) to render inline input
              const parts = gapText.split(/_{2,}/);
              const hasBlank = parts.length > 1;

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
                    {hasBlank ? (
                      /* Inline input replacing the blank */
                      <Text fontSize="sm" lineHeight="tall">
                        {parts.map((part, i) => (
                          <span key={i}>
                            {part}
                            {i < parts.length - 1 && (
                              <Input
                                as="input"
                                size="sm"
                                display="inline"
                                width="160px"
                                mx={1}
                                verticalAlign="middle"
                                borderColor={
                                  isCorrect
                                    ? "green.500"
                                    : isWrong
                                      ? "red.500"
                                      : "gray.300"
                                }
                                bg={
                                  isCorrect
                                    ? "green.50"
                                    : isWrong
                                      ? "red.50"
                                      : "white"
                                }
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
                                placeholder="Your answer"
                              />
                            )}
                          </span>
                        ))}
                      </Text>
                    ) : (
                      /* Fallback: show question text + input below */
                      <>
                        {gapText && (
                          <Box
                            fontSize="sm"
                            mb={2}
                            dangerouslySetInnerHTML={{ __html: gapText }}
                            css={{
                              "& p": { marginBottom: "0.25rem" },
                              "& strong": { fontWeight: "bold" },
                            }}
                          />
                        )}
                        <Input
                          size="sm"
                          maxWidth="300px"
                          borderColor={
                            isCorrect
                              ? "green.500"
                              : isWrong
                                ? "red.500"
                                : "gray.300"
                          }
                          bg={
                            isCorrect
                              ? "green.50"
                              : isWrong
                                ? "red.50"
                                : "white"
                          }
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
                      </>
                    )}

                    {/* Show correct answer when results visible */}
                    {showResults && isWrong && (
                      <Text fontSize="xs" color="green.600" mt={1}>
                        Correct: {sub.correctAnswer}
                      </Text>
                    )}
                  </Box>
                </HStack>
              );
            })}
          </VStack>
        </Box>
      </HStack>
    </Box>
  );
}
