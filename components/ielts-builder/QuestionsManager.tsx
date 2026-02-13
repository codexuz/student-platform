"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Text,
  VStack,
  Badge,
  IconButton,
  Spinner,
} from "@chakra-ui/react";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import {
  ieltsQuestionsAPI,
  ieltsQuestionContentsAPI,
  ieltsQuestionChoicesAPI,
  ieltsMultipleChoiceQuestionsAPI,
  ieltsMultipleChoiceOptionsAPI,
} from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type { PageId, QuestionContent } from "./types";
import QuestionContentModal from "./QuestionContentModal";

/* ── Local API entity types ─────────────────────────────────────────────── */

interface APIQuestion {
  id: string;
  reading_part_id?: string | null;
  listening_part_id?: string | null;
  number_of_questions: number;
}

interface APIQuestionContent {
  id: string;
  question_id: string;
  type: string;
  title: string;
  condition?: string | null;
  content?: string | null;
  limit?: number | null;
  showOptions?: boolean;
  optionsTitle?: string | null;
  order: number;
}

interface APIChoice {
  id: string;
  question_content_id: string;
  value: string;
  label: string;
  order: number;
}

interface APIMCQQuestion {
  id: string;
  question_content_id: string;
  question: string;
  order: number;
}

interface QuestionWithContents extends APIQuestion {
  contents: (APIQuestionContent & {
    choices?: APIChoice[];
    mcqQuestions?: APIMCQQuestion[];
  })[];
}

/* ── Style helpers ──────────────────────────────────────────────────────── */

const typeColors: Record<string, { bg: string; color: string }> = {
  completion: { bg: "#dbeafe", color: "#1d4ed8" },
  "multiple-choice": { bg: "#fce7f3", color: "#be185d" },
  "multi-select": { bg: "#ede9fe", color: "#6d28d9" },
  selection: { bg: "#d1fae5", color: "#065f46" },
  "draggable-selection": { bg: "#fef3c7", color: "#92400e" },
  "matching-information": { bg: "#fce4ec", color: "#880e4f" },
};

