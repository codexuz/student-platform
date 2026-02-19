"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Text,
  Badge,
  IconButton,
  Spinner,
  Input,
  NativeSelect,
  Pagination,
  ButtonGroup,
} from "@chakra-ui/react";
import {
  Plus,
  Trash2,
  Pencil,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ieltsWritingTasksAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type { PageId, IELTSWritingTask } from "./types";

interface WritingTasksListProps {
  onNavigate: (page: PageId, data?: Record<string, string>) => void;
}

export default function WritingTasksList({
  onNavigate,
}: WritingTasksListProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<IELTSWritingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [taskFilter, setTaskFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 10;

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    async (currentPage: number, search: string, task: string, mode: string) => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = {
          page: currentPage,
          limit: PAGE_SIZE,
        };
        if (search.trim()) params.search = search.trim();
        if (task) params.task = task;
        if (mode) params.mode = mode;

        const res = await ieltsWritingTasksAPI.getAll(params);
        setTasks(res?.data || []);
        setTotal(res?.total || 0);
      } catch {
        toaster.error({ title: "Error loading writing tasks" });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Reload when page changes
  useEffect(() => {
    load(page, searchTerm, taskFilter, modeFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, load]);

  // Debounced search / filter: reset to page 1
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      load(1, searchTerm, taskFilter, modeFilter);
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchTerm, taskFilter, modeFilter, load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this writing task?")) return;
    try {
      await ieltsWritingTasksAPI.delete(id);
      toaster.success({ title: "Writing task deleted" });
      load(page, searchTerm, taskFilter, modeFilter);
    } catch {
      toaster.error({ title: "Error deleting task" });
    }
  };

  const truncateHtml = (html: string | undefined, n: number) => {
    if (!html) return "";
    const text = html.replace(/<[^>]+>/g, "");
    return text.length > n ? text.substring(0, n) + "..." : text;
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toaster.success({ title: "ID copied!" });
  };

  const truncId = (id: string) => (id ? id.substring(0, 8) + "..." : "-");

  if (loading && tasks.length === 0)
    return (
      <Flex justifyContent="center" py={12}>
        <Spinner size="lg" color="#4f46e5" />
      </Flex>
    );

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
      </Flex>

      {tasks.length === 0 && !searchTerm && !taskFilter && !modeFilter ? (
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
      ) : tasks.length === 0 ? (
        <Box textAlign="center" py={12} color="gray.400">
          <Heading size="sm" color="gray.500">
            No matching writing tasks
          </Heading>
        </Box>
      ) : (
        <Box
          bg="white"
          _dark={{ bg: "gray.800" }}
          rounded="lg"
          borderWidth="1px"
          shadow="sm"
          overflow="hidden"
        >
          <Box overflowX="auto">
            <Box as="table" w="full" fontSize="sm">
              <Box as="thead">
                <Box as="tr">
                  {[
                    "Prompt",
                    "Task",
                    "Mode",
                    "Writing",
                    "Words",
                    "ID",
                    "Actions",
                  ].map((h) => (
                    <Box
                      as="th"
                      key={h}
                      textAlign="left"
                      px={4}
                      py={2.5}
                      bg="gray.50"
                      _dark={{ bg: "gray.700", color: "gray.400" }}
                      fontSize="xs"
                      textTransform="uppercase"
                      color="gray.500"
                      fontWeight="700"
                      borderBottomWidth="2px"
                      whiteSpace="nowrap"
                    >
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box as="tbody">
                {tasks.map((task) => (
                  <Box
                    as="tr"
                    key={task.id}
                    _hover={{ bg: "gray.50", _dark: { bg: "gray.700" } }}
                  >
                    {/* Prompt */}
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      fontWeight="500"
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                      maxW="320px"
                    >
                      {truncateHtml(task.prompt, 80) || "No prompt"}
                    </Box>

                    {/* Task */}
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      <Badge
                        colorPalette={
                          task.task === "TASK_1" ? "blue" : "purple"
                        }
                        variant="subtle"
                        fontSize="xs"
                      >
                        {task.task === "TASK_1" ? "Task 1" : "Task 2"}
                      </Badge>
                    </Box>

                    {/* Mode */}
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      <Badge
                        colorPalette={task.mode === "mock" ? "purple" : "blue"}
                        variant="subtle"
                        fontSize="xs"
                      >
                        {task.mode === "mock" ? "Mock" : "Practice"}
                      </Badge>
                    </Box>

                    {/* Writing */}
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      {task.writing?.title && task.writing_id ? (
                        <Link
                          href={`/ielts-test-builder/writings/${task.writing_id}/edit`}
                          style={{
                            color: "#4f46e5",
                            fontWeight: 500,
                            textDecoration: "none",
                            fontSize: "13px",
                          }}
                        >
                          {task.writing.title}
                        </Link>
                      ) : (
                        <Text color="gray.500">-</Text>
                      )}
                    </Box>

                    {/* Min Words */}
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                      whiteSpace="nowrap"
                    >
                      {task.min_words ? (
                        <Text fontSize="xs" color="gray.500">
                          {task.min_words}+
                        </Text>
                      ) : (
                        <Text color="gray.400">-</Text>
                      )}
                    </Box>

                    {/* ID */}
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      <Badge
                        bg="gray.100"
                        color="gray.500"
                        _dark={{ bg: "gray.700", color: "gray.400" }}
                        fontSize="xs"
                        fontFamily="mono"
                        px={1.5}
                        rounded="sm"
                        cursor="pointer"
                        onClick={() => copyId(task.id)}
                        variant="plain"
                      >
                        {truncId(task.id)}
                      </Badge>
                    </Box>

                    {/* Actions */}
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      <HStack gap={1}>
                        <IconButton
                          size="xs"
                          colorPalette="green"
                          variant="ghost"
                          onClick={() =>
                            router.push(`/practice/writing/${task.id}`)
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
                            onNavigate("writing-task-form", {
                              editId: task.id,
                            })
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
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          {/* Pagination */}
          <Flex
            px={4}
            py={3}
            borderTopWidth="1px"
            borderColor="gray.100"
            _dark={{ borderColor: "gray.700" }}
            alignItems="center"
            justifyContent="space-between"
            gap={3}
          >
            <Text fontSize="xs" color="gray.500">
              Showing {(page - 1) * PAGE_SIZE + 1}-
              {Math.min(page * PAGE_SIZE, total)} of {total}
            </Text>
            <Pagination.Root
              count={total}
              pageSize={PAGE_SIZE}
              page={page}
              onPageChange={(e) => setPage(e.page)}
            >
              <ButtonGroup variant="ghost" size="sm" wrap="wrap">
                <Pagination.PrevTrigger asChild>
                  <IconButton aria-label="Previous page">
                    <ChevronLeft size={16} />
                  </IconButton>
                </Pagination.PrevTrigger>

                <Pagination.Items
                  render={(p) => (
                    <IconButton
                      variant={{ base: "ghost", _selected: "outline" }}
                    >
                      {p.value}
                    </IconButton>
                  )}
                />

                <Pagination.NextTrigger asChild>
                  <IconButton aria-label="Next page">
                    <ChevronRight size={16} />
                  </IconButton>
                </Pagination.NextTrigger>
              </ButtonGroup>
            </Pagination.Root>
          </Flex>
        </Box>
      )}
    </Box>
  );
}
