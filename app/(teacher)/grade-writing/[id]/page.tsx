"use client";

import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Image,
  Input,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ieltsAnswersAPI } from "@/lib/ielts-api";

interface StudentInfo {
  user_id?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone?: string;
}

interface WritingTaskInfo {
  id?: string;
  task?: string;
  prompt?: string;
  image_url?: string | null;
  min_words?: number;
  suggested_time?: number;
}

interface WritingTaskItem {
  writingAnswerId: string;
  attemptId: string;
  submittedAt: string;
  task?: WritingTaskInfo;
  answerText?: string;
  wordCount?: number;
  feedback?: string | null;
}

interface WritingTaskGroup {
  student?: StudentInfo;
  writingTasks?: WritingTaskItem[];
}

interface AttemptsResultsResponse {
  writingTasksToGrade?: WritingTaskGroup[];
  pagination?: {
    writingTasksToGradeTotalPages?: number;
  };
}

interface GradeForm {
  task_response: string;
  lexical_resources: string;
  grammar_range_and_accuracy: string;
  coherence_and_cohesion: string;
  feedback: string;
}

interface SelectedTask extends WritingTaskItem {
  student?: StudentInfo;
}

const PAGE_LIMIT = 50;

const parseScore = (value: string) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return undefined;
  if (numeric < 0 || numeric > 9) return undefined;
  return numeric;
};

