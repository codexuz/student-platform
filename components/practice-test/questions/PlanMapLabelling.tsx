"use client";

import { useState, useRef, useCallback } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  NativeSelect,
  Circle,
  Image,
} from "@chakra-ui/react";
import type { QuestionComponentProps } from "../types";
import { getQuestionRange } from "../types";

/**
 * PLAN_MAP_LABELLING — label a plan/map diagram.
 *
 * Shows the map/plan image from questionText, followed by sub-questions.
 * Each sub-question is a label (e.g. "Scarecrow") that the student matches
 * to a letter (A-I) from the map using a select dropdown.
 */
export default function PlanMapLabelling({
  question,
  answers,
  onAnswer,
  disabled = false,
  showResults = false,
}: QuestionComponentProps) {
  const [startNum, endNum] = getQuestionRange(question);
  const subQuestions = question.questions ?? [];
  const options = question.options ?? [];
  const sortedOptions = [...options].sort(
    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
  );

  /* ── image width resize via drag handle ── */
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

  /* ── strip img tag to get any remaining question text ── */
  const remainingText = (question.questionText ?? "")
    .replace(/<img[^>]*>/gi, "")
    .replace(/<p>\s*<\/p>/gi, "")
    .trim();

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
        {/* ─── Left: Map / Plan image ─── */}
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
                alt="Plan / Map diagram"
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

        {/* ─── Right: Questions ─── */}
        <Box flex={1} minW="0">
          {/* Remaining text (if any besides the image) */}
          {remainingText && (
            <Box
              fontSize="sm"
              mb={4}
              dangerouslySetInnerHTML={{ __html: remainingText }}
              css={{
                "& p": { marginBottom: "0.25rem" },
                "& strong": { fontWeight: "bold" },
              }}
            />
          )}

          {/* Option letters legend */}
          {sortedOptions.length > 0 &&
            sortedOptions.some((o) => o.optionText?.trim()) && (
              <Box
                mb={4}
                p={3}
                bg="gray.50"
                _dark={{ bg: "gray.700" }}
                borderRadius="md"
              >
                <VStack align="stretch" gap={1}>
                  {sortedOptions.map((opt) => (
                    <Text key={opt.optionKey} fontSize="sm">
                      <strong>{opt.optionKey}</strong>
                      {opt.optionText ? ` — ${opt.optionText}` : ""}
                    </Text>
                  ))}
                </VStack>
              </Box>
            )}

          {/* Sub-questions with select dropdowns */}
          <VStack align="stretch" gap={3}>
            {subQuestions.map((sub) => {
              const qNum = sub.questionNumber ?? 0;
              const selected = answers[qNum] ?? "";
              const isCorrect =
                showResults &&
                !!selected &&
                selected.toUpperCase() ===
                  (sub.correctAnswer ?? "").toUpperCase();
              const isWrong = showResults && !!selected && !isCorrect;

              return (
                <HStack
                  key={qNum}
                  align="center"
                  gap={3}
                  p={2}
                  borderRadius="md"
                  bg={
                    isCorrect ? "green.50" : isWrong ? "red.50" : "transparent"
                  }
                  _dark={{
                    bg: isCorrect
                      ? "green.900/30"
                      : isWrong
                        ? "red.900/30"
                        : "transparent",
                  }}
                  transition="background 0.15s"
                >
                  {/* Question number badge */}
                  <Circle
                    size="28px"
                    bg="blue.50"
                    color="blue.700"
                    _dark={{ bg: "blue.900", color: "blue.300" }}
                    fontSize="sm"
                    fontWeight="bold"
                    flexShrink={0}
                  >
                    {qNum}
                  </Circle>

                  {/* Label text */}
                  <Text fontSize="sm" fontWeight="medium">
                    {sub.questionText}
                  </Text>

                  {/* Select dropdown */}
                  <NativeSelect.Root
                    size="sm"
                    width="70px"
                    flexShrink={0}
                    disabled={disabled}
                  >
                    <NativeSelect.Field
                      value={selected}
                      onChange={(e) => onAnswer(qNum, e.target.value)}
                      borderColor={
                        isCorrect
                          ? "green.500"
                          : isWrong
                            ? "red.500"
                            : undefined
                      }
                      _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
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

                  {/* Result feedback */}
                  {showResults && selected && (
                    <Text fontSize="xs" fontWeight="bold" flexShrink={0}>
                      {isCorrect ? (
                        <Box
                          as="span"
                          color="green.600"
                          _dark={{ color: "green.300" }}
                        >
                          ✓
                        </Box>
                      ) : (
                        <Box
                          as="span"
                          color="red.500"
                          _dark={{ color: "red.300" }}
                        >
                          ✗ {sub.correctAnswer}
                        </Box>
                      )}
                    </Text>
                  )}
                </HStack>
              );
            })}
          </VStack>
        </Box>
      </HStack>
    </Box>
  );
}
