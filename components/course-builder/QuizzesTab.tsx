"use client";

import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  Popover,
  Portal,
  Text,
  Textarea,
  VStack,
  Spinner,
} from "@chakra-ui/react";
import { ArrowLeft, Plus } from "lucide-react";
import { useState, useCallback } from "react";
import { ieltsQuizzesAPI, ieltsQuizQuestionsAPI } from "@/lib/teacher-api";
import { toaster } from "@/components/ui/toaster";
import type {
  Quiz,
  QuizQuestion,
  QuizChoice,
  AcceptedAnswer,
  QuestionType,
  Section,
  Lesson,
} from "./types";

interface Props {
  courseId: string;
  sections: Section[];
}

export default function QuizzesTab({ courseId, sections }: Props) {
  const allLessons: (Lesson & { sectionTitle: string })[] = sections.flatMap(
    (s) => (s.lessons || []).map((l) => ({ ...l, sectionTitle: s.title })),
  );

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editQuiz, setEditQuiz] = useState<Quiz | null>(null);
  const [viewQuiz, setViewQuiz] = useState<Quiz | null>(null);
  const [deletePopoverId, setDeletePopoverId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await ieltsQuizzesAPI.getAll(courseId);
      setQuizzes(d.data || d || []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [courseId]);

  useState(() => {
    load();
    return true;
  });

  const deleteQuiz = async (id: string) => {
    setDeletePopoverId(null);
    try {
      await ieltsQuizzesAPI.delete(id);
      toaster.success({ title: "Quiz deleted!" });
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to delete";
      toaster.error({ title: msg });
    }
  };

  if (viewQuiz) {
    return (
      <QuizDetail
        quiz={viewQuiz}
        onBack={() => {
          setViewQuiz(null);
          load();
        }}
      />
    );
  }

  return (
    <Box flex={1} overflowY="auto" p={{ base: 4, md: 8 }}>
      <Box maxW="800px" mx="auto">
        <HStack justify="space-between" mb={5}>
          <Heading size="lg">Quizzes</Heading>
          <Button
            colorPalette="blue"
            size="sm"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={14} /> Create Quiz
          </Button>
        </HStack>

        {loading ? (
          <VStack py={12}>
            <Spinner />
          </VStack>
        ) : !quizzes.length ? (
          <VStack py={16} gap={3}>
            <Text fontSize="5xl">❓</Text>
            <Heading size="md" color="gray.500" _dark={{ color: "gray.400" }}>
              No quizzes yet
            </Heading>
            <Text fontSize="sm" color="gray.400" _dark={{ color: "gray.500" }}>
              Add quizzes to test learner knowledge
            </Text>
          </VStack>
        ) : (
          <VStack gap={3} align="stretch">
            {quizzes.map((q) => (
              <Box
                key={q.id}
                bg="white"
                _dark={{ bg: "gray.800", borderColor: "gray.700" }}
                borderWidth="1.5px"
                borderColor="gray.200"
                rounded="lg"
                p={5}
              >
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="700" fontSize="md">
                    ❓ {q.title}
                  </Text>
                  <HStack gap={1.5}>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setViewQuiz(q)}
                    >
                      Questions
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setEditQuiz(q)}
                    >
                      Edit
                    </Button>
                    <Popover.Root
                      open={deletePopoverId === q.id}
                      onOpenChange={(e) =>
                        setDeletePopoverId(e.open ? q.id : null)
                      }
                    >
                      <Popover.Trigger asChild>
                        <Button colorPalette="red" size="xs">
                          Delete
                        </Button>
                      </Popover.Trigger>
                      <Portal>
                        <Popover.Positioner>
                          <Popover.Content w="240px">
                            <Popover.Arrow />
                            <Popover.Body>
                              <Text fontSize="sm" fontWeight="600" mb={1}>
                                Delete quiz?
                              </Text>
                              <Text fontSize="xs" color="gray.500" mb={3}>
                                This will permanently delete the quiz and all
                                its questions.
                              </Text>
                              <HStack justify="flex-end" gap={2}>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => setDeletePopoverId(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="xs"
                                  colorPalette="red"
                                  onClick={() => deleteQuiz(q.id)}
                                >
                                  Delete
                                </Button>
                              </HStack>
                            </Popover.Body>
                          </Popover.Content>
                        </Popover.Positioner>
                      </Portal>
                    </Popover.Root>
                  </HStack>
                </HStack>
                <Text fontSize="sm" color="gray.500">
                  {q.time_limit_seconds
                    ? `⏱ ${Math.floor(q.time_limit_seconds / 60)} min`
                    : "No time limit"}{" "}
                  · {q.is_published ? "✅ Published" : "📝 Draft"} · Attempts:{" "}
                  {q.attempts_allowed === 0 ? "∞" : q.attempts_allowed}
                  {q.lesson_id &&
                    (() => {
                      const lesson = allLessons.find(
                        (l) => l.id === q.lesson_id,
                      );
                      return lesson
                        ? ` · 📖 ${lesson.sectionTitle} → ${lesson.title}`
                        : "";
                    })()}
                </Text>
              </Box>
            ))}
          </VStack>
        )}

        {(showCreate || editQuiz) && (
          <QuizFormModal
            courseId={courseId}
            item={editQuiz}
            lessons={allLessons}
            onClose={() => {
              setShowCreate(false);
              setEditQuiz(null);
            }}
            onDone={() => {
              setShowCreate(false);
              setEditQuiz(null);
              load();
            }}
          />
        )}
      </Box>
    </Box>
  );
}

