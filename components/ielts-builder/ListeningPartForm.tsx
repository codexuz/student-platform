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
  Icon,
  Spinner,
} from "@chakra-ui/react";
import { Save, Upload, X, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { ieltsListeningPartsAPI, ieltsListeningAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type { PageId, IELTSListening } from "./types";
import FileUploadModal from "./FileUploadModal";
import AudioPlayer from "./AudioPlayer";

interface ListeningPartFormProps {
  editId?: string | null;
  prefillListeningId?: string;
  onNavigate: (page: PageId, data?: Record<string, string>) => void;
}

export default function ListeningPartForm({
  editId,
  prefillListeningId,
  onNavigate,
}: ListeningPartFormProps) {
  const [listeningId, setListeningId] = useState(prefillListeningId || "");
  const [part, setPart] = useState("PART_1");
  const [title, setTitle] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioName, setAudioName] = useState("");
  const [audioDuration, setAudioDuration] = useState("");
  const [answers, setAnswers] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listenings, setListenings] = useState<IELTSListening[]>([]);
  const [loadingListenings, setLoadingListenings] = useState(true);
  const [showAudioUpload, setShowAudioUpload] = useState(false);
  const isEdit = !!editId;

  useEffect(() => {
    ieltsListeningAPI
      .getAll()
      .then((res: IELTSListening[] | { data: IELTSListening[] }) => {
        const list = Array.isArray(res) ? res : res.data || [];
        setListenings(list);
      })
      .catch(() => {})
      .finally(() => setLoadingListenings(false));
  }, []);

  useEffect(() => {
    if (editId) {
      setLoading(true);
      ieltsListeningPartsAPI
        .getById(editId)
        .then((p: Record<string, unknown>) => {
          setListeningId((p.listening_id as string) || "");
          setPart((p.part as string) || "PART_1");
          setTitle((p.title as string) || "");
          const audio = p.audio as Record<string, unknown> | null;
          setAudioUrl((audio?.url as string) || "");
          setAudioName((audio?.file_name as string) || "");
          setAudioDuration(audio?.duration ? String(audio.duration) : "");
          setAnswers(p.answers ? JSON.stringify(p.answers, null, 2) : "");
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
        listening_id: listeningId,
        part,
        title: title || null,
        answers: parsedAnswers,
        audio: audioUrl
          ? {
              url: audioUrl,
              file_name: audioName || null,
              duration: audioDuration ? parseInt(audioDuration) : null,
            }
          : null,
      };

      if (isEdit) {
        await ieltsListeningPartsAPI.update(editId!, body);
        toaster.success({ title: "Listening part updated!" });
      } else {
        const r = await ieltsListeningPartsAPI.create(body);
        toaster.success({ title: `Listening part created! ID: ${r.id}` });
      }
      onNavigate("listening-parts");
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
          onClick={() => onNavigate("listening-parts")}
        >
          Listening Parts
        </Text>
        <Text color="gray.300" _dark={{ color: "gray.600" }}>
          /
        </Text>
        <Text>{isEdit ? "Edit Listening Part" : "Create Listening Part"}</Text>
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
            {isEdit ? "Edit Listening Part" : "Create Listening Part"}
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
                  Listening
                </Text>
                {loadingListenings ? (
                  <HStack gap={2} py={2}>
                    <Spinner size="xs" />
                    <Text fontSize="sm" color="gray.400">
                      Loading...
                    </Text>
                  </HStack>
                ) : (
                  <NativeSelect.Root size="sm" w="full">
                    <NativeSelect.Field
                      value={listeningId}
                      onChange={(e) => setListeningId(e.currentTarget.value)}
                    >
                      <option value="">— Select a listening —</option>
                      {listenings.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title}
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
                    <option value="PART_4">Part 4</option>
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
                placeholder="e.g. A conversation between two students"
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
                Audio
              </Text>
              {audioUrl ? (
                <VStack gap={2} alignItems="stretch">
                  <AudioPlayer
                    src={audioUrl}
                    fileName={audioName || undefined}
                  />
                  <Button
                    variant="ghost"
                    size="xs"
                    color="red.400"
                    _hover={{ color: "red.600" }}
                    onClick={() => {
                      setAudioUrl("");
                      setAudioName("");
                      setAudioDuration("");
                    }}
                    alignSelf="flex-start"
                  >
                    <Icon as={X} fontSize="xs" /> Remove
                  </Button>
                </VStack>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAudioUpload(true)}
                >
                  <Icon as={Upload} fontSize="sm" /> Upload Audio
                </Button>
              )}
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

            <Flex justifyContent="space-between" alignItems="center" pt={2}>
              <HStack gap={2}>
                <Button
                  bg="#10b981"
                  color="white"
                  _hover={{ bg: "#059669" }}
                  onClick={handleSave}
                  loading={saving}
                  size="sm"
                >
                  <Save size={14} /> {isEdit ? "Update" : "Save Listening Part"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onNavigate("listening-parts")}
                  size="sm"
                >
                  Cancel
                </Button>
              </HStack>
              {isEdit && (
                <Button
                  bg="#4f46e5"
                  color="white"
                  _hover={{ bg: "#3730a3" }}
                  size="sm"
                  onClick={() =>
                    onNavigate("listening-part-questions", {
                      partId: editId!,
                    })
                  }
                >
                  <Plus size={14} /> Add Questions
                </Button>
              )}
            </Flex>
          </VStack>
        </Box>
      </Box>

      <FileUploadModal
        open={showAudioUpload}
        onClose={() => setShowAudioUpload(false)}
        type="audio"
        onUploaded={(url, fileName) => {
          setAudioUrl(url);
          if (fileName) setAudioName(fileName);
        }}
      />
    </Box>
  );
}
