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
  EmptyState,
  IconButton,
  Input,
  Dialog,
  Portal,
  Field,
  Badge,
  Card,
  Icon,
  SimpleGrid,
} from "@chakra-ui/react";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Layers,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ieltsVocabularyAPI, ieltsVocabularyDecksAPI } from "@/lib/teacher-api";
import { toaster } from "@/components/ui/toaster";
import type {
  IeltsVocabulary,
  IeltsVocabularyDeck,
} from "@/components/vocabulary/types";

export default function VocabularyDetailPage() {
  return (
    <ProtectedRoute>
      <VocabularyDetailContent />
    </ProtectedRoute>
  );
}

function VocabularyDetailContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const vocabId = params.id;

  const [loading, setLoading] = useState(true);
  const [vocabulary, setVocabulary] = useState<IeltsVocabulary | null>(null);
  const [decks, setDecks] = useState<IeltsVocabularyDeck[]>([]);
  const [search, setSearch] = useState("");

  // Create/Edit deck modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<IeltsVocabularyDeck | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [deckTitle, setDeckTitle] = useState("");

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<IeltsVocabularyDeck | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const vocab = await ieltsVocabularyAPI.getById(vocabId);
      setVocabulary(vocab);
      setDecks(vocab.decks ?? []);
    } catch (err) {
      console.error("Failed to fetch vocabulary:", err);
      toaster.error({ title: "Failed to load vocabulary" });
    } finally {
      setLoading(false);
    }
  }, [vocabId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredDecks = search
    ? decks.filter((d) => d.title.toLowerCase().includes(search.toLowerCase()))
    : decks;

  const openCreate = () => {
    setEditingDeck(null);
    setDeckTitle("");
    setModalOpen(true);
  };

  const openEdit = (deck: IeltsVocabularyDeck) => {
    setEditingDeck(deck);
    setDeckTitle(deck.title);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!deckTitle.trim()) return;
    setSaving(true);
    try {
      if (editingDeck) {
        await ieltsVocabularyDecksAPI.update(editingDeck.id, {
          title: deckTitle,
        });
        toaster.success({ title: "Deck updated" });
      } else {
        await ieltsVocabularyDecksAPI.create({
          ielts_vocabulary_id: vocabId,
          title: deckTitle,
        });
        toaster.success({ title: "Deck created" });
      }
      setModalOpen(false);
      setEditingDeck(null);
      fetchData();
    } catch (err) {
      console.error("Failed to save deck:", err);
      toaster.error({
        title: editingDeck ? "Failed to update deck" : "Failed to create deck",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await ieltsVocabularyDecksAPI.delete(deleteTarget.id);
      toaster.success({ title: "Deck deleted" });
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      console.error("Failed to delete deck:", err);
      toaster.error({ title: "Failed to delete deck" });
    } finally {
      setDeleting(false);
    }
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
              onClick={() => router.push("/vocabulary")}
            >
              <ArrowLeft size={18} />
            </IconButton>
            <Heading size={{ base: "sm", md: "md" }}>
              {vocabulary?.title || "Vocabulary"}
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
          ) : !vocabulary ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Title>Vocabulary not found</EmptyState.Title>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <>
              {/* Vocab info */}
              <VStack gap={1} alignItems="flex-start" mb={6}>
                <HStack>
                  <Heading size={{ base: "lg", md: "xl" }}>
                    {vocabulary.title}
                  </Heading>
                  <Badge colorPalette="blue">{decks.length} decks</Badge>
                </HStack>
                {vocabulary.description && (
                  <Text color="gray.600" _dark={{ color: "gray.400" }}>
                    {vocabulary.description}
                  </Text>
                )}
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
                      placeholder="Search decks..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </Box>
                </HStack>
                <Button size="sm" colorPalette="brand" onClick={openCreate}>
                  <Plus size={16} />
                  New Deck
                </Button>
              </Flex>

              {/* Decks Grid */}
              {filteredDecks.length === 0 ? (
                <EmptyState.Root>
                  <EmptyState.Content>
                    <EmptyState.Title>No decks yet</EmptyState.Title>
                    <EmptyState.Description>
                      {search
                        ? "No decks match your search."
                        : "Create your first deck in this vocabulary."}
                    </EmptyState.Description>
                  </EmptyState.Content>
                </EmptyState.Root>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
                  {filteredDecks.map((deck) => (
                    <Card.Root
                      key={deck.id}
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{
                        transform: "translateY(-2px)",
                        shadow: "md",
                      }}
                      borderRadius="xl"
                      onClick={() =>
                        router.push(`/vocabulary/${vocabId}/decks/${deck.id}`)
                      }
                    >
                      <Card.Body p={5}>
                        <VStack gap={3} alignItems="flex-start">
                          <HStack justify="space-between" w="full">
                            <HStack>
                              <Icon color="brand.500">
                                <Layers size={18} />
                              </Icon>
                              <Heading size="md">{deck.title}</Heading>
                            </HStack>
                            <HStack gap={1}>
                              <IconButton
                                aria-label="Edit"
                                size="xs"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(deck);
                                }}
                              >
                                <Pencil size={14} />
                              </IconButton>
                              <IconButton
                                aria-label="Delete"
                                size="xs"
                                variant="ghost"
                                colorPalette="red"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(deck);
                                }}
                              >
                                <Trash2 size={14} />
                              </IconButton>
                            </HStack>
                          </HStack>
                          <HStack justify="space-between" w="full">
                            <Badge colorPalette="green" size="sm">
                              {deck.words?.length ?? 0} words
                            </Badge>
                            <Icon color="gray.400">
                              <ArrowRight size={16} />
                            </Icon>
                          </HStack>
                        </VStack>
                      </Card.Body>
                    </Card.Root>
                  ))}
                </SimpleGrid>
              )}
            </>
          )}
        </Box>
      </Box>

      <MobileBottomNav />

      {/* Create / Edit Deck Modal */}
      <Dialog.Root
        open={modalOpen}
        onOpenChange={(e) => {
          if (!e.open) {
            setModalOpen(false);
            setEditingDeck(null);
          }
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>
                  {editingDeck ? "Edit Deck" : "New Deck"}
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Field.Root required>
                  <Field.Label>Deck Title</Field.Label>
                  <Input
                    placeholder="e.g. Unit 1 — Academic Words"
                    value={deckTitle}
                    onChange={(e) => setDeckTitle(e.target.value)}
                  />
                </Field.Root>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setModalOpen(false);
                    setEditingDeck(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  colorPalette="brand"
                  onClick={handleSave}
                  loading={saving}
                  disabled={!deckTitle.trim()}
                >
                  {editingDeck ? "Save Changes" : "Create"}
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
                <Dialog.Title>Delete Deck</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>
                  Are you sure you want to delete{" "}
                  <Text as="span" fontWeight="bold">
                    {deleteTarget?.title}
                  </Text>
                  ? All words in this deck will also be removed.
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
