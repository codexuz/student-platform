"use client";

import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Icon,
  Spinner,
  Input,
} from "@chakra-ui/react";
import {
  LuCircleCheck,
  LuCircleX,
  LuCircle,
  LuChevronRight,
  LuRotateCcw,
  LuClock,
  LuTrophy,
  LuHourglass,
  LuInfinity,
  LuPlay,
  LuClipboardList,
} from "react-icons/lu";
import { useState, useEffect, useRef } from "react";
import { ieltsCourseAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toaster } from "@/components/ui/toaster";

// ── Types ──

interface QuizChoice {
  id: string;
  question_id: string;
  choice_text: string;
  is_correct: boolean;
  position: number;
}

interface AcceptedAnswer {
  id: string;
  question_id: string;
  answer_text: string;
}

interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_type:
    | "single_choice"
    | "multiple_choice"
    | "true_false"
    | "short_text";
  prompt: string;
  explanation: string | null;
  points: string;
  position: number;
  choices: QuizChoice[];
  acceptedAnswers: AcceptedAnswer[];
}

interface Quiz {
  id: string;
  course_id: string;
  lesson_id: string | null;
  title: string;
  time_limit_seconds: number | null;
  attempts_allowed: number;
  is_published: boolean;
  questions?: QuizQuestion[];
}

// ── Component ──

interface LessonQuizProps {
  lessonId: string;
}

