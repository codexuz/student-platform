"use client";

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Text,
  Badge,
  Spinner,
  IconButton,
} from "@chakra-ui/react";
import { Link2, Unlink, Plus, ArrowLeft, GripVertical } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { ieltsWritingAPI, ieltsWritingTasksAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import LinkExistingItemModal from "./LinkExistingItemModal";
import type { PageId, IELTSWritingTask } from "./types";

interface LinkedWritingTasksProps {
  writingId: string;
  onNavigate: (page: PageId, data?: Record<string, string>) => void;
}

export default function LinkedWritingTasks({
  writingId,
  onNavigate,
}: LinkedWritingTasksProps) {
  const [linkedTasks, setLinkedTasks] = useState<IELTSWritingTask[]>([]);
  const [writingTitle, setWritingTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  const loadLinkedTasks = useCallback(async () => {
    setLoading(true);
    try {
      const [linkedRes, writingRes] = await Promise.all([
        ieltsWritingAPI.getLinkedTasks(writingId),
        ieltsWritingAPI.getById(writingId),
      ]);
      const tasks = Array.isArray(linkedRes)
        ? linkedRes.map(
            (link: {
              writingTask?: IELTSWritingTask;
              writing_task_id: string;
              order?: number;
            }) =>
              link.writingTask
                ? { ...link.writingTask, _junctionOrder: link.order }
                : { id: link.writing_task_id, _junctionOrder: link.order },
          )
        : ((linkedRes as { data?: IELTSWritingTask[] }).data ?? []);
      setLinkedTasks(tasks as IELTSWritingTask[]);
      setWritingTitle(writingRes?.title || "");
    } catch {
      toaster.error({ title: "Failed to load linked tasks" });
    } finally {
      setLoading(false);
    }
  }, [writingId]);

  useEffect(() => {
    loadLinkedTasks();
  }, [loadLinkedTasks]);

  const handleUnlink = async (taskId: string) => {
    if (!confirm("Unlink this writing task from the writing section?")) return;
    setUnlinking(taskId);
    try {
      await ieltsWritingAPI.unlinkTask({
        writing_id: writingId,
        writing_task_id: taskId,
      });
      toaster.success({ title: "Task unlinked" });
      loadLinkedTasks();
    } catch {
      toaster.error({ title: "Failed to unlink task" });
    } finally {
      setUnlinking(null);
    }
  };

  const handleLink = async (taskId: string, order?: number) => {
    await ieltsWritingAPI.linkTask({
      writing_id: writingId,
      writing_task_id: taskId,
      order,
    });
    toaster.success({ title: "Task linked!" });
    loadLinkedTasks();
  };

  const fetchAvailableTasks = async (search?: string) => {
    const params: Record<string, string | number> = { limit: 50 };
    if (search?.trim()) params.search = search.trim();
    const res = await ieltsWritingTasksAPI.getAll(params);
    return res?.data || res || [];
  };

  const truncateHtml = (html: string | undefined, n: number) => {
    if (!html) return "";
    const text = html.replace(/<[^>]+>/g, "");
    return text.length > n ? text.substring(0, n) + "…" : text;
  };

  if (loading) {
    return (
      <Flex justifyContent="center" py={12}>
        <Spinner size="lg" color="#4f46e5" />
      </Flex>
    );
  }

  return (
    <Box>
      {/* Breadcrumb */}
      <HStack gap={1.5} fontSize="sm" color="gray.400" mb={4}>
        <Text
          as="span"
          color="#4f46e5"
          cursor="pointer"
          fontWeight="500"
          _hover={{ textDecoration: "underline" }}
          onClick={() => onNavigate("writings")}
        >
          Writings
        </Text>
        <Text color="gray.300" _dark={{ color: "gray.600" }}>
          /
        </Text>
        <Text>{writingTitle || "Writing"}</Text>
        <Text color="gray.300" _dark={{ color: "gray.600" }}>
          /
        </Text>
        <Text>Linked Tasks</Text>
      </HStack>

      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <HStack gap={2}>
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("writings")}
            aria-label="Back"
          >
            <ArrowLeft size={16} />
          </IconButton>
          <Heading size="md" fontWeight="700">
            <Link2 size={18} style={{ display: "inline", marginRight: 8 }} />
            Linked Writing Tasks
          </Heading>
        </HStack>
        <HStack gap={2}>
          <Button
            size="sm"
            variant="outline"
            colorPalette="blue"
            onClick={() => setLinkModalOpen(true)}
          >
            <Link2 size={14} /> Link Existing Task
          </Button>
          <Button
            size="sm"
            bg="#4f46e5"
            color="white"
            _hover={{ bg: "#3730a3" }}
            onClick={() => onNavigate("writing-task-form", { writingId })}
          >
            <Plus size={14} /> Create & Link New Task
          </Button>
        </HStack>
      </Flex>

      {linkedTasks.length === 0 ? (
        <Box textAlign="center" py={12} color="gray.400">
          <Text fontSize="4xl" mb={3}>
            🔗
          </Text>
          <Heading size="sm" color="gray.500" mb={1}>
            No tasks linked yet
          </Heading>
          <Text fontSize="sm">
            Link existing writing tasks or create new ones to add to this
            writing section.
          </Text>
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
                    "Order",
                    "Prompt",
                    "Task",
                    "Mode",
                    "Min Words",
                    "Time",
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
                    >
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box as="tbody">
                {linkedTasks.map((t, idx) => (
                  <Box
                    as="tr"
                    key={t.id}
                    _hover={{ bg: "gray.50", _dark: { bg: "gray.700" } }}
                  >
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      <HStack gap={1}>
                        <GripVertical size={14} color="gray" />
                        <Text fontSize="sm" fontWeight="600">
                          {(t as IELTSWritingTask & { _junctionOrder?: number })
                            ._junctionOrder ?? idx + 1}
                        </Text>
                      </HStack>
                    </Box>
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                      maxW="320px"
                    >
                      {truncateHtml(t.prompt, 80) || "No prompt"}
                    </Box>
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      <Badge
                        colorPalette={t.task === "TASK_1" ? "blue" : "purple"}
                        variant="subtle"
                        fontSize="xs"
                      >
                        {t.task === "TASK_1" ? "Task 1" : "Task 2"}
                      </Badge>
                    </Box>
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      {t.mode && (
                        <Badge
                          colorPalette={t.mode === "mock" ? "purple" : "blue"}
                          variant="subtle"
                          fontSize="xs"
                        >
                          {t.mode === "mock" ? "Mock" : "Practice"}
                        </Badge>
                      )}
                    </Box>
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      <Text fontSize="sm">
                        {t.min_words ? `${t.min_words}+` : "-"}
                      </Text>
                    </Box>
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      <Text fontSize="sm">
                        {t.suggested_time ? `${t.suggested_time} min` : "-"}
                      </Text>
                    </Box>
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
                          variant="outline"
                          onClick={() =>
                            onNavigate("writing-task-form", { editId: t.id })
                          }
                          aria-label="Edit task"
                          title="Edit this task"
                        >
                          <Link2 size={14} />
                        </IconButton>
                        <IconButton
                          size="xs"
                          colorPalette="red"
                          variant="ghost"
                          loading={unlinking === t.id}
                          onClick={() => handleUnlink(t.id)}
                          aria-label="Unlink"
                          title="Unlink from this writing"
                        >
                          <Unlink size={14} />
                        </IconButton>
                      </HStack>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      <LinkExistingItemModal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        itemLabel="Writing Task"
        fetchItems={fetchAvailableTasks}
        alreadyLinkedIds={linkedTasks.map((t) => t.id)}
        onLink={handleLink}
      />
    </Box>
  );
}
