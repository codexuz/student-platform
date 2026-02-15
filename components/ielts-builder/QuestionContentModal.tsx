"use client";

import {
  Badge,
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
import Image from "@tiptap/extension-image";
import { Control, RichTextEditor } from "@/components/ui/rich-text-editor";
import type {
  IELTSQuestionType,
  IELTSQuestion,
  IELTSSubQuestion,
  IELTSQuestionOption,
} from "./types";

interface QuestionContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: IELTSQuestion) => void;
  editData?: IELTSQuestion | null;
}

const questionTypes: { value: IELTSQuestionType; label: string }[] = [
  { value: "TRUE_FALSE_NOT_GIVEN", label: "True / False / Not Given" },
  { value: "YES_NO_NOT_GIVEN", label: "Yes / No / Not Given" },
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "MULTIPLE_ANSWER", label: "Multiple Answer" },
  { value: "NOTE_COMPLETION", label: "Note Completion" },
  { value: "SENTENCE_COMPLETION", label: "Sentence Completion" },
  { value: "SUMMARY_COMPLETION", label: "Summary Completion" },
  {
    value: "SUMMARY_COMPLETION_DRAG_DROP",
    label: "Summary Completion (Drag & Drop)",
  },
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "TABLE_COMPLETION", label: "Table Completion" },
  { value: "FLOW_CHART_COMPLETION", label: "Flow Chart Completion" },
  { value: "DIAGRAM_LABELLING", label: "Diagram Labelling" },
  { value: "MATCHING_HEADINGS", label: "Matching Headings" },
  { value: "MATCHING_INFORMATION", label: "Matching Information" },
  { value: "MATCHING_FEATURES", label: "Matching Features" },
  { value: "MATCHING_SENTENCE_ENDINGS", label: "Matching Sentence Endings" },
  { value: "PLAN_MAP_LABELLING", label: "Plan / Map Labelling" },
];

/* ── Per-type data structure flags ──────────────────── */

// All types use sub-questions EXCEPT MULTIPLE_CHOICE (options-only)
const usesSubQuestions = (t: IELTSQuestionType) => t !== "MULTIPLE_CHOICE";

// Types that use the options[] (choices) array
const usesOptions = (t: IELTSQuestionType) =>
  [
    "MULTIPLE_CHOICE",
    "MULTIPLE_ANSWER",
    "SUMMARY_COMPLETION_DRAG_DROP",
    "MATCHING_FEATURES",
    "MATCHING_SENTENCE_ENDINGS",
    "PLAN_MAP_LABELLING",
  ].includes(t);

/* ── Correct-answer input mode per type ─────────────── */
type AnswerMode =
  | "text"
  | "dropdown-tfng"
  | "dropdown-ynng"
  | "select-option-key"
  | "select-heading-key";

const getAnswerMode = (t: IELTSQuestionType): AnswerMode => {
  if (t === "TRUE_FALSE_NOT_GIVEN") return "dropdown-tfng";
  if (t === "YES_NO_NOT_GIVEN") return "dropdown-ynng";
  if (t === "MATCHING_HEADINGS") return "select-heading-key";
  if (
    [
      "MATCHING_FEATURES",
      "MATCHING_SENTENCE_ENDINGS",
      "SUMMARY_COMPLETION_DRAG_DROP",
      "PLAN_MAP_LABELLING",
      "MULTIPLE_ANSWER",
    ].includes(t)
  )
    return "select-option-key";
  return "text";
};