export default function LessonQuiz({ lessonId }: LessonQuizProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [fetchId, setFetchId] = useState(lessonId);

  if (fetchId !== lessonId) {
    setFetchId(lessonId);
    setLoading(true);
    setQuizzes([]);
    setActiveQuiz(null);
  }

  useEffect(() => {
    if (!lessonId) return;
    ieltsCourseAPI
      .getQuizzesByLessonId(lessonId)
      .then((res: Quiz | Quiz[] | { data?: Quiz[] }) => {
        let list: Quiz[];
        if (Array.isArray(res)) {
          list = res;
        } else if (
          res &&
          typeof res === "object" &&
          "data" in res &&
          Array.isArray((res as { data?: Quiz[] }).data)
        ) {
          list = (res as { data: Quiz[] }).data;
        } else if (res && typeof res === "object" && "id" in res) {
          list = [res as Quiz];
        } else {
          list = [];
        }
        const published = list.filter((q: Quiz) => q.is_published);
        setQuizzes(published);
      })
      .catch(() => setQuizzes([]))
      .finally(() => setLoading(false));
  }, [lessonId]);

  if (loading) {
    return (
      <Flex justify="center" py={8}>
        <Spinner size="md" color="brand.500" />
      </Flex>
    );
  }

  if (!quizzes.length) return null;

  if (activeQuiz) {
    return <QuizPlayer quiz={activeQuiz} onBack={() => setActiveQuiz(null)} />;
  }

  return (
    <Box mt={8}>
      <HStack gap={2} mb={4}>
        <Icon fontSize="xl" color="brand.500">
          <LuClipboardList />
        </Icon>
        <Heading size="md" color="gray.900" _dark={{ color: "gray.100" }}>
          Quizzes
        </Heading>
      </HStack>
      <VStack gap={3} align="stretch">
        {quizzes.map((quiz) => (
          <Flex
            key={quiz.id}
            p={5}
            bg="white"
            _dark={{ bg: "gray.800", borderColor: "gray.700" }}
            borderWidth="1px"
            borderColor="gray.200"
            rounded="xl"
            align="center"
            justify="space-between"
            cursor="pointer"
            _hover={{
              borderColor: "brand.300",
              shadow: "md",
              _dark: { borderColor: "brand.600" },
            }}
            transition="all 0.2s"
            onClick={() => setActiveQuiz(quiz)}
          >
            <HStack gap={4} flex={1} minW={0}>
              {/* Quiz icon */}
              <Flex
                w="44px"
                h="44px"
                rounded="xl"
                bg="brand.50"
                _dark={{ bg: "brand.900" }}
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Icon fontSize="xl" color="brand.500">
                  <LuHourglass />
                </Icon>
              </Flex>

              <VStack align="start" gap={1.5} flex={1} minW={0}>
                <Text fontWeight="600" fontSize="md" lineClamp={1}>
                  {quiz.title}
                </Text>
                <HStack gap={3} fontSize="xs" color="gray.500">
                  {quiz.time_limit_seconds ? (
                    <HStack gap={1}>
                      <Icon fontSize="sm" color="orange.400">
                        <LuClock />
                      </Icon>
                      <Text fontWeight="500">
                        {Math.floor(quiz.time_limit_seconds / 60)} min
                      </Text>
                    </HStack>
                  ) : (
                    <HStack gap={1}>
                      <Icon fontSize="sm" color="green.400">
                        <LuClock />
                      </Icon>
                      <Text fontWeight="500">No time limit</Text>
                    </HStack>
                  )}
                  <Text color="gray.300">•</Text>
                  <HStack gap={1}>
                    {quiz.attempts_allowed === 0 ? (
                      <>
                        <Icon fontSize="sm" color="blue.400">
                          <LuInfinity />
                        </Icon>
                        <Text fontWeight="500">Unlimited</Text>
                      </>
                    ) : (
                      <Text fontWeight="500">
                        {quiz.attempts_allowed} attempt
                        {quiz.attempts_allowed > 1 ? "s" : ""}
                      </Text>
                    )}
                  </HStack>
                </HStack>
              </VStack>
            </HStack>

            {/* Start button */}
            <Flex
              px={4}
              py={2}
              rounded="lg"
              bg="brand.500"
              color="white"
              align="center"
              gap={1.5}
              fontSize="sm"
              fontWeight="600"
              flexShrink={0}
              transition="all 0.2s"
              _hover={{
                bg: "brand.600",
                shadow: "0 0 0 3px var(--chakra-colors-brand-200)",
                transform: "scale(1.04)",
              }}
              _dark={{
                _hover: {
                  shadow: "0 0 0 3px var(--chakra-colors-brand-800)",
                },
              }}
              css={{
                animation: "subtlePulse 2s ease-in-out infinite",
                "@keyframes subtlePulse": {
                  "0%, 100%": { boxShadow: "0 0 0 0 rgba(59,130,246,0.3)" },
                  "50%": { boxShadow: "0 0 0 6px rgba(59,130,246,0)" },
                },
                "&:hover": {
                  animation: "none",
                },
              }}
            >
              <Icon fontSize="sm">
                <LuPlay />
              </Icon>
              Start
            </Flex>
          </Flex>
        ))}
      </VStack>
    </Box>
  );
}

// ── Quiz Player ──

