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
} from "@chakra-ui/react";
import { Save } from "lucide-react";
import { useState, useEffect } from "react";
import { ieltsTestsAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type { PageId } from "./types";

interface TestFormProps {
  editId?: string | null;
  onNavigate: (page: PageId, data?: Record<string, string>) => void;
}

export default function TestForm({ editId, onNavigate }: TestFormProps) {
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState("practice");
  const [status, setStatus] = useState("draft");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!editId;

  useEffect(() => {
    if (editId) {
      setLoading(true);
      ieltsTestsAPI
        .getById(editId)
        .then((t: Record<string, string>) => {
          setTitle(t.title || "");
          setMode(t.mode || "practice");
          setStatus(t.status || "draft");
          setCategory(t.category || "");
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
      const body: Record<string, string> = { title, mode, status };
      if (category) body.category = category;

      if (isEdit) {
        await ieltsTestsAPI.update(editId!, body);
        toaster.success({ title: "Test updated!" });
      } else {
        const r = await ieltsTestsAPI.create(body);
        toaster.success({ title: `Test created! ID: ${r.id}` });
      }
      onNavigate("tests");
    } catch (e: unknown) {
      toaster.error({ title: "Error", description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box py={12} textAlign="center" color="gray.400">
        Loading...
      </Box>
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
          onClick={() => onNavigate("tests")}
        >
          Tests
        </Text>
        <Text color="gray.300" _dark={{ color: "gray.600" }}>
          /
        </Text>
        <Text>{isEdit ? "Edit Test" : "Create Test"}</Text>
      </HStack>

      <Box
        bg="white"
        _dark={{ bg: "gray.800" }}
        rounded="lg"
        borderWidth="1px"
        shadow="sm"
      >
        <Flex
          px={5}
          py={3.5}
          borderBottomWidth="1px"
          alignItems="center"
          justifyContent="space-between"
        >
          <Heading size="sm" fontWeight="600">
            {isEdit ? "Edit Test" : "Create New Test"}
          </Heading>
        </Flex>
        <Box px={5} py={5}>
          <VStack gap={4} alignItems="stretch">
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
                Test Title
              </Text>
              <Input
                placeholder="e.g. Cambridge IELTS 18 - Test 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
                  Mode
                </Text>
                <NativeSelect.Root size="sm" w="full">
                  <NativeSelect.Field
                    value={mode}
                    onChange={(e) => setMode(e.currentTarget.value)}
                  >
                    <option value="practice">Practice</option>
                    <option value="mock">Mock Exam</option>
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
                  Status
                </Text>
                <NativeSelect.Root size="sm" w="full">
                  <NativeSelect.Field
                    value={status}
                    onChange={(e) => setStatus(e.currentTarget.value)}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
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
                  Category
                </Text>
                <NativeSelect.Root size="sm" w="full">
                  <NativeSelect.Field
                    value={category}
                    onChange={(e) => setCategory(e.currentTarget.value)}
                  >
                    <option value="">-- Select --</option>
                    <option value="authentic">Authentic</option>
                    <option value="pre-test">Pre-Test</option>
                    <option value="cambridge books">Cambridge Books</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
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
                <Save size={14} /> {isEdit ? "Update Test" : "Save Test"}
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate("tests")}
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
