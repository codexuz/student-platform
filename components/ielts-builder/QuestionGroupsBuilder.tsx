"use client";

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
  Badge,
  IconButton,
} from "@chakra-ui/react";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { useState } from "react";
import type {
  IELTSQuestion,
  IELTSSubQuestion,
  IELTSQuestionOption,
} from "./types";
import QuestionContentModal from "./QuestionContentModal";

const typeColors: Record<string, { bg: string; color: string }> = {
  NOTE_COMPLETION: { bg: "#dbeafe", color: "#1d4ed8" },
  TRUE_FALSE_NOT_GIVEN: { bg: "#d1fae5", color: "#065f46" },
  YES_NO_NOT_GIVEN: { bg: "#d1fae5", color: "#065f46" },
  MATCHING_INFORMATION: { bg: "#fce4ec", color: "#880e4f" },
  MATCHING_HEADINGS: { bg: "#fce4ec", color: "#880e4f" },
  SUMMARY_COMPLETION: { bg: "#dbeafe", color: "#1d4ed8" },
  SUMMARY_COMPLETION_DRAG_DROP: { bg: "#fef3c7", color: "#92400e" },
  MULTIPLE_CHOICE: { bg: "#fce7f3", color: "#be185d" },
  MULTIPLE_ANSWER: { bg: "#ede9fe", color: "#6d28d9" },
  SENTENCE_COMPLETION: { bg: "#dbeafe", color: "#1d4ed8" },
  SHORT_ANSWER: { bg: "#e0f2fe", color: "#0369a1" },
  TABLE_COMPLETION: { bg: "#ecfdf5", color: "#047857" },
  FLOW_CHART_COMPLETION: { bg: "#f0fdf4", color: "#15803d" },
  DIAGRAM_LABELLING: { bg: "#fef9c3", color: "#a16207" },
  MATCHING_FEATURES: { bg: "#fce4ec", color: "#880e4f" },
  MATCHING_SENTENCE_ENDINGS: { bg: "#fce4ec", color: "#880e4f" },
  PLAN_MAP_LABELLING: { bg: "#fef9c3", color: "#a16207" },
};

interface QuestionGroupsBuilderProps {
  questions: IELTSQuestion[];
  onChange: (questions: IELTSQuestion[]) => void;
}