/* ── Quiz Form Modal ── */
function QuizFormModal({
  courseId,
  item,
  lessons,
  onClose,
  onDone,
}: {
  courseId: string;
  item: Quiz | null;
  lessons: (Lesson & { sectionTitle: string })[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [title, setTitle] = useState(item?.title || "");
  const [lessonId, setLessonId] = useState(item?.lesson_id || "");
  const [timeLimit, setTimeLimit] = useState(
    item?.time_limit_seconds?.toString() || "",
  );
  const [attempts, setAttempts] = useState(item?.attempts_allowed ?? 0);
  const [published, setPublished] = useState(item?.is_published ?? false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        course_id: courseId,
        lesson_id: lessonId || undefined,
        title,
        time_limit_seconds: timeLimit ? parseInt(timeLimit) : undefined,
        attempts_allowed: Number(attempts),
        is_published: published,
      };
      if (item?.id) {
        await ieltsQuizzesAPI.update(item.id, body);
        toaster.success({ title: "Quiz updated!" });
      } else {
        await ieltsQuizzesAPI.create(body);
        toaster.success({ title: "Quiz created!" });
      }
      onDone();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed";
      toaster.error({ title: msg });
    }
    setSaving(false);
  };

  return (
    <ModalWrapper title={item ? "Edit Quiz" : "Create Quiz"} onClose={onClose}>
      <VStack gap={4} align="stretch">
        <FormField label="Title">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Quiz title"
          />
        </FormField>
        <FormField label="Lesson (optional)">
          <select
            style={{
              width: "100%",
              padding: "8px 12px",
              borderWidth: "1px",
              borderRadius: "6px",
              fontSize: "0.875rem",
              background: "var(--chakra-colors-bg)",
              color: "inherit",
            }}
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value)}
          >
            <option value="">— No lesson —</option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.sectionTitle} → {l.title}
              </option>
            ))}
          </select>
        </FormField>
        <HStack gap={3}>
          <FormField label="Time Limit (sec)">
            <Input
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              placeholder="600"
            />
          </FormField>
          <FormField label="Attempts (0 = ∞)">
            <Input
              type="number"
              value={attempts}
              onChange={(e) => setAttempts(Number(e.target.value))}
              min={0}
            />
          </FormField>
        </HStack>
        <FormField label="Published">
          <select
            style={{
              width: "100%",
              padding: "8px 12px",
              borderWidth: "1px",
              borderRadius: "6px",
              fontSize: "0.875rem",
              background: "var(--chakra-colors-bg)",
              color: "inherit",
            }}
            value={published ? "true" : "false"}
            onChange={(e) => setPublished(e.target.value === "true")}
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </FormField>
      </VStack>
      <HStack justify="flex-end" mt={4} gap={2}>
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          colorPalette="blue"
          size="sm"
          onClick={save}
          disabled={saving}
          loading={saving}
        >
          Save
        </Button>
      </HStack>
    </ModalWrapper>
  );
}

