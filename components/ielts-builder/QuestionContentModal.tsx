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
  IconButton,
} from "@chakra-ui/react";
import { X, Plus, Trash2 } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Control, RichTextEditor } from "@/components/ui/rich-text-editor";
import type {
  QuestionType,
  QuestionContent,
  QuestionOption,
  MCQQuestion,
} from "./types";

interface QuestionContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: QuestionContent) => void;
}

const questionTypes: { value: QuestionType; label: string }[] = [
  { value: "completion", label: "Completion (Fill in the blanks)" },
  { value: "multiple-choice", label: "Multiple Choice" },
  { value: "multi-select", label: "Multi Select" },
  { value: "selection", label: "Selection (True/False/Not Given)" },
  { value: "draggable-selection", label: "Draggable Selection" },
  { value: "matching-information", label: "Matching Information" },
];

export default function QuestionContentModal({
  isOpen,
  onClose,
  onSave,
}: QuestionContentModalProps) {
  const [type, setType] = useState<QuestionType>("completion");
  const [title, setTitle] = useState("");
  const [condition, setCondition] = useState("");
  const [content, setContent] = useState("");

  const conditionEditor = useEditor({
    extensions: [StarterKit, Underline],
    content: condition,
    onUpdate({ editor }) {
      setCondition(editor.getHTML());
    },
    shouldRerenderOnTransaction: true,
    immediatelyRender: false,
  });

  const contentEditor = useEditor({
    extensions: [StarterKit, Underline],
    content: content,
    onUpdate({ editor }) {
      setContent(editor.getHTML());
    },
    shouldRerenderOnTransaction: true,
    immediatelyRender: false,
  });

  // Reset editors when modal opens
  useEffect(() => {
    if (isOpen) {
      conditionEditor?.commands.setContent("");
      contentEditor?.commands.setContent("");
    }
  }, [isOpen, conditionEditor, contentEditor]);
  const [limit, setLimit] = useState<string>("");
  const [order, setOrder] = useState<string>("");
  const [showOptions, setShowOptions] = useState(true);
  const [optionsTitle, setOptionsTitle] = useState("");
  const [options, setOptions] = useState<QuestionOption[]>([]);
  const [mcqs, setMcqs] = useState<MCQQuestion[]>([]);

  const hasOpts = [
    "selection",
    "draggable-selection",
    "matching-information",
  ].includes(type);
  const isMcq = ["multiple-choice", "multi-select"].includes(type);

  const addOption = useCallback(() => {
    const letter = String.fromCharCode(65 + options.length);
    setOptions((prev) => [
      ...prev,
      { value: letter.toLowerCase(), label: "", order: prev.length + 1 },
    ]);
  }, [options.length]);

  const removeOption = useCallback((idx: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const updateOptionLabel = useCallback((idx: number, label: string) => {
    setOptions((prev) =>
      prev.map((o, i) =>
        i === idx ? { ...o, label, value: String.fromCharCode(97 + i) } : o,
      ),
    );
  }, []);

  const addMcq = useCallback(() => {
    setMcqs((prev) => [
      ...prev,
      { question: "", order: prev.length + 1, options: [] },
    ]);
  }, []);

  const removeMcq = useCallback((idx: number) => {
    setMcqs((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const updateMcqQuestion = useCallback((idx: number, question: string) => {
    setMcqs((prev) => prev.map((m, i) => (i === idx ? { ...m, question } : m)));
  }, []);

  const addMcqOption = useCallback((mcqIdx: number) => {
    setMcqs((prev) =>
      prev.map((m, i) =>
        i === mcqIdx
          ? {
              ...m,
              options: [
                ...m.options,
                {
                  value: String.fromCharCode(97 + m.options.length),
                  label: "",
                  order: m.options.length + 1,
                },
              ],
            }
          : m,
      ),
    );
  }, []);

  const removeMcqOption = useCallback((mcqIdx: number, optIdx: number) => {
    setMcqs((prev) =>
      prev.map((m, i) =>
        i === mcqIdx
          ? { ...m, options: m.options.filter((_, oi) => oi !== optIdx) }
          : m,
      ),
    );
  }, []);

  const updateMcqOptionLabel = useCallback(
    (mcqIdx: number, optIdx: number, label: string) => {
      setMcqs((prev) =>
        prev.map((m, i) =>
          i === mcqIdx
            ? {
                ...m,
                options: m.options.map((o, oi) =>
                  oi === optIdx
                    ? { ...o, label, value: String.fromCharCode(97 + oi) }
                    : o,
                ),
              }
            : m,
        ),
      );
    },
    [],
  );

  const handleSave = () => {
    const newContent: QuestionContent = {
      type,
      title,
      condition: condition || null,
      content: content || null,
      limit: limit ? parseInt(limit) : null,
      showOptions,
      optionsTitle: optionsTitle || null,
      order: order ? parseInt(order) : 1,
      options: hasOpts ? [...options] : [],
      multipleChoiceQuestions: isMcq
        ? mcqs.map((m) => ({
            question: m.question,
            order: m.order,
            options: [...m.options],
          }))
        : [],
    };
    onSave(newContent);
    handleClose();
  };

  const handleClose = () => {
    setType("completion");
    setTitle("");
    setCondition("");
    setContent("");
    setLimit("");
    setOrder("");
    setShowOptions(true);
    setOptionsTitle("");
    setOptions([]);
    setMcqs([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      inset={0}
      bg="blackAlpha.500"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={200}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <Box
        bg="white"
        _dark={{ bg: "gray.800" }}
        rounded="xl"
        shadow="xl"
        w="90%"
        maxW="640px"
        maxH="85vh"
        overflow="hidden"
        display="flex"
        flexDirection="column"
      >
        {/* Header */}
        <Flex
          px={5}
          py={4}
          borderBottomWidth="1px"
          alignItems="center"
          justifyContent="space-between"
          flexShrink={0}
        >
          <Heading size="sm" fontWeight="700">
            Add Question Content
          </Heading>
          <IconButton
            size="sm"
            variant="ghost"
            onClick={handleClose}
            aria-label="Close"
            rounded="md"
          >
            <X size={16} />
          </IconButton>
        </Flex>

        {/* Body */}
        <Box flex="1" overflowY="auto" px={5} py={4}>
          <VStack gap={4} alignItems="stretch">
            {/* Type */}
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
                Question Type
              </Text>
              <NativeSelect.Root size="sm" w="full">
                <NativeSelect.Field
                  value={type}
                  onChange={(e) =>
                    setType(e.currentTarget.value as QuestionType)
                  }
                >
                  {questionTypes.map((qt) => (
                    <option key={qt.value} value={qt.value}>
                      {qt.label}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Box>

            {/* Title */}
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
                size="sm"
                placeholder="e.g. Questions 1-6"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Box>

            {/* Condition */}
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
                Condition / Instructions
              </Text>
              <RichTextEditor.Root
                editor={conditionEditor}
                css={{ "--content-min-height": "60px" }}
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
                </RichTextEditor.Toolbar>
                <RichTextEditor.Content />
              </RichTextEditor.Root>
            </Box>

            {/* Content */}
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
                Content (HTML)
              </Text>
              <RichTextEditor.Root
                editor={contentEditor}
                css={{ "--content-min-height": "80px" }}
              >
                <RichTextEditor.Toolbar>
                  <RichTextEditor.ControlGroup>
                    <Control.Bold />
                    <Control.Italic />
                    <Control.Underline />
                  </RichTextEditor.ControlGroup>
                  <RichTextEditor.ControlGroup>
                    <Control.H3 />
                    <Control.H4 />
                  </RichTextEditor.ControlGroup>
                  <RichTextEditor.ControlGroup>
                    <Control.BulletList />
                    <Control.OrderedList />
                  </RichTextEditor.ControlGroup>
                  <RichTextEditor.ControlGroup>
                    <Control.Undo />
                    <Control.Redo />
                  </RichTextEditor.ControlGroup>
                </RichTextEditor.Toolbar>
                <RichTextEditor.Content />
              </RichTextEditor.Root>
            </Box>

            {/* Word Limit & Order */}
            <Flex gap={3}>
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
                  Word Limit
                </Text>
                <Input
                  size="sm"
                  type="number"
                  placeholder="e.g. 2"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
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
                  Order
                </Text>
                <Input
                  size="sm"
                  type="number"
                  placeholder="1"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                />
              </Box>
            </Flex>

            {/* Options section (selection types) */}
            {hasOpts && (
              <>
                <Flex alignItems="center" gap={2}>
                  <input
                    type="checkbox"
                    checked={showOptions}
                    onChange={(e) => setShowOptions(e.target.checked)}
                    id="show-options"
                  />
                  <label
                    htmlFor="show-options"
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Show Options
                  </label>
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
                    Options Title
                  </Text>
                  <Input
                    size="sm"
                    placeholder="e.g. List of headings"
                    value={optionsTitle}
                    onChange={(e) => setOptionsTitle(e.target.value)}
                  />
                </Box>

                <Box>
                  <Flex
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Text
                      fontSize="xs"
                      fontWeight="600"
                      color="gray.600"
                      _dark={{ color: "gray.400" }}
                      textTransform="uppercase"
                      letterSpacing="0.3px"
                    >
                      Options
                    </Text>
                    <Button size="xs" variant="outline" onClick={addOption}>
                      <Plus size={12} /> Add Option
                    </Button>
                  </Flex>
                  <VStack gap={2} alignItems="stretch">
                    {options.map((opt, i) => (
                      <HStack key={i}>
                        <Box
                          w="28px"
                          h="28px"
                          bg="gray.200"
                          _dark={{ bg: "gray.600", color: "gray.200" }}
                          rounded="full"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize="xs"
                          fontWeight="700"
                          color="gray.600"
                          flexShrink={0}
                        >
                          {String.fromCharCode(65 + i)}
                        </Box>
                        <Input
                          size="sm"
                          flex="1"
                          placeholder="Option label"
                          value={opt.label}
                          onChange={(e) => updateOptionLabel(i, e.target.value)}
                        />
                        <IconButton
                          size="xs"
                          variant="ghost"
                          colorPalette="red"
                          onClick={() => removeOption(i)}
                          aria-label="Remove option"
                        >
                          <X size={14} />
                        </IconButton>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              </>
            )}

            {/* MCQ section */}
            {isMcq && (
              <Box>
                <Flex justifyContent="space-between" alignItems="center" mb={2}>
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color="gray.600"
                    _dark={{ color: "gray.400" }}
                    textTransform="uppercase"
                    letterSpacing="0.3px"
                  >
                    Multiple Choice Questions
                  </Text>
                  <Button size="xs" variant="outline" onClick={addMcq}>
                    <Plus size={12} /> Add MCQ
                  </Button>
                </Flex>
                <VStack gap={3} alignItems="stretch">
                  {mcqs.map((mcq, mi) => (
                    <Box
                      key={mi}
                      borderWidth="1px"
                      borderColor="gray.200"
                      _dark={{ borderColor: "gray.600", bg: "gray.700" }}
                      rounded="md"
                      p={3}
                      bg="white"
                    >
                      <Input
                        size="sm"
                        placeholder="Question text..."
                        value={mcq.question}
                        onChange={(e) => updateMcqQuestion(mi, e.target.value)}
                        mb={2}
                      />
                      <Flex
                        justifyContent="space-between"
                        alignItems="center"
                        mb={2}
                      >
                        <Text fontSize="xs" color="gray.500">
                          Options:
                        </Text>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => addMcqOption(mi)}
                        >
                          <Plus size={12} /> Option
                        </Button>
                      </Flex>
                      <VStack gap={1.5} alignItems="stretch">
                        {mcq.options.map((opt, oi) => (
                          <HStack key={oi}>
                            <Box
                              w="24px"
                              h="24px"
                              bg="gray.200"
                              _dark={{ bg: "gray.600", color: "gray.200" }}
                              rounded="full"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              fontSize="10px"
                              fontWeight="700"
                              color="gray.600"
                              flexShrink={0}
                            >
                              {String.fromCharCode(65 + oi)}
                            </Box>
                            <Input
                              size="sm"
                              flex="1"
                              placeholder="Option text"
                              value={opt.label}
                              onChange={(e) =>
                                updateMcqOptionLabel(mi, oi, e.target.value)
                              }
                            />
                            <IconButton
                              size="xs"
                              variant="ghost"
                              colorPalette="red"
                              onClick={() => removeMcqOption(mi, oi)}
                              aria-label="Remove option"
                            >
                              <X size={14} />
                            </IconButton>
                          </HStack>
                        ))}
                      </VStack>
                      <Flex justifyContent="flex-end" mt={2}>
                        <Button
                          size="xs"
                          colorPalette="red"
                          variant="ghost"
                          onClick={() => removeMcq(mi)}
                        >
                          <Trash2 size={12} /> Remove MCQ
                        </Button>
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        </Box>

        {/* Footer */}
        <Flex
          px={5}
          py={3}
          borderTopWidth="1px"
          justifyContent="flex-end"
          gap={2}
          flexShrink={0}
        >
          <Button variant="outline" onClick={handleClose} size="sm">
            Cancel
          </Button>
          <Button
            bg="#4f46e5"
            color="white"
            _hover={{ bg: "#3730a3" }}
            onClick={handleSave}
            size="sm"
          >
            Add Content
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
