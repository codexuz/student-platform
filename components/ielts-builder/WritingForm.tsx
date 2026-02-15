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
  Spinner,
} from "@chakra-ui/react";
import { Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import { Control, RichTextEditor } from "@/components/ui/rich-text-editor";
import { ieltsWritingAPI, ieltsTestsAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type { PageId, IELTSTest } from "./types";

interface WritingFormProps {
  editId?: string | null;
  prefillTestId?: string;
  onNavigate: (page: PageId, data?: Record<string, string>) => void;
}

export default function WritingForm({
  editId,
  prefillTestId,
  onNavigate,
}: WritingFormProps) {
  const isEdit = !!editId;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const descriptionEditor = useEditor({
    extensions: [StarterKit, Underline, Image],
    content: description,
    onUpdate({ editor }) {
      setDescription(editor.getHTML());
    },
    shouldRerenderOnTransaction: true,
    immediatelyRender: false,
  });

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
    ieltsWritingAPI
      .getById(editId)
      .then((r: { title?: string; description?: string; test_id?: string }) => {
        setTitle(r.title || "");
        setDescription(r.description || "");
        descriptionEditor?.commands.setContent(r.description || "");
        setTestId(r.test_id || "");
      })
      .catch(() => {
        toaster.error({ title: "Failed to load writing" });
      })
      .finally(() => setLoadingData(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, string | undefined> = {
        title,
        description: description || undefined,
        test_id: testId || undefined,
      };
      if (isEdit) {
        await ieltsWritingAPI.update(editId, body);
        toaster.success({ title: "Writing updated!" });
      } else {
        const r = await ieltsWritingAPI.create(body);
        toaster.success({ title: `Writing created! ID: ${r.id}` });
      }
      onNavigate("writings");
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
          onClick={() => onNavigate("writings")}
        >
          Writings
        </Text>
        <Text color="gray.300" _dark={{ color: "gray.600" }}>
          /
        </Text>
        <Text>{isEdit ? "Edit Writing" : "Create Writing"}</Text>
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
            {isEdit ? "Edit Writing Section" : "Create Writing Section"}
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
                placeholder="e.g. Academic Writing Test"
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
                Description
              </Text>
              <RichTextEditor.Root
                editor={descriptionEditor}
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
                <Save size={14} /> {isEdit ? "Update Writing" : "Save Writing"}
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate("writings")}
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
