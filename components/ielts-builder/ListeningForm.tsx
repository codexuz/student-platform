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
  Icon,
  Spinner,
} from "@chakra-ui/react";
import { Save, Upload, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Control, RichTextEditor } from "@/components/ui/rich-text-editor";
import { ieltsListeningAPI } from "@/lib/ielts-api";
import { ieltsTestsAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type { PageId, IELTSTest } from "./types";
import FileUploadModal from "./FileUploadModal";
import AudioPlayer from "./AudioPlayer";

interface ListeningFormProps {
  prefillTestId?: string;
  onNavigate: (page: PageId, data?: Record<string, string>) => void;
}

export default function ListeningForm({
  prefillTestId,
  onNavigate,
}: ListeningFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const descriptionEditor = useEditor({
    extensions: [StarterKit, Underline],
    content: description,
    onUpdate({ editor }) {
      setDescription(editor.getHTML());
    },
    shouldRerenderOnTransaction: true,
    immediatelyRender: false,
  });

  const [testId, setTestId] = useState(prefillTestId || "");
  const [fullAudio, setFullAudio] = useState("");
  const [saving, setSaving] = useState(false);
  const [tests, setTests] = useState<IELTSTest[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [showAudioUpload, setShowAudioUpload] = useState(false);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, string | undefined> = {
        title,
        test_id: testId || undefined,
        description: description || undefined,
        full_audio_url: fullAudio || undefined,
      };
      const r = await ieltsListeningAPI.create(body);
      toaster.success({ title: `Listening created! ID: ${r.id}` });
      onNavigate("listenings");
    } catch (e: unknown) {
      toaster.error({ title: "Error", description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <HStack gap={1.5} fontSize="sm" color="gray.400" mb={4}>
        <Text
          as="span"
          color="#4f46e5"
          cursor="pointer"
          fontWeight="500"
          _hover={{ textDecoration: "underline" }}
          onClick={() => onNavigate("listenings")}
        >
          Listenings
        </Text>
        <Text color="gray.300" _dark={{ color: "gray.600" }}>
          /
        </Text>
        <Text>Create Listening</Text>
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
            Create Listening Section
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
                placeholder="e.g. Listening Test"
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
                  Full Audio
                </Text>
                {fullAudio ? (
                  <VStack gap={2} alignItems="stretch">
                    <AudioPlayer src={fullAudio} compact />
                    <Button
                      variant="ghost"
                      size="xs"
                      color="red.400"
                      _hover={{ color: "red.600" }}
                      onClick={() => setFullAudio("")}
                      alignSelf="flex-start"
                    >
                      <Icon as={X} fontSize="xs" /> Remove
                    </Button>
                  </VStack>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    w="full"
                    onClick={() => setShowAudioUpload(true)}
                  >
                    <Icon as={Upload} fontSize="sm" /> Upload Audio
                  </Button>
                )}
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
                <Save size={14} /> Save Listening
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate("listenings")}
                size="sm"
              >
                Cancel
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Box>

      <FileUploadModal
        open={showAudioUpload}
        onClose={() => setShowAudioUpload(false)}
        type="audio"
        onUploaded={(url) => {
          setFullAudio(url);
        }}
      />
    </Box>
  );
}
