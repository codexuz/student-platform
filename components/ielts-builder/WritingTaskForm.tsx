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
  VStack,
  Icon,
  Spinner,
  Image,
} from "@chakra-ui/react";
import { Save, Upload, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { Control, RichTextEditor } from "@/components/ui/rich-text-editor";
import { ieltsWritingTasksAPI, ieltsWritingAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type { PageId, IELTSWriting } from "./types";
import FileUploadModal from "./FileUploadModal";

interface WritingTaskFormProps {
  editId?: string | null;
  prefillWritingId?: string;
  onNavigate: (page: PageId, data?: Record<string, string>) => void;
}

export default function WritingTaskForm({
  editId,
  prefillWritingId,
  onNavigate,
}: WritingTaskFormProps) {
  const isEdit = !!editId;
  const [writingId, setWritingId] = useState(prefillWritingId || "");
  const [task, setTask] = useState("TASK_1");
  const [prompt, setPrompt] = useState("");

  const promptEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image,
      TextAlign.configure({ types: ["paragraph", "heading"] }),
    ],
    content: prompt,
    onUpdate({ editor }) {
      setPrompt(editor.getHTML());
    },
    shouldRerenderOnTransaction: true,
    immediatelyRender: false,
  });

  const [minWords, setMinWords] = useState("150");
  const [suggestedTime, setSuggestedTime] = useState("20");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [writings, setWritings] = useState<IELTSWriting[]>([]);
  const [loadingWritings, setLoadingWritings] = useState(true);
  const [loadingData, setLoadingData] = useState(!!editId);
  const [showImageUpload, setShowImageUpload] = useState(false);

  useEffect(() => {
    ieltsWritingAPI
      .getAll()
      .then((res: IELTSWriting[] | { data: IELTSWriting[] }) => {
        const list = Array.isArray(res) ? res : res.data || [];
        setWritings(list);
      })
      .catch(() => {})
      .finally(() => setLoadingWritings(false));
  }, []);

  useEffect(() => {
    if (!editId) return;
    setLoadingData(true);
    ieltsWritingTasksAPI
      .getById(editId)
      .then(
        (r: {
          writing_id?: string;
          task?: string;
          prompt?: string;
          min_words?: number;
          suggested_time?: number;
          image_url?: string;
        }) => {
          setWritingId(r.writing_id || "");
          setTask(r.task || "TASK_1");
          setPrompt(r.prompt || "");
          promptEditor?.commands.setContent(r.prompt || "");
          setMinWords(String(r.min_words || 150));
          setSuggestedTime(String(r.suggested_time || 20));
          setImageUrl(r.image_url || "");
        },
      )
      .catch(() => {
        toaster.error({ title: "Failed to load writing task" });
      })
      .finally(() => setLoadingData(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        writing_id: writingId,
        task,
        prompt: prompt || null,
        min_words: parseInt(minWords) || 150,
        suggested_time: parseInt(suggestedTime) || 20,
      };
      if (imageUrl) body.image_url = imageUrl;
      if (isEdit) {
        await ieltsWritingTasksAPI.update(editId, body);
        toaster.success({ title: "Writing task updated!" });
      } else {
        const r = await ieltsWritingTasksAPI.create(body);
        toaster.success({ title: `Writing task created! ID: ${r.id}` });
      }
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
        <Text>{isEdit ? "Edit Task" : "Create Task"}</Text>
      </HStack>

      {loadingData ? (
        <Flex justifyContent="center" py={12}>
          <Spinner size="lg" color="#4f46e5" />
        </Flex>
      ) : (
        <Box
          bg="white"
          _dark={{ bg: "gray.800" }}
          rounded="lg"
          borderWidth="1px"
          shadow="sm"
        >
          <Box px={5} py={3.5} borderBottomWidth="1px">
            <Heading size="sm" fontWeight="600">
              {isEdit ? "Edit Writing Task" : "Create Writing Task"}
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
                    Writing
                  </Text>
                  {loadingWritings ? (
                    <HStack gap={2} py={2}>
                      <Spinner size="xs" />
                      <Text fontSize="sm" color="gray.400">
                        Loading...
                      </Text>
                    </HStack>
                  ) : (
                    <NativeSelect.Root size="sm" w="full">
                      <NativeSelect.Field
                        value={writingId}
                        onChange={(e) => setWritingId(e.currentTarget.value)}
                      >
                        <option value="">— Select a writing —</option>
                        {writings.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.title}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  )}
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
                <RichTextEditor.Root
                  editor={promptEditor}
                  css={{ "--content-min-height": "120px" }}
                >
                  <RichTextEditor.Toolbar>
                    <RichTextEditor.ControlGroup>
                      <Control.Bold />
                      <Control.Italic />
                      <Control.Underline />
                    </RichTextEditor.ControlGroup>
                    <RichTextEditor.ControlGroup>
                      <Control.BulletList />
                      <Control.OrderedList />
                    </RichTextEditor.ControlGroup>
                    <RichTextEditor.ControlGroup>
                      <Control.Undo />
                      <Control.Redo />
                    </RichTextEditor.ControlGroup>
                    <RichTextEditor.ControlGroup>
                      <Control.ImageControl />
                    </RichTextEditor.ControlGroup>
                  </RichTextEditor.Toolbar>
                  <RichTextEditor.Content />
                </RichTextEditor.Root>
              </Box>

              {/* Image upload for writing task (e.g. chart/graph for Task 1) */}
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
                  Task Image (optional)
                </Text>
                {imageUrl ? (
                  <Box position="relative" display="inline-block">
                    <Image
                      src={imageUrl}
                      alt="Task image"
                      maxH="150px"
                      rounded="md"
                      borderWidth="1px"
                    />
                    <Box
                      position="absolute"
                      top={1}
                      right={1}
                      bg="white"
                      rounded="full"
                      p={0.5}
                      cursor="pointer"
                      shadow="sm"
                      onClick={() => setImageUrl("")}
                      _hover={{ bg: "red.50" }}
                    >
                      <Icon as={X} fontSize="xs" color="red.500" />
                    </Box>
                  </Box>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowImageUpload(true)}
                  >
                    <Icon as={Upload} fontSize="sm" /> Upload Image
                  </Button>
                )}
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
                  <Save size={14} /> {isEdit ? "Update Task" : "Save Task"}
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
      )}

      <FileUploadModal
        open={showImageUpload}
        onClose={() => setShowImageUpload(false)}
        type="image"
        onUploaded={(url) => {
          setImageUrl(url);
        }}
      />
    </Box>
  );
}
