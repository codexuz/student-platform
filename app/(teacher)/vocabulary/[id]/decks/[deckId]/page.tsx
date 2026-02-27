"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Spinner,
  HStack,
  VStack,
  Table,
  EmptyState,
  Pagination,
  ButtonGroup,
  IconButton,
  Input,
  Dialog,
  Portal,
  Field,
  Badge,
  Textarea,
} from "@chakra-ui/react";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  ArrowLeft,
  Volume2,
  Upload,
  FileSpreadsheet,
  FileText,
  FileType,
  X,
} from "lucide-react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { useRouter, useParams } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  ieltsVocabularyDecksAPI,
  ieltsVocabularyWordsAPI,
} from "@/lib/teacher-api";
import { toaster } from "@/components/ui/toaster";
import type {
  IeltsVocabularyDeck,
  IeltsDeckWord,
} from "@/components/vocabulary/types";
import {
  parseVocabularyFile,
  downloadExcelTemplate,
  downloadTxtTemplate,
  downloadDocxTemplate,
  type ParsedWord,
} from "@/lib/vocabulary-import";

const PAGE_SIZE = 20;

const EMPTY_WORD_FORM = {
  word: "",
  partOfSpeech: "",
  definition: "",
  example: "",
  uzbek: "",
  rus: "",
  image_url: "",
  audio_url: "",
};

export default function DeckDetailPage() {
  return (
    <ProtectedRoute>
      <DeckDetailContent />
    </ProtectedRoute>
  );
}

