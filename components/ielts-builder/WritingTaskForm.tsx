"use client";

import {
  Box,
  Button,
  Combobox,
  Flex,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Portal,
  Text,
  VStack,
  Icon,
  Spinner,
  Image as ChakraImage,
  createListCollection,
} from "@chakra-ui/react";
import { Save, Upload, X, ChevronsUpDown } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { Control, RichTextEditor } from "@/components/ui/rich-text-editor";
import { ieltsWritingTasksAPI, ieltsWritingAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type {
  PageId,
  IELTSWriting,
  IELTSWritingTask,
  IELTSMode,
} from "./types";
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
  const [task, setTask] = useState<IELTSWritingTask["task"]>("TASK_1");
  const [mode, setMode] = useState<IELTSMode>("practice");
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
  const [writingSearchInput, setWritingSearchInput] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const writingCollection = useMemo(
    () =>
      createListCollection({
        items: writings,
        itemToValue: (w) => w.id,
        itemToString: (w) => w.title,
      }),
    [writings],
  );

  // Load initial writings
  useEffect(() => {
    ieltsWritingAPI
      .getAll({ limit: 20 })
      .then((res: IELTSWriting[] | { data: IELTSWriting[] }) => {
        const list = Array.isArray(res) ? res : res.data || [];
        setWritings(list);
      })
      .catch(() => {})
      .finally(() => setLoadingWritings(false));
  }, []);

  // Debounced search for writings
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      ieltsWritingAPI
        .getAll({ limit: 20, search: writingSearchInput || undefined })
        .then((res: IELTSWriting[] | { data: IELTSWriting[] }) => {
          const list = Array.isArray(res) ? res : res.data || [];
          setWritings(list);
        })
        .catch(() => {});
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [writingSearchInput]);

  useEffect(() => {
    if (!editId) return;
    setLoadingData(true);
    ieltsWritingTasksAPI
      .getById(editId)
      .then(
        (r: {
          writing_id?: string;
          task?: IELTSWritingTask["task"];
          mode?: IELTSMode;
          prompt?: string;
          min_words?: number;
          suggested_time?: number;
          image_url?: string;
        }) => {
          setWritingId(r.writing_id || "");
          setTask(r.task || "TASK_1");
          setMode(r.mode || "practice");
          setPrompt(r.prompt || "");
          promptEditor?.commands.setContent(r.prompt || "");
          setMinWords(String(r.min_words || 150));
          setSuggestedTime(String(r.suggested_time || 20));
          setImageUrl(r.image_url || "");
          // Ensure the linked writing appears in the combobox list
          if (r.writing_id) {
            ieltsWritingAPI
              .getById(r.writing_id)
              .then((writing: IELTSWriting) => {
                setWritings((prev) =>
                  prev.some((w) => w.id === writing.id)
                    ? prev
                    : [writing, ...prev],
                );
              })
              .catch(() => {});
          }
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
        mode,
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
                    <Combobox.Root
                      collection={writingCollection}
                      value={writingId ? [writingId] : []}
                      onValueChange={(details) => {
                        setWritingId(details.value[0] || "");
                      }}
                      onInputValueChange={(details) => {
                        setWritingSearchInput(details.inputValue);
                      }}
                      inputBehavior="autohighlight"
                      openOnClick
                      size="sm"
                      w="full"
                    >
                      <Combobox.Control>
                        <Combobox.Input placeholder="Search writings..." />
                        <Combobox.IndicatorGroup>
                          <Combobox.ClearTrigger />
                          <Combobox.Trigger>
                            <ChevronsUpDown />
                          </Combobox.Trigger>
                        </Combobox.IndicatorGroup>
                      </Combobox.Control>
                      <Portal>
                        <Combobox.Positioner>
                          <Combobox.Content>
                            <Combobox.Empty>No writings found</Combobox.Empty>
                            {writingCollection.items.map((w) => (
                              <Combobox.Item key={w.id} item={w}>
                                {w.title}
                                <Combobox.ItemIndicator />
                              </Combobox.Item>
                            ))}
                          </Combobox.Content>
                        </Combobox.Positioner>
                      </Portal>
                    </Combobox.Root>
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
                      onChange={(e) =>
                        setTask(
                          e.currentTarget.value as IELTSWritingTask["task"],
                        )
                      }
                    >
                      <option value="TASK_1">Task 1</option>
                      <option value="TASK_2">Task 2</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
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
                    Mode
                  </Text>
                  <NativeSelect.Root size="sm" w="full">
                    <NativeSelect.Field
                      value={mode}
                      onChange={(e) =>
                        setMode(e.currentTarget.value as IELTSMode)
                      }
                    >
                      <option value="practice">Practice</option>
                      <option value="mock">Mock</option>
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
                    <ChakraImage
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