/* ── Standard IELTS instructions by type ────────────── */
const defaultInstructions: Record<IELTSQuestionType, string> = {
  TRUE_FALSE_NOT_GIVEN:
    "Do the following statements agree with the information given in the passage? Write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, NOT GIVEN if there is no information on this.",
  YES_NO_NOT_GIVEN:
    "Do the following statements agree with the views of the writer? Write YES if the statement agrees with the views of the writer, NO if the statement contradicts the views of the writer, NOT GIVEN if it is impossible to say what the writer thinks about this.",
  MULTIPLE_CHOICE: "Choose the correct letter, A, B, C or D.",
  MULTIPLE_ANSWER: "Choose THREE correct answers.",
  NOTE_COMPLETION:
    "Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  SENTENCE_COMPLETION:
    "Complete the sentences below. Write NO MORE THAN TWO WORDS from the passage for each answer.",
  SUMMARY_COMPLETION:
    "Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
  SUMMARY_COMPLETION_DRAG_DROP:
    "Complete the summary using the list of words below.",
  SHORT_ANSWER:
    "Answer the questions below. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.",
  TABLE_COMPLETION:
    "Complete the table below. Write NO MORE THAN ONE WORD AND/OR A NUMBER for each answer.",
  FLOW_CHART_COMPLETION:
    "Complete the flow chart below. Write NO MORE THAN TWO WORDS for each answer.",
  DIAGRAM_LABELLING:
    "Label the diagram below. Write NO MORE THAN TWO WORDS from the passage for each answer.",
  MATCHING_HEADINGS:
    "Choose the correct heading for each paragraph from the list of headings below.",
  MATCHING_INFORMATION:
    "Which paragraph contains the following information? Write the correct letter, A–F.",
  MATCHING_FEATURES: "Match each statement with the correct option, A, B or C.",
  MATCHING_SENTENCE_ENDINGS:
    "Complete each sentence with the correct ending, A–F, below.",
  PLAN_MAP_LABELLING:
    "Label the map below. Choose your answers from the box and write the correct letter next to the questions.",
};

/* ── Label helper ──────────────────────────────────── */
const FieldLabel = ({ children }: { children: string }) => (
  <Text
    fontSize="xs"
    fontWeight="600"
    color="gray.600"
    _dark={{ color: "gray.400" }}
    mb={1}
    textTransform="uppercase"
    letterSpacing="0.3px"
  >
    {children}
  </Text>
);

/* ── Hints per type category ───────────────────────── */
const typeHints: Partial<Record<IELTSQuestionType, string>> = {
  TRUE_FALSE_NOT_GIVEN:
    "Add statements as sub-questions. Correct answer must be TRUE, FALSE, or NOT GIVEN.",
  YES_NO_NOT_GIVEN:
    "Add statements as sub-questions. Correct answer must be YES, NO, or NOT GIVEN.",
  MULTIPLE_CHOICE:
    "Options only – no sub-questions. Exactly one option must be marked as correct.",
  MULTIPLE_ANSWER:
    "Options + sub-questions. Multiple options can be correct. Sub-question correctAnswer = option key.",
  NOTE_COMPLETION:
    "Sub-questions only. Each blank is a sub-question. Correct answer = text from the passage.",
  SENTENCE_COMPLETION:
    "Sub-questions only. Each incomplete sentence is a sub-question. Correct answer = text from the passage.",
  SUMMARY_COMPLETION:
    "Sub-questions only. Each blank in the summary is a sub-question. Correct answer = words from the passage.",
  SUMMARY_COMPLETION_DRAG_DROP:
    "Options are the word bank. Sub-question correctAnswer must match an option key (A, B, C…).",
  SHORT_ANSWER: "Sub-questions only. Each question gets a free text answer.",
  TABLE_COMPLETION:
    "Define table headers & rows below. Use ____ for blanks. Each blank = a sub-question.",
  FLOW_CHART_COMPLETION:
    "Use questionText HTML for the flow chart. Each blank = a sub-question.",
  DIAGRAM_LABELLING:
    "Use questionText for diagram image/HTML. Each label = a sub-question.",
  MATCHING_HEADINGS:
    "Define heading options below (roman numerals). Sub-question correctAnswer = heading key.",
  MATCHING_INFORMATION:
    "Sub-questions only. Correct answer = paragraph letter (A, B, C…).",
  MATCHING_FEATURES:
    "Options = features/people to match. Sub-question correctAnswer = option key.",
  MATCHING_SENTENCE_ENDINGS:
    "Options = sentence endings. Sub-question correctAnswer = option key. Each ending used once.",
  PLAN_MAP_LABELLING:
    "Options = location labels. Sub-question correctAnswer = option key.",
};

