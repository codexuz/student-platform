"use client";

import { useState, useEffect, useCallback } from "react";
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
  Spinner,
} from "@chakra-ui/react";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import {
  ieltsQuestionsAPI,
  ieltsSubQuestionsAPI,
  ieltsQuestionChoicesAPI,
} from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type {
  PageId,
  IELTSQuestion,
  IELTSSubQuestion,
  IELTSQuestionOption,
  IELTSQuestionType,
} from "./types";
import QuestionContentModal from "./QuestionContentModal";

/* ── Style helpers ──────────────────────────────────────────────────────── */

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

const truncate = (s: string | undefined, n: number) =>
  s && s.length > n ? s.substring(0, n) + "..." : s || "";

/* ── Component ──────────────────────────────────────────────────────────── */

interface QuestionsManagerProps {
  partId: string;
  partType: "reading" | "listening";
  onNavigate: (page: PageId, data?: Record<string, string>) => void;
}

export default function QuestionsManager({
  partId,
  partType,
  onNavigate,
}: QuestionsManagerProps) {
  const [questions, setQuestions] = useState<IELTSQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [creatingQuestion, setCreatingQuestion] = useState(false);

  const backLabel =
    partType === "reading" ? "Reading Parts" : "Listening Parts";
  const backPage =
    partType === "reading" ? "reading-part-form" : "listening-part-form";

  /* ── Fetch ──────────────────────────────────────────────────────────── */

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const res =
        partType === "reading"
          ? await ieltsQuestionsAPI.getByReadingPart(partId)
          : await ieltsQuestionsAPI.getByListeningPart(partId);

      const list: IELTSQuestion[] = Array.isArray(res) ? res : res.data || [];
      setQuestions(list);
    } catch {
      toaster.error({ title: "Error loading questions" });
    } finally {
      setLoading(false);
    }
  }, [partId, partType]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  /* ── Handlers ───────────────────────────────────────────────────────── */

  const openAddQuestion = () => {
    setModalOpen(true);
  };

  const handleSaveQuestion = async (questionData: IELTSQuestion) => {
    setCreatingQuestion(true);
    try {
      const body: Record<string, unknown> = {
        [partType === "reading" ? "reading_part_id" : "listening_part_id"]:
          partId,
        type: questionData.type,
        questionText: questionData.questionText || null,
        instruction: questionData.instruction || null,
        context: questionData.context || null,
        questionNumber: questionData.questionNumber,
        points: questionData.points || 1,
        explanation: questionData.explanation || null,
        fromPassage: questionData.fromPassage || null,
        isActive: true,
      };

      // Support nested creation: include sub-questions and options
      if (questionData.questions?.length) {
        body.questions = questionData.questions;
      }
      if (questionData.options?.length) {
        body.options = questionData.options;
      }

      await ieltsQuestionsAPI.create(body);
      toaster.success({ title: "Question created!" });
      fetchQuestions();
    } catch (e) {
      toaster.error({
        title: "Error creating question",
        description: (e as Error).message,
      });
    } finally {
      setCreatingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await ieltsQuestionsAPI.delete(questionId);
      toaster.success({ title: "Question deleted" });
      fetchQuestions();
    } catch {
      toaster.error({ title: "Error deleting question" });
    }
  };

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  /* ── Render ─────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <Box py={12} textAlign="center" color="gray.400">
        <HStack gap={2} justifyContent="center">
          <Spinner size="sm" />
          <Text>Loading questions...</Text>
        </HStack>
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <HStack gap={1.5} fontSize="sm" color="gray.400" mb={4}>
        <Text
          as="span"
          color="#4f46e5"
          cursor="pointer"
          fontWeight="500"
          _hover={{ textDecoration: "underline" }}
          onClick={() =>
            onNavigate(
              partType === "reading" ? "reading-parts" : "listening-parts",
            )
          }
        >
          {backLabel}
        </Text>
        <Text color="gray.300" _dark={{ color: "gray.600" }}>
          /
        </Text>
        <Text
          as="span"
          color="#4f46e5"
          cursor="pointer"
          fontWeight="500"
          _hover={{ textDecoration: "underline" }}
          onClick={() => onNavigate(backPage as PageId, { editId: partId })}
        >
          Edit Part
        </Text>
        <Text color="gray.300" _dark={{ color: "gray.600" }}>
          /
        </Text>
        <Text>Questions</Text>
      </HStack>

      {/* Main Card */}
      <Box
        bg="white"
        _dark={{ bg: "gray.800" }}
        rounded="lg"
        borderWidth="1px"
        shadow="sm"
      >
        <Flex
          px={5}
          py={3.5}
          borderBottomWidth="1px"
          alignItems="center"
          justifyContent="space-between"
        >
          <Heading size="sm" fontWeight="600">
            Questions
          </Heading>
          <Button
            size="sm"
            bg="#4f46e5"
            color="white"
            _hover={{ bg: "#3730a3" }}
            onClick={openAddQuestion}
            loading={creatingQuestion}
          >
            <Plus size={14} /> Add Question
          </Button>
        </Flex>

        <Box p={5}>
          {questions.length === 0 ? (
            <Text fontSize="sm" color="gray.400" textAlign="center" py={8}>
              No questions yet. Click &quot;+ Add Question&quot; to get started.
            </Text>
          ) : (
            <VStack gap={3} alignItems="stretch">
              {questions.map((question, qi) => {
                const qType = question.type || "NOTE_COMPLETION";
                const tc = typeColors[qType] || {
                  bg: "#f3f4f6",
                  color: "#374151",
                };
                const qId = question.id || String(qi);
                const subs = question.questions || [];
                const opts = question.options || [];

                return (
                  <Box
                    key={qId}
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
                      onClick={() => toggleCollapse(qId)}
                    >
                      <HStack>
                        <Box
                          transition="transform 0.2s"
                          transform={
                            collapsed[qId] ? "rotate(-90deg)" : "rotate(0)"
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
                            ? `: ${truncate(question.questionText, 60)}`
                            : ""}
                        </Text>
                      </HStack>
                      <HStack onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          size="xs"
                          colorPalette="red"
                          variant="ghost"
                          onClick={() => handleDeleteQuestion(qId)}
                          aria-label="Delete question"
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      </HStack>
                    </Flex>

                    {/* Question Body */}
                    {!collapsed[qId] && (
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
                                  key={sq.id || si}
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
                                    key={opt.id || oi}
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
        onClose={() => {
          setModalOpen(false);
        }}
        onSave={handleSaveQuestion}
      />
    </Box>
  );
}
