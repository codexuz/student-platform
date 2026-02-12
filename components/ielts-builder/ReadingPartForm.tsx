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
import { useState, useEffect } from "react";
import { ieltsReadingPartsAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type { QuestionGroup, QuestionContent, PageId } from "./types";
import QuestionGroupsBuilder from "./QuestionGroupsBuilder";

interface ReadingPartFormProps {
  editId?: string | null;
  prefillReadingId?: string;
  onNavigate: (page: PageId, data?: Record<string, string>) => void;
}

function buildContentPayload(c: QuestionContent) {
  const block: Record<string, unknown> = {
    type: c.type,
    title: c.title,
    condition: c.condition || null,
    content: c.content || null,
    limit: c.limit,
    showOptions: c.showOptions,
    optionsTitle: c.optionsTitle || null,
    order: c.order,
  };
  if (c.options?.length) {
    block.options = c.options.map((o, i) => ({
      value: o.value,
      label: o.label,
      order: o.order || i + 1,
    }));
  }
  if (c.multipleChoiceQuestions?.length) {
    block.multipleChoiceQuestions = c.multipleChoiceQuestions.map((m, i) => ({
      question: m.question,
      order: m.order || i + 1,
      options: m.options.map((o, j) => ({
        value: o.value,
        label: o.label,
        order: o.order || j + 1,
      })),
    }));
  }
  return block;
}

export default function ReadingPartForm({
  editId,
  prefillReadingId,
  onNavigate,
}: ReadingPartFormProps) {
  const [readingId, setReadingId] = useState(prefillReadingId || "");
  const [part, setPart] = useState("PART_1");
  const [title, setTitle] = useState("");
  const [passage, setPassage] = useState("");
  const [answers, setAnswers] = useState("");
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!editId;

  useEffect(() => {
    if (editId) {
      setLoading(true);
      ieltsReadingPartsAPI
        .getById(editId)
        .then((p: Record<string, unknown>) => {
          setReadingId((p.reading_id as string) || "");
          setPart((p.part as string) || "PART_1");
          setTitle((p.title as string) || "");
          setPassage((p.passage as string) || "");
          setAnswers(p.answers ? JSON.stringify(p.answers, null, 2) : "");
          setQuestionGroups(
            ((p.questions as QuestionGroup[]) || []).map((q) => ({
              number_of_questions: q.number_of_questions || 0,
              contents: (q.contents || []).map((c) => ({ ...c })),
            })),
          );
        })
        .catch((e: Error) =>
          toaster.error({ title: "Error", description: e.message }),
        )
        .finally(() => setLoading(false));
    }
  }, [editId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      let parsedAnswers = null;
      if (answers.trim()) {
        try {
          parsedAnswers = JSON.parse(answers);
        } catch {
          toaster.error({ title: "Invalid JSON in answers" });
          setSaving(false);
          return;
        }
      }
      const body = {
        reading_id: readingId,
        part,
        title: title || null,
        passage: passage || null,
        answers: parsedAnswers,
        questions: questionGroups.map((q) => ({
          number_of_questions: q.number_of_questions,
          contents: q.contents.map(buildContentPayload),
        })),
      };

      if (isEdit) {
        await ieltsReadingPartsAPI.update(editId!, body);
        toaster.success({ title: "Reading part updated!" });
      } else {
        const r = await ieltsReadingPartsAPI.create(body);
        toaster.success({ title: `Reading part created! ID: ${r.id}` });
      }
      onNavigate("reading-parts");
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
                  Reading ID
                </Text>
                <Input
                  placeholder="UUID of reading section"
                  value={readingId}
                  onChange={(e) => setReadingId(e.target.value)}
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
                  Part
                </Text>
                <NativeSelect.Root size="sm" w="full">
                  <NativeSelect.Field
                    value={part}
                    onChange={(e) => setPart(e.currentTarget.value)}
                  >
                    <option value="PART_1">Part 1</option>
                    <option value="PART_2">Part 2</option>
                    <option value="PART_3">Part 3</option>
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
              <Textarea
                placeholder="Paste the reading passage here..."
                value={passage}
                onChange={(e) => setPassage(e.target.value)}
                rows={6}
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
                Answer Key (JSON)
              </Text>
              <Textarea
                placeholder='{"1":"answer1","2":"answer2"}'
                value={answers}
                onChange={(e) => setAnswers(e.target.value)}
                rows={3}
              />
            </Box>

            <QuestionGroupsBuilder
              groups={questionGroups}
              onChange={setQuestionGroups}
            />

            <HStack gap={2} pt={2}>
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
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}
