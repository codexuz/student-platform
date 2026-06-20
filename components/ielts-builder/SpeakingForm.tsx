"use client";

import {
  Box,
  Button,
  Combobox,
  Flex,
  Heading,
  HStack,
  Input,
  Portal,
  Text,
  Textarea,
  VStack,
  Spinner,
  NativeSelect,
  Switch,
  createListCollection,
} from "@chakra-ui/react";
import { Save, ChevronsUpDown } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ieltsSpeakingAPI, ieltsTestsAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type { IELTSTest } from "./types";

const VOICES = ["alloy", "ash", "ballad", "coral", "sage", "verse", "marin", "cedar"];

interface SpeakingFormProps {
  editId?: string | null;
}

export default function SpeakingForm({ editId }: SpeakingFormProps) {
  const router = useRouter();
  const isEdit = !!editId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState("practice");
  const [voice, setVoice] = useState("alloy");
  const [isActive, setIsActive] = useState(true);
  const [testId, setTestId] = useState("");

  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(!!editId);
  const [tests, setTests] = useState<IELTSTest[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [testSearch, setTestSearch] = useState("");
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

  useEffect(() => {
    ieltsTestsAPI
      .getAll({ limit: 20 })
      .then((res: IELTSTest[] | { data: IELTSTest[] }) => {
        setTests(Array.isArray(res) ? res : res.data || []);
      })
      .catch(() => {})
      .finally(() => setLoadingTests(false));
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      ieltsTestsAPI
        .getAll({ limit: 20, search: testSearch || undefined })
        .then((res: IELTSTest[] | { data: IELTSTest[] }) => {
          setTests(Array.isArray(res) ? res : res.data || []);
        })
        .catch(() => {});
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [testSearch]);

  useEffect(() => {
    if (!editId) return;
    setLoadingData(true);
    ieltsSpeakingAPI
      .getById(editId)
      .then(
        (r: {
          title?: string;
          description?: string;
          mode?: string;
          voice?: string;
          is_active?: boolean;
          test_id?: string;
        }) => {
          setTitle(r.title || "");
          setDescription(r.description || "");
          setMode(r.mode || "practice");
          setVoice(r.voice || "alloy");
          setIsActive(r.is_active !== false);
          setTestId(r.test_id || "");
          if (r.test_id) {
            ieltsTestsAPI
              .getById(r.test_id)
              .then((test: IELTSTest) =>
                setTests((prev) =>
                  prev.some((t) => t.id === test.id) ? prev : [test, ...prev],
                ),
              )
              .catch(() => {});
          }
        },
      )
      .catch(() => toaster.error({ title: "Failed to load topic" }))
      .finally(() => setLoadingData(false));
  }, [editId]);

  const handleSave = async () => {
    if (!title.trim()) {
      toaster.error({ title: "Title is required" });
      return;
    }
    setSaving(true);
    try {
      const body = {
        title,
        description: description || undefined,
        mode,
        voice,
        is_active: isActive,
        test_id: testId || undefined,
      };
      if (isEdit) {
        await ieltsSpeakingAPI.update(editId, body);
        toaster.success({ title: "Topic updated!" });
      } else {
        const r = await ieltsSpeakingAPI.create(body);
        toaster.success({ title: `Topic created! ID: ${r.id}` });
      }
      router.push("/ielts-test-builder/speakings");
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
          onClick={() => router.push("/ielts-test-builder/speakings")}
        >
          Speaking
        </Text>
        <Text>/</Text>
        <Text>{isEdit ? "Edit Topic" : "Create Topic"}</Text>
      </HStack>

      <Box bg="white" _dark={{ bg: "gray.800" }} rounded="lg" borderWidth="1px" shadow="sm">
        <Box px={5} py={3.5} borderBottomWidth="1px">
          <Heading size="sm" fontWeight="600">
            {isEdit ? "Edit Speaking Topic" : "Create Speaking Topic"}
          </Heading>
        </Box>
        <Box px={5} py={5}>
          <VStack gap={4} alignItems="stretch">
            <Field label="Title">
              <Input
                placeholder="e.g. Daily Life & Hometown"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>

            <Field label="Description">
              <Textarea
                placeholder="Short description of the topic"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </Field>

            <HStack gap={4} alignItems="flex-start">
              <Field label="Mode">
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                  >
                    <option value="practice">Practice</option>
                    <option value="mock">Mock</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field>

              <Field label="Examiner voice">
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field
                    value={voice}
                    onChange={(e) => setVoice(e.target.value)}
                  >
                    {VOICES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field>
            </HStack>

            <Field label="Test (optional)">
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
                  onValueChange={(d) => setTestId(d.value[0] || "")}
                  onInputValueChange={(d) => setTestSearch(d.inputValue)}
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
            </Field>

            <Switch.Root
              checked={isActive}
              onCheckedChange={(d) => setIsActive(d.checked)}
            >
              <Switch.HiddenInput />
              <Switch.Control />
              <Switch.Label>Active (visible to students)</Switch.Label>
            </Switch.Root>

            <HStack gap={2} pt={2}>
              <Button
                bg="#10b981"
                color="white"
                _hover={{ bg: "#059669" }}
                onClick={handleSave}
                loading={saving}
                size="sm"
              >
                <Save size={14} /> {isEdit ? "Update Topic" : "Save Topic"}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/ielts-test-builder/speakings")}
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
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
        {label}
      </Text>
      {children}
    </Box>
  );
}
