"use client";

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { Save } from "lucide-react";
import { useState } from "react";
import { ieltsWritingTasksAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type { PageId } from "./types";

interface WritingTaskFormProps {
  prefillWritingId?: string;
  onNavigate: (page: PageId, data?: Record<string, string>) => void;
}

export default function WritingTaskForm({
  prefillWritingId,
  onNavigate,
}: WritingTaskFormProps) {
  const [writingId, setWritingId] = useState(prefillWritingId || "");
  const [task, setTask] = useState("TASK_1");
  const [prompt, setPrompt] = useState("");
  const [instructions, setInstructions] = useState("");
  const [minWords, setMinWords] = useState("150");
  const [suggestedTime, setSuggestedTime] = useState("20");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        writing_id: writingId,
        task,
        prompt: prompt || null,
        instructions: instructions || null,
        min_words: parseInt(minWords) || 150,
        suggested_time: parseInt(suggestedTime) || 20,
      };
      const r = await ieltsWritingTasksAPI.create(body);
      toaster.success({ title: `Writing task created! ID: ${r.id}` });
      onNavigate("writing-tasks");
    } catch (e: unknown) {
      toaster.error({ title: "Error", description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <HStack gap={1.5} fontSize="sm" color="gray.400" mb={4}>
        <Text
          as="span"
          color="#4f46e5"
          cursor="pointer"
          fontWeight="500"
          _hover={{ textDecoration: "underline" }}
          onClick={() => onNavigate("writing-tasks")}
        >
          Writing Tasks
        </Text>
        <Text color="gray.300" _dark={{ color: "gray.600" }}>
          /
        </Text>
        <Text>Create Task</Text>
      </HStack>

      <Box
        bg="white"
        _dark={{ bg: "gray.800" }}
        rounded="lg"
        borderWidth="1px"
        shadow="sm"
      >
        <Box px={5} py={3.5} borderBottomWidth="1px">
          <Heading size="sm" fontWeight="600">
            Create Writing Task
          </Heading>
        </Box>
        <Box px={5} py={5}>
          <VStack gap={4} alignItems="stretch">
            <Flex gap={3} direction={{ base: "column", md: "row" }}>
              <Box flex="1">
                <Text
                  fontSize="xs"
                  fontWeight="600"
                  color="gray.600"
                  _dark={{ color: "gray.400" }}
                  mb={1}
                  textTransform="uppercase"
                  letterSpacing="0.3px"
                >
                  Writing ID
                </Text>
                <Input
                  placeholder="UUID of writing section"
                  value={writingId}
                  onChange={(e) => setWritingId(e.target.value)}
                />
              </Box>
              <Box flex="1">
                <Text
                  fontSize="xs"
                  fontWeight="600"
                  color="gray.600"
                  _dark={{ color: "gray.400" }}
                  mb={1}
                  textTransform="uppercase"
                  letterSpacing="0.3px"
                >
                  Task
                </Text>
                <NativeSelect.Root size="sm" w="full">
                  <NativeSelect.Field
                    value={task}
                    onChange={(e) => setTask(e.currentTarget.value)}
                  >
                    <option value="TASK_1">Task 1</option>
                    <option value="TASK_2">Task 2</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Box>
            </Flex>

            <Box>
              <Text
                fontSize="xs"
                fontWeight="600"
                color="gray.600"
                _dark={{ color: "gray.400" }}
                mb={1}
                textTransform="uppercase"
                letterSpacing="0.3px"
              >
                Prompt
              </Text>
              <Textarea
                placeholder="Write the task prompt here..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
            </Box>

            <Box>
              <Text
                fontSize="xs"
                fontWeight="600"
                color="gray.600"
                _dark={{ color: "gray.400" }}
                mb={1}
                textTransform="uppercase"
                letterSpacing="0.3px"
              >
                Instructions
              </Text>
              <Textarea
                placeholder="Additional instructions..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={2}
              />
            </Box>

            <Flex gap={3} direction={{ base: "column", md: "row" }}>
              <Box flex="1">
                <Text
                  fontSize="xs"
                  fontWeight="600"
                  color="gray.600"
                  _dark={{ color: "gray.400" }}
                  mb={1}
                  textTransform="uppercase"
                  letterSpacing="0.3px"
                >
                  Minimum Words
                </Text>
                <Input
                  type="number"
                  value={minWords}
                  onChange={(e) => setMinWords(e.target.value)}
                />
              </Box>
              <Box flex="1">
                <Text
                  fontSize="xs"
                  fontWeight="600"
                  color="gray.600"
                  _dark={{ color: "gray.400" }}
                  mb={1}
                  textTransform="uppercase"
                  letterSpacing="0.3px"
                >
                  Suggested Time (minutes)
                </Text>
                <Input
                  type="number"
                  value={suggestedTime}
                  onChange={(e) => setSuggestedTime(e.target.value)}
                />
              </Box>
            </Flex>

            <HStack gap={2} pt={2}>
              <Button
                bg="#10b981"
                color="white"
                _hover={{ bg: "#059669" }}
                onClick={handleSave}
                loading={saving}
                size="sm"
              >
                <Save size={14} /> Save Task
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate("writing-tasks")}
                size="sm"
              >
                Cancel
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}