export default function QuestionContentModal({
  isOpen,
  onClose,
  onSave,
  editData,
}: QuestionContentModalProps) {
  const isEdit = !!editData;
  const [type, setType] = useState<IELTSQuestionType>(
    editData?.type || "TRUE_FALSE_NOT_GIVEN",
  );
  const [questionText, setQuestionText] = useState(
    editData?.questionText || "",
  );
  const [instruction, setInstruction] = useState(
    editData?.instruction ||
      defaultInstructions[editData?.type || "TRUE_FALSE_NOT_GIVEN"],
  );
  const [questionNumber, setQuestionNumber] = useState(
    editData?.questionNumber ? String(editData.questionNumber) : "",
  );
  const [points, setPoints] = useState(
    editData?.points ? String(editData.points) : "1",
  );
  const [explanation, setExplanation] = useState(editData?.explanation || "");
  const [fromPassage, setFromPassage] = useState(editData?.fromPassage || "");

  // Special fields
  const [headingOptions, setHeadingOptions] = useState<
    { key: string; text: string }[]
  >(
    editData?.headingOptions
      ? Object.entries(editData.headingOptions).map(([key, text]) => ({
          key,
          text: text as string,
        }))
      : [],
  );
  const [tableHeaders, setTableHeaders] = useState<string[]>(
    editData?.tableData?.headers || [""],
  );
  const [tableRows, setTableRows] = useState<string[][]>(
    editData?.tableData?.rows || [[""]],
  );

  // Sub-questions
  const [subQuestions, setSubQuestions] = useState<IELTSSubQuestion[]>(
    editData?.questions?.length
      ? editData.questions.map((sq) => ({
          questionNumber: sq.questionNumber,
          questionText: sq.questionText || "",
          correctAnswer: sq.correctAnswer || "",
          explanation: sq.explanation || "",
          fromPassage: sq.fromPassage || "",
          points: sq.points
            ? typeof sq.points === "string"
              ? parseFloat(sq.points)
              : sq.points
            : 1,
          order: sq.order || 1,
        }))
      : [],
  );
  // Options (choices)
  const [options, setOptions] = useState<IELTSQuestionOption[]>(
    editData?.options?.length
      ? editData.options.map((o) => ({
          optionKey: o.optionKey,
          optionText: o.optionText,
          isCorrect: o.isCorrect || false,
          orderIndex: o.orderIndex || 0,
        }))
      : [],
  );

  const instructionEditor = useEditor({
    extensions: [StarterKit, Underline, Image],
    content: instruction,
    onUpdate({ editor }) {
      setInstruction(editor.getHTML());
    },
    shouldRerenderOnTransaction: true,
    immediatelyRender: false,
  });

  const questionTextEditor = useEditor({
    extensions: [StarterKit, Underline, Image],
    content: questionText,
    onUpdate({ editor }) {
      setQuestionText(editor.getHTML());
    },
    shouldRerenderOnTransaction: true,
    immediatelyRender: false,
  });

  // Auto-fill default instruction when type changes
  const handleTypeChange = useCallback(
    (newType: IELTSQuestionType) => {
      setType(newType);
      const defInst = defaultInstructions[newType];
      setInstruction(defInst);
      instructionEditor?.commands.setContent(defInst);

      // Reset type-specific data
      if (newType !== "MATCHING_HEADINGS") setHeadingOptions([]);
      if (newType !== "TABLE_COMPLETION") {
        setTableHeaders([""]);
        setTableRows([[""]]);
      }
    },
    [instructionEditor],
  );

  // Sync TipTap editors with initial content once they're ready
  useEffect(() => {
    if (isOpen) {
      instructionEditor?.commands.setContent(instruction);
      questionTextEditor?.commands.setContent(questionText);
    }
  }, [isOpen, instructionEditor, questionTextEditor]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Sub-question helpers ─────────────────────────── */
  const addSubQuestion = useCallback(() => {
    const base = questionNumber ? parseInt(questionNumber) : 1;
    setSubQuestions((prev) => [
      ...prev,
      {
        questionNumber: base + prev.length,
        questionText: "",
        correctAnswer: "",
        explanation: "",
        fromPassage: "",
        points: 1,
        order: prev.length + 1,
      },
    ]);
  }, [questionNumber]);

  const removeSubQuestion = useCallback((idx: number) => {
    setSubQuestions((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const updateSubQuestion = useCallback(
    (idx: number, field: keyof IELTSSubQuestion, value: string | number) => {
      setSubQuestions((prev) =>
        prev.map((sq, i) => (i === idx ? { ...sq, [field]: value } : sq)),
      );
    },
    [],
  );

  /* ── Option helpers ───────────────────────────────── */
  const addOption = useCallback(() => {
    const letter = String.fromCharCode(65 + options.length);
    setOptions((prev) => [
      ...prev,
      {
        optionKey: letter,
        optionText: "",
        isCorrect: false,
        orderIndex: prev.length,
      },
    ]);
  }, [options.length]);

  const removeOption = useCallback((idx: number) => {
    setOptions((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((o, i) => ({
          ...o,
          optionKey: String.fromCharCode(65 + i),
          orderIndex: i,
        })),
    );
  }, []);

  const updateOption = useCallback(
    (
      idx: number,
      field: keyof IELTSQuestionOption,
      value: string | boolean | number,
    ) => {
      setOptions((prev) =>
        prev.map((o, i) => (i === idx ? { ...o, [field]: value } : o)),
      );
    },
    [],
  );

  // For MULTIPLE_CHOICE: enforce single correct
  const toggleSingleCorrect = useCallback((idx: number) => {
    setOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === idx })));
  }, []);

  /* ── Heading Options helpers ──────────────────────── */
  const addHeadingOption = useCallback(() => {
    setHeadingOptions((prev) => {
      const romanNumerals = [
        "i",
        "ii",
        "iii",
        "iv",
        "v",
        "vi",
        "vii",
        "viii",
        "ix",
        "x",
        "xi",
        "xii",
      ];
      const nextKey = romanNumerals[prev.length] || `h${prev.length + 1}`;
      return [...prev, { key: nextKey, text: "" }];
    });
  }, []);

  const removeHeadingOption = useCallback((idx: number) => {
    setHeadingOptions((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const updateHeadingOption = useCallback(
    (idx: number, field: "key" | "text", value: string) => {
      setHeadingOptions((prev) =>
        prev.map((h, i) => (i === idx ? { ...h, [field]: value } : h)),
      );
    },
    [],
  );

  /* ── Table Data helpers ───────────────────────────── */
  const addTableColumn = useCallback(() => {
    setTableHeaders((prev) => [...prev, ""]);
    setTableRows((prev) => prev.map((row) => [...row, ""]));
  }, []);

  const removeTableColumn = useCallback((colIdx: number) => {
    setTableHeaders((prev) => prev.filter((_, i) => i !== colIdx));
    setTableRows((prev) =>
      prev.map((row) => row.filter((_, i) => i !== colIdx)),
    );
  }, []);

  const addTableRow = useCallback(() => {
    setTableRows((prev) => [...prev, new Array(tableHeaders.length).fill("")]);
  }, [tableHeaders.length]);

  const removeTableRow = useCallback((rowIdx: number) => {
    setTableRows((prev) => prev.filter((_, i) => i !== rowIdx));
  }, []);

  /* ── Save & Close ─────────────────────────────────── */
  const handleSave = () => {
    const question: IELTSQuestion = {
      type,
      questionText: questionText || undefined,
      instruction: instruction || undefined,
      questionNumber: questionNumber ? parseInt(questionNumber) : undefined,
      points: points ? parseInt(points) : 1,
      explanation: explanation || undefined,
      fromPassage: fromPassage || undefined,
      isActive: true,
    };

    // Heading options for MATCHING_HEADINGS
    if (type === "MATCHING_HEADINGS" && headingOptions.length > 0) {
      const ho: Record<string, string> = {};
      headingOptions.forEach((h) => {
        if (h.key) ho[h.key] = h.text;
      });
      question.headingOptions = ho;
    }

    // Table data for TABLE_COMPLETION
    if (type === "TABLE_COMPLETION") {
      question.tableData = {
        headers: tableHeaders,
        rows: tableRows,
      };
    }

    if (usesSubQuestions(type) && subQuestions.length > 0) {
      question.questions = subQuestions;
    }
    if (usesOptions(type) && options.length > 0) {
      question.options = options;
    }
    onSave(question);
    handleClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  const showSubs = usesSubQuestions(type);
  const showOpts = usesOptions(type);
  const answerMode = getAnswerMode(type);
  const isMultipleChoice = type === "MULTIPLE_CHOICE";

  /* ── Correct-answer input for sub-questions ──────── */
  const renderCorrectAnswer = (sq: IELTSSubQuestion, si: number) => {
    switch (answerMode) {
      case "dropdown-tfng":
        return (
          <NativeSelect.Root size="sm" w="140px" flexShrink={0}>
            <NativeSelect.Field
              value={sq.correctAnswer || ""}
              onChange={(e) =>
                updateSubQuestion(si, "correctAnswer", e.currentTarget.value)
              }
            >
              <option value="">Select…</option>
              <option value="TRUE">TRUE</option>
              <option value="FALSE">FALSE</option>
              <option value="NOT GIVEN">NOT GIVEN</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        );
      case "dropdown-ynng":
        return (
          <NativeSelect.Root size="sm" w="140px" flexShrink={0}>
            <NativeSelect.Field
              value={sq.correctAnswer || ""}
              onChange={(e) =>
                updateSubQuestion(si, "correctAnswer", e.currentTarget.value)
              }
            >
              <option value="">Select…</option>
              <option value="YES">YES</option>
              <option value="NO">NO</option>
              <option value="NOT GIVEN">NOT GIVEN</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        );
      case "select-option-key":
        return (
          <NativeSelect.Root size="sm" w="120px" flexShrink={0}>
            <NativeSelect.Field
              value={sq.correctAnswer || ""}
              onChange={(e) =>
                updateSubQuestion(si, "correctAnswer", e.currentTarget.value)
              }
            >
              <option value="">Key…</option>
              {options.map((opt) => (
                <option key={opt.optionKey} value={opt.optionKey}>
                  {opt.optionKey}
                  {opt.optionText ? ` – ${opt.optionText.slice(0, 20)}` : ""}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        );
      case "select-heading-key":
        return (
          <NativeSelect.Root size="sm" w="140px" flexShrink={0}>
            <NativeSelect.Field
              value={sq.correctAnswer || ""}
              onChange={(e) =>
                updateSubQuestion(si, "correctAnswer", e.currentTarget.value)
              }
            >
              <option value="">Key…</option>
              {headingOptions.map((h) => (
                <option key={h.key} value={h.key}>
                  {h.key} – {h.text.slice(0, 20)}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        );
      default:
        return (
          <Input
            size="sm"
            flex="1"
            placeholder="Correct answer"
            value={sq.correctAnswer || ""}
            onChange={(e) =>
              updateSubQuestion(si, "correctAnswer", e.target.value)
            }
          />
        );
    }
  };

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
        maxW="780px"
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
            {isEdit ? "Edit Question" : "Add Question"}
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
            {/* Question Type */}
            <Box>
              <FieldLabel>Question Type</FieldLabel>
              <NativeSelect.Root size="sm" w="full">
                <NativeSelect.Field
                  value={type}
                  onChange={(e) =>
                    handleTypeChange(e.currentTarget.value as IELTSQuestionType)
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
              {/* Type hint */}
              {typeHints[type] && (
                <Text fontSize="xs" color="blue.600" mt={1.5}>
                  {typeHints[type]}
                </Text>
              )}
            </Box>

            {/* Data structure badges */}
            <HStack gap={2} flexWrap="wrap">
              {showSubs && (
                <Badge size="sm" colorPalette="teal" variant="subtle">
                  Sub-Questions
                </Badge>
              )}
              {showOpts && (
                <Badge size="sm" colorPalette="purple" variant="subtle">
                  Options
                </Badge>
              )}
              {type === "MATCHING_HEADINGS" && (
                <Badge size="sm" colorPalette="orange" variant="subtle">
                  Heading Options
                </Badge>
              )}
              {type === "TABLE_COMPLETION" && (
                <Badge size="sm" colorPalette="orange" variant="subtle">
                  Table Data
                </Badge>
              )}
              {isMultipleChoice && (
                <Badge size="sm" colorPalette="yellow" variant="subtle">
                  Single Correct
                </Badge>
              )}
              {type === "MULTIPLE_ANSWER" && (
                <Badge size="sm" colorPalette="yellow" variant="subtle">
                  Multiple Correct
                </Badge>
              )}
            </HStack>

            {/* Question Number & Points */}
            <Flex gap={3}>
              <Box flex="1">
                <FieldLabel>Question Number</FieldLabel>
                <Input
                  size="sm"
                  type="number"
                  placeholder="e.g. 1"
                  value={questionNumber}
                  onChange={(e) => setQuestionNumber(e.target.value)}
                />
              </Box>
              <Box flex="1">
                <FieldLabel>Points</FieldLabel>
                <Input
                  size="sm"
                  type="number"
                  placeholder="1"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                />
              </Box>
            </Flex>

            {/* Instruction */}
            <Box>
              <FieldLabel>Instruction</FieldLabel>
              <RichTextEditor.Root
                editor={instructionEditor}
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
                  <RichTextEditor.ControlGroup>
                    <Control.ImageControl />
                  </RichTextEditor.ControlGroup>
                </RichTextEditor.Toolbar>
                <RichTextEditor.Content />
              </RichTextEditor.Root>
            </Box>

            {/* Question Text */}
            <Box>
              <FieldLabel>
                {type === "NOTE_COMPLETION" ||
                type === "SUMMARY_COMPLETION" ||
                type === "SUMMARY_COMPLETION_DRAG_DROP" ||
                type === "FLOW_CHART_COMPLETION"
                  ? "Question Text (HTML with ____ blanks)"
                  : type === "DIAGRAM_LABELLING" ||
                      type === "PLAN_MAP_LABELLING"
                    ? "Question Text (image/diagram HTML)"
                    : "Question Text"}
              </FieldLabel>
              <RichTextEditor.Root
                editor={questionTextEditor}
                css={{ "--content-min-height": "80px" }}
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

            {/* Explanation & From Passage (question-level) */}
            {/* <Flex gap={3}>
              <Box flex="1">
                <FieldLabel>Explanation</FieldLabel>
                <Input
                  size="sm"
                  placeholder="Explanation for the answer"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                />
              </Box>
              <Box flex="1">
                <FieldLabel>From Passage</FieldLabel>
                <Input
                  size="sm"
                  placeholder="Passage reference"
                  value={fromPassage}
                  onChange={(e) => setFromPassage(e.target.value)}
                />
              </Box>
            </Flex> */}

            {/* ── MATCHING_HEADINGS: Heading Options ────────── */}
            {type === "MATCHING_HEADINGS" && (
              <Box
                borderWidth="1px"
                borderColor="orange.200"
                _dark={{ borderColor: "orange.700" }}
                rounded="md"
                p={3}
              >
                <Flex justifyContent="space-between" alignItems="center" mb={2}>
                  <FieldLabel>Heading Options (i, ii, iii…)</FieldLabel>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={addHeadingOption}
                  >
                    <Plus size={12} /> Add Heading
                  </Button>
                </Flex>
                <VStack gap={2} alignItems="stretch">
                  {headingOptions.map((h, i) => (
                    <HStack key={i}>
                      <Input
                        size="sm"
                        w="60px"
                        fontWeight="700"
                        textAlign="center"
                        value={h.key}
                        onChange={(e) =>
                          updateHeadingOption(i, "key", e.target.value)
                        }
                        placeholder="i"
                      />
                      <Input
                        size="sm"
                        flex="1"
                        placeholder="Heading text"
                        value={h.text}
                        onChange={(e) =>
                          updateHeadingOption(i, "text", e.target.value)
                        }
                      />
                      <IconButton
                        size="xs"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() => removeHeadingOption(i)}
                        aria-label="Remove heading"
                      >
                        <X size={14} />
                      </IconButton>
                    </HStack>
                  ))}
                  {headingOptions.length === 0 && (
                    <Text fontSize="xs" color="gray.400" textAlign="center">
                      No headings yet. Click &quot;Add Heading&quot; to create
                      the list.
                    </Text>
                  )}
                </VStack>
              </Box>
            )}

            {/* ── TABLE_COMPLETION: Table Data ──────────────── */}
            {type === "TABLE_COMPLETION" && (
              <Box
                borderWidth="1px"
                borderColor="orange.200"
                _dark={{ borderColor: "orange.700" }}
                rounded="md"
                p={3}
              >
                <Flex justifyContent="space-between" alignItems="center" mb={2}>
                  <FieldLabel>Table Data</FieldLabel>
                  <HStack gap={1}>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={addTableColumn}
                    >
                      <Plus size={12} /> Column
                    </Button>
                    <Button size="xs" variant="outline" onClick={addTableRow}>
                      <Plus size={12} /> Row
                    </Button>
                  </HStack>
                </Flex>
                <Text fontSize="xs" color="gray.500" mb={2}>
                  Use &quot;____&quot; in cells for blanks (linked to
                  sub-questions by order).
                </Text>
                {/* Headers */}
                <HStack gap={1} mb={1}>
                  {tableHeaders.map((hdr, ci) => (
                    <Flex key={ci} flex="1" gap={0.5}>
                      <Input
                        size="xs"
                        fontWeight="700"
                        value={hdr}
                        onChange={(e) =>
                          setTableHeaders((prev) =>
                            prev.map((h, i) => (i === ci ? e.target.value : h)),
                          )
                        }
                        placeholder={`Header ${ci + 1}`}
                      />
                      {tableHeaders.length > 1 && (
                        <IconButton
                          size="xs"
                          variant="ghost"
                          colorPalette="red"
                          onClick={() => removeTableColumn(ci)}
                          aria-label="Remove column"
                        >
                          <X size={10} />
                        </IconButton>
                      )}
                    </Flex>
                  ))}
                </HStack>
                {/* Rows */}
                <VStack gap={1} alignItems="stretch">
                  {tableRows.map((row, ri) => (
                    <HStack key={ri} gap={1}>
                      {row.map((cell, ci) => (
                        <Input
                          key={ci}
                          size="xs"
                          flex="1"
                          value={cell}
                          onChange={(e) =>
                            setTableRows((prev) =>
                              prev.map((r, rIdx) =>
                                rIdx === ri
                                  ? r.map((c, cIdx) =>
                                      cIdx === ci ? e.target.value : c,
                                    )
                                  : r,
                              ),
                            )
                          }
                          placeholder={cell === "____" ? "____" : "Cell value"}
                          bg={cell === "____" ? "yellow.50" : undefined}
                        />
                      ))}
                      {tableRows.length > 1 && (
                        <IconButton
                          size="xs"
                          variant="ghost"
                          colorPalette="red"
                          onClick={() => removeTableRow(ri)}
                          aria-label="Remove row"
                        >
                          <X size={10} />
                        </IconButton>
                      )}
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}

            {/* ── Options (Choices) ─────────────────────────── */}
            {showOpts && (
              <Box
                borderWidth="1px"
                borderColor="purple.200"
                _dark={{ borderColor: "purple.700" }}
                rounded="md"
                p={3}
              >
                <Flex justifyContent="space-between" alignItems="center" mb={2}>
                  <FieldLabel>
                    {isMultipleChoice
                      ? "Options (select ONE correct)"
                      : type === "MULTIPLE_ANSWER"
                        ? "Options (select MULTIPLE correct)"
                        : type === "SUMMARY_COMPLETION_DRAG_DROP"
                          ? "Word Bank"
                          : type === "MATCHING_FEATURES"
                            ? "Features / Categories"
                            : type === "MATCHING_SENTENCE_ENDINGS"
                              ? "Sentence Endings"
                              : type === "PLAN_MAP_LABELLING"
                                ? "Location Labels"
                                : "Options (Choices)"}
                  </FieldLabel>
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
                        {opt.optionKey}
                      </Box>
                      <Input
                        size="sm"
                        flex="1"
                        placeholder="Option text"
                        value={opt.optionText}
                        onChange={(e) =>
                          updateOption(i, "optionText", e.target.value)
                        }
                      />
                      {/* isCorrect: only for MULTIPLE_CHOICE/MULTIPLE_ANSWER */}
                      {(isMultipleChoice || type === "MULTIPLE_ANSWER") && (
                        <>
                          <input
                            type={isMultipleChoice ? "radio" : "checkbox"}
                            name="correctOption"
                            checked={opt.isCorrect}
                            onChange={() =>
                              isMultipleChoice
                                ? toggleSingleCorrect(i)
                                : updateOption(i, "isCorrect", !opt.isCorrect)
                            }
                            title="Correct?"
                          />
                          <Text
                            fontSize="xs"
                            color="gray.500"
                            whiteSpace="nowrap"
                          >
                            Correct
                          </Text>
                        </>
                      )}
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
                  {options.length === 0 && (
                    <Text fontSize="xs" color="gray.400" textAlign="center">
                      No options yet.
                    </Text>
                  )}
                </VStack>
              </Box>
            )}

            {/* ── Sub-Questions ─────────────────────────────── */}
            {showSubs && (
              <Box
                borderWidth="1px"
                borderColor="teal.200"
                _dark={{ borderColor: "teal.700" }}
                rounded="md"
                p={3}
              >
                <Flex justifyContent="space-between" alignItems="center" mb={2}>
                  <FieldLabel>
                    {type === "TRUE_FALSE_NOT_GIVEN" ||
                    type === "YES_NO_NOT_GIVEN"
                      ? "Statements"
                      : type === "MATCHING_INFORMATION"
                        ? "Statements (match to paragraph)"
                        : type === "MATCHING_HEADINGS"
                          ? "Paragraphs (match to heading)"
                          : type === "MATCHING_FEATURES"
                            ? "Statements (match to feature)"
                            : type === "MATCHING_SENTENCE_ENDINGS"
                              ? "Sentence Beginnings"
                              : "Sub-Questions"}
                  </FieldLabel>
                  <Button size="xs" variant="outline" onClick={addSubQuestion}>
                    <Plus size={12} /> Add
                  </Button>
                </Flex>
                <VStack gap={3} alignItems="stretch">
                  {subQuestions.map((sq, si) => (
                    <Box
                      key={si}
                      borderWidth="1px"
                      borderColor="gray.200"
                      _dark={{ borderColor: "gray.600", bg: "gray.700" }}
                      rounded="md"
                      p={3}
                      bg="white"
                    >
                      <Flex
                        justifyContent="space-between"
                        alignItems="center"
                        mb={2}
                      >
                        <Text fontSize="sm" fontWeight="600">
                          #{sq.questionNumber || si + 1}
                        </Text>
                        <Button
                          size="xs"
                          colorPalette="red"
                          variant="ghost"
                          onClick={() => removeSubQuestion(si)}
                        >
                          <Trash2 size={12} /> Remove
                        </Button>
                      </Flex>
                      <VStack gap={2} alignItems="stretch">
                        <Flex gap={2}>
                          <Input
                            size="sm"
                            flex="2"
                            placeholder={
                              type === "TRUE_FALSE_NOT_GIVEN" ||
                              type === "YES_NO_NOT_GIVEN"
                                ? "Statement text"
                                : type === "MATCHING_HEADINGS"
                                  ? "e.g. Paragraph A"
                                  : type === "MATCHING_INFORMATION"
                                    ? "Information to find"
                                    : type === "MATCHING_SENTENCE_ENDINGS"
                                      ? "Sentence beginning"
                                      : "Question / blank text"
                            }
                            value={sq.questionText || ""}
                            onChange={(e) =>
                              updateSubQuestion(
                                si,
                                "questionText",
                                e.target.value,
                              )
                            }
                          />
                          {renderCorrectAnswer(sq, si)}
                        </Flex>
                        <Flex gap={2}>
                          <Input
                            size="sm"
                            flex="1"
                            placeholder="Explanation"
                            value={sq.explanation || ""}
                            onChange={(e) =>
                              updateSubQuestion(
                                si,
                                "explanation",
                                e.target.value,
                              )
                            }
                          />
                          <Input
                            size="sm"
                            flex="1"
                            placeholder="From passage"
                            value={sq.fromPassage || ""}
                            onChange={(e) =>
                              updateSubQuestion(
                                si,
                                "fromPassage",
                                e.target.value,
                              )
                            }
                          />
                          <Input
                            size="sm"
                            w="60px"
                            type="number"
                            placeholder="Order"
                            value={sq.order || ""}
                            onChange={(e) =>
                              updateSubQuestion(
                                si,
                                "order",
                                parseInt(e.target.value) || 1,
                              )
                            }
                          />
                          <Input
                            size="sm"
                            w="60px"
                            type="number"
                            placeholder="Pts"
                            value={sq.points || ""}
                            onChange={(e) =>
                              updateSubQuestion(
                                si,
                                "points",
                                parseInt(e.target.value) || 1,
                              )
                            }
                          />
                        </Flex>
                      </VStack>
                    </Box>
                  ))}
                  {subQuestions.length === 0 && (
                    <Text fontSize="xs" color="gray.400" textAlign="center">
                      No sub-questions yet. Click &quot;Add&quot; to begin.
                    </Text>
                  )}
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
            {isEdit ? "Update Question" : "Add Question"}
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
