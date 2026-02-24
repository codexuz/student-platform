"use client";

import {
  Box,
  Button,
  Combobox,
  Flex,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Portal,
  Text,
  VStack,
  Icon,
  Spinner,
  createListCollection,
} from "@chakra-ui/react";
import { Save, Upload, X, Plus, ChevronsUpDown, FileText } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { ieltsListeningPartsAPI, ieltsListeningAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type {
  PageId,
  IELTSListening,
  IELTSListeningPart,
  DifficultyLevel,
  IELTSMode,
} from "./types";
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
  const [part, setPart] = useState<IELTSListeningPart["part"]>("PART_1");
  const [mode, setMode] = useState<IELTSMode>("practice");
  const [title, setTitle] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioName, setAudioName] = useState("");
  const [audioDuration, setAudioDuration] = useState("");
  const [transcriptUrl, setTranscriptUrl] = useState("");
  const [transcriptName, setTranscriptName] = useState("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("MEDIUM");
  const [isActive, setIsActive] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listenings, setListenings] = useState<IELTSListening[]>([]);
  const [loadingListenings, setLoadingListenings] = useState(true);
  const [showAudioUpload, setShowAudioUpload] = useState(false);
  const [showTranscriptUpload, setShowTranscriptUpload] = useState(false);
  const [listeningSearchInput, setListeningSearchInput] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isEdit = !!editId;

  const listeningCollection = useMemo(
    () =>
      createListCollection({
        items: listenings,
        itemToValue: (l) => l.id,
        itemToString: (l) => l.title,
      }),
    [listenings],
  );

  // Load initial listenings
  useEffect(() => {
    ieltsListeningAPI
      .getAll({ limit: 20 })
      .then((res: IELTSListening[] | { data: IELTSListening[] }) => {
        const list = Array.isArray(res) ? res : res.data || [];
        setListenings(list);
      })
      .catch(() => {})
      .finally(() => setLoadingListenings(false));
  }, []);

  // Debounced search for listenings
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      ieltsListeningAPI
        .getAll({ limit: 20, search: listeningSearchInput || undefined })
        .then((res: IELTSListening[] | { data: IELTSListening[] }) => {
          const list = Array.isArray(res) ? res : res.data || [];
          setListenings(list);
        })
        .catch(() => {});
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [listeningSearchInput]);

  useEffect(() => {
    if (editId) {
      setLoading(true);
      ieltsListeningPartsAPI
        .getById(editId)
        .then((p: Record<string, unknown>) => {
          setListeningId((p.listening_id as string) || "");
          setPart((p.part as IELTSListeningPart["part"]) || "PART_1");
          setMode((p.mode as IELTSMode) || "practice");
          setTitle((p.title as string) || "");
          setAudioUrl((p.audio_url as string) || "");
          setAudioName("");
          setAudioDuration("");
          setTranscriptUrl((p.transcript_url as string) || "");
          setTranscriptName("");
          // Ensure the linked listening appears in the combobox list
          if (p.listening_id) {
            ieltsListeningAPI
              .getById(p.listening_id as string)
              .then((listening: IELTSListening) => {
                setListenings((prev) =>
                  prev.some((l) => l.id === listening.id)
                    ? prev
                    : [listening, ...prev],
                );
              })
              .catch(() => {});
          }
          if (p.timeLimitMinutes)
            setTimeLimitMinutes(String(p.timeLimitMinutes));
          if (p.difficulty) setDifficulty(p.difficulty as DifficultyLevel);
          if (p.isActive !== undefined) setIsActive(p.isActive as boolean);
          if (p.totalQuestions) setTotalQuestions(String(p.totalQuestions));
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
      const body: Record<string, unknown> = {
        listening_id: listeningId,
        part,
        mode,
        title: title || null,
        difficulty,
        isActive,
        audio_url: audioUrl || null,
        transcript_url: transcriptUrl || null,
      };
      if (timeLimitMinutes) body.timeLimitMinutes = parseInt(timeLimitMinutes);
      if (totalQuestions) body.totalQuestions = parseInt(totalQuestions);

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
                  <Combobox.Root
                    collection={listeningCollection}
                    value={listeningId ? [listeningId] : []}
                    onValueChange={(details) => {
                      setListeningId(details.value[0] || "");
                    }}
                    onInputValueChange={(details) => {
                      setListeningSearchInput(details.inputValue);
                    }}
                    inputBehavior="autohighlight"
                    openOnClick
                    size="sm"
                    w="full"
                  >
                    <Combobox.Control>
                      <Combobox.Input placeholder="Search listenings..." />
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
                          <Combobox.Empty>No listenings found</Combobox.Empty>
                          {listeningCollection.items.map((l) => (
                            <Combobox.Item key={l.id} item={l}>
                              {l.title}
                              <Combobox.ItemIndicator />
                            </Combobox.Item>
                          ))}
                        </Combobox.Content>
                      </Combobox.Positioner>
                    </Portal>
                  </Combobox.Root>
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
                    onChange={(e) =>
                      setPart(
                        e.currentTarget.value as IELTSListeningPart["part"],
                      )
                    }
                  >
                    <option value="PART_1">Part 1</option>
                    <option value="PART_2">Part 2</option>
                    <option value="PART_3">Part 3</option>
                    <option value="PART_4">Part 4</option>
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
                  Mode
                </Text>
                <NativeSelect.Root size="sm" w="full">
                  <NativeSelect.Field
                    value={mode}
                    onChange={(e) =>
                      setMode(e.currentTarget.value as IELTSMode)
                    }
                  >
                    <option value="practice">Practice</option>
                    <option value="mock">Mock</option>
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
                Transcript
              </Text>
              {transcriptUrl ? (
                <VStack gap={2} alignItems="stretch">
                  <HStack
                    gap={2}
                    p={2}
                    bg="gray.50"
                    _dark={{ bg: "gray.700" }}
                    rounded="md"
                    borderWidth="1px"
                  >
                    <Icon as={FileText} fontSize="sm" color="blue.500" />
                    <Text
                      fontSize="sm"
                      color="gray.600"
                      _dark={{ color: "gray.300" }}
                      wordBreak="break-all"
                      flex="1"
                    >
                      {transcriptName || transcriptUrl}
                    </Text>
                  </HStack>
                  <Button
                    variant="ghost"
                    size="xs"
                    color="red.400"
                    _hover={{ color: "red.600" }}
                    onClick={() => {
                      setTranscriptUrl("");
                      setTranscriptName("");
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
                  onClick={() => setShowTranscriptUpload(true)}
                >
                  <Icon as={Upload} fontSize="sm" /> Upload Transcript
                </Button>
              )}
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
                  Time Limit (minutes)
                </Text>
                <Input
                  type="number"
                  placeholder="e.g. 10"
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(e.target.value)}
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
                  Difficulty
                </Text>
                <NativeSelect.Root size="sm" w="full">
                  <NativeSelect.Field
                    value={difficulty}
                    onChange={(e) =>
                      setDifficulty(e.currentTarget.value as DifficultyLevel)
                    }
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
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
                  Total Questions
                </Text>
                <Input
                  type="number"
                  placeholder="e.g. 10"
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(e.target.value)}
                />
              </Box>
            </Flex>

            <Flex alignItems="center" gap={2}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                id="is-active"
              />
              <label
                htmlFor="is-active"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Active
              </label>
            </Flex>

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

      <FileUploadModal
        open={showTranscriptUpload}
        onClose={() => setShowTranscriptUpload(false)}
        type="transcript"
        onUploaded={(url, fileName) => {
          setTranscriptUrl(url);
          if (fileName) setTranscriptName(fileName);
        }}
      />
    </Box>
  );
}
