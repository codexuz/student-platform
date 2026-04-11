"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Button,
  Spinner,
  Badge,
  HStack,
  VStack,
  Separator,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  FileText,
  PenLine,
  MessageSquareText,
  BarChart3,
  Clock,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ieltsAnswersAPI, ieltsWritingTasksAPI } from "@/lib/ielts-api";
import type {
  AttemptResult,
  WritingAnswerResult,
  WritingTaskDetail,
} from "@/components/practice-test/review/types";

export default function WritingReviewPage() {
  return (
    <ProtectedRoute>
      <WritingReviewContent />
    </ProtectedRoute>
  );
}

function WritingReviewContent() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params?.attemptId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [writingTasks, setWritingTasks] = useState<
    Record<string, WritingTaskDetail>
  >({});
  const [currentTask, setCurrentTask] = useState(0);

  useEffect(() => {
    if (!attemptId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await ieltsAnswersAPI.getAttemptResult(attemptId);
        const attemptResult: AttemptResult = data?.data ?? data;
        setResult(attemptResult);

        if (attemptResult.writingAnswers?.length > 0) {
          const taskMap: Record<string, WritingTaskDetail> = {};
          await Promise.all(
            attemptResult.writingAnswers.map(
              async (wa: WritingAnswerResult) => {
                try {
                  const taskData = await ieltsWritingTasksAPI.getById(
                    wa.taskId,
                  );
                  const task = taskData?.data ?? taskData;
                  taskMap[wa.taskId] = task;
                } catch {
                  // skip if task fetch fails
                }
              },
            ),
          );
          setWritingTasks(taskMap);
        }
      } catch (err: unknown) {
        console.error("Failed to load writing review:", err);
        setError("Failed to load review data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [attemptId]);

  if (loading) {
    return (
      <Flex
        h="100vh"
        align="center"
        justify="center"
        bg="gray.50"
        _dark={{ bg: "gray.900" }}
      >
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  if (error || !result) {
    return (
      <Flex
        h="100vh"
        align="center"
        justify="center"
        direction="column"
        gap={4}
        bg="gray.50"
        _dark={{ bg: "gray.900" }}
      >
        <Text color="red.500" fontSize="lg">
          {error || "Result not found"}
        </Text>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft size={16} />
          Go Back
        </Button>
      </Flex>
    );
  }

  const sortedAnswers = [...result.writingAnswers].sort((a, b) => {
    const taskA = writingTasks[a.taskId]?.task ?? "";
    const taskB = writingTasks[b.taskId]?.task ?? "";
    return taskA.localeCompare(taskB);
  });
  const wa = sortedAnswers[currentTask];
  const taskDetail = wa ? writingTasks[wa.taskId] : undefined;
  const totalTasks = sortedAnswers.length;

  return (
    <Flex direction="column" h="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
      {/* ─── Compact Header ─── */}
      <Flex
        h="12"
        px={{ base: 3, md: 5 }}
        alignItems="center"
        justifyContent="space-between"
        bg="white"
        _dark={{ bg: "gray.800" }}
        borderBottomWidth="1px"
        borderColor="gray.200"
        flexShrink={0}
      >
        <HStack gap={2}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/practice/results")}
            px={2}
          >
            <ArrowLeft size={16} />
            <Text ml={1} display={{ base: "none", sm: "inline" }}>
              Back
            </Text>
          </Button>
          <Separator orientation="vertical" h="5" />
          <Badge
            bg="red.500"
            color="white"
            px={2.5}
            py={0.5}
            borderRadius="md"
            fontWeight="bold"
            fontSize="xs"
          >
            IELTS
          </Badge>
          <Text fontSize="sm" fontWeight="semibold" color="gray.700" _dark={{ color: "gray.200" }}>
            Writing Review
          </Text>
        </HStack>

        {wa?.score?.overall != null && (
          <HStack gap={1.5}>
            <Text fontSize="xs" color="gray.500">Band</Text>
            <Flex
              align="center"
              justify="center"
              bg="blue.500"
              color="white"
              borderRadius="lg"
              px={2.5}
              py={0.5}
              fontWeight="bold"
              fontSize="sm"
            >
              {wa.score.overall}
            </Flex>
          </HStack>
        )}
      </Flex>

      {/* ─── Main Scrollable Content ─── */}
      {wa && (
        <Box flex={1} overflowY="auto" px={{ base: 3, md: 6, lg: 8 }} py={{ base: 4, md: 6 }}>
          {/* Score Breakdown Strip */}
          {wa.score && (
            <Flex
              mb={5}
              p={4}
              bg="white"
              _dark={{ bg: "gray.800" }}
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              gap={{ base: 3, md: 4 }}
              flexWrap="wrap"
              align="center"
              justify="center"
            >
              <ScorePill
                icon={<BarChart3 size={14} />}
                label="Task Response"
                value={wa.score.task_response}
              />
              <Separator orientation="vertical" h="10" display={{ base: "none", md: "block" }} />
              <ScorePill
                icon={<MessageSquareText size={14} />}
                label="Coherence & Cohesion"
                value={wa.score.coherence_and_cohesion}
              />
              <Separator orientation="vertical" h="10" display={{ base: "none", md: "block" }} />
              <ScorePill
                icon={<FileText size={14} />}
                label="Lexical Resource"
                value={wa.score.lexical_resources}
              />
              <Separator orientation="vertical" h="10" display={{ base: "none", md: "block" }} />
              <ScorePill
                icon={<PenLine size={14} />}
                label="Grammar & Accuracy"
                value={wa.score.grammar_range_and_accuracy}
              />
              {wa.score.overall != null && (
                <>
                  <Separator orientation="vertical" h="10" display={{ base: "none", md: "block" }} />
                  <ScorePill
                    label="Overall"
                    value={wa.score.overall}
                    highlight
                  />
                </>
              )}
            </Flex>
          )}

          {/* ─── Two-Column Grid: Prompt | Essay ─── */}
          <Grid
            templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
            gap={{ base: 4, md: 5 }}
            mb={5}
          >
            {/* Left Column — Task Prompt */}
            <Box
              bg="white"
              _dark={{ bg: "gray.800" }}
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              overflow="hidden"
              display="flex"
              flexDirection="column"
            >
              <Flex
                px={5}
                py={3}
                borderBottomWidth="1px"
                borderColor="gray.100"
                align="center"
                gap={2}
                bg="gray.50"
                _dark={{ bg: "gray.750" }}
              >
                <FileText size={16} color="var(--chakra-colors-blue-500)" />
                <Text fontSize="sm" fontWeight="semibold" color="gray.700" _dark={{ color: "gray.200" }}>
                  Task Prompt
                </Text>
                {taskDetail?.task && (
                  <Badge colorPalette="purple" fontSize="2xs" ml="auto">
                    {taskDetail.task.replace("_", " ")}
                  </Badge>
                )}
                {taskDetail?.min_words && (
                  <Badge colorPalette="blue" fontSize="2xs" variant="outline">
                    Min {taskDetail.min_words} words
                  </Badge>
                )}
              </Flex>
              <Box px={5} py={4} flex={1} overflowY="auto">
                {taskDetail?.prompt ? (
                  <Box
                    fontSize="sm"
                    lineHeight="1.8"
                    color="gray.700"
                    _dark={{ color: "gray.300" }}
                    dangerouslySetInnerHTML={{ __html: taskDetail.prompt }}
                    css={{
                      "& p": { marginBottom: "0.75em" },
                      "& strong": { fontWeight: "bold" },
                    }}
                  />
                ) : (
                  <Text fontSize="sm" color="gray.400" fontStyle="italic">
                    Task prompt not available.
                  </Text>
                )}
                {taskDetail?.image_url && (
                  <Box mt={4} position="relative">
                    <Image
                      src={taskDetail.image_url}
                      alt="Task visual"
                      width={800}
                      height={500}
                      style={{
                        maxWidth: "100%",
                        height: "auto",
                        borderRadius: "8px",
                        border: "1px solid var(--chakra-colors-gray-200)",
                      }}
                      unoptimized
                    />
                  </Box>
                )}
              </Box>
            </Box>

            {/* Right Column — Student's Response */}
            <Box
              bg="white"
              _dark={{ bg: "gray.800" }}
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              overflow="hidden"
              display="flex"
              flexDirection="column"
            >
              <Flex
                px={5}
                py={3}
                borderBottomWidth="1px"
                borderColor="gray.100"
                align="center"
                gap={2}
                bg="gray.50"
                _dark={{ bg: "gray.750" }}
              >
                <PenLine size={16} color="var(--chakra-colors-green-500)" />
                <Text fontSize="sm" fontWeight="semibold" color="gray.700" _dark={{ color: "gray.200" }}>
                  Your Response
                </Text>
                <HStack ml="auto" gap={2}>
                  <Badge colorPalette="blue" fontSize="2xs">
                    {wa.wordCount} words
                  </Badge>
                </HStack>
              </Flex>
              <Box px={5} py={4} flex={1} overflowY="auto">
                <Box
                  fontSize="sm"
                  lineHeight="2"
                  whiteSpace="pre-wrap"
                  color="gray.800"
                  _dark={{ color: "gray.200" }}
                  fontFamily="Georgia, 'Times New Roman', serif"
                >
                  {wa.answerText}
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* ─── Feedback Section ─── */}
          {wa.feedback && (
            <Box
              mb={5}
              bg="white"
              _dark={{ bg: "gray.800" }}
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
              overflow="hidden"
            >
              <Flex
                px={5}
                py={3}
                borderBottomWidth="1px"
                borderColor="gray.100"
                align="center"
                gap={2}
                bg="gray.50"
                _dark={{ bg: "gray.750" }}
              >
                <MessageSquareText size={16} color="var(--chakra-colors-orange-500)" />
                <Text fontSize="sm" fontWeight="semibold" color="gray.700" _dark={{ color: "gray.200" }}>
                  Examiner Feedback
                </Text>
              </Flex>
              <Box px={5} py={4}>
                <Text fontSize="sm" lineHeight="1.8" color="gray.700" _dark={{ color: "gray.300" }}>
                  {wa.feedback}
                </Text>
              </Box>
            </Box>
          )}

          {/* Not graded notice */}
          {!wa.score && !wa.feedback && (
            <Flex
              mb={5}
              p={6}
              bg="white"
              _dark={{ bg: "gray.800" }}
              borderRadius="xl"
              borderWidth="1px"
              borderColor="orange.200"
              align="center"
              justify="center"
              gap={3}
              direction="column"
            >
              <Flex
                w="12"
                h="12"
                borderRadius="full"
                bg="orange.50"
                _dark={{ bg: "orange.900/30" }}
                align="center"
                justify="center"
              >
                <Clock size={24} color="var(--chakra-colors-orange-400)" />
              </Flex>
              <Text color="gray.500" fontSize="sm" fontWeight="medium">
                This task has not been graded yet.
              </Text>
            </Flex>
          )}
        </Box>
      )}

      {/* ─── Footer: Task Navigation ─── */}
      {totalTasks > 1 && (
        <Flex
          bg="white"
          _dark={{ bg: "gray.800" }}
          borderTopWidth="1px"
          borderColor="gray.300"
          flexShrink={0}
          h="11"
        >
          {sortedAnswers.map((w, idx) => {
            const isActive = idx === currentTask;
            const taskScore = w.score?.overall;
            const taskName = writingTasks[w.taskId]?.task;
            const label = taskName
              ? taskName.replace("TASK_", "Part ")
              : `Part ${idx + 1}`;
            return (
              <Flex
                key={w.taskId}
                flex={1}
                align="center"
                justify="center"
                gap={2}
                cursor="pointer"
                onClick={() => setCurrentTask(idx)}
                fontWeight={isActive ? "bold" : "normal"}
                fontSize="sm"
                color={isActive ? "gray.900" : "gray.500"}
                _dark={{
                  color: isActive ? "white" : "gray.400",
                }}
                bg={isActive ? "white" : "gray.50"}
                _hover={{ bg: isActive ? "white" : "gray.100" }}
                borderTopWidth={isActive ? "3px" : "0px"}
                borderTopColor="blue.500"
                borderRightWidth={idx < totalTasks - 1 ? "1px" : "0px"}
                borderRightColor="gray.200"
                transition="all 0.15s"
              >
                <Text>{label}</Text>
                {taskScore != null && !isActive && (
                  <Text fontSize="xs" color="gray.400">
                    {taskScore}
                  </Text>
                )}
                {taskScore != null && isActive && (
                  <Badge
                    fontSize="2xs"
                    colorPalette={taskScore >= 6.5 ? "green" : taskScore >= 5 ? "orange" : "red"}
                  >
                    {taskScore}
                  </Badge>
                )}
              </Flex>
            );
          })}
        </Flex>
      )}
    </Flex>
  );
}

// ─── Score Pill ────────────────────────────────────────────────────────────

function ScorePill({
  label,
  value,
  highlight = false,
  icon,
}: {
  label: string;
  value: number | null;
  highlight?: boolean;
  icon?: React.ReactNode;
}) {
  const score = value ?? 0;
  const color =
    highlight
      ? "blue"
      : score >= 7
        ? "green"
        : score >= 5.5
          ? "orange"
          : score > 0
            ? "red"
            : "gray";

  return (
    <VStack gap={0.5} minW="80px" textAlign="center">
      <Text
        fontSize="2xl"
        fontWeight="bold"
        color={highlight ? `${color}.600` : value != null ? `${color}.500` : "gray.300"}
        lineHeight="1"
      >
        {value != null ? value : "—"}
      </Text>
      <HStack gap={1}>
        {icon && (
          <Box color="gray.400">{icon}</Box>
        )}
        <Text fontSize="xs" color="gray.500" lineHeight="1.2">
          {label}
        </Text>
      </HStack>
    </VStack>
  );
}
