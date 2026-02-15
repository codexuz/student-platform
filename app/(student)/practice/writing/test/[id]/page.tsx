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
  Textarea,
  HStack,
  Image,
  Tabs,
} from "@chakra-ui/react";
import { ArrowLeft, Clock, Send } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ieltsAPI } from "@/lib/api";

interface WritingTaskData {
  id: string;
  task: string;
  prompt?: string;
  image_url?: string;
  min_words?: number;
  suggested_time?: number;
}

interface WritingData {
  id: string;
  title: string;
  description?: string;
  tasks?: WritingTaskData[];
}

/**
 * Full writing test practice page.
 * Route: /practice/writing/test/[id]
 * Loads a writing test by ID and renders all its tasks.
 */
export default function WritingTestPracticePage() {
  return (
    <ProtectedRoute>
      <WritingTestPracticeContent />
    </ProtectedRoute>
  );
}

function WritingTestPracticeContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [writing, setWriting] = useState<WritingData | null>(null);
  const [essays, setEssays] = useState<Record<string, string>>({});
  const [wordCounts, setWordCounts] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await ieltsAPI.getWritingTestById(id);
        const result = data?.data ?? data;

        if (!result) {
          setError("Writing test not found");
          return;
        }

        setWriting(result);
      } catch (err: unknown) {
        console.error("Failed to load writing test:", err);
        setError("Failed to load writing test. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleEssayChange = (
    taskId: string,
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const text = e.target.value;
    setEssays((prev) => ({ ...prev, [taskId]: text }));
    const words = text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    setWordCounts((prev) => ({ ...prev, [taskId]: words.length }));
  };

  const handleSubmitTask = (taskId: string) => {
    console.log("Submitted essay:", {
      writingId: id,
      taskId,
      essay: essays[taskId],
      wordCount: wordCounts[taskId],
    });
    setSubmitted((prev) => ({ ...prev, [taskId]: true }));
  };

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

  if (error || !writing || !writing.tasks?.length) {
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
          {error || "No writing tasks found in this test."}
        </Text>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft size={16} />
          Go Back
        </Button>
      </Flex>
    );
  }

  const sortedTasks = [...writing.tasks].sort((a, b) =>
    a.task.localeCompare(b.task),
  );

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
      {/* Header */}
      <Flex
        h="14"
        px={{ base: 4, md: 6 }}
        alignItems="center"
        justifyContent="space-between"
        bg="white"
        _dark={{ bg: "gray.800" }}
        borderBottomWidth="1px"
        position="sticky"
        top={0}
        zIndex={20}
      >
        <HStack gap={3}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            px={2}
          >
            <ArrowLeft size={18} />
            <Text ml={1} display={{ base: "none", sm: "inline" }}>
              Back
            </Text>
          </Button>
          <Badge
            bg="red.500"
            color="white"
            px={3}
            py={1}
            borderRadius="md"
            fontWeight="bold"
            fontSize="sm"
          >
            IELTS
          </Badge>
        </HStack>

        <Text
          fontWeight="semibold"
          fontSize="sm"
          color="gray.600"
          _dark={{ color: "gray.300" }}
        >
          {writing.title}
        </Text>
      </Flex>

      {/* Content with tabs */}
      <Box maxW="900px" mx="auto" p={{ base: 4, md: 8 }}>
        <Heading size="lg" mb={6}>
          Writing Test
        </Heading>

        <Tabs.Root defaultValue={sortedTasks[0]?.id}>
          <Tabs.List mb={6}>
            {sortedTasks.map((task) => {
              const label = task.task
                ? `Task ${task.task.replace("TASK_", "")}`
                : "Task";
              return (
                <Tabs.Trigger key={task.id} value={task.id}>
                  {label}
                  {submitted[task.id] && (
                    <Badge
                      colorPalette="green"
                      variant="subtle"
                      fontSize="xs"
                      ml={2}
                    >
                      Done
                    </Badge>
                  )}
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>

          {sortedTasks.map((task) => {
            const taskLabel = task.task
              ? `Task ${task.task.replace("TASK_", "")}`
              : "Task";
            const wc = wordCounts[task.id] || 0;
            const isTaskSubmitted = submitted[task.id] || false;

            return (
              <Tabs.Content key={task.id} value={task.id}>
                {/* Meta */}
                <HStack gap={3} mb={4}>
                  <Badge colorPalette="green" variant="subtle" fontSize="xs">
                    {taskLabel}
                  </Badge>
                  {task.suggested_time && (
                    <HStack gap={1} color="gray.500" fontSize="sm">
                      <Clock size={14} />
                      <Text>{task.suggested_time} min</Text>
                    </HStack>
                  )}
                  {task.min_words && (
                    <Badge
                      colorPalette={wc >= task.min_words ? "green" : "gray"}
                      variant="subtle"
                      fontSize="xs"
                    >
                      {wc}/{task.min_words} words
                    </Badge>
                  )}
                </HStack>

                {/* Prompt */}
                {task.prompt && (
                  <Box
                    bg="white"
                    _dark={{ bg: "gray.800" }}
                    p={6}
                    borderRadius="xl"
                    borderWidth="1px"
                    mb={6}
                  >
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      color="gray.500"
                      mb={2}
                      textTransform="uppercase"
                      letterSpacing="wide"
                    >
                      Task Prompt
                    </Text>
                    <Box
                      fontSize="md"
                      lineHeight="tall"
                      dangerouslySetInnerHTML={{ __html: task.prompt }}
                    />
                  </Box>
                )}

                {/* Image */}
                {task.image_url && (
                  <Box
                    bg="white"
                    _dark={{ bg: "gray.800" }}
                    p={4}
                    borderRadius="xl"
                    borderWidth="1px"
                    mb={6}
                    textAlign="center"
                  >
                    <Image
                      src={task.image_url}
                      alt="Task image"
                      maxH="400px"
                      mx="auto"
                      borderRadius="md"
                    />
                  </Box>
                )}

                {/* Essay input */}
                <Box
                  bg="white"
                  _dark={{ bg: "gray.800" }}
                  p={6}
                  borderRadius="xl"
                  borderWidth="1px"
                >
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    color="gray.500"
                    mb={3}
                    textTransform="uppercase"
                    letterSpacing="wide"
                  >
                    Your Response
                  </Text>
                  <Textarea
                    value={essays[task.id] || ""}
                    onChange={(e) => handleEssayChange(task.id, e)}
                    placeholder="Write your essay here..."
                    minH="300px"
                    resize="vertical"
                    fontSize="md"
                    lineHeight="tall"
                    disabled={isTaskSubmitted}
                    borderColor="gray.200"
                    _dark={{ borderColor: "gray.600" }}
                  />
                  <HStack justify="space-between" mt={3}>
                    <Text fontSize="sm" color="gray.500">
                      Word count: <strong>{wc}</strong>
                      {task.min_words ? ` / ${task.min_words} minimum` : ""}
                    </Text>
                    <Button
                      colorPalette="brand"
                      size="sm"
                      onClick={() => handleSubmitTask(task.id)}
                      disabled={isTaskSubmitted || wc === 0}
                    >
                      <Send size={14} />
                      {isTaskSubmitted ? "Submitted" : "Submit"}
                    </Button>
                  </HStack>
                </Box>
              </Tabs.Content>
            );
          })}
        </Tabs.Root>
      </Box>
    </Box>
  );
}
