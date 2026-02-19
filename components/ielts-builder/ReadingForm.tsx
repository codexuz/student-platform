"use client";

import {
  Box,
  Button,
  Combobox,
  Heading,
  HStack,
  Input,
  Portal,
  Text,
  VStack,
  Spinner,
  Flex,
  createListCollection,
} from "@chakra-ui/react";
import { Save, ChevronsUpDown } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
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
  const [testSearchInput, setTestSearchInput] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const testCollection = useMemo(
    () =>
      createListCollection({
        items: tests,
        itemToValue: (t) => t.id,
        itemToString: (t) => t.title,
      }),
    [tests],
  );

  // Load initial tests
  useEffect(() => {
    ieltsTestsAPI
      .getAll({ limit: 20 })
      .then((res: IELTSTest[] | { data: IELTSTest[] }) => {
        const list = Array.isArray(res) ? res : res.data || [];
        setTests(list);
      })
      .catch(() => {})
      .finally(() => setLoadingTests(false));
  }, []);

  // Debounced search for tests
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      ieltsTestsAPI
        .getAll({ limit: 20, search: testSearchInput || undefined })
        .then((res: IELTSTest[] | { data: IELTSTest[] }) => {
          const list = Array.isArray(res) ? res : res.data || [];
          setTests(list);
        })
        .catch(() => {});
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [testSearchInput]);

  useEffect(() => {
    if (!editId) return;
    setLoadingData(true);
    ieltsReadingAPI
      .getById(editId)
      .then((r: { title?: string; test_id?: string }) => {
        setTitle(r.title || "");
        setTestId(r.test_id || "");
        // Ensure the linked test appears in the combobox list
        if (r.test_id) {
          ieltsTestsAPI
            .getById(r.test_id)
            .then((test: IELTSTest) => {
              setTests((prev) =>
                prev.some((t) => t.id === test.id) ? prev : [test, ...prev],
              );
            })
            .catch(() => {});
        }
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
                <Combobox.Root
                  collection={testCollection}
                  value={testId ? [testId] : []}
                  onValueChange={(details) => {
                    setTestId(details.value[0] || "");
                  }}
                  onInputValueChange={(details) => {
                    setTestSearchInput(details.inputValue);
                  }}
                  inputBehavior="autohighlight"
                  openOnClick
                  size="sm"
                  w="full"
                >
                  <Combobox.Control>
                    <Combobox.Input placeholder="Search tests..." />
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
                        <Combobox.Empty>No tests found</Combobox.Empty>
                        {testCollection.items.map((t) => (
                          <Combobox.Item key={t.id} item={t}>
                            {t.title}
                            <Combobox.ItemIndicator />
                          </Combobox.Item>
                        ))}
                      </Combobox.Content>
                    </Combobox.Positioner>
                  </Portal>
                </Combobox.Root>
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
