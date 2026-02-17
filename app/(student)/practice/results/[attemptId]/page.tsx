"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Spinner,
  Badge,
  HStack,
  VStack,
  Grid,
  Card,
  Switch,
  Circle,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Target,
  Award,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import { ieltsAnswersAPI } from "@/lib/ielts-api";
import { ieltsWritingTasksAPI } from "@/lib/ielts-api";

interface QuestionResult {
  questionId: string;
  questionNumber: number;
  questionType: string;
  questionText: string | null;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean | null;
  points: number;
  earnedPoints: number | null;
  explanation: string | null;
  fromPassage: string | null;
  questionParts: unknown[];
  answerText: string | null;
  optionText: string | null;
}

interface WritingAnswerResult {
  taskId: string;
  taskNumber: number;
  answerText: string;
  wordCount: number;
  score: {
    task_response: number | null;
    lexical_resources: number | null;
    grammar_range_and_accuracy: number | null;
    coherence_and_cohesion: number | null;
    overall: number | null;
  } | null;
  feedback: string | null;
}

interface WritingTaskDetail {
  id: string;
  task: string;
  prompt: string | null;
  min_words: number | null;
  suggested_time: number | null;
  image_url: string | null;
}

interface AttemptResult {
  attemptId: string;
  scope?: string;
  partId?: string;
  part_id?: string;
  moduleId?: string;
  module_id?: string;
  testId?: string;
  test_id?: string;
  readingId?: string;
  listeningId?: string;
  userId: string;
  totalQuestions: number;
  correctAnswers: number;
  totalPoints: number;
  earnedPoints: number;
  score: number;
  ieltsBandScore: number;
  timeSpentMinutes: number;
  isCompleted: boolean;
  startedAt: string;
  completedAt: string | null;
  questionResults: QuestionResult[];
  writingAnswers: WritingAnswerResult[];
}

export default function ResultsPage() {
  return (
    <ProtectedRoute>
      <ResultsContent />
    </ProtectedRoute>
  );
}