function QuizPlayer({ quiz, onBack }: { quiz: Quiz; onBack: () => void }) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [, setAttemptId] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(
    quiz.time_limit_seconds ?? null,
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Use embedded questions if available, otherwise fetch
  useState(() => {
    if (quiz.questions && quiz.questions.length > 0) {
      const sorted = [...quiz.questions].sort(
        (a: QuizQuestion, b: QuizQuestion) => a.position - b.position,
      );
      setQuestions(sorted);
      setLoading(false);
      return;
    }
    ieltsCourseAPI
      .getQuizQuestions(quiz.id)
      .then((res: QuizQuestion[] | { data?: QuizQuestion[] }) => {
        let data: QuizQuestion[];
        if (Array.isArray(res)) {
          data = res;
        } else {
          data = res?.data ?? [];
        }
        data.sort(
          (a: QuizQuestion, b: QuizQuestion) => a.position - b.position,
        );
        setQuestions(data);
      })
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  });

  // Timer
  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, submitted]);

  const handleSelectChoice = (
    questionId: string,
    choiceId: string,
    type: string,
  ) => {
    if (submitted) return;
    setAnswers((prev) => {
      if (type === "multiple_choice") {
        const current = (prev[questionId] as string[]) || [];
        if (current.includes(choiceId)) {
          return {
            ...prev,
            [questionId]: current.filter((c) => c !== choiceId),
          };
        }
        return { ...prev, [questionId]: [...current, choiceId] };
      }
      return { ...prev, [questionId]: choiceId };
    });
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: text }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      // Step 1 — Start attempt
      const userId = user?.id;
      if (!userId) throw new Error("User not authenticated");
      const attempt = await ieltsCourseAPI.startQuizAttempt(userId, quiz.id);
      const aId = attempt.id;
      setAttemptId(aId);

      // Step 2 — Submit all answers
      const answerRequests = questions.flatMap((q) => {
        const answer = answers[q.id];
        if (!answer || (Array.isArray(answer) && !answer.length)) return [];

        if (q.question_type === "short_text") {
          const text = (answer as string).trim();
          if (!text) return [];
          const isCorrect = q.acceptedAnswers.some(
            (a) => a.answer_text.trim().toLowerCase() === text.toLowerCase(),
          );
          return [
            ieltsCourseAPI.submitQuizAnswer({
              attempt_id: aId,
              question_id: q.id,
              answer_text: text,
              is_correct: isCorrect,
            }),
          ];
        }

        if (q.question_type === "multiple_choice" && Array.isArray(answer)) {
          const correctIds = q.choices
            .filter((c) => c.is_correct)
            .map((c) => c.id);
          const allCorrect =
            correctIds.length === answer.length &&
            correctIds.every((id) => answer.includes(id));
          return answer.map((choiceId) => {
            const choice = q.choices.find((c) => c.id === choiceId);
            return ieltsCourseAPI.submitQuizAnswer({
              attempt_id: aId,
              question_id: q.id,
              choice_id: choiceId,
              is_correct: allCorrect && !!choice?.is_correct,
            });
          });
        }

        // single_choice / true_false
        const choiceId = answer as string;
        const choice = q.choices.find((c) => c.id === choiceId);
        return [
          ieltsCourseAPI.submitQuizAnswer({
            attempt_id: aId,
            question_id: q.id,
            choice_id: choiceId,
            is_correct: !!choice?.is_correct,
          }),
        ];
      });

      await Promise.all(answerRequests);

      // Step 3 — Finalize
      await ieltsCourseAPI.finalizeQuizAttempt(aId);

      setSubmitted(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to submit quiz";
      toaster.error({ title: msg });
    }
    setSubmitting(false);
  };

  // Auto-submit when time runs out
  const timedOut =
    timeLeft !== null && timeLeft <= 0 && !submitted && !submitting;
  useEffect(() => {
    if (timedOut) handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timedOut]);

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setAttemptId(null);
    setCurrentIdx(0);
    setTimeLeft(quiz.time_limit_seconds ?? null);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // ── Score calculation ──

  const getScore = () => {
    let earned = 0;
    let total = 0;
    questions.forEach((q) => {
      const pts = parseFloat(q.points) || 1;
      total += pts;
      const answer = answers[q.id];
      if (q.question_type === "short_text") {
        const text = ((answer as string) || "").trim().toLowerCase();
        if (
          q.acceptedAnswers.some(
            (a) => a.answer_text.trim().toLowerCase() === text,
          )
        ) {
          earned += pts;
        }
      } else {
        // single_choice, true_false
        if (typeof answer === "string") {
          const correctChoice = q.choices.find((c) => c.is_correct);
          if (correctChoice && correctChoice.id === answer) earned += pts;
        }
        // multiple_choice
        if (Array.isArray(answer)) {
          const correctIds = q.choices
            .filter((c) => c.is_correct)
            .map((c) => c.id);
          const selected = answer as string[];
          if (
            correctIds.length === selected.length &&
            correctIds.every((id) => selected.includes(id))
          ) {
            earned += pts;
          }
        }
      }
    });
    return { earned, total };
  };

  const isQuestionCorrect = (q: QuizQuestion) => {
    const answer = answers[q.id];
    if (q.question_type === "short_text") {
      const text = ((answer as string) || "").trim().toLowerCase();
      return q.acceptedAnswers.some(
        (a) => a.answer_text.trim().toLowerCase() === text,
      );
    }
    if (typeof answer === "string") {
      const correctChoice = q.choices.find((c) => c.is_correct);
      return correctChoice?.id === answer;
    }
    if (Array.isArray(answer)) {
      const correctIds = q.choices.filter((c) => c.is_correct).map((c) => c.id);
      return (
        correctIds.length === answer.length &&
        correctIds.every((id) => answer.includes(id))
      );
    }
    return false;
  };

  // ── Loading ──

  if (loading) {
    return (
      <Flex justify="center" py={12}>
        <Spinner size="lg" color="brand.500" />
      </Flex>
    );
  }

  if (!questions.length) {
    return (
      <Box mt={8} textAlign="center">
        <Text color="gray.500">No questions found for this quiz.</Text>
        <Button variant="ghost" size="sm" mt={3} onClick={onBack}>
          ← Back to quizzes
        </Button>
      </Box>
    );
  }

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).filter((k) =>
    Array.isArray(answers[k])
      ? (answers[k] as string[]).length > 0
      : !!answers[k],
  ).length;

  // ── Results view ──

  if (submitted) {
    const { earned, total } = getScore();
    const pct = total > 0 ? Math.round((earned / total) * 100) : 0;

    return (
      <Box mt={8}>
        <Button variant="ghost" size="sm" onClick={onBack} mb={4}>
          ← Back to quizzes
        </Button>

        {/* Score card */}
        <Box
          bg="white"
          _dark={{ bg: "gray.800", borderColor: "gray.700" }}
          borderWidth="1px"
          borderColor="gray.200"
          rounded="xl"
          p={6}
          textAlign="center"
          mb={6}
        >
          <Icon
            fontSize="4xl"
            color={
              pct >= 70 ? "green.500" : pct >= 40 ? "orange.500" : "red.500"
            }
            mb={2}
          >
            <LuTrophy />
          </Icon>
          <Heading size="lg" mb={1}>
            {pct}%
          </Heading>
          <Text fontSize="sm" color="gray.500" mb={4}>
            {earned} / {total} points
          </Text>
          <Text
            fontSize="md"
            fontWeight="600"
            color={
              pct >= 70 ? "green.600" : pct >= 40 ? "orange.600" : "red.600"
            }
          >
            {pct >= 70
              ? "Great job! 🎉"
              : pct >= 40
                ? "Good effort! Keep going 💪"
                : "Keep practicing! 📚"}
          </Text>
          <Button
            mt={4}
            size="sm"
            colorPalette="brand"
            variant="outline"
            onClick={handleRetry}
          >
            <LuRotateCcw /> Try Again
          </Button>
        </Box>

        {/* Review answers */}
        <Heading
          size="sm"
          mb={3}
          color="gray.700"
          _dark={{ color: "gray.300" }}
        >
          Review Answers
        </Heading>
        <VStack gap={4} align="stretch">
          {questions.map((q, idx) => {
            const correct = isQuestionCorrect(q);
            const userAnswer = answers[q.id];
            return (
              <Box
                key={q.id}
                bg="white"
                borderWidth="1px"
                borderColor={correct ? "green.200" : "red.200"}
                _dark={{
                  bg: "gray.800",
                  borderColor: correct ? "green.700" : "red.700",
                }}
                rounded="lg"
                p={4}
              >
                <HStack gap={2} mb={2}>
                  <Icon fontSize="md" color={correct ? "green.500" : "red.500"}>
                    {correct ? <LuCircleCheck /> : <LuCircleX />}
                  </Icon>
                  <Text fontWeight="600" fontSize="sm" flex={1}>
                    {idx + 1}. {q.prompt}
                  </Text>
                </HStack>

                {q.question_type === "short_text" ? (
                  <VStack align="start" gap={1} pl={6}>
                    <Text
                      fontSize="sm"
                      color={correct ? "green.600" : "red.600"}
                    >
                      Your answer: {(userAnswer as string) || "(no answer)"}
                    </Text>
                    {!correct && (
                      <Text fontSize="sm" color="green.600">
                        Accepted:{" "}
                        {q.acceptedAnswers.map((a) => a.answer_text).join(", ")}
                      </Text>
                    )}
                  </VStack>
                ) : (
                  <VStack align="stretch" gap={1} pl={6}>
                    {[...q.choices]
                      .sort((a, b) => a.position - b.position)
                      .map((c) => {
                        const isSelected = Array.isArray(userAnswer)
                          ? userAnswer.includes(c.id)
                          : userAnswer === c.id;
                        return (
                          <HStack
                            key={c.id}
                            gap={2}
                            px={3}
                            py={1.5}
                            rounded="md"
                            bg={
                              c.is_correct
                                ? "green.50"
                                : isSelected
                                  ? "red.50"
                                  : "transparent"
                            }
                            _dark={{
                              bg: c.is_correct
                                ? "green.900"
                                : isSelected
                                  ? "red.900"
                                  : "transparent",
                            }}
                          >
                            <Icon
                              fontSize="sm"
                              color={
                                c.is_correct
                                  ? "green.500"
                                  : isSelected
                                    ? "red.500"
                                    : "gray.400"
                              }
                            >
                              {c.is_correct ? (
                                <LuCircleCheck />
                              ) : isSelected ? (
                                <LuCircleX />
                              ) : (
                                <LuCircle />
                              )}
                            </Icon>
                            <Text
                              fontSize="sm"
                              color={
                                c.is_correct
                                  ? "green.700"
                                  : isSelected
                                    ? "red.600"
                                    : "gray.600"
                              }
                              _dark={{
                                color: c.is_correct
                                  ? "green.300"
                                  : isSelected
                                    ? "red.400"
                                    : "gray.400",
                              }}
                            >
                              {c.choice_text}
                            </Text>
                          </HStack>
                        );
                      })}
                  </VStack>
                )}
              </Box>
            );
          })}
        </VStack>
      </Box>
    );
  }

  // ── Quiz in progress ──

  return (
    <Box mt={8}>
      {/* Header */}
      <Flex align="center" justify="space-between" mb={4}>
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <HStack gap={4}>
          {timeLeft !== null && (
            <HStack
              gap={1}
              fontSize="sm"
              fontWeight="600"
              color={timeLeft < 60 ? "red.500" : "gray.600"}
            >
              <Icon fontSize="sm">
                <LuClock />
              </Icon>
              <Text>{formatTime(timeLeft)}</Text>
            </HStack>
          )}
          <Text fontSize="sm" color="gray.500">
            {answeredCount}/{questions.length} answered
          </Text>
        </HStack>
      </Flex>

      {/* Quiz title */}
      <Heading size="md" mb={5} color="gray.900" _dark={{ color: "gray.100" }}>
        {quiz.title}
      </Heading>

      {/* Progress dots */}
      <HStack gap={1.5} mb={6} flexWrap="wrap">
        {questions.map((q, idx) => {
          const hasAnswer = Array.isArray(answers[q.id])
            ? (answers[q.id] as string[]).length > 0
            : !!answers[q.id];
          return (
            <Box
              key={q.id}
              as="button"
              w="28px"
              h="28px"
              rounded="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="xs"
              fontWeight="600"
              cursor="pointer"
              transition="all 0.15s"
              bg={
                idx === currentIdx
                  ? "brand.500"
                  : hasAnswer
                    ? "brand.100"
                    : "gray.100"
              }
              color={
                idx === currentIdx
                  ? "white"
                  : hasAnswer
                    ? "brand.700"
                    : "gray.500"
              }
              _dark={{
                bg:
                  idx === currentIdx
                    ? "brand.500"
                    : hasAnswer
                      ? "brand.900"
                      : "gray.700",
                color:
                  idx === currentIdx
                    ? "white"
                    : hasAnswer
                      ? "brand.300"
                      : "gray.400",
              }}
              _hover={{
                transform: "scale(1.1)",
              }}
              onClick={() => setCurrentIdx(idx)}
            >
              {idx + 1}
            </Box>
          );
        })}
      </HStack>

      {/* Current question */}
      <Box
        bg="white"
        _dark={{ bg: "gray.800", borderColor: "gray.700" }}
        borderWidth="1px"
        borderColor="gray.200"
        rounded="xl"
        p={{ base: 4, md: 6 }}
        mb={4}
      >
        <Text
          fontWeight="600"
          fontSize="md"
          mb={1}
          color="gray.900"
          _dark={{ color: "gray.100" }}
        >
          Question {currentIdx + 1}
        </Text>
        <Text fontSize="xs" color="gray.400" mb={4}>
          {currentQ.question_type.replace("_", " ")} · {currentQ.points} point
          {parseFloat(currentQ.points) !== 1 ? "s" : ""}
        </Text>
        <Text
          fontSize="md"
          mb={5}
          color="gray.800"
          _dark={{ color: "gray.200" }}
          whiteSpace="pre-wrap"
        >
          {currentQ.prompt}
        </Text>

        {/* Choices / Input */}
        {currentQ.question_type === "short_text" ? (
          <Input
            placeholder="Type your answer…"
            value={(answers[currentQ.id] as string) || ""}
            onChange={(e) => handleTextAnswer(currentQ.id, e.target.value)}
            size="md"
          />
        ) : (
          <VStack gap={2} align="stretch">
            {[...currentQ.choices]
              .sort((a, b) => a.position - b.position)
              .map((choice) => {
                const isSelected =
                  currentQ.question_type === "multiple_choice"
                    ? ((answers[currentQ.id] as string[]) || []).includes(
                        choice.id,
                      )
                    : answers[currentQ.id] === choice.id;

                return (
                  <Flex
                    key={choice.id}
                    px={4}
                    py={3}
                    rounded="lg"
                    cursor="pointer"
                    align="center"
                    gap={3}
                    borderWidth="1.5px"
                    borderColor={isSelected ? "brand.400" : "gray.200"}
                    bg={isSelected ? "brand.50" : "white"}
                    _dark={{
                      borderColor: isSelected ? "brand.500" : "gray.600",
                      bg: isSelected ? "brand.900" : "gray.800",
                    }}
                    _hover={{
                      borderColor: "brand.300",
                      _dark: { borderColor: "brand.600" },
                    }}
                    transition="all 0.15s"
                    onClick={() =>
                      handleSelectChoice(
                        currentQ.id,
                        choice.id,
                        currentQ.question_type,
                      )
                    }
                  >
                    <Icon
                      fontSize="md"
                      color={isSelected ? "brand.500" : "gray.400"}
                    >
                      {isSelected ? <LuCircleCheck /> : <LuCircle />}
                    </Icon>
                    <Text
                      fontSize="sm"
                      fontWeight={isSelected ? "600" : "normal"}
                      color={isSelected ? "brand.700" : "gray.700"}
                      _dark={{
                        color: isSelected ? "brand.300" : "gray.300",
                      }}
                    >
                      {choice.choice_text}
                    </Text>
                  </Flex>
                );
              })}
          </VStack>
        )}
      </Box>

      {/* Navigation */}
      <Flex justify="space-between" align="center">
        <Button
          variant="outline"
          size="sm"
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
        >
          Previous
        </Button>

        {currentIdx < questions.length - 1 ? (
          <Button
            colorPalette="brand"
            size="sm"
            onClick={() =>
              setCurrentIdx((p) => Math.min(questions.length - 1, p + 1))
            }
          >
            Next <LuChevronRight />
          </Button>
        ) : (
          <Button
            colorPalette="green"
            size="sm"
            onClick={handleSubmit}
            disabled={answeredCount === 0 || submitting}
            loading={submitting}
          >
            Submit Quiz
          </Button>
        )}
      </Flex>
    </Box>
  );
}