/* ── Quiz Detail (questions) ── */
function QuizDetail({ quiz, onBack }: { quiz: Quiz; onBack: () => void }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editQ, setEditQ] = useState<QuizQuestion | null>(null);
  const [deleteQPopoverId, setDeleteQPopoverId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await ieltsQuizQuestionsAPI.getAll(quiz.id);
      setQuestions(
        (d.data || d || []).sort(
          (a: QuizQuestion, b: QuizQuestion) => a.position - b.position,
        ),
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load questions";
      toaster.error({ title: msg });
    }
    setLoading(false);
  }, [quiz.id]);

  useState(() => {
    load();
    return true;
  });

  const deleteQ = async (id: string) => {
    setDeleteQPopoverId(null);
    try {
      await ieltsQuizQuestionsAPI.delete(id);
      toaster.success({ title: "Deleted!" });
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed";
      toaster.error({ title: msg });
    }
  };

  return (
    <Box flex={1} overflowY="auto" p={{ base: 4, md: 8 }}>
      <Box maxW="800px" mx="auto">
        <HStack gap={2} mb={5}>
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </Button>
          <Heading size="lg" flex={1}>
            {quiz.title} — Questions
          </Heading>
          <Button
            colorPalette="blue"
            size="sm"
            onClick={() => setShowForm(true)}
          >
            <Plus size={14} /> Add Question
          </Button>
        </HStack>

        {loading ? (
          <VStack py={12}>
            <Spinner />
          </VStack>
        ) : !questions.length ? (
          <VStack py={16} gap={3}>
            <Text fontSize="5xl">📝</Text>
            <Heading size="md" color="gray.500">
              No questions
            </Heading>
          </VStack>
        ) : (
          <VStack gap={2} align="stretch">
            {questions.map((q) => (
              <Box
                key={q.id}
                bg="gray.50"
                _dark={{ bg: "gray.700" }}
                rounded="md"
                px={4}
                py={3}
              >
                <HStack justify="space-between" align="flex-start">
                  <Box>
                    <Text fontWeight="600" fontSize="sm" mb={1}>
                      {q.position}. {q.prompt}
                    </Text>
                    <Text fontSize="xs" color="gray.400" mb={1}>
                      Type: {q.question_type} · Points: {q.points ?? 1}
                    </Text>
                    <HStack gap={1} flexWrap="wrap">
                      {q.choices?.map((c) => (
                        <Box
                          key={c.id || c.choice_text}
                          px={2.5}
                          py={0.5}
                          rounded="full"
                          fontSize="xs"
                          fontWeight="500"
                          bg={c.is_correct ? "green.100" : "gray.100"}
                          color={c.is_correct ? "green.700" : "gray.500"}
                          _dark={{
                            bg: c.is_correct ? "green.900" : "gray.600",
                            color: c.is_correct ? "green.300" : "gray.400",
                          }}
                        >
                          {c.is_correct ? "✓" : "○"} {c.choice_text}
                        </Box>
                      ))}
                      {q.accepted_answers?.map((a) => (
                        <Box
                          key={a.id || a.answer_text}
                          px={2.5}
                          py={0.5}
                          rounded="full"
                          fontSize="xs"
                          fontWeight="500"
                          bg="green.100"
                          color="green.700"
                          _dark={{ bg: "green.900", color: "green.300" }}
                        >
                          ✓ {a.answer_text}
                        </Box>
                      ))}
                    </HStack>
                  </Box>
                  <HStack gap={1} flexShrink={0}>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setEditQ(q)}
                    >
                      Edit
                    </Button>
                    <Popover.Root
                      open={deleteQPopoverId === q.id}
                      onOpenChange={(e) =>
                        setDeleteQPopoverId(e.open ? q.id : null)
                      }
                    >
                      <Popover.Trigger asChild>
                        <Button colorPalette="red" size="xs">
                          Del
                        </Button>
                      </Popover.Trigger>
                      <Portal>
                        <Popover.Positioner>
                          <Popover.Content w="220px">
                            <Popover.Arrow />
                            <Popover.Body>
                              <Text fontSize="sm" fontWeight="600" mb={1}>
                                Delete question?
                              </Text>
                              <Text fontSize="xs" color="gray.500" mb={3}>
                                This action cannot be undone.
                              </Text>
                              <HStack justify="flex-end" gap={2}>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => setDeleteQPopoverId(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="xs"
                                  colorPalette="red"
                                  onClick={() => deleteQ(q.id)}
                                >
                                  Delete
                                </Button>
                              </HStack>
                            </Popover.Body>
                          </Popover.Content>
                        </Popover.Positioner>
                      </Portal>
                    </Popover.Root>
                  </HStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        )}

        {(showForm || editQ) && (
          <QuestionFormModal
            quizId={quiz.id}
            item={editQ}
            onClose={() => {
              setShowForm(false);
              setEditQ(null);
            }}
            onDone={() => {
              setShowForm(false);
              setEditQ(null);
              load();
            }}
          />
        )}
      </Box>
    </Box>
  );
}

/* ── Question Form Modal ── */
function QuestionFormModal({
  quizId,
  item,
  onClose,
  onDone,
}: {
  quizId: string;
  item: QuizQuestion | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [qType, setQType] = useState<QuestionType>(
    item?.question_type || "single_choice",
  );
  const [prompt, setPrompt] = useState(item?.prompt || "");
  const [explanation, setExplanation] = useState(item?.explanation || "");
  const [points, setPoints] = useState(item?.points ?? 1);
  const [position, setPosition] = useState(item?.position || 1);
  const [choices, setChoices] = useState<QuizChoice[]>(() => {
    if (item?.choices?.length) return item.choices.map((c) => ({ ...c }));
    if ((item?.question_type || "single_choice") === "true_false") {
      return [
        { choice_text: "True", is_correct: true, position: 1 },
        { choice_text: "False", is_correct: false, position: 2 },
      ];
    }
    return [];
  });
  const [accepted, setAccepted] = useState<AcceptedAnswer[]>(
    item?.accepted_answers?.length
      ? item.accepted_answers.map((a) => ({ ...a }))
      : [],
  );
  const [saving, setSaving] = useState(false);

  const isChoice = ["single_choice", "multiple_choice", "true_false"].includes(
    qType,
  );

  // When switching to true_false, initialize default choices
  const [prevQType, setPrevQType] = useState(qType);
  if (prevQType !== qType) {
    setPrevQType(qType);
    if (qType === "true_false" && !choices.length) {
      setChoices([
        { choice_text: "True", is_correct: true, position: 1 },
        { choice_text: "False", is_correct: false, position: 2 },
      ]);
    }
  }

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        quiz_id: quizId,
        question_type: qType,
        prompt,
        explanation: explanation || undefined,
        points: parseFloat(String(points)),
        position: parseInt(String(position)),
      };
      if (isChoice && choices.length)
        body.choices = choices.map((c, i) => ({
          choice_text: c.choice_text,
          is_correct: !!c.is_correct,
          position: c.position || i + 1,
        }));
      if (qType === "short_text" && accepted.length)
        body.acceptedAnswers = accepted
          .filter((a) => a.answer_text?.trim())
          .map((a) => ({ answer_text: a.answer_text }));
      if (item?.id) {
        await ieltsQuizQuestionsAPI.update(item.id, body);
        toaster.success({ title: "Updated!" });
      } else {
        await ieltsQuizQuestionsAPI.create(body);
        toaster.success({ title: "Question created!" });
      }
      onDone();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed";
      toaster.error({ title: msg });
    }
    setSaving(false);
  };

  return (
    <ModalWrapper
      title={item ? "Edit Question" : "Add Question"}
      onClose={onClose}
    >
      <VStack gap={4} align="stretch">
        <HStack gap={3}>
          <FormField label="Type">
            <select
              style={{
                width: "100%",
                padding: "8px 12px",
                borderWidth: "1px",
                borderRadius: "6px",
                fontSize: "0.875rem",
                background: "var(--chakra-colors-bg)",
                color: "inherit",
              }}
              value={qType}
              onChange={(e) => setQType(e.target.value as QuestionType)}
            >
              <option value="single_choice">Single Choice</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="true_false">True/False</option>
              <option value="short_text">Short Text</option>
            </select>
          </FormField>
          <FormField label="Position">
            <Input
              type="number"
              value={position}
              onChange={(e) => setPosition(Number(e.target.value))}
              min={1}
            />
          </FormField>
        </HStack>

        <FormField label="Prompt">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Question text…"
            rows={2}
          />
        </FormField>

        <HStack gap={3}>
          <FormField label="Points">
            <Input
              type="number"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              min={0}
              step={0.5}
            />
          </FormField>
          <FormField label="Explanation">
            <Input
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Optional"
            />
          </FormField>
        </HStack>

        {/* Choices */}
        {isChoice && (
          <Box>
            <HStack justify="space-between" mb={2}>
              <Text
                fontSize="xs"
                fontWeight="600"
                color="gray.500"
                textTransform="uppercase"
              >
                Choices
              </Text>
              <Button
                variant="outline"
                size="xs"
                onClick={() =>
                  setChoices([
                    ...choices,
                    {
                      choice_text: "",
                      is_correct: false,
                      position: choices.length + 1,
                    },
                  ])
                }
              >
                <Plus size={12} /> Add
              </Button>
            </HStack>
            <VStack gap={1.5} align="stretch">
              {choices.map((c, i) => (
                <HStack key={i} gap={2}>
                  <Box
                    w={6}
                    h={6}
                    rounded="full"
                    bg={c.is_correct ? "green.100" : "gray.200"}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="xs"
                    fontWeight="700"
                    color={c.is_correct ? "green.700" : "gray.500"}
                    flexShrink={0}
                  >
                    {String.fromCharCode(65 + i)}
                  </Box>
                  <Input
                    flex={1}
                    size="sm"
                    value={c.choice_text}
                    onChange={(e) => {
                      const n = [...choices];
                      n[i] = { ...n[i], choice_text: e.target.value };
                      setChoices(n);
                    }}
                  />
                  <Box
                    as="label"
                    fontSize="xs"
                    display="flex"
                    alignItems="center"
                    gap={1}
                  >
                    <input
                      type="checkbox"
                      checked={c.is_correct}
                      onChange={(e) => {
                        const n = [...choices];
                        n[i] = { ...n[i], is_correct: e.target.checked };
                        setChoices(n);
                      }}
                    />
                    ✓
                  </Box>
                  <Button
                    colorPalette="red"
                    size="xs"
                    variant="ghost"
                    onClick={() =>
                      setChoices(choices.filter((_, j) => j !== i))
                    }
                  >
                    ×
                  </Button>
                </HStack>
              ))}
            </VStack>
          </Box>
        )}

        {/* Short text accepted answers */}
        {qType === "short_text" && (
          <Box>
            <HStack justify="space-between" mb={2}>
              <Text
                fontSize="xs"
                fontWeight="600"
                color="gray.500"
                textTransform="uppercase"
              >
                Accepted Answers
              </Text>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setAccepted([...accepted, { answer_text: "" }])}
              >
                <Plus size={12} /> Add
              </Button>
            </HStack>
            <VStack gap={1.5} align="stretch">
              {accepted.map((a, i) => (
                <HStack key={i} gap={2}>
                  <Input
                    flex={1}
                    size="sm"
                    value={a.answer_text}
                    onChange={(e) => {
                      const n = [...accepted];
                      n[i] = { answer_text: e.target.value };
                      setAccepted(n);
                    }}
                  />
                  <Button
                    colorPalette="red"
                    size="xs"
                    variant="ghost"
                    onClick={() =>
                      setAccepted(accepted.filter((_, j) => j !== i))
                    }
                  >
                    ×
                  </Button>
                </HStack>
              ))}
            </VStack>
          </Box>
        )}
      </VStack>

      <HStack justify="flex-end" mt={4} gap={2}>
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          colorPalette="blue"
          size="sm"
          onClick={save}
          disabled={saving}
          loading={saving}
        >
          Save
        </Button>
      </HStack>
    </ModalWrapper>
  );
}

/* ── Shared components ── */
function ModalWrapper({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Box
      position="fixed"
      inset={0}
      bg="blackAlpha.500"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={200}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Box
        bg="white"
        _dark={{ bg: "gray.800" }}
        rounded="xl"
        shadow="lg"
        w="90%"
        maxW="520px"
        maxH="85vh"
        overflowY="auto"
      >
        <Box
          px={6}
          py={5}
          borderBottomWidth="1px"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <Text fontWeight="700" fontSize="md">
            {title}
          </Text>
          <Box
            as="button"
            w={8}
            h={8}
            rounded="md"
            bg="gray.100"
            _dark={{ bg: "gray.700" }}
            display="flex"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            fontSize="lg"
            color="gray.500"
            _hover={{ bg: "gray.200", _dark: { bg: "gray.600" } }}
            onClick={onClose}
          >
            ×
          </Box>
        </Box>
        <Box p={6}>{children}</Box>
      </Box>
    </Box>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box flex={1}>
      <Text
        fontSize="xs"
        fontWeight="600"
        color="gray.500"
        textTransform="uppercase"
        letterSpacing="0.3px"
        mb={1}
      >
        {label}
      </Text>
      {children}
    </Box>
  );
}
