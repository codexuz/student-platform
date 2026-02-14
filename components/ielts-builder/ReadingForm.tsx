"use client";

import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Text,
  VStack,
  Spinner,
  Flex,
} from "@chakra-ui/react";
import { Save } from "lucide-react";
import { useState, useEffect } from "react";
import { ieltsReadingAPI, ieltsTestsAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type { PageId, IELTSTest } from "./types";

interface ReadingFormProps {
  editId?: string | null;
  prefillTestId?: string;
  onNavigate: (page: PageId, data?: Record<string, string>) => void;
}

export default function ReadingForm({
  editId,
  prefillTestId,
  onNavigate,
}: ReadingFormProps) {
  const isEdit = !!editId;
  const [title, setTitle] = useState("");
  const [testId, setTestId] = useState(prefillTestId || "");
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(!!editId);
  const [tests, setTests] = useState<IELTSTest[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);

  useEffect(() => {
    ieltsTestsAPI
      .getAll()
      .then((res: IELTSTest[] | { data: IELTSTest[] }) => {
        const list = Array.isArray(res) ? res : res.data || [];
        setTests(list);
      })
      .catch(() => {})
      .finally(() => setLoadingTests(false));
  }, []);

  useEffect(() => {
    if (!editId) return;
    setLoadingData(true);
    ieltsReadingAPI
      .getById(editId)
      .then((r: { title?: string; test_id?: string }) => {
        setTitle(r.title || "");
        setTestId(r.test_id || "");
      })
      .catch(() => {
        toaster.error({ title: "Failed to load reading" });
      })
      .finally(() => setLoadingData(false));
  }, [editId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = { title, test_id: testId };
      if (isEdit) {
        await ieltsReadingAPI.update(editId, body);
        toaster.success({ title: "Reading updated!" });
      } else {
        const r = await ieltsReadingAPI.create(body);
        toaster.success({ title: `Reading created! ID: ${r.id}` });
      }
      onNavigate("readings");
    } catch (e: unknown) {
      toaster.error({ title: "Error", description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  if (loadingData)
    return (
      <Flex justifyContent="center" py={12}>
        <Spinner size="lg" color="#4f46e5" />
      </Flex>
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
          onClick={() => onNavigate("readings")}
        >
          Readings
        </Text>
        <Text color="gray.300" _dark={{ color: "gray.600" }}>
          /
        </Text>
        <Text>{isEdit ? "Edit Reading" : "Create Reading"}</Text>
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
            {isEdit ? "Edit Reading Section" : "Create Reading Section"}
          </Heading>
        </Box>
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
                Title
              </Text>
              <Input
                placeholder="e.g. Academic Reading Test"
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
                Test
              </Text>
              {loadingTests ? (
                <HStack gap={2} py={2}>
                  <Spinner size="xs" />
                  <Text fontSize="sm" color="gray.400">
                    Loading tests...
                  </Text>
                </HStack>
              ) : (
                <NativeSelect.Root size="sm" w="full">
                  <NativeSelect.Field
                    value={testId}
                    onChange={(e) => setTestId(e.currentTarget.value)}
                  >
                    <option value="">— Select a test —</option>
                    {tests.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              )}
            </Box>
            <HStack gap={2} pt={2}>
              <Button
                bg="#10b981"
                color="white"
                _hover={{ bg: "#059669" }}
                onClick={handleSave}
                loading={saving}
                size="sm"
              >
                <Save size={14} /> {isEdit ? "Update Reading" : "Save Reading"}
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate("readings")}
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
