"use client";

import { Box, Flex, HStack, Text, IconButton } from "@chakra-ui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
      minH="44px"
      alignItems="stretch"
      bg={colors.navBg}
      borderTopWidth="1px"
      borderColor={colors.border}
      position="sticky"
      bottom={0}
      zIndex={20}
    >
      {/* Part tabs — full width, equally divided */}
      {parts.map((part, idx) => {
        const isActive = idx === currentPartIndex;
        const questionNums = getAllQuestionNumbers(part.questions);
        const answeredCount = questionNums.filter((n) => !!answers[n]).length;

        return (
          <Flex
            key={part.id}
            flex={1}
            align="center"
            px={{ base: 2, md: 3 }}
            py={1.5}
            gap={2}
            cursor="pointer"
            onClick={() => onPartChange(idx)}
            borderRightWidth={idx < parts.length - 1 ? "1px" : "0px"}
            borderRightColor={colors.border}
            borderTopWidth={isActive ? "3px" : "0px"}
            borderTopColor={colors.accentColor}
            transition="all 0.15s"
            minW="0"
          >
            {/* Part label */}
            <Text
              fontWeight={isActive ? "bold" : "medium"}
              fontSize="sm"
              color={isActive ? colors.text : colors.textSecondary}
              whiteSpace="nowrap"
              flexShrink={0}
            >
              {part.partLabel}
            </Text>

            {/* Question number pills (active part only) */}
            {isActive && (
              <HStack gap={0.5} flexWrap="wrap" flexShrink={1} minW="0">
                {questionNums.map((num) => {
                  const isAnswered = !!answers[num];
                  const isCurrent = num === currentQuestionNumber;

                  return (
                    <Box
                      key={num}
                      w="24px"
                      h="24px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      borderRadius="sm"
                      fontSize="2xs"
                      fontWeight="semibold"
                      cursor="pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuestionClick(num);
                      }}
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
                      flexShrink={0}
                    >
                      {num}
                    </Box>
                  );
                })}
              </HStack>
            )}

            {/* Answered count (inactive parts) */}
            {!isActive && (
              <Text
                fontSize="xs"
                color={colors.textSecondary}
                fontWeight="medium"
                whiteSpace="nowrap"
              >
                {answeredCount} of {part.totalQuestions}
              </Text>
            )}
          </Flex>
        );
      })}

      {/* Submit / nav controls */}
      <Flex
        align="center"
        gap={1}
        flexShrink={0}
        px={2}
        borderLeftWidth="1px"
        borderLeftColor={colors.border}
      >
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
      </Flex>
    </Flex>
  );
}