export default function QuestionGroupsBuilder({
  questions,
  onChange,
}: QuestionGroupsBuilderProps) {
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);

  const removeQuestion = (idx: number) => {
    onChange(questions.filter((_, i) => i !== idx));
  };

  const openAddQuestion = () => {
    setModalOpen(true);
  };

  const handleSaveQuestion = (question: IELTSQuestion) => {
    onChange([...questions, question]);
  };

  const toggleCollapse = (idx: number) => {
    setCollapsed((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const truncate = (s: string | undefined, n: number) =>
    s && s.length > n ? s.substring(0, n) + "..." : s || "";

  return (
    <>
      <Box
        borderWidth="1px"
        rounded="lg"
        overflow="hidden"
        bg="white"
        _dark={{ bg: "gray.800" }}
      >
        <Flex
          px={4}
          py={3}
          borderBottomWidth="1px"
          bg="gray.50"
          _dark={{ bg: "gray.700" }}
          alignItems="center"
          justifyContent="space-between"
        >
          <Heading size="sm" fontWeight="600">
            Questions
          </Heading>
          <Button
            size="xs"
            bg="#4f46e5"
            color="white"
            _hover={{ bg: "#3730a3" }}
            onClick={openAddQuestion}
          >
            <Plus size={12} /> Add Question
          </Button>
        </Flex>
        <Box p={4}>
          {questions.length === 0 ? (
            <Text fontSize="sm" color="gray.400" textAlign="center" py={4}>
              No questions. Click &quot;+ Add Question&quot;.
            </Text>
          ) : (
            <VStack gap={3} alignItems="stretch">
              {questions.map((question, qi) => {
                const qType = question.type || "NOTE_COMPLETION";
                const tc = typeColors[qType] || {
                  bg: "#f3f4f6",
                  color: "#374151",
                };
                const subs = question.questions || [];
                const opts = question.options || [];

                return (
                  <Box
                    key={qi}
                    borderWidth="1.5px"
                    borderColor="gray.200"
                    _dark={{ borderColor: "gray.600" }}
                    rounded="lg"
                    overflow="hidden"
                  >
                    {/* Question Header */}
                    <Flex
                      px={3}
                      py={2.5}
                      bg="gray.50"
                      _dark={{ bg: "gray.700" }}
                      alignItems="center"
                      justifyContent="space-between"
                      cursor="pointer"
                      userSelect="none"
                      onClick={() => toggleCollapse(qi)}
                    >
                      <HStack>
                        <Box
                          transition="transform 0.2s"
                          transform={
                            collapsed[qi] ? "rotate(-90deg)" : "rotate(0)"
                          }
                        >
                          <ChevronDown size={14} />
                        </Box>
                        <Badge
                          bg={tc.bg}
                          color={tc.color}
                          fontSize="10px"
                          fontWeight="700"
                          textTransform="uppercase"
                          px={2}
                          rounded="sm"
                          variant="plain"
                        >
                          {qType.replace(/_/g, " ")}
                        </Badge>
                        <Text fontSize="sm" fontWeight="600">
                          Q{question.questionNumber || qi + 1}
                          {question.questionText
                            ? `: ${truncate(question.questionText, 50)}`
                            : ""}
                        </Text>
                      </HStack>
                      <HStack onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          size="xs"
                          colorPalette="red"
                          variant="ghost"
                          onClick={() => removeQuestion(qi)}
                          aria-label="Remove question"
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      </HStack>
                    </Flex>

                    {/* Question Body */}
                    {!collapsed[qi] && (
                      <Box p={3} borderTopWidth="1px">
                        {question.instruction && (
                          <Text fontSize="xs" color="gray.500" mb={2}>
                            <strong>Instruction:</strong>{" "}
                            {truncate(question.instruction, 200)}
                          </Text>
                        )}

                        {/* Sub-Questions */}
                        {subs.length > 0 && (
                          <Box mb={2}>
                            <Text
                              fontSize="xs"
                              fontWeight="600"
                              color="gray.500"
                              mb={1}
                            >
                              Sub-Questions ({subs.length})
                            </Text>
                            <VStack gap={1} alignItems="stretch">
                              {subs.map((sq: IELTSSubQuestion, si: number) => (
                                <HStack
                                  key={si}
                                  fontSize="xs"
                                  gap={2}
                                  px={2}
                                  py={1}
                                  bg="gray.50"
                                  _dark={{ bg: "gray.700" }}
                                  rounded="sm"
                                >
                                  <Text
                                    fontWeight="600"
                                    color="gray.600"
                                    flexShrink={0}
                                  >
                                    #{sq.questionNumber || si + 1}
                                  </Text>
                                  <Text
                                    flex="1"
                                    color="gray.700"
                                    _dark={{ color: "gray.300" }}
                                  >
                                    {truncate(sq.questionText, 80)}
                                  </Text>
                                  {sq.correctAnswer && (
                                    <Badge
                                      colorPalette="green"
                                      variant="subtle"
                                      fontSize="10px"
                                    >
                                      {truncate(sq.correctAnswer, 30)}
                                    </Badge>
                                  )}
                                </HStack>
                              ))}
                            </VStack>
                          </Box>
                        )}

                        {/* Options */}
                        {opts.length > 0 && (
                          <Box>
                            <Text
                              fontSize="xs"
                              fontWeight="600"
                              color="gray.500"
                              mb={1}
                            >
                              Options ({opts.length})
                            </Text>
                            <HStack gap={2} flexWrap="wrap">
                              {opts.map(
                                (opt: IELTSQuestionOption, oi: number) => (
                                  <Badge
                                    key={oi}
                                    colorPalette={
                                      opt.isCorrect ? "green" : "gray"
                                    }
                                    variant="subtle"
                                    fontSize="10px"
                                  >
                                    {opt.optionKey}:{" "}
                                    {truncate(opt.optionText, 40)}
                                  </Badge>
                                ),
                              )}
                            </HStack>
                          </Box>
                        )}

                        {subs.length === 0 && opts.length === 0 && (
                          <Text fontSize="sm" color="gray.400" mt={1}>
                            No sub-questions or options.
                          </Text>
                        )}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </VStack>
          )}
        </Box>
      </Box>

      <QuestionContentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveQuestion}
      />
    </>
  );
}
