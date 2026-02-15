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
} from "@chakra-ui/react";
import { ArrowLeft, Clock, Send } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ieltsAPI } from "@/lib/api";

interface WritingTaskData {
  id: string;
  writing_id: string;
  task: string;
  prompt?: string;
  image_url?: string;
  min_words?: number;
  suggested_time?: number;
  title?: string;
}

/**
 * Single writing task practice page.
 * Route: /practice/writing/[id]
 * Loads a writing task by ID and renders the prompt + essay editor.
 */
export default function WritingTaskPracticePage() {
  return (
    <ProtectedRoute>
      <WritingTaskPracticeContent />
    </ProtectedRoute>
  );
}

function WritingTaskPracticeContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskData, setTaskData] = useState<WritingTaskData | null>(null);
  const [essay, setEssay] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await ieltsAPI.getWritingTaskById(id);
        const task = data?.data ?? data;

        if (!task) {
          setError("Writing task not found");
          return;
        }

        setTaskData(task);
      } catch (err: unknown) {
        console.error("Failed to load writing task:", err);
        setError("Failed to load writing task. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleEssayChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setEssay(text);
    const words = text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    setWordCount(words.length);
  };

  const handleSubmit = () => {
    console.log("Submitted essay:", { taskId: id, essay, wordCount });
    setIsSubmitted(true);
    // TODO: Submit essay to API
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

  if (error || !taskData) {
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
          {error || "Writing task not found."}
        </Text>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft size={16} />
          Go Back
        </Button>
      </Flex>
    );
  }

  const taskLabel = taskData.task
    ? `Task ${taskData.task.replace("TASK_", "")}`
    : "Task";

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
          <Badge colorPalette="green" variant="subtle" fontSize="xs">
            {taskLabel}
          </Badge>
        </HStack>

        <HStack gap={3}>
          {taskData.suggested_time && (
            <HStack gap={1} color="gray.500" fontSize="sm">
              <Clock size={14} />
              <Text>{taskData.suggested_time} min</Text>
            </HStack>
          )}
          {taskData.min_words && (
            <Badge
              colorPalette={wordCount >= taskData.min_words ? "green" : "gray"}
              variant="subtle"
              fontSize="xs"
            >
              {wordCount}/{taskData.min_words} words
            </Badge>
          )}
        </HStack>
      </Flex>

      {/* Content */}
      <Box maxW="900px" mx="auto" p={{ base: 4, md: 8 }}>
        {/* Task heading */}
        <Heading size="lg" mb={4}>
          Writing {taskLabel}
        </Heading>

        {/* Prompt */}
        {taskData.prompt && (
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
              dangerouslySetInnerHTML={{ __html: taskData.prompt }}
            />
          </Box>
        )}

        {/* Image (for Task 1 graphs/charts) */}
        {taskData.image_url && (
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
              src={taskData.image_url}
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
          mb={6}
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
            value={essay}
            onChange={handleEssayChange}
            placeholder="Write your essay here..."
            minH="300px"
            resize="vertical"
            fontSize="md"
            lineHeight="tall"
            disabled={isSubmitted}
            borderColor="gray.200"
            _dark={{ borderColor: "gray.600" }}
          />
          <HStack justify="space-between" mt={3}>
            <Text fontSize="sm" color="gray.500">
              Word count: <strong>{wordCount}</strong>
              {taskData.min_words ? ` / ${taskData.min_words} minimum` : ""}
            </Text>
            <Button
              colorPalette="brand"
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitted || wordCount === 0}
            >
              <Send size={14} />
              {isSubmitted ? "Submitted" : "Submit"}
            </Button>
          </HStack>
        </Box>
      </Box>
    </Box>
  );
}