const truncate = (s: string, n: number) =>
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
  const [questions, setQuestions] = useState<QuestionWithContents[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [targetQuestionId, setTargetQuestionId] = useState<string | null>(null);
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

      const list: APIQuestion[] = Array.isArray(res) ? res : res.data || [];

      // For each question, fetch its content blocks
      const enriched: QuestionWithContents[] = await Promise.all(
        list.map(async (q) => {
          try {
            const cRes = await ieltsQuestionContentsAPI.getByQuestion(q.id);
            const contents: APIQuestionContent[] = Array.isArray(cRes)
              ? cRes
              : cRes.data || [];
            return { ...q, contents };
          } catch {
            return { ...q, contents: [] };
          }
        }),
      );

      setQuestions(enriched);
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

  const handleCreateQuestion = async () => {
    setCreatingQuestion(true);
    try {
      const body: Record<string, unknown> = {
        [partType === "reading" ? "reading_part_id" : "listening_part_id"]:
          partId,
        number_of_questions: 10,
      };
      await ieltsQuestionsAPI.create(body);
      toaster.success({ title: "Question group created!" });
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

  const handleUpdateQuestionCount = async (
    questionId: string,
    count: number,
  ) => {
    try {
      await ieltsQuestionsAPI.update(questionId, {
        number_of_questions: count,
      });
    } catch {
      toaster.error({ title: "Error updating question count" });
    }
  };

  const openAddContent = (questionId: string) => {
    setTargetQuestionId(questionId);
    setModalOpen(true);
  };

  const handleSaveContent = async (content: QuestionContent) => {
    if (!targetQuestionId) return;
    try {
      // 1. Create the question content
      const contentBody = {
        question_id: targetQuestionId,
        type: content.type,
        title: content.title,
        condition: content.condition || null,
        content: content.content || null,
        limit: content.limit,
        showOptions: content.showOptions,
        optionsTitle: content.optionsTitle || null,
        order: content.order,
      };
      const created = await ieltsQuestionContentsAPI.create(contentBody);
      const contentId = created.id;

      // 2. Create choices if applicable
      if (content.options?.length) {
        await Promise.all(
          content.options.map((opt) =>
            ieltsQuestionChoicesAPI.create({
              question_content_id: contentId,
              value: opt.value,
              label: opt.label,
              order: opt.order,
            }),
          ),
        );
      }

      // 3. Create MCQ questions + options if applicable
      if (content.multipleChoiceQuestions?.length) {
        for (const mcq of content.multipleChoiceQuestions) {
          const mcqCreated = await ieltsMultipleChoiceQuestionsAPI.create({
            question_content_id: contentId,
            question: mcq.question,
            order: mcq.order,
          });
          if (mcq.options?.length) {
            await Promise.all(
              mcq.options.map((opt) =>
                ieltsMultipleChoiceOptionsAPI.create({
                  multiple_choice_question_id: mcqCreated.id,
                  value: opt.value,
                  label: opt.label,
                  order: opt.order,
                }),
              ),
            );
          }
        }
      }

      toaster.success({ title: "Content block added!" });
      fetchQuestions();
    } catch (e) {
      toaster.error({
        title: "Error saving content",
        description: (e as Error).message,
      });
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    try {
      await ieltsQuestionContentsAPI.delete(contentId);
      toaster.success({ title: "Content block deleted" });
      fetchQuestions();
    } catch {
      toaster.error({ title: "Error deleting content" });
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
            onClick={handleCreateQuestion}
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
              {questions.map((question, qi) => (
                <Box
                  key={question.id}
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
                    onClick={() => toggleCollapse(question.id)}
                  >
                    <HStack>
                      <Box
                        transition="transform 0.2s"
                        transform={
                          collapsed[question.id]
                            ? "rotate(-90deg)"
                            : "rotate(0)"
                        }
                      >
                        <ChevronDown size={14} />
                      </Box>
                      <Text fontSize="sm" fontWeight="600">
                        Question Group {qi + 1}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        ({question.contents.length} content block
                        {question.contents.length !== 1 ? "s" : ""})
                      </Text>
                    </HStack>
                    <HStack onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="xs"
                        bg="#4f46e5"
                        color="white"
                        _hover={{ bg: "#3730a3" }}
                        onClick={() => openAddContent(question.id)}
                      >
                        <Plus size={12} /> Content
                      </Button>
                      <IconButton
                        size="xs"
                        colorPalette="red"
                        variant="ghost"
                        onClick={() => handleDeleteQuestion(question.id)}
                        aria-label="Delete question"
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </HStack>
                  </Flex>

                  {/* Question Body */}
                  {!collapsed[question.id] && (
                    <Box p={3} borderTopWidth="1px">
                      <Box mb={3}>
                        <Text
                          fontSize="xs"
                          fontWeight="600"
                          color="gray.600"
                          _dark={{ color: "gray.400" }}
                          mb={1}
                          textTransform="uppercase"
                          letterSpacing="0.3px"
                        >
                          Number of Questions
                        </Text>
                        <Input
                          size="sm"
                          type="number"
                          w="120px"
                          value={question.number_of_questions}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setQuestions((prev) =>
                              prev.map((q) =>
                                q.id === question.id
                                  ? { ...q, number_of_questions: val }
                                  : q,
                              ),
                            );
                            handleUpdateQuestionCount(question.id, val);
                          }}
                        />
                      </Box>

                      {question.contents.length === 0 ? (
                        <Text fontSize="sm" color="gray.400" mt={2}>
                          No content blocks yet.
                        </Text>
                      ) : (
                        <VStack gap={2} alignItems="stretch">
                          {question.contents.map((ct) => {
                            const tc = typeColors[ct.type] || {
                              bg: "#f3f4f6",
                              color: "#374151",
                            };
                            return (
                              <Box
                                key={ct.id}
                                borderWidth="1px"
                                borderStyle="dashed"
                                borderColor="gray.300"
                                _dark={{
                                  borderColor: "gray.600",
                                  bg: "gray.700",
                                }}
                                rounded="md"
                                p={3}
                                bg="gray.50"
                                position="relative"
                              >
                                <Flex
                                  justifyContent="space-between"
                                  alignItems="center"
                                  mb={1}
                                >
                                  <HStack>
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
                                      {ct.type}
                                    </Badge>
                                    <Text fontSize="sm" fontWeight="600">
                                      {ct.title || "Untitled"}
                                    </Text>
                                  </HStack>
                                  <IconButton
                                    size="xs"
                                    colorPalette="red"
                                    variant="ghost"
                                    onClick={() => handleDeleteContent(ct.id)}
                                    aria-label="Remove content"
                                  >
                                    <Trash2 size={14} />
                                  </IconButton>
                                </Flex>
                                {ct.condition && (
                                  <Text fontSize="xs" color="gray.500">
                                    {truncate(ct.condition, 120)}
                                  </Text>
                                )}
                                {ct.choices && ct.choices.length > 0 && (
                                  <Text fontSize="xs" color="gray.400" mt={1}>
                                    Options:{" "}
                                    {ct.choices.map((o) => o.label).join(", ")}
                                  </Text>
                                )}
                                {ct.mcqQuestions &&
                                  ct.mcqQuestions.length > 0 && (
                                    <Text fontSize="xs" color="gray.400" mt={1}>
                                      {ct.mcqQuestions.length} MCQ(s)
                                    </Text>
                                  )}
                              </Box>
                            );
                          })}
                        </VStack>
                      )}
                    </Box>
                  )}
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      </Box>

      <QuestionContentModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setTargetQuestionId(null);
        }}
        onSave={handleSaveContent}
      />
    </Box>
  );
}
