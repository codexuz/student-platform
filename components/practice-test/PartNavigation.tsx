"use client";

import { Box, Flex, HStack, Text, IconButton } from "@chakra-ui/react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import type { PartNavigationProps } from "./types";
import { getAllQuestionNumbers } from "./types";
import { useTestTheme } from "./TestThemeContext";

/**
 * Bottom navigation bar for the practice test.
 * Shows part tabs with question number indicators and navigation controls.
 */
export default function PartNavigation({
  parts,
  currentPartIndex,
  currentQuestionNumber,
  answers,
  onPartChange,
  onQuestionClick,
  onPrev,
  onNext,
  onSubmit,
  isStarted = false,
}: PartNavigationProps) {
  const { colors } = useTestTheme();

  return (
    <Flex
      h="auto"
      minH="52px"
      px={{ base: 2, md: 4 }}
      py={2}
      alignItems="center"
      justifyContent="space-between"
      bg={colors.navBg}
      borderTopWidth="1px"
      borderColor={colors.border}
      position="sticky"
      bottom={0}
      zIndex={20}
      gap={3}
    >
      {/* Part tabs + question indicators */}
      <HStack
        gap={4}
        flex={1}
        overflowX="auto"
        py={0.5}
        css={{
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
        }}
      >
        {parts.map((part, idx) => {
          const isActive = idx === currentPartIndex;
          const questionNums = getAllQuestionNumbers(part.questions);
          const answeredCount = questionNums.filter((n) => !!answers[n]).length;

          return (
            <HStack key={part.id} gap={2} flexShrink={0}>
              {/* Part label */}
              <Box
                cursor="pointer"
                onClick={() => onPartChange(idx)}
                display="flex"
                alignItems="center"
                gap={1.5}
                py={1}
              >
                <Text
                  fontWeight="bold"
                  fontSize="sm"
                  color={isActive ? colors.text : colors.textSecondary}
                  whiteSpace="nowrap"
                  transition="color 0.15s"
                >
                  {part.partLabel}
                </Text>

                {/* Answered count badge (collapsed parts) */}
                {!isActive && (
                  <Text
                    fontSize="xs"
                    color={colors.textSecondary}
                    fontWeight="medium"
                    whiteSpace="nowrap"
                  >
                    {answeredCount}/{part.totalQuestions}
                  </Text>
                )}
              </Box>

              {/* Question number pills (active part only) */}
              {isActive && (
                <HStack gap={0.5}>
                  {questionNums.map((num) => {
                    const isAnswered = !!answers[num];
                    const isCurrent = num === currentQuestionNumber;

                    return (
                      <Box
                        key={num}
                        w="30px"
                        h="30px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="semibold"
                        cursor="pointer"
                        onClick={() => onQuestionClick(num)}
                        userSelect="none"
                        transition="all 0.15s ease"
                        bg={
                          isAnswered
                            ? "teal.500"
                            : isCurrent
                              ? colors.accentColor
                              : "transparent"
                        }
                        color={
                          isAnswered
                            ? "white"
                            : isCurrent
                              ? "white"
                              : colors.textSecondary
                        }
                        borderWidth="1.5px"
                        borderColor={
                          isAnswered
                            ? "teal.500"
                            : isCurrent
                              ? colors.accentColor
                              : colors.border
                        }
                        _hover={{
                          bg: isAnswered
                            ? "teal.600"
                            : isCurrent
                              ? colors.accentColor
                              : colors.hoverBg,
                          borderColor: isAnswered
                            ? "teal.600"
                            : isCurrent
                              ? colors.accentColor
                              : colors.textSecondary,
                        }}
                      >
                        {num}
                      </Box>
                    );
                  })}
                </HStack>
              )}

              {/* Separator between parts */}
              {idx < parts.length - 1 && (
                <Box w="1px" h="24px" bg={colors.border} ml={1} />
              )}
            </HStack>
          );
        })}
      </HStack>

      {/* Navigation controls */}
      <HStack gap={1} flexShrink={0}>
        <IconButton
          variant="ghost"
          size="sm"
          aria-label="Previous question"
          onClick={onPrev}
          borderRadius="full"
          color={colors.textSecondary}
          _hover={{ bg: colors.hoverBg, color: colors.text }}
        >
          <ChevronLeft size={20} />
        </IconButton>
        <IconButton
          variant="ghost"
          size="sm"
          aria-label="Next question"
          onClick={onNext}
          borderRadius="full"
          color={colors.textSecondary}
          _hover={{ bg: colors.hoverBg, color: colors.text }}
        >
          <ChevronRight size={20} />
        </IconButton>

        {onSubmit && (
          <IconButton
            variant="outline"
            size="sm"
            aria-label="Submit test"
            onClick={onSubmit}
            borderRadius="full"
            color={isStarted ? "green.600" : "gray.400"}
            borderColor={isStarted ? "green.300" : "gray.300"}
            _hover={
              isStarted ? { bg: "green.50", borderColor: "green.400" } : {}
            }
            ml={1}
            disabled={!isStarted}
            opacity={isStarted ? 1 : 0.5}
            cursor={isStarted ? "pointer" : "not-allowed"}
          >
            <Check size={18} />
          </IconButton>
        )}
      </HStack>
    </Flex>
  );
}