function ResultsContent() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params?.attemptId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  const [writingTasks, setWritingTasks] = useState<
    Record<string, WritingTaskDetail>
  >({});

  useEffect(() => {
    if (!attemptId) return;

    const fetchResult = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await ieltsAnswersAPI.getAttemptResult(attemptId);
        const res = data?.data ?? data;
        setResult(res);

        // Fetch writing task details
        if (res?.writingAnswers?.length > 0) {
          const taskMap: Record<string, WritingTaskDetail> = {};
          await Promise.all(
            res.writingAnswers.map(async (wa: WritingAnswerResult) => {
              try {
                const taskData = await ieltsWritingTasksAPI.getById(wa.taskId);
                const task = taskData?.data ?? taskData;
                taskMap[wa.taskId] = task;
              } catch {
                // skip if task fetch fails
              }
            }),
          );
          setWritingTasks(taskMap);
        }
      } catch (err: unknown) {
        console.error("Failed to load results:", err);
        setError("Failed to load results. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId]);

  if (loading) {
    return (
      <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
        <Sidebar />
        <Box ml={{ base: 0, lg: "240px" }}>
          <Flex h="100vh" align="center" justify="center">
            <Spinner size="xl" color="blue.500" />
          </Flex>
        </Box>
      </Box>
    );
  }

  if (error || !result) {
    return (
      <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
        <Sidebar />
        <Box ml={{ base: 0, lg: "240px" }}>
          <Flex
            h="100vh"
            align="center"
            justify="center"
            direction="column"
            gap={4}
          >
            <Text color="red.500" fontSize="lg">
              {error || "Result not found"}
            </Text>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft size={16} />
              Go Back
            </Button>
          </Flex>
        </Box>
      </Box>
    );
  }

  const hasQuestions = result.questionResults.length > 0;
  const hasWriting = result.writingAnswers.length > 0;
  const scorePercent =
    result.totalPoints > 0
      ? Math.round((result.earnedPoints / result.totalPoints) * 100)
      : 0;

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
      <Sidebar />
      <Box ml={{ base: 0, lg: "240px" }} pb={{ base: "80px", lg: 0 }}>
        {/* Header Bar */}
        <Flex
          h="16"
          px={{ base: 4, md: 8 }}
          alignItems="center"
          justifyContent="space-between"
          bg="white"
          _dark={{ bg: "gray.800" }}
          borderBottomWidth="1px"
        >
          <HStack gap={3}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/practice/results")}
            >
              <ArrowLeft size={16} />
              Back
            </Button>
          </HStack>
        </Flex>

        <Box p={{ base: 4, md: 8 }} maxW="1000px" mx="auto">
          {/* Success Banner */}
          <Card.Root mb={8} overflow="hidden">
            <Box textAlign="center" py={8} px={6}>
              <Flex justify="center" mb={4}>
                <Flex
                  align="center"
                  justify="center"
                  w="64px"
                  h="64px"
                  borderRadius="full"
                  borderWidth="3px"
                  borderColor="green.400"
                  color="green.400"
                >
                  <CheckCircle2 size={36} />
                </Flex>
              </Flex>
              <Heading size="xl" mb={1}>
                Test Complete!
              </Heading>
              <Text color="gray.500" fontSize="sm">
                Here are your results
              </Text>
            </Box>

            {/* Score Section */}
            {hasQuestions && (
              <Box px={6} pb={6}>
                <Flex
                  justify="space-between"
                  align="center"
                  bg="gray.50"
                  _dark={{ bg: "gray.700" }}
                  px={5}
                  py={4}
                  borderRadius="lg"
                  mb={3}
                >
                  <Text fontWeight="medium" fontSize="md">
                    Your Score:
                  </Text>
                  <Text
                    fontWeight="bold"
                    fontSize="2xl"
                    color={
                      scorePercent >= 70
                        ? "green.500"
                        : scorePercent >= 50
                          ? "orange.500"
                          : "red.500"
                    }
                  >
                    {result.earnedPoints}/{result.totalPoints}
                  </Text>
                </Flex>

                {/* Progress bar */}
                <Box
                  w="100%"
                  h="8px"
                  bg="gray.200"
                  _dark={{ bg: "gray.600" }}
                  borderRadius="full"
                  overflow="hidden"
                  mb={4}
                >
                  <Box
                    h="100%"
                    w={`${scorePercent}%`}
                    bg={
                      scorePercent >= 70
                        ? "green.400"
                        : scorePercent >= 50
                          ? "orange.400"
                          : "red.400"
                    }
                    borderRadius="full"
                    transition="width 0.5s ease"
                  />
                </Box>

                {/* Stats Grid */}
                <Grid
                  templateColumns={{
                    base: "repeat(2, 1fr)",
                    md: "repeat(4, 1fr)",
                  }}
                  gap={4}
                >
                  <StatCard
                    icon={Award}
                    label="Band Score"
                    value={String(result.ieltsBandScore)}
                    color="purple.500"
                  />
                  <StatCard
                    icon={Target}
                    label="Accuracy"
                    value={`${scorePercent}%`}
                    color="blue.500"
                  />
                  <StatCard
                    icon={CheckCircle2}
                    label="Correct"
                    value={`${result.correctAnswers}/${result.totalQuestions}`}
                    color="green.500"
                  />
                  <StatCard
                    icon={Clock}
                    label="Time Spent"
                    value={`${result.timeSpentMinutes.toFixed(1)} min`}
                    color="orange.500"
                  />
                </Grid>
              </Box>
            )}

            {/* Writing Scores */}
            {hasWriting && (
              <Box px={6} pb={6}>
                <Heading size="md" mb={4}>
                  Writing Results
                </Heading>
                <VStack gap={4} align="stretch">
                  {result.writingAnswers.map((wa, idx) => (
                    <Card.Root key={wa.taskId} variant="outline">
                      <Card.Body>
                        <Flex justify="space-between" align="center" mb={3}>
                          <Text fontWeight="semibold">
                            Task {wa.taskNumber || idx + 1}
                            {writingTasks[wa.taskId]?.task && (
                              <Badge
                                ml={2}
                                colorPalette="purple"
                                fontSize="2xs"
                              >
                                {writingTasks[wa.taskId].task.replace("_", " ")}
                              </Badge>
                            )}
                          </Text>
                          <Badge colorPalette="blue">
                            {wa.wordCount} words
                          </Badge>
                        </Flex>

                        {/* Task Prompt */}
                        {writingTasks[wa.taskId]?.prompt && (
                          <Box
                            bg="blue.50"
                            _dark={{ bg: "blue.900/30" }}
                            p={4}
                            borderRadius="md"
                            mb={3}
                            borderLeftWidth="3px"
                            borderColor="blue.400"
                          >
                            <Text
                              fontSize="xs"
                              fontWeight="semibold"
                              color="blue.600"
                              _dark={{ color: "blue.300" }}
                              mb={1}
                            >
                              Task Prompt
                            </Text>
                            <Box
                              fontSize="sm"
                              color="gray.700"
                              _dark={{ color: "gray.300" }}
                              dangerouslySetInnerHTML={{
                                __html: writingTasks[wa.taskId].prompt!,
                              }}
                              css={{ "& p": { marginBottom: "0.5em" } }}
                            />
                          </Box>
                        )}

                        {/* User's Answer */}
                        {wa.answerText && (
                          <Box
                            bg="gray.50"
                            _dark={{ bg: "gray.700" }}
                            p={4}
                            borderRadius="md"
                            mb={3}
                          >
                            <Text
                              fontSize="xs"
                              fontWeight="semibold"
                              color="gray.500"
                              mb={1}
                            >
                              Your Answer
                            </Text>
                            <Text fontSize="sm" whiteSpace="pre-wrap">
                              {wa.answerText}
                            </Text>
                          </Box>
                        )}
                        {wa.score && (
                          <Grid templateColumns="repeat(2, 1fr)" gap={2} mb={2}>
                            <ScoreItem
                              label="Task Response"
                              value={wa.score.task_response}
                            />
                            <ScoreItem
                              label="Coherence"
                              value={wa.score.coherence_and_cohesion}
                            />
                            <ScoreItem
                              label="Lexical"
                              value={wa.score.lexical_resources}
                            />
                            <ScoreItem
                              label="Grammar"
                              value={wa.score.grammar_range_and_accuracy}
                            />
                            {wa.score.overall != null && (
                              <Box gridColumn="span 2">
                                <Flex
                                  justify="space-between"
                                  bg="blue.50"
                                  _dark={{ bg: "blue.900" }}
                                  px={3}
                                  py={2}
                                  borderRadius="md"
                                >
                                  <Text fontWeight="semibold" fontSize="sm">
                                    Overall Band
                                  </Text>
                                  <Text fontWeight="bold" color="blue.600">
                                    {wa.score.overall}
                                  </Text>
                                </Flex>
                              </Box>
                            )}
                          </Grid>
                        )}
                        {wa.feedback && (
                          <Box
                            bg="gray.50"
                            _dark={{ bg: "gray.700" }}
                            p={3}
                            borderRadius="md"
                          >
                            <Text fontSize="xs" fontWeight="semibold" mb={1}>
                              Feedback
                            </Text>
                            <Text fontSize="sm">{wa.feedback}</Text>
                          </Box>
                        )}
                        {!wa.score && !wa.feedback && (
                          <Text fontSize="sm" color="gray.500">
                            Not graded yet
                          </Text>
                        )}
                      </Card.Body>
                    </Card.Root>
                  ))}
                </VStack>
              </Box>
            )}
          </Card.Root>

          {/* Answer Sheet */}
          {hasQuestions && (
            <Card.Root>
              <Card.Body>
                <Flex justify="space-between" align="center" mb={6}>
                  <Heading size="md">Answer Sheet</Heading>
                  <HStack gap={2}>
                    <Text fontSize="sm" color="gray.500">
                      Show Correct Answers
                    </Text>
                    <Switch.Root
                      checked={showCorrectAnswers}
                      onCheckedChange={(e) => setShowCorrectAnswers(e.checked)}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                  </HStack>
                </Flex>

                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
                  {result.questionResults.map((qr) => (
                    <AnswerRow
                      key={qr.questionId}
                      questionNumber={qr.questionNumber}
                      userAnswer={qr.userAnswer}
                      correctAnswer={qr.correctAnswer}
                      isCorrect={qr.isCorrect}
                      showCorrectAnswers={showCorrectAnswers}
                    />
                  ))}
                </Grid>
              </Card.Body>
            </Card.Root>
          )}

          {/* Action Buttons */}
          <Flex justify="center" gap={4} mt={8} mb={4}>
            <Button
              colorPalette="brand"
              onClick={() => router.push("/practice")}
            >
              <RotateCcw size={16} />
              Practice More
            </Button>
          </Flex>
        </Box>
      </Box>
      <MobileBottomNav />
    </Box>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

function StatCard({
  icon: IconComp,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card.Root variant="outline">
      <Card.Body py={3} px={4}>
        <Flex align="center" gap={3}>
          <Flex
            align="center"
            justify="center"
            w="36px"
            h="36px"
            borderRadius="lg"
            bg={`${color.split(".")[0]}.50`}
            color={color}
          >
            <IconComp size={18} />
          </Flex>
          <Box>
            <Text fontSize="xs" color="gray.500">
              {label}
            </Text>
            <Text fontWeight="bold" fontSize="lg">
              {value}
            </Text>
          </Box>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}

function ScoreItem({ label, value }: { label: string; value: number | null }) {
  return (
    <Flex justify="space-between" px={3} py={1}>
      <Text fontSize="sm" color="gray.600">
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="semibold">
        {value != null ? value : "—"}
      </Text>
    </Flex>
  );
}

function AnswerRow({
  questionNumber,
  userAnswer,
  correctAnswer,
  isCorrect,
  showCorrectAnswers,
}: {
  questionNumber: number;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean | null;
  showCorrectAnswers: boolean;
}) {
  const answered = userAnswer != null && userAnswer !== "";
  const correct = isCorrect === true;
  const wrong = isCorrect === false;
  const unanswered = !answered;

  return (
    <Flex
      align="center"
      gap={3}
      bg={correct ? "green.50" : wrong ? "red.50" : "gray.50"}
      _dark={{
        bg: correct ? "green.900/30" : wrong ? "red.900/30" : "gray.700",
      }}
      px={4}
      py={3}
      borderRadius="lg"
    >
      {/* Question number badge */}
      <Circle
        size="28px"
        bg={correct ? "green.500" : wrong ? "red.500" : "gray.400"}
        color="white"
        fontSize="xs"
        fontWeight="bold"
        flexShrink={0}
      >
        {questionNumber}
      </Circle>

      {/* User answer */}
      <Text
        fontSize="sm"
        flex={1}
        fontWeight={answered ? "medium" : "normal"}
        color={unanswered ? "gray.400" : undefined}
      >
        {answered ? userAnswer : "N/A"}
      </Text>

      {/* Correct/Wrong icon */}
      {correct && (
        <CheckCircle2 size={16} color="var(--chakra-colors-green-500)" />
      )}
      {wrong && <XCircle size={16} color="var(--chakra-colors-red-500)" />}
      {unanswered && <XCircle size={16} color="var(--chakra-colors-red-500)" />}

      {/* Correct answer (when toggled) */}
      {showCorrectAnswers && !correct && (
        <Text fontSize="xs" color="green.600" fontWeight="semibold">
          (Correct: {correctAnswer})
        </Text>
      )}
    </Flex>
  );
}
