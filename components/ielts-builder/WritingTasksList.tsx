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
import { Plus, Trash2, Pencil } from "lucide-react";
import { ieltsWritingTasksAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type { PageId, IELTSWritingTask } from "./types";

interface WritingTasksListProps {
  onNavigate: (page: PageId, data?: Record<string, string>) => void;
}

export default function WritingTasksList({
  onNavigate,
}: WritingTasksListProps) {
  const [tasks, setTasks] = useState<IELTSWritingTask[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(() => {
    setLoading(true);
    ieltsWritingTasksAPI
      .getAll()
      .then((res: IELTSWritingTask[] | { data: IELTSWritingTask[] }) => {
        const list = Array.isArray(res) ? res : res.data || [];
        setTasks(list);
      })
      .catch(() => {
        toaster.error({ title: "Error loading writing tasks" });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    ieltsWritingTasksAPI
      .getAll()
      .then((res: IELTSWritingTask[] | { data: IELTSWritingTask[] }) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : res.data || [];
        setTasks(list);
      })
      .catch(() => {
        if (!cancelled) toaster.error({ title: "Error loading writing tasks" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await ieltsWritingTasksAPI.delete(id);
      toaster.success({ title: "Writing task deleted" });
      loadTasks();
    } catch {
      toaster.error({ title: "Error deleting task" });
    }
  };

  const truncateHtml = (html: string | undefined, n: number) => {
    if (!html) return "";
    const text = html.replace(/<[^>]+>/g, "");
    return text.length > n ? text.substring(0, n) + "..." : text;
  };

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="md" fontWeight="700">
          Writing Tasks
        </Heading>
        <Button
          size="sm"
          bg="#4f46e5"
          color="white"
          _hover={{ bg: "#3730a3" }}
          onClick={() => onNavigate("writing-task-form")}
        >
          <Plus size={14} /> Create Task
        </Button>
      </Flex>

      {loading ? (
        <Box py={12} textAlign="center" color="gray.400">
          <HStack gap={2} justifyContent="center">
            <Spinner size="sm" />
            <Text>Loading writing tasks...</Text>
          </HStack>
        </Box>
      ) : tasks.length === 0 ? (
        <Box textAlign="center" py={12} color="gray.400">
          <Text fontSize="4xl" mb={3}>
            📝
          </Text>
          <Heading size="sm" color="gray.500" mb={1}>
            No Writing Tasks
          </Heading>
          <Text fontSize="sm">
            Create tasks from a Writing section using the button above, or
            navigate to Writings first.
          </Text>
        </Box>
      ) : (
        <VStack gap={2} alignItems="stretch">
          {tasks.map((task) => (
            <Box
              key={task.id}
              bg="white"
              _dark={{ bg: "gray.800" }}
              borderWidth="1px"
              rounded="lg"
              px={4}
              py={3}
              shadow="sm"
            >
              <Flex justifyContent="space-between" alignItems="center">
                <HStack gap={3}>
                  <Badge
                    colorPalette={task.task === "TASK_1" ? "blue" : "purple"}
                    variant="subtle"
                    fontSize="xs"
                  >
                    {task.task === "TASK_1" ? "Task 1" : "Task 2"}
                  </Badge>
                  <Text fontSize="sm" fontWeight="500">
                    {truncateHtml(task.prompt, 80) || "No prompt"}
                  </Text>
                </HStack>
                <HStack gap={1}>
                  {task.min_words && (
                    <Text fontSize="xs" color="gray.400">
                      {task.min_words}+ words
                    </Text>
                  )}
                  <IconButton
                    size="xs"
                    colorPalette="blue"
                    variant="ghost"
                    onClick={() =>
                      onNavigate("writing-task-form", { editId: task.id })
                    }
                    aria-label="Edit task"
                  >
                    <Pencil size={14} />
                  </IconButton>
                  <IconButton
                    size="xs"
                    colorPalette="red"
                    variant="ghost"
                    onClick={() => handleDelete(task.id)}
                    aria-label="Delete task"
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </HStack>
              </Flex>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
}