export default function GradeWritingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const writingAnswerId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedTask, setSelectedTask] = useState<SelectedTask | null>(null);
  const [form, setForm] = useState<GradeForm>({
    task_response: "",
    lexical_resources: "",
    grammar_range_and_accuracy: "",
    coherence_and_cohesion: "",
    feedback: "",
  });

  useEffect(() => {
    const findTask = async () => {
      if (!writingAnswerId || Array.isArray(writingAnswerId)) {
        setError("Invalid writing answer ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        let currentPage = 1;
        let totalPages = 1;
        let found: SelectedTask | null = null;

        while (currentPage <= totalPages && !found) {
          const response = (await ieltsAnswersAPI.getMyStudentsAttemptsResults({
            page: currentPage,
            limit: PAGE_LIMIT,
          })) as AttemptsResultsResponse;

          totalPages = Math.max(
            response?.pagination?.writingTasksToGradeTotalPages || 1,
            1,
          );

          const groups = Array.isArray(response?.writingTasksToGrade)
            ? response.writingTasksToGrade
            : [];

          for (const group of groups) {
            const tasks = Array.isArray(group?.writingTasks)
              ? group.writingTasks
              : [];
            const task = tasks.find(
              (item) => item.writingAnswerId === writingAnswerId,
            );
            if (task) {
              found = {
                ...task,
                student: group.student,
              };
              break;
            }
          }

          currentPage += 1;
        }

        if (!found) {
          setError("Writing answer not found.");
          setSelectedTask(null);
          return;
        }

        setSelectedTask(found);
      } catch {
        setError("Failed to load writing answer.");
        setSelectedTask(null);
      } finally {
        setLoading(false);
      }
    };

    findTask();
  }, [writingAnswerId]);

  const overallPreview = useMemo(() => {
    const values = [
      parseScore(form.task_response),
      parseScore(form.lexical_resources),
      parseScore(form.grammar_range_and_accuracy),
      parseScore(form.coherence_and_cohesion),
    ].filter((value): value is number => typeof value === "number");

    if (values.length !== 4) return "-";

    const avg = values.reduce((sum, value) => sum + value, 0) / 4;
    return Math.round(avg * 2) / 2;
  }, [form]);

  const onSubmit = async () => {
    if (!selectedTask?.writingAnswerId) return;

    const scorePayload = {
      task_response: parseScore(form.task_response),
      lexical_resources: parseScore(form.lexical_resources),
      grammar_range_and_accuracy: parseScore(form.grammar_range_and_accuracy),
      coherence_and_cohesion: parseScore(form.coherence_and_cohesion),
    };

    if (
      scorePayload.task_response === undefined ||
      scorePayload.lexical_resources === undefined ||
      scorePayload.grammar_range_and_accuracy === undefined ||
      scorePayload.coherence_and_cohesion === undefined
    ) {
      setError("All score fields are required and must be between 0 and 9.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await ieltsAnswersAPI.gradeWriting(selectedTask.writingAnswerId, {
        score: scorePayload,
        feedback: form.feedback.trim(),
      });

      setSuccess("Writing answer graded successfully.");
    } catch {
      setError("Failed to submit grade.");
    } finally {
      setSaving(false);
    }
  };

  const studentName = [
    selectedTask?.student?.first_name,
    selectedTask?.student?.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <ProtectedRoute>
      <Flex
        h="100vh"
        bg="gray.50"
        _dark={{ bg: "gray.900" }}
        direction={{ base: "column", lg: "row" }}
      >
        <Box display={{ base: "none", lg: "block" }}>
          <Sidebar />
        </Box>

        <Box
          flex="1"
          overflowY="auto"
          pb={{ base: "16", lg: "0" }}
          ml={{ base: 0, lg: "240px" }}
        >
          <Flex
            h={{ base: "14", md: "16" }}
            px={{ base: 4, md: 8 }}
            alignItems="center"
            justifyContent="space-between"
            bg="white"
            _dark={{ bg: "gray.800" }}
            borderBottomWidth="1px"
          >
            <Heading size={{ base: "sm", md: "md" }}>Grade Writing</Heading>
            <HStack gap={{ base: 2, md: 4 }}>
              <NotificationsDrawer />
            </HStack>
          </Flex>

          <Container
            maxW="7xl"
            py={{ base: 4, md: 6, lg: 8 }}
            px={{ base: 4, md: 6 }}
          >
            <VStack gap={6} alignItems="stretch">
              {loading ? (
                <Card.Root borderRadius="2xl" overflow="hidden">
                  <Card.Body p={{ base: 4, md: 6 }}>
                    <Flex justify="center" align="center" minH="260px">
                      <Spinner size="xl" color="brand.500" />
                    </Flex>
                  </Card.Body>
                </Card.Root>
              ) : error && !selectedTask ? (
                <Card.Root borderRadius="2xl" overflow="hidden">
                  <Card.Body p={{ base: 4, md: 6 }}>
                    <VStack alignItems="stretch" gap={4}>
                      <Text color="red.500">{error}</Text>
                      <HStack>
                        <Button
                          variant="outline"
                          onClick={() => router.push("/grade-writing")}
                        >
                          Back to list
                        </Button>
                      </HStack>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              ) : (
                <>
                  <Card.Root borderRadius="2xl" overflow="hidden">
                    <Card.Body p={{ base: 4, md: 6 }}>
                      <VStack alignItems="stretch" gap={4}>
                        <HStack justify="space-between" flexWrap="wrap" gap={3}>
                          <Box>
                            <Heading size={{ base: "md", md: "lg" }}>
                              {selectedTask?.task?.task || "Writing Task"}
                            </Heading>
                            <Text
                              color="gray.600"
                              _dark={{ color: "gray.400" }}
                            >
                              {studentName ||
                                selectedTask?.student?.username ||
                                "-"}
                            </Text>
                          </Box>
                          <Button
                            variant="outline"
                            onClick={() => router.push("/grade-writing")}
                          >
                            Back
                          </Button>
                        </HStack>

                        <Box
                          p={4}
                          rounded="lg"
                          bg="gray.50"
                          _dark={{ bg: "gray.800" }}
                          borderWidth="1px"
                        >
                          <Text
                            fontSize="sm"
                            color="gray.600"
                            _dark={{ color: "gray.400" }}
                            mb={2}
                          >
                            Prompt
                          </Text>
                          <Box
                            fontSize="sm"
                            dangerouslySetInnerHTML={{
                              __html: selectedTask?.task?.prompt || "-",
                            }}
                          />
                          {selectedTask?.task?.image_url ? (
                            <Image
                              src={selectedTask.task.image_url}
                              alt="Task"
                              mt={4}
                              rounded="md"
                              maxH="300px"
                              objectFit="contain"
                            />
                          ) : null}
                        </Box>

                        <Box
                          p={4}
                          rounded="lg"
                          bg="gray.50"
                          _dark={{ bg: "gray.800" }}
                          borderWidth="1px"
                        >
                          <Text
                            fontSize="sm"
                            color="gray.600"
                            _dark={{ color: "gray.400" }}
                            mb={2}
                          >
                            Student Answer
                          </Text>
                          <Text whiteSpace="pre-wrap">
                            {selectedTask?.answerText || "-"}
                          </Text>
                          <Text
                            mt={3}
                            fontSize="sm"
                            color="gray.600"
                            _dark={{ color: "gray.400" }}
                          >
                            Word Count: {selectedTask?.wordCount ?? 0}
                          </Text>
                        </Box>
                      </VStack>
                    </Card.Body>
                  </Card.Root>

                  <Card.Root borderRadius="2xl" overflow="hidden">
                    <Card.Body p={{ base: 4, md: 6 }}>
                      <VStack alignItems="stretch" gap={4}>
                        <Heading size={{ base: "sm", md: "md" }}>
                          Enter Scores
                        </Heading>

                        <Grid
                          templateColumns={{
                            base: "1fr",
                            md: "repeat(2, 1fr)",
                          }}
                          gap={4}
                        >
                          <Box>
                            <Text fontSize="sm" mb={1}>
                              Task Response (0-9)
                            </Text>
                            <Input
                              type="number"
                              min={0}
                              max={9}
                              step={0.5}
                              value={form.task_response}
                              onChange={(event) =>
                                setForm((prev) => ({
                                  ...prev,
                                  task_response: event.target.value,
                                }))
                              }
                            />
                          </Box>
                          <Box>
                            <Text fontSize="sm" mb={1}>
                              Lexical Resources (0-9)
                            </Text>
                            <Input
                              type="number"
                              min={0}
                              max={9}
                              step={0.5}
                              value={form.lexical_resources}
                              onChange={(event) =>
                                setForm((prev) => ({
                                  ...prev,
                                  lexical_resources: event.target.value,
                                }))
                              }
                            />
                          </Box>
                          <Box>
                            <Text fontSize="sm" mb={1}>
                              Grammar Range & Accuracy (0-9)
                            </Text>
                            <Input
                              type="number"
                              min={0}
                              max={9}
                              step={0.5}
                              value={form.grammar_range_and_accuracy}
                              onChange={(event) =>
                                setForm((prev) => ({
                                  ...prev,
                                  grammar_range_and_accuracy:
                                    event.target.value,
                                }))
                              }
                            />
                          </Box>
                          <Box>
                            <Text fontSize="sm" mb={1}>
                              Coherence & Cohesion (0-9)
                            </Text>
                            <Input
                              type="number"
                              min={0}
                              max={9}
                              step={0.5}
                              value={form.coherence_and_cohesion}
                              onChange={(event) =>
                                setForm((prev) => ({
                                  ...prev,
                                  coherence_and_cohesion: event.target.value,
                                }))
                              }
                            />
                          </Box>
                        </Grid>

                        <Box>
                          <Text fontSize="sm" mb={1}>
                            Feedback
                          </Text>
                          <Textarea
                            rows={6}
                            value={form.feedback}
                            onChange={(event) =>
                              setForm((prev) => ({
                                ...prev,
                                feedback: event.target.value,
                              }))
                            }
                            placeholder="Write detailed feedback for the student"
                          />
                        </Box>

                        <Text
                          fontSize="sm"
                          color="gray.600"
                          _dark={{ color: "gray.400" }}
                        >
                          Overall Preview: {overallPreview}
                        </Text>

                        {error ? <Text color="red.500">{error}</Text> : null}
                        {success ? (
                          <Text color="green.500">{success}</Text>
                        ) : null}

                        <HStack>
                          <Button onClick={onSubmit} loading={saving}>
                            Submit Grade
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => router.push("/grade-writing")}
                          >
                            Cancel
                          </Button>
                        </HStack>
                      </VStack>
                    </Card.Body>
                  </Card.Root>
                </>
              )}
            </VStack>
          </Container>
        </Box>

        <MobileBottomNav />
      </Flex>
    </ProtectedRoute>
  );
}
