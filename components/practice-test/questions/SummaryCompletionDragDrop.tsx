"use client";

import { useState } from "react";
import { Box, Heading, Text, VStack, HStack, Grid } from "@chakra-ui/react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { QuestionComponentProps } from "../types";
import { getQuestionRange } from "../types";

/**
 * SUMMARY_COMPLETION_DRAG_DROP — drag words from a bank into gaps (e.g., Questions 23-26).
 */
export default function SummaryCompletionDragDrop({
  question,
  answers,
  onAnswer,
  disabled = false,
  showResults = false,
}: QuestionComponentProps) {
  const [startNum, endNum] = getQuestionRange(question);
  const subQuestions = question.questions ?? [];
  const wordBankItems = question.options ?? [];
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Items already placed in gaps
  const placedItems = new Set(Object.values(answers));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || disabled) return;

    const droppedValue = String(active.id);
    const targetQNum = Number(over.id);

    if (!isNaN(targetQNum)) {
      // Remove from any other gap first
      Object.entries(answers).forEach(([qn, val]) => {
        if (val === droppedValue && Number(qn) !== targetQNum) {
          onAnswer(Number(qn), "");
        }
      });
      onAnswer(targetQNum, droppedValue);
    }
  };

  const handleGapClick = (qNum: number) => {
    if (disabled) return;
    // Clear the gap
    if (answers[qNum]) {
      onAnswer(qNum, "");
    }
  };

  return (
    <Box>
      <Heading size="md" mb={2}>
        Questions {startNum}-{endNum}
      </Heading>

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

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Sentences with droppable gaps */}
        <VStack align="stretch" gap={3} mb={6}>
          {subQuestions.map((sub) => {
            const qNum = sub.questionNumber ?? 0;
            const answer = answers[qNum] ?? "";
            const text = sub.questionText ?? "";
            const isCorrect = showResults && answer === sub.correctAnswer;
            const isWrong = showResults && answer && !isCorrect;

            return (
              <HStack
                key={qNum}
                align="center"
                flexWrap="wrap"
                gap={1}
                fontSize="sm"
                lineHeight="2"
              >
                <Text as="span">{text}</Text>
                <DroppableGap
                  id={qNum}
                  value={answer}
                  isCorrect={!!isCorrect}
                  isWrong={!!isWrong}
                  onClick={() => handleGapClick(qNum)}
                  disabled={disabled}
                  placeholder={String(qNum)}
                />
              </HStack>
            );
          })}
        </VStack>

        {/* Word bank */}
        <Box
          p={4}
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="gray.300"
          _dark={{ borderColor: "gray.600" }}
          borderRadius="lg"
        >
          <Grid
            templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }}
            gap={3}
          >
            {wordBankItems.map((item) => {
              const isPlaced = placedItems.has(item.optionText);
              return (
                <DraggableWord
                  key={item.optionKey}
                  id={item.optionText}
                  text={item.optionText}
                  isPlaced={isPlaced}
                  disabled={disabled}
                />
              );
            })}
          </Grid>
        </Box>

        <DragOverlay>
          {activeId ? (
            <Box
              px={4}
              py={2}
              bg="blue.500"
              color="white"
              borderRadius="md"
              fontSize="sm"
              fontWeight="medium"
              shadow="lg"
              cursor="grabbing"
            >
              {activeId}
            </Box>
          ) : null}
        </DragOverlay>
      </DndContext>
    </Box>
  );
}

// ─── Draggable Word ──────────────────────────────────────────────────────

function DraggableWord({
  id,
  text,
  isPlaced,
  disabled,
}: {
  id: string;
  text: string;
  isPlaced: boolean;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled: disabled || isPlaced,
  });

  const dragProps = { ...listeners, ...attributes };

  return (
    <Box
      ref={setNodeRef}
      {...dragProps}
      px={4}
      py={2}
      borderWidth="1px"
      borderColor="gray.300"
      borderRadius="md"
      bg={isPlaced ? "gray.100" : "white"}
      _dark={{
        borderColor: "gray.600",
        bg: isPlaced ? "gray.700" : "gray.800",
      }}
      opacity={isPlaced || isDragging ? 0.4 : 1}
      cursor={disabled || isPlaced ? "default" : "grab"}
      fontSize="sm"
      textAlign="center"
      userSelect="none"
      transition="all 0.15s"
      _hover={
        disabled || isPlaced ? {} : { borderColor: "blue.400", shadow: "sm" }
      }
    >
      {text}
    </Box>
  );
}

// ─── Droppable Gap ───────────────────────────────────────────────────────

function DroppableGap({
  id,
  value,
  isCorrect,
  isWrong,
  onClick,
  disabled,
  placeholder,
}: {
  id: number;
  value: string;
  isCorrect: boolean;
  isWrong: boolean;
  onClick: () => void;
  disabled: boolean;
  placeholder: string;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <Box
      ref={setNodeRef}
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      minWidth="140px"
      px={3}
      py={1}
      borderWidth="2px"
      borderStyle="dashed"
      borderColor={
        isOver
          ? "blue.400"
          : isCorrect
            ? "green.500"
            : isWrong
              ? "red.500"
              : value
                ? "blue.300"
                : "gray.300"
      }
      borderRadius="md"
      bg={
        isOver
          ? "blue.50"
          : isCorrect
            ? "green.50"
            : isWrong
              ? "red.50"
              : value
                ? "blue.50"
                : "transparent"
      }
      _dark={{
        bg: isOver
          ? "blue.900"
          : isCorrect
            ? "green.900"
            : isWrong
              ? "red.900"
              : value
                ? "blue.900"
                : "transparent",
        borderColor: isOver
          ? "blue.400"
          : isCorrect
            ? "green.400"
            : isWrong
              ? "red.400"
              : value
                ? "blue.400"
                : "gray.600",
      }}
      cursor={disabled ? "default" : value ? "pointer" : "default"}
      onClick={onClick}
      transition="all 0.15s"
      fontSize="sm"
    >
      {value || (
        <Text color="gray.400" fontSize="sm">
          {placeholder}
        </Text>
      )}
    </Box>
  );
}
