"use client";

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Text,
  VStack,
  Badge,
  IconButton,
} from "@chakra-ui/react";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { QuestionGroup, QuestionContent } from "./types";
import QuestionContentModal from "./QuestionContentModal";

const typeColors: Record<string, { bg: string; color: string }> = {
  completion: { bg: "#dbeafe", color: "#1d4ed8" },
  "multiple-choice": { bg: "#fce7f3", color: "#be185d" },
  "multi-select": { bg: "#ede9fe", color: "#6d28d9" },
  selection: { bg: "#d1fae5", color: "#065f46" },
  "draggable-selection": { bg: "#fef3c7", color: "#92400e" },
  "matching-information": { bg: "#fce4ec", color: "#880e4f" },
};

interface QuestionGroupsBuilderProps {
  groups: QuestionGroup[];
  onChange: (groups: QuestionGroup[]) => void;
}

export default function QuestionGroupsBuilder({
  groups,
  onChange,
}: QuestionGroupsBuilderProps) {
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [targetGroupIndex, setTargetGroupIndex] = useState<number | null>(null);

  const addGroup = () => {
    onChange([...groups, { number_of_questions: 10, contents: [] }]);
  };

  const removeGroup = (idx: number) => {
    onChange(groups.filter((_, i) => i !== idx));
  };

  const updateGroupCount = (idx: number, count: number) => {
    onChange(
      groups.map((g, i) =>
        i === idx ? { ...g, number_of_questions: count } : g,
      ),
    );
  };

  const removeContent = (groupIdx: number, contentIdx: number) => {
    onChange(
      groups.map((g, i) =>
        i === groupIdx
          ? { ...g, contents: g.contents.filter((_, ci) => ci !== contentIdx) }
          : g,
      ),
    );
  };

  const openAddContent = (groupIdx: number) => {
    setTargetGroupIndex(groupIdx);
    setModalOpen(true);
  };

  const handleSaveContent = (content: QuestionContent) => {
    if (targetGroupIndex === null) return;
    onChange(
      groups.map((g, i) =>
        i === targetGroupIndex
          ? { ...g, contents: [...g.contents, content] }
          : g,
      ),
    );
  };

  const toggleCollapse = (idx: number) => {
    setCollapsed((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const truncate = (s: string, n: number) =>
    s && s.length > n ? s.substring(0, n) + "..." : s || "";

  return (
    <>
      <Box
        borderWidth="1px"
        rounded="lg"
        overflow="hidden"
        bg="white"
        _dark={{ bg: "gray.800" }}
      >
        <Flex
          px={4}
          py={3}
          borderBottomWidth="1px"
          bg="gray.50"
          _dark={{ bg: "gray.700" }}
          alignItems="center"
          justifyContent="space-between"
        >
          <Heading size="sm" fontWeight="600">
            Question Groups
          </Heading>
          <Button
            size="xs"
            bg="#4f46e5"
            color="white"
            _hover={{ bg: "#3730a3" }}
            onClick={addGroup}
          >
            <Plus size={12} /> Add Group
          </Button>
        </Flex>
        <Box p={4}>
          {groups.length === 0 ? (
            <Text fontSize="sm" color="gray.400" textAlign="center" py={4}>
              No question groups. Click &quot;+ Add Group&quot;.
            </Text>
          ) : (
            <VStack gap={3} alignItems="stretch">
              {groups.map((group, gi) => (
                <Box
                  key={gi}
                  borderWidth="1.5px"
                  borderColor="gray.200"
                  _dark={{ borderColor: "gray.600" }}
                  rounded="lg"
                  overflow="hidden"
                >
                  {/* Group Header */}
                  <Flex
                    px={3}
                    py={2.5}
                    bg="gray.50"
                    _dark={{ bg: "gray.700" }}
                    alignItems="center"
                    justifyContent="space-between"
                    cursor="pointer"
                    userSelect="none"
                    onClick={() => toggleCollapse(gi)}
                  >
                    <HStack>
                      <Box
                        transition="transform 0.2s"
                        transform={
                          collapsed[gi] ? "rotate(-90deg)" : "rotate(0)"
                        }
                      >
                        <ChevronDown size={14} />
                      </Box>
                      <Text fontSize="sm" fontWeight="600">
                        Group {gi + 1}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        ({group.contents.length} content blocks)
                      </Text>
                    </HStack>
                    <HStack onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="xs"
                        bg="#4f46e5"
                        color="white"
                        _hover={{ bg: "#3730a3" }}
                        onClick={() => openAddContent(gi)}
                      >
                        <Plus size={12} /> Content
                      </Button>
                      <IconButton
                        size="xs"
                        colorPalette="red"
                        variant="ghost"
                        onClick={() => removeGroup(gi)}
                        aria-label="Remove group"
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </HStack>
                  </Flex>

                  {/* Group Body */}
                  {!collapsed[gi] && (
                    <Box p={3} borderTopWidth="1px">
                      <Box mb={3}>
                        <Text
                          fontSize="xs"
                          fontWeight="600"
                          color="gray.600"
                          _dark={{ color: "gray.400" }}
                          mb={1}
                          textTransform="uppercase"
                          letterSpacing="0.3px"
                        >
                          Number of Questions
                        </Text>
                        <Input
                          size="sm"
                          type="number"
                          w="120px"
                          value={group.number_of_questions}
                          onChange={(e) =>
                            updateGroupCount(gi, parseInt(e.target.value) || 0)
                          }
                        />
                      </Box>

                      {group.contents.length === 0 ? (
                        <Text fontSize="sm" color="gray.400" mt={2}>
                          No content blocks yet.
                        </Text>
                      ) : (
                        <VStack gap={2} alignItems="stretch">
                          {group.contents.map((ct, ci) => {
                            const tc = typeColors[ct.type] || {
                              bg: "#f3f4f6",
                              color: "#374151",
                            };
                            return (
                              <Box
                                key={ci}
                                borderWidth="1px"
                                borderStyle="dashed"
                                borderColor="gray.300"
                                _dark={{
                                  borderColor: "gray.600",
                                  bg: "gray.700",
                                }}
                                rounded="md"
                                p={3}
                                bg="gray.50"
                                position="relative"
                              >
                                <Flex
                                  justifyContent="space-between"
                                  alignItems="center"
                                  mb={1}
                                >
                                  <HStack>
                                    <Badge
                                      bg={tc.bg}
                                      color={tc.color}
                                      fontSize="10px"
                                      fontWeight="700"
                                      textTransform="uppercase"
                                      px={2}
                                      rounded="sm"
                                      variant="plain"
                                    >
                                      {ct.type}
                                    </Badge>
                                    <Text fontSize="sm" fontWeight="600">
                                      {ct.title || "Untitled"}
                                    </Text>
                                  </HStack>
                                  <IconButton
                                    size="xs"
                                    colorPalette="red"
                                    variant="ghost"
                                    onClick={() => removeContent(gi, ci)}
                                    aria-label="Remove content"
                                  >
                                    <Trash2 size={14} />
                                  </IconButton>
                                </Flex>
                                {ct.condition && (
                                  <Text fontSize="xs" color="gray.500">
                                    {truncate(ct.condition, 120)}
                                  </Text>
                                )}
                                {ct.options && ct.options.length > 0 && (
                                  <Text fontSize="xs" color="gray.400" mt={1}>
                                    Options:{" "}
                                    {ct.options.map((o) => o.label).join(", ")}
                                  </Text>
                                )}
                                {ct.multipleChoiceQuestions &&
                                  ct.multipleChoiceQuestions.length > 0 && (
                                    <Text fontSize="xs" color="gray.400" mt={1}>
                                      {ct.multipleChoiceQuestions.length} MCQ(s)
                                    </Text>
                                  )}
                              </Box>
                            );
                          })}
                        </VStack>
                      )}
                    </Box>
                  )}
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      </Box>

      <QuestionContentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveContent}
      />
    </>
  );
}