function DeckDetailContent() {
  const router = useRouter();
  const params = useParams<{ id: string; deckId: string }>();
  const { id: vocabId, deckId } = params;

  const [loading, setLoading] = useState(true);
  const [deck, setDeck] = useState<IeltsVocabularyDeck | null>(null);
  const [words, setWords] = useState<IeltsDeckWord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // Create/Edit word modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<IeltsDeckWord | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_WORD_FORM);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<IeltsDeckWord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Audio playback
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Import modal
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedWords, setParsedWords] = useState<ParsedWord[]>([]);
  const [importParsing, setImportParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [deckData, wordsRes] = await Promise.all([
        ieltsVocabularyDecksAPI.getById(deckId),
        ieltsVocabularyWordsAPI.getAll(deckId, page, PAGE_SIZE),
      ]);
      setDeck(deckData);
      const wordsList = wordsRes.data ?? wordsRes ?? [];
      setWords(Array.isArray(wordsList) ? wordsList : []);
      setTotal(wordsRes.total ?? wordsList.length ?? 0);
    } catch (err) {
      console.error("Failed to fetch deck:", err);
      toaster.error({ title: "Failed to load deck" });
    } finally {
      setLoading(false);
    }
  }, [deckId, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredWords = search
    ? words.filter(
        (w) =>
          w.word.toLowerCase().includes(search.toLowerCase()) ||
          w.definition?.toLowerCase().includes(search.toLowerCase()) ||
          w.uzbek?.toLowerCase().includes(search.toLowerCase()) ||
          w.rus?.toLowerCase().includes(search.toLowerCase()),
      )
    : words;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const openCreate = () => {
    setEditingWord(null);
    setForm(EMPTY_WORD_FORM);
    setModalOpen(true);
  };

  const openEdit = (word: IeltsDeckWord) => {
    setEditingWord(word);
    setForm({
      word: word.word,
      partOfSpeech: word.partOfSpeech ?? "",
      definition: word.definition ?? "",
      example: word.example ?? "",
      uzbek: word.uzbek ?? "",
      rus: word.rus ?? "",
      image_url: word.image_url ?? "",
      audio_url: word.audio_url ?? "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.word.trim()) return;
    setSaving(true);
    try {
      const payload: Record<string, string> = { word: form.word };
      if (form.partOfSpeech) payload.partOfSpeech = form.partOfSpeech;
      if (form.definition) payload.definition = form.definition;
      if (form.example) payload.example = form.example;
      if (form.uzbek) payload.uzbek = form.uzbek;
      if (form.rus) payload.rus = form.rus;
      if (form.image_url) payload.image_url = form.image_url;
      if (form.audio_url) payload.audio_url = form.audio_url;

      if (editingWord) {
        await ieltsVocabularyWordsAPI.update(editingWord.id, payload);
        toaster.success({ title: "Word updated" });
      } else {
        await ieltsVocabularyWordsAPI.create({
          ...payload,
          deck_id: deckId,
        });
        toaster.success({ title: "Word added" });
      }
      setModalOpen(false);
      setEditingWord(null);
      fetchData();
    } catch (err) {
      console.error("Failed to save word:", err);
      toaster.error({
        title: editingWord ? "Failed to update word" : "Failed to add word",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await ieltsVocabularyWordsAPI.delete(deleteTarget.id);
      toaster.success({ title: "Word deleted" });
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      console.error("Failed to delete word:", err);
      toaster.error({ title: "Failed to delete word" });
    } finally {
      setDeleting(false);
    }
  };

  const playAudio = (word: IeltsDeckWord) => {
    if (!word.audio_url) return;
    setPlayingId(word.id);
    const audio = new Audio(word.audio_url);
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
    audio.play();
  };

  const updateField = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  // ─── Import handlers ─────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportParsing(true);
    try {
      const words = await parseVocabularyFile(file);
      setParsedWords(words);
      if (words.length === 0) {
        toaster.error({
          title: "No words found",
          description: "The file is empty or has no recognizable word column.",
        });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to parse file";
      console.error("Failed to parse file:", err);
      toaster.error({ title: message });
      setParsedWords([]);
    } finally {
      setImportParsing(false);
    }
  };

  const handleImport = async () => {
    if (parsedWords.length === 0) return;
    setImporting(true);
    setImportProgress(0);
    let success = 0;
    let failed = 0;
    for (let i = 0; i < parsedWords.length; i++) {
      try {
        await ieltsVocabularyWordsAPI.create({
          deck_id: deckId,
          ...parsedWords[i],
        });
        success++;
      } catch {
        failed++;
      }
      setImportProgress(i + 1);
    }
    setImporting(false);
    setImportOpen(false);
    setImportFile(null);
    setParsedWords([]);
    fetchData();
    toaster.success({
      title: `Import complete: ${success} added${failed > 0 ? `, ${failed} failed` : ""}`,
    });
  };

  const resetImport = () => {
    setImportFile(null);
    setParsedWords([]);
    setImportProgress(0);
  };

  return (
    <Flex
      h="100vh"
      bg="gray.50"
      _dark={{ bg: "gray.900" }}
      direction={{ base: "column", lg: "row" }}
    >
      <Box display={{ base: "none", lg: "block" }}>
        <Sidebar />
      </Box>

      <Box
        flex="1"
        overflowY="auto"
        pb={{ base: "16", lg: "0" }}
        ml={{ base: 0, lg: "240px" }}
      >
        {/* Header */}
        <Flex
          h={{ base: "14", md: "16" }}
          px={{ base: 4, md: 8 }}
          alignItems="center"
          justifyContent="space-between"
          bg="white"
          _dark={{ bg: "gray.800" }}
          borderBottomWidth="1px"
        >
          <HStack gap={2}>
            <IconButton
              aria-label="Back"
              size="sm"
              variant="ghost"
              onClick={() => router.push(`/vocabulary/${vocabId}`)}
            >
              <ArrowLeft size={18} />
            </IconButton>
            <Heading size={{ base: "sm", md: "md" }}>
              {deck?.title || "Deck"}
            </Heading>
          </HStack>
          <HStack gap={{ base: 2, md: 4 }}>
            <NotificationsDrawer />
          </HStack>
        </Flex>

        <Box p={{ base: 4, md: 6 }} maxW="1100px" mx="auto">
          {loading ? (
            <Flex justify="center" py={12}>
              <Spinner size="xl" color="brand.500" />
            </Flex>
          ) : !deck ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Title>Deck not found</EmptyState.Title>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <>
              {/* Info */}
              <VStack gap={1} alignItems="flex-start" mb={6}>
                <HStack>
                  <Heading size={{ base: "lg", md: "xl" }}>
                    {deck.title}
                  </Heading>
                  <Badge colorPalette="green">{total} words</Badge>
                </HStack>
              </VStack>

              {/* Toolbar */}
              <Flex
                mb={6}
                gap={3}
                direction={{ base: "column", sm: "row" }}
                justify="space-between"
                align={{ base: "stretch", sm: "center" }}
              >
                <HStack flex={1} maxW={{ sm: "320px" }}>
                  <Box position="relative" flex={1}>
                    <Box
                      position="absolute"
                      left={3}
                      top="50%"
                      transform="translateY(-50%)"
                      zIndex={1}
                      color="gray.400"
                    >
                      <Search size={16} />
                    </Box>
                    <Input
                      size="sm"
                      pl={9}
                      placeholder="Search words..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </Box>
                </HStack>
                <HStack gap={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setImportOpen(true)}
                  >
                    <Upload size={16} />
                    Import
                  </Button>
                  <Button size="sm" colorPalette="brand" onClick={openCreate}>
                    <Plus size={16} />
                    Add Word
                  </Button>
                </HStack>
              </Flex>

              {/* Words Table */}
              {filteredWords.length === 0 ? (
                <EmptyState.Root>
                  <EmptyState.Content>
                    <EmptyState.Title>No words yet</EmptyState.Title>
                    <EmptyState.Description>
                      {search
                        ? "No words match your search."
                        : "Add your first word to this deck."}
                    </EmptyState.Description>
                  </EmptyState.Content>
                </EmptyState.Root>
              ) : (
                <Box
                  borderWidth="1px"
                  borderRadius="lg"
                  overflow="hidden"
                  bg="white"
                  _dark={{ bg: "gray.800" }}
                >
                  <Box overflowX="auto">
                    <Table.Root size="sm" variant="outline" interactive>
                      <Table.Header>
                        <Table.Row bg="gray.50" _dark={{ bg: "gray.700" }}>
                          <Table.ColumnHeader pl={4} minW="140px">
                            Word
                          </Table.ColumnHeader>
                          <Table.ColumnHeader
                            display={{ base: "none", md: "table-cell" }}
                            minW="80px"
                          >
                            POS
                          </Table.ColumnHeader>
                          <Table.ColumnHeader
                            display={{ base: "none", lg: "table-cell" }}
                            minW="200px"
                          >
                            Definition
                          </Table.ColumnHeader>
                          <Table.ColumnHeader
                            display={{ base: "none", md: "table-cell" }}
                            minW="100px"
                          >
                            UZ
                          </Table.ColumnHeader>
                          <Table.ColumnHeader
                            display={{ base: "none", md: "table-cell" }}
                            minW="100px"
                          >
                            RU
                          </Table.ColumnHeader>
                          <Table.ColumnHeader
                            textAlign="right"
                            pr={4}
                            minW="100px"
                          >
                            Actions
                          </Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {filteredWords.map((w) => (
                          <Table.Row key={w.id}>
                            <Table.Cell pl={4} fontWeight="medium">
                              <HStack>
                                {w.audio_url && (
                                  <IconButton
                                    aria-label="Play audio"
                                    size="xs"
                                    variant="ghost"
                                    colorPalette="blue"
                                    onClick={() => playAudio(w)}
                                    disabled={playingId === w.id}
                                  >
                                    <Volume2 size={14} />
                                  </IconButton>
                                )}
                                <Text>{w.word}</Text>
                              </HStack>
                            </Table.Cell>
                            <Table.Cell
                              display={{ base: "none", md: "table-cell" }}
                            >
                              {w.partOfSpeech && (
                                <Badge size="sm" variant="subtle">
                                  {w.partOfSpeech}
                                </Badge>
                              )}
                            </Table.Cell>
                            <Table.Cell
                              display={{ base: "none", lg: "table-cell" }}
                              color="gray.600"
                              _dark={{ color: "gray.400" }}
                              maxW="250px"
                              truncate
                            >
                              {w.definition || "—"}
                            </Table.Cell>
                            <Table.Cell
                              display={{ base: "none", md: "table-cell" }}
                              color="gray.600"
                              _dark={{ color: "gray.400" }}
                            >
                              {w.uzbek || "—"}
                            </Table.Cell>
                            <Table.Cell
                              display={{ base: "none", md: "table-cell" }}
                              color="gray.600"
                              _dark={{ color: "gray.400" }}
                            >
                              {w.rus || "—"}
                            </Table.Cell>
                            <Table.Cell textAlign="right" pr={4}>
                              <HStack justify="flex-end" gap={1}>
                                <IconButton
                                  aria-label="Edit"
                                  size="xs"
                                  variant="ghost"
                                  onClick={() => openEdit(w)}
                                >
                                  <Pencil size={14} />
                                </IconButton>
                                <IconButton
                                  aria-label="Delete"
                                  size="xs"
                                  variant="ghost"
                                  colorPalette="red"
                                  onClick={() => setDeleteTarget(w)}
                                >
                                  <Trash2 size={14} />
                                </IconButton>
                              </HStack>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Box>
                </Box>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <Flex justify="center" mt={6}>
                  <Pagination.Root
                    count={total}
                    pageSize={PAGE_SIZE}
                    page={page}
                    onPageChange={(e) => setPage(e.page)}
                  >
                    <ButtonGroup variant="ghost" size="sm">
                      <Pagination.PrevTrigger asChild>
                        <IconButton aria-label="Previous">
                          <LuChevronLeft />
                        </IconButton>
                      </Pagination.PrevTrigger>
                      <Pagination.Items
                        render={(pageItem) => (
                          <IconButton
                            aria-label={`Page ${pageItem.value}`}
                            variant={
                              pageItem.value === page ? "solid" : "ghost"
                            }
                            colorPalette={
                              pageItem.value === page ? "brand" : undefined
                            }
                          >
                            {pageItem.value}
                          </IconButton>
                        )}
                      />
                      <Pagination.NextTrigger asChild>
                        <IconButton aria-label="Next">
                          <LuChevronRight />
                        </IconButton>
                      </Pagination.NextTrigger>
                    </ButtonGroup>
                  </Pagination.Root>
                </Flex>
              )}
            </>
          )}
        </Box>
      </Box>

      <MobileBottomNav />

      {/* Create / Edit Word Modal */}
      <Dialog.Root
        open={modalOpen}
        onOpenChange={(e) => {
          if (!e.open) {
            setModalOpen(false);
            setEditingWord(null);
          }
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="lg">
              <Dialog.Header>
                <Dialog.Title>
                  {editingWord ? "Edit Word" : "Add Word"}
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <VStack gap={4}>
                  <Flex
                    gap={4}
                    w="full"
                    direction={{ base: "column", sm: "row" }}
                  >
                    <Field.Root required flex={1}>
                      <Field.Label>Word</Field.Label>
                      <Input
                        placeholder="e.g. ubiquitous"
                        value={form.word}
                        onChange={(e) => updateField("word", e.target.value)}
                      />
                    </Field.Root>
                    <Field.Root w={{ base: "full", sm: "160px" }}>
                      <Field.Label>Part of Speech</Field.Label>
                      <Input
                        placeholder="e.g. adjective"
                        value={form.partOfSpeech}
                        onChange={(e) =>
                          updateField("partOfSpeech", e.target.value)
                        }
                      />
                    </Field.Root>
                  </Flex>

                  <Field.Root>
                    <Field.Label>Definition</Field.Label>
                    <Textarea
                      placeholder="English definition"
                      value={form.definition}
                      onChange={(e) =>
                        updateField("definition", e.target.value)
                      }
                      rows={2}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Example Sentence</Field.Label>
                    <Textarea
                      placeholder="Use the word in a sentence"
                      value={form.example}
                      onChange={(e) => updateField("example", e.target.value)}
                      rows={2}
                    />
                  </Field.Root>

                  <Flex
                    gap={4}
                    w="full"
                    direction={{ base: "column", sm: "row" }}
                  >
                    <Field.Root flex={1}>
                      <Field.Label>Uzbek Translation</Field.Label>
                      <Input
                        placeholder="O'zbek tilida"
                        value={form.uzbek}
                        onChange={(e) => updateField("uzbek", e.target.value)}
                      />
                    </Field.Root>
                    <Field.Root flex={1}>
                      <Field.Label>Russian Translation</Field.Label>
                      <Input
                        placeholder="На русском"
                        value={form.rus}
                        onChange={(e) => updateField("rus", e.target.value)}
                      />
                    </Field.Root>
                  </Flex>

                  <Flex
                    gap={4}
                    w="full"
                    direction={{ base: "column", sm: "row" }}
                  >
                    <Field.Root flex={1}>
                      <Field.Label>Image URL</Field.Label>
                      <Input
                        placeholder="https://..."
                        value={form.image_url}
                        onChange={(e) =>
                          updateField("image_url", e.target.value)
                        }
                      />
                    </Field.Root>
                    <Field.Root flex={1}>
                      <Field.Label>Audio URL</Field.Label>
                      <Input
                        placeholder="https://..."
                        value={form.audio_url}
                        onChange={(e) =>
                          updateField("audio_url", e.target.value)
                        }
                      />
                    </Field.Root>
                  </Flex>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setModalOpen(false);
                    setEditingWord(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  colorPalette="brand"
                  onClick={handleSave}
                  loading={saving}
                  disabled={!form.word.trim()}
                >
                  {editingWord ? "Save Changes" : "Add Word"}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Import Modal */}
      <Dialog.Root
        open={importOpen}
        onOpenChange={(e) => {
          if (!e.open) {
            setImportOpen(false);
            resetImport();
          }
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="2xl">
              <Dialog.Header>
                <Dialog.Title>Import Words</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <VStack gap={5} align="stretch">
                  {/* Template Downloads */}
                  <Box>
                    <Text fontWeight="medium" mb={2}>
                      1. Download a template
                    </Text>
                    <HStack gap={2} flexWrap="wrap">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={downloadExcelTemplate}
                      >
                        <FileSpreadsheet size={14} />
                        Excel (.xlsx)
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={downloadTxtTemplate}
                      >
                        <FileText size={14} />
                        Text (.txt)
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={downloadDocxTemplate}
                      >
                        <FileType size={14} />
                        Word (.doc)
                      </Button>
                    </HStack>
                  </Box>

                  {/* File Upload */}
                  <Box>
                    <Text fontWeight="medium" mb={2}>
                      2. Upload your filled file
                    </Text>
                    <Box
                      borderWidth="2px"
                      borderStyle="dashed"
                      borderColor="gray.300"
                      _dark={{ borderColor: "gray.600" }}
                      borderRadius="lg"
                      p={6}
                      textAlign="center"
                      position="relative"
                    >
                      {importFile ? (
                        <HStack justify="center" gap={3}>
                          <FileSpreadsheet size={20} />
                          <Text fontWeight="medium">{importFile.name}</Text>
                          <IconButton
                            aria-label="Remove file"
                            size="xs"
                            variant="ghost"
                            onClick={resetImport}
                          >
                            <X size={14} />
                          </IconButton>
                        </HStack>
                      ) : (
                        <VStack gap={2}>
                          <Upload size={24} color="gray" />
                          <Text color="gray.500" fontSize="sm">
                            Click to browse or drag a file here
                          </Text>
                          <Text color="gray.400" fontSize="xs">
                            Supports .xlsx, .xls, .doc, .docx, .txt, .csv
                          </Text>
                        </VStack>
                      )}
                      <Input
                        type="file"
                        accept=".xlsx,.xls,.doc,.docx,.txt,.csv"
                        position="absolute"
                        inset={0}
                        opacity={0}
                        cursor="pointer"
                        onChange={handleFileSelect}
                      />
                    </Box>
                  </Box>

                  {/* Parsing spinner */}
                  {importParsing && (
                    <Flex justify="center" py={4}>
                      <Spinner size="md" color="brand.500" />
                    </Flex>
                  )}

                  {/* Preview */}
                  {parsedWords.length > 0 && (
                    <Box>
                      <Text fontWeight="medium" mb={2}>
                        3. Preview ({parsedWords.length} words found)
                      </Text>
                      <Box
                        borderWidth="1px"
                        borderRadius="lg"
                        overflow="hidden"
                        maxH="280px"
                        overflowY="auto"
                      >
                        <Table.Root size="sm" variant="outline">
                          <Table.Header>
                            <Table.Row bg="gray.50" _dark={{ bg: "gray.700" }}>
                              <Table.ColumnHeader pl={3}>#</Table.ColumnHeader>
                              <Table.ColumnHeader>Word</Table.ColumnHeader>
                              <Table.ColumnHeader
                                display={{ base: "none", sm: "table-cell" }}
                              >
                                POS
                              </Table.ColumnHeader>
                              <Table.ColumnHeader
                                display={{ base: "none", md: "table-cell" }}
                              >
                                Definition
                              </Table.ColumnHeader>
                              <Table.ColumnHeader
                                display={{ base: "none", md: "table-cell" }}
                              >
                                UZ
                              </Table.ColumnHeader>
                              <Table.ColumnHeader
                                display={{ base: "none", md: "table-cell" }}
                              >
                                RU
                              </Table.ColumnHeader>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            {parsedWords.map((pw, idx) => (
                              <Table.Row key={idx}>
                                <Table.Cell pl={3} color="gray.400">
                                  {idx + 1}
                                </Table.Cell>
                                <Table.Cell fontWeight="medium">
                                  {pw.word}
                                </Table.Cell>
                                <Table.Cell
                                  display={{ base: "none", sm: "table-cell" }}
                                >
                                  {pw.partOfSpeech && (
                                    <Badge size="sm" variant="subtle">
                                      {pw.partOfSpeech}
                                    </Badge>
                                  )}
                                </Table.Cell>
                                <Table.Cell
                                  display={{ base: "none", md: "table-cell" }}
                                  maxW="180px"
                                  truncate
                                  color="gray.600"
                                  _dark={{ color: "gray.400" }}
                                >
                                  {pw.definition || "—"}
                                </Table.Cell>
                                <Table.Cell
                                  display={{ base: "none", md: "table-cell" }}
                                  color="gray.600"
                                  _dark={{ color: "gray.400" }}
                                >
                                  {pw.uzbek || "—"}
                                </Table.Cell>
                                <Table.Cell
                                  display={{ base: "none", md: "table-cell" }}
                                  color="gray.600"
                                  _dark={{ color: "gray.400" }}
                                >
                                  {pw.rus || "—"}
                                </Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table.Root>
                      </Box>
                    </Box>
                  )}

                  {/* Import progress */}
                  {importing && (
                    <HStack gap={3}>
                      <Spinner size="sm" />
                      <Text fontSize="sm" color="gray.600">
                        Importing {importProgress} / {parsedWords.length}...
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setImportOpen(false);
                    resetImport();
                  }}
                  disabled={importing}
                >
                  Cancel
                </Button>
                <Button
                  colorPalette="brand"
                  onClick={handleImport}
                  loading={importing}
                  disabled={parsedWords.length === 0 || importParsing}
                >
                  Import{" "}
                  {parsedWords.length > 0 && `${parsedWords.length} Words`}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Delete Confirmation */}
      <Dialog.Root
        open={!!deleteTarget}
        onOpenChange={(e) => {
          if (!e.open) setDeleteTarget(null);
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Delete Word</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>
                  Are you sure you want to delete{" "}
                  <Text as="span" fontWeight="bold">
                    &quot;{deleteTarget?.word}&quot;
                  </Text>
                  ?
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </Button>
                <Button
                  colorPalette="red"
                  onClick={handleDelete}
                  loading={deleting}
                >
                  Delete
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Flex>
  );
}
