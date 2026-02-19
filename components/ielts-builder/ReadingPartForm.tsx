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
  Spinner,
  createListCollection,
} from "@chakra-ui/react";
import { Save, Plus, ChevronsUpDown } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { Control, RichTextEditor } from "@/components/ui/rich-text-editor";
import { ieltsReadingPartsAPI, ieltsReadingAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type {
  PageId,
  IELTSReading,
  IELTSReadingPart,
  DifficultyLevel,
  IELTSMode,
} from "./types";

interface ReadingPartFormProps {
  editId?: string | null;
  prefillReadingId?: string;
  onNavigate: (page: PageId, data?: Record<string, string>) => void;
}

export default function ReadingPartForm({
  editId,
  prefillReadingId,
  onNavigate,
}: ReadingPartFormProps) {
  const [readingId, setReadingId] = useState(prefillReadingId || "");
  const [part, setPart] = useState<IELTSReadingPart["part"]>("PART_1");
  const [mode, setMode] = useState<IELTSMode>("practice");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("MEDIUM");
  const [isActive, setIsActive] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState("");

  const contentEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image,
      TextAlign.configure({ types: ["paragraph", "heading"] }),
    ],
    content: content,
    onUpdate({ editor }) {
      setContent(editor.getHTML());
    },
    shouldRerenderOnTransaction: true,
    immediatelyRender: false,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [readings, setReadings] = useState<IELTSReading[]>([]);
  const [loadingReadings, setLoadingReadings] = useState(true);
  const [readingSearchInput, setReadingSearchInput] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isEdit = !!editId;

  const readingCollection = useMemo(
    () =>
      createListCollection({
        items: readings,
        itemToValue: (r) => r.id,
        itemToString: (r) => r.title,
      }),
    [readings],
  );

  // Load initial readings
  useEffect(() => {
    ieltsReadingAPI
      .getAll({ limit: 20 })
      .then((res: IELTSReading[] | { data: IELTSReading[] }) => {
        const list = Array.isArray(res) ? res : res.data || [];
        setReadings(list);
      })
      .catch(() => {})
      .finally(() => setLoadingReadings(false));
  }, []);

  // Debounced search for readings
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      ieltsReadingAPI
        .getAll({ limit: 20, search: readingSearchInput || undefined })
        .then((res: IELTSReading[] | { data: IELTSReading[] }) => {
          const list = Array.isArray(res) ? res : res.data || [];
          setReadings(list);
        })
        .catch(() => {});
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [readingSearchInput]);

  useEffect(() => {
    if (editId) {
      setLoading(true);
      ieltsReadingPartsAPI
        .getById(editId)
        .then((p: Record<string, unknown>) => {
          setReadingId((p.reading_id as string) || "");
          setPart((p.part as IELTSReadingPart["part"]) || "PART_1");
          setMode((p.mode as IELTSMode) || "practice");
          setTitle((p.title as string) || "");
          // Ensure the linked reading appears in the combobox list
          if (p.reading_id) {
            ieltsReadingAPI
              .getById(p.reading_id as string)
              .then((reading: IELTSReading) => {
                setReadings((prev) =>
                  prev.some((r) => r.id === reading.id)
                    ? prev
                    : [reading, ...prev],
                );
              })
              .catch(() => {});
          }
          const contentVal = (p.content as string) || "";
          setContent(contentVal);
          if (contentEditor) {
            contentEditor.commands.setContent(contentVal);
          }
          if (p.timeLimitMinutes)
            setTimeLimitMinutes(String(p.timeLimitMinutes));
          if (p.difficulty) setDifficulty(p.difficulty as DifficultyLevel);
          if (p.isActive !== undefined) setIsActive(p.isActive as boolean);
          if (p.totalQuestions) setTotalQuestions(String(p.totalQuestions));
        })
        .catch((e: Error) =>
          toaster.error({ title: "Error", description: e.message }),
        )
        .finally(() => setLoading(false));
    }
  }, [editId]);

  // Sync editor content when editor becomes ready after data fetch
  useEffect(() => {
    if (contentEditor && content && !contentEditor.isDestroyed) {
      const currentContent = contentEditor.getHTML();
      if (currentContent !== content && currentContent === "<p></p>") {
        contentEditor.commands.setContent(content);
      }
    }
  }, [contentEditor, content]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        reading_id: readingId,
        part,
        mode,
        title: title || null,
        content: content || null,
        difficulty,
        isActive,
      };
      if (timeLimitMinutes) body.timeLimitMinutes = parseInt(timeLimitMinutes);
      if (totalQuestions) body.totalQuestions = parseInt(totalQuestions);

      if (isEdit) {
        await ieltsReadingPartsAPI.update(editId!, body);
        toaster.success({ title: "Reading part updated!" });
        onNavigate("reading-parts");
      } else {
        const r = await ieltsReadingPartsAPI.create(body);
        toaster.success({ title: `Reading part created!` });
        onNavigate("reading-part-form", { editId: r.id });
      }
    } catch (e: unknown) {
      toaster.error({ title: "Error", description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <Box py={12} textAlign="center" color="gray.400">
        Loading...
      </Box>
    );

  return (
    <Box>
      <HStack gap={1.5} fontSize="sm" color="gray.400" mb={4}>
        <Text
          as="span"
          color="#4f46e5"
          cursor="pointer"
          fontWeight="500"
          _hover={{ textDecoration: "underline" }}
          onClick={() => onNavigate("reading-parts")}
        >
          Reading Parts
        </Text>
        <Text color="gray.300" _dark={{ color: "gray.600" }}>
          /
        </Text>
        <Text>{isEdit ? "Edit Reading Part" : "Create Reading Part"}</Text>
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
            {isEdit ? "Edit Reading Part" : "Create Reading Part"}
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
                  Reading
                </Text>
                {loadingReadings ? (
                  <HStack gap={2} py={2}>
                    <Spinner size="xs" />
                    <Text fontSize="sm" color="gray.400">
                      Loading...
                    </Text>
                  </HStack>
                ) : (
                  <Combobox.Root
                    collection={readingCollection}
                    value={readingId ? [readingId] : []}
                    onValueChange={(details) => {
                      setReadingId(details.value[0] || "");
                    }}
                    onInputValueChange={(details) => {
                      setReadingSearchInput(details.inputValue);
                    }}
                    inputBehavior="autohighlight"
                    openOnClick
                    size="sm"
                    w="full"
                  >
                    <Combobox.Control>
                      <Combobox.Input placeholder="Search readings..." />
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
                          <Combobox.Empty>No readings found</Combobox.Empty>
                          {readingCollection.items.map((r) => (
                            <Combobox.Item key={r.id} item={r}>
                              {r.title}
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
                  Part
                </Text>
                <NativeSelect.Root size="sm" w="full">
                  <NativeSelect.Field
                    value={part}
                    onChange={(e) =>
                      setPart(e.currentTarget.value as IELTSReadingPart["part"])
                    }
                  >
                    <option value="PART_1">Part 1</option>
                    <option value="PART_2">Part 2</option>
                    <option value="PART_3">Part 3</option>
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
                Title
              </Text>
              <Input
                placeholder="e.g. The History of Astronomy"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
                Passage
              </Text>
              <RichTextEditor.Root
                editor={contentEditor}
                css={{ "--content-min-height": "200px" }}
              >
                <RichTextEditor.Toolbar>
                  <RichTextEditor.ControlGroup>
                    <Control.Bold />
                    <Control.Italic />
                    <Control.Underline />
                    <Control.Strikethrough />
                  </RichTextEditor.ControlGroup>
                  <RichTextEditor.ControlGroup>
                    <Control.H1 />
                    <Control.H2 />
                    <Control.H3 />
                  </RichTextEditor.ControlGroup>
                  <RichTextEditor.ControlGroup>
                    <Control.BulletList />
                    <Control.OrderedList />
                    <Control.Blockquote />
                  </RichTextEditor.ControlGroup>
                  <RichTextEditor.ControlGroup>
                    <Control.AlignLeft />
                    <Control.AlignCenter />
                    <Control.AlignRight />
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
                  Time Limit (minutes)
                </Text>
                <Input
                  type="number"
                  placeholder="e.g. 20"
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(e.target.value)}
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
                  Difficulty
                </Text>
                <NativeSelect.Root size="sm" w="full">
                  <NativeSelect.Field
                    value={difficulty}
                    onChange={(e) =>
                      setDifficulty(e.currentTarget.value as DifficultyLevel)
                    }
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
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
                  Total Questions
                </Text>
                <Input
                  type="number"
                  placeholder="e.g. 13"
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(e.target.value)}
                />
              </Box>
            </Flex>

            <Flex alignItems="center" gap={2}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                id="is-active"
              />
              <label
                htmlFor="is-active"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Active
              </label>
            </Flex>

            <Flex justifyContent="space-between" alignItems="center" pt={2}>
              <HStack gap={2}>
                <Button
                  bg="#10b981"
                  color="white"
                  _hover={{ bg: "#059669" }}
                  onClick={handleSave}
                  loading={saving}
                  size="sm"
                >
                  <Save size={14} /> {isEdit ? "Update" : "Save Reading Part"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onNavigate("reading-parts")}
                  size="sm"
                >
                  Cancel
                </Button>
              </HStack>
              {isEdit && (
                <Button
                  bg="#4f46e5"
                  color="white"
                  _hover={{ bg: "#3730a3" }}
                  size="sm"
                  onClick={() =>
                    onNavigate("reading-part-questions", { partId: editId! })
                  }
                >
                  <Plus size={14} /> Add Questions
                </Button>
              )}
            </Flex>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}
