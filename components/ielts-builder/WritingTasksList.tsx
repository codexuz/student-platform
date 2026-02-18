"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  Input,
  NativeSelect,
} from "@chakra-ui/react";
import { Plus, Trash2, Pencil, Eye } from "lucide-react";
import Link from "next/link";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [taskFilter, setTaskFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [writingFilter, setWritingFilter] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

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

  const writingOptions = useMemo(
    () =>
      [
        ...new Map(
          tasks
            .filter((t) => t.writing?.title)
            .map((t) => [t.writing_id, t.writing!.title]),
        ).entries(),
      ].map(([id, title]) => ({ id, title })),
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (taskFilter) result = result.filter((t) => t.task === taskFilter);
    if (modeFilter) result = result.filter((t) => t.mode === modeFilter);
    if (writingFilter)
      result = result.filter((t) => t.writing_id === writingFilter);

    const query = searchTerm.trim().toLowerCase();
    if (query) {
      result = result.filter((task) => {
        const promptText = task.prompt?.replace(/<[^>]+>/g, "") || "";
        return [task.id, task.task, task.mode, task.writing?.title, promptText]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      });
    }

    return result;
  }, [tasks, searchTerm, taskFilter, modeFilter, writingFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE));
  const paginatedTasks = filteredTasks.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, taskFilter, modeFilter, writingFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);
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

      <Flex mb={3} gap={2} flexWrap="wrap" alignItems="center">
        <Input
          maxW="220px"
          size="sm"
          placeholder="Search writing tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <NativeSelect.Root size="sm" width="130px">
          <NativeSelect.Field
            value={taskFilter}
            onChange={(e) => setTaskFilter(e.target.value)}
          >
            <option value="">All Tasks</option>
            <option value="TASK_1">Task 1</option>
            <option value="TASK_2">Task 2</option>
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        <NativeSelect.Root size="sm" width="140px">
          <NativeSelect.Field
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
          >
            <option value="">All Modes</option>
            <option value="practice">Practice</option>
            <option value="mock">Mock</option>
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        {writingOptions.length > 0 && (
          <NativeSelect.Root size="sm" width="180px">
            <NativeSelect.Field
              value={writingFilter}
              onChange={(e) => setWritingFilter(e.target.value)}
            >
              <option value="">All Writings</option>
              {writingOptions.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        )}
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
      ) : filteredTasks.length === 0 ? (
        <Box textAlign="center" py={12} color="gray.400">
          <Heading size="sm" color="gray.500">
            No matching writing tasks
          </Heading>
        </Box>
      ) : (
        <VStack gap={2} alignItems="stretch">
          {paginatedTasks.map((task) => (
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
                  <Badge
                    colorPalette={task.mode === "mock" ? "purple" : "blue"}
                    variant="subtle"
                    fontSize="xs"
                  >
                    {task.mode === "mock" ? "Mock" : "Practice"}
                  </Badge>
                  <Text fontSize="sm" fontWeight="500">
                    {truncateHtml(task.prompt, 80) || "No prompt"}
                  </Text>
                  {task.writing?.title && task.writing_id ? (
                    <Link
                      href={`/ielts-test-builder/writings/${task.writing_id}/edit`}
                      style={{
                        color: "#4f46e5",
                        fontWeight: 500,
                        textDecoration: "none",
                        fontSize: "12px",
                      }}
                    >
                      {task.writing.title}
                    </Link>
                  ) : null}
                </HStack>
                <HStack gap={1}>
                  {task.min_words && (
                    <Text fontSize="xs" color="gray.400">
                      {task.min_words}+ words
                    </Text>
                  )}
                  <IconButton
                    size="xs"
                    colorPalette="green"
                    variant="ghost"
                    onClick={() =>
                      window.open(`/practice/writing/${task.id}`, "_blank")
                    }
                    aria-label="Preview"
                    title="Preview as student"
                  >
                    <Eye size={14} />
                  </IconButton>
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
          <Flex
            px={2}
            py={2}
            alignItems="center"
            justifyContent="space-between"
            gap={3}
          >
            <Text fontSize="xs" color="gray.500">
              Showing {(page - 1) * PAGE_SIZE + 1}-
              {Math.min(page * PAGE_SIZE, filteredTasks.length)} of{" "}
              {filteredTasks.length}
            </Text>
            <HStack gap={2}>
              <Button
                size="xs"
                variant="outline"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Prev
              </Button>
              <Text fontSize="xs" color="gray.500">
                Page {page} / {totalPages}
              </Text>
              <Button
                size="xs"
                variant="outline"
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </HStack>
          </Flex>
        </VStack>
      )}
    </Box>
  );
}
