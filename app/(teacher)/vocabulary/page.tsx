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
  Textarea,
  Badge,
  Icon,
} from "@chakra-ui/react";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ieltsVocabularyAPI } from "@/lib/teacher-api";
import { toaster } from "@/components/ui/toaster";
import type { IeltsVocabulary, Paginated } from "@/components/vocabulary/types";

const PAGE_SIZE = 10;

export default function VocabularyPage() {
  return (
    <ProtectedRoute>
      <VocabularyContent />
    </ProtectedRoute>
  );
}

function VocabularyContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vocabularies, setVocabularies] = useState<IeltsVocabulary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // Create/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IeltsVocabulary | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<IeltsVocabulary | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const fetchVocabularies = useCallback(async () => {
    setLoading(true);
    try {
      const res: Paginated<IeltsVocabulary> = await ieltsVocabularyAPI.getAll(
        page,
        PAGE_SIZE,
      );
      setVocabularies(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch vocabularies:", err);
      toaster.error({ title: "Failed to load vocabularies" });
      setVocabularies([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchVocabularies();
  }, [fetchVocabularies]);

  const filteredVocabularies = search
    ? vocabularies.filter(
        (v) =>
          v.title.toLowerCase().includes(search.toLowerCase()) ||
          v.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : vocabularies;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", description: "" });
    setModalOpen(true);
  };

  const openEdit = (vocab: IeltsVocabulary) => {
    setEditing(vocab);
    setForm({ title: vocab.title, description: vocab.description || "" });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await ieltsVocabularyAPI.update(editing.id, form);
        toaster.success({ title: "Vocabulary updated" });
      } else {
        await ieltsVocabularyAPI.create(form);
        toaster.success({ title: "Vocabulary created" });
      }
      setModalOpen(false);
      setEditing(null);
      fetchVocabularies();
    } catch (err) {
      console.error("Failed to save vocabulary:", err);
      toaster.error({
        title: editing
          ? "Failed to update vocabulary"
          : "Failed to create vocabulary",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await ieltsVocabularyAPI.delete(deleteTarget.id);
      toaster.success({ title: "Vocabulary deleted" });
      setDeleteTarget(null);
      fetchVocabularies();
    } catch (err) {
      console.error("Failed to delete vocabulary:", err);
      toaster.error({ title: "Failed to delete vocabulary" });
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
          <Heading size={{ base: "sm", md: "md" }}>Vocabulary</Heading>
          <HStack gap={{ base: 2, md: 4 }}>
            <NotificationsDrawer />
          </HStack>
        </Flex>

        <Box p={{ base: 4, md: 6 }} maxW="1100px" mx="auto">
          {/* Title */}
          <VStack gap={1} alignItems="flex-start" mb={6}>
            <Heading size={{ base: "lg", md: "xl" }}>IELTS Vocabulary</Heading>
            <Text color="gray.600" _dark={{ color: "gray.400" }}>
              Create and manage vocabulary collections for IELTS preparation
            </Text>
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
                  placeholder="Search vocabularies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Box>
            </HStack>
            <Button size="sm" colorPalette="brand" onClick={openCreate}>
              <Plus size={16} />
              New Vocabulary
            </Button>
          </Flex>

          {/* Content */}
          {loading ? (
            <Flex justify="center" py={12}>
              <Spinner size="xl" color="brand.500" />
            </Flex>
          ) : filteredVocabularies.length === 0 ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Title>No vocabularies found</EmptyState.Title>
                <EmptyState.Description>
                  {search
                    ? "No vocabularies match your search."
                    : "Create your first vocabulary collection to get started."}
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
              <Table.Root size="sm" variant="outline" interactive>
                <Table.Header>
                  <Table.Row bg="gray.50" _dark={{ bg: "gray.700" }}>
                    <Table.ColumnHeader pl={4}>Title</Table.ColumnHeader>
                    <Table.ColumnHeader
                      display={{ base: "none", md: "table-cell" }}
                    >
                      Description
                    </Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="center">
                      Decks
                    </Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="right" pr={4}>
                      Actions
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredVocabularies.map((v) => (
                    <Table.Row
                      key={v.id}
                      cursor="pointer"
                      _hover={{ bg: "gray.50", _dark: { bg: "gray.700" } }}
                      onClick={() => router.push(`/vocabulary/${v.id}`)}
                    >
                      <Table.Cell pl={4} fontWeight="medium">
                        <HStack>
                          <Icon color="brand.500">
                            <BookOpen size={16} />
                          </Icon>
                          <Text>{v.title}</Text>
                        </HStack>
                      </Table.Cell>
                      <Table.Cell
                        display={{ base: "none", md: "table-cell" }}
                        color="gray.600"
                        _dark={{ color: "gray.400" }}
                        maxW="300px"
                        truncate
                      >
                        {v.description || "—"}
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        <Badge colorPalette="blue" size="sm">
                          {v.decks?.length ?? 0} decks
                        </Badge>
                      </Table.Cell>
                      <Table.Cell textAlign="right" pr={4}>
                        <HStack justify="flex-end" gap={1}>
                          <IconButton
                            aria-label="Edit"
                            size="xs"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(v);
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
                              setDeleteTarget(v);
                            }}
                          >
                            <Trash2 size={14} />
                          </IconButton>
                          <IconButton
                            aria-label="View"
                            size="xs"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/vocabulary/${v.id}`);
                            }}
                          >
                            <ArrowRight size={14} />
                          </IconButton>
                        </HStack>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
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
                        variant={pageItem.value === page ? "solid" : "ghost"}
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
        </Box>
      </Box>

      <MobileBottomNav />

      {/* Create / Edit Modal */}
      <Dialog.Root
        open={modalOpen}
        onOpenChange={(e) => {
          if (!e.open) {
            setModalOpen(false);
            setEditing(null);
          }
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>
                  {editing ? "Edit Vocabulary" : "New Vocabulary"}
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <VStack gap={4}>
                  <Field.Root required>
                    <Field.Label>Title</Field.Label>
                    <Input
                      placeholder="e.g. Cambridge IELTS Words"
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>Description</Field.Label>
                    <Textarea
                      placeholder="Short description (optional)"
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                      rows={3}
                    />
                  </Field.Root>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setModalOpen(false);
                    setEditing(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  colorPalette="brand"
                  onClick={handleSave}
                  loading={saving}
                  disabled={!form.title.trim()}
                >
                  {editing ? "Save Changes" : "Create"}
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
                <Dialog.Title>Delete Vocabulary</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>
                  Are you sure you want to delete{" "}
                  <Text as="span" fontWeight="bold">
                    {deleteTarget?.title}
                  </Text>
                  ? This will also remove all its decks and words. This action
                  cannot be undone.
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
