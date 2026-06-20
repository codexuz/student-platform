"use client";

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Spinner,
  Table,
  Badge,
  IconButton,
  EmptyState,
  Text,
  ButtonGroup,
  Pagination,
} from "@chakra-ui/react";
import { Plus, Search, Pencil, Trash2, ListTree, Mic } from "lucide-react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ieltsSpeakingAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";

const PAGE_SIZE = 10;

interface SpeakingTopic {
  id: string;
  title: string;
  mode?: string;
  is_active?: boolean;
  test?: { title?: string } | null;
}

export default function SpeakingsList() {
  const router = useRouter();
  const [items, setItems] = useState<SpeakingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ieltsSpeakingAPI.getAll({
        page,
        limit: PAGE_SIZE,
        ...(debounced && { search: debounced }),
      });
      setItems(res?.data || []);
      setTotal(res?.total ?? 0);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, debounced]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await ieltsSpeakingAPI.delete(id);
      toaster.success({ title: "Topic deleted" });
      fetchData();
    } catch (e: unknown) {
      toaster.error({ title: "Delete failed", description: (e as Error).message });
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={3}>
        <HStack gap={2}>
          <Mic size={20} color="#4f46e5" />
          <Heading size="md" fontWeight="700">
            Speaking Topics
          </Heading>
        </HStack>
        <Button
          bg="#4f46e5"
          color="white"
          _hover={{ bg: "#4338ca" }}
          size="sm"
          onClick={() => router.push("/ielts-test-builder/speakings/create")}
        >
          <Plus size={16} /> New Topic
        </Button>
      </Flex>

      <Box position="relative" maxW="320px" mb={4}>
        <Box
          position="absolute"
          left="10px"
          top="50%"
          transform="translateY(-50%)"
          color="gray.400"
          zIndex={1}
          pointerEvents="none"
        >
          <Search size={16} />
        </Box>
        <Input
          size="sm"
          pl="34px"
          placeholder="Search topics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>

      <Box bg="white" _dark={{ bg: "gray.800" }} rounded="lg" borderWidth="1px" overflow="hidden">
        {loading ? (
          <Flex justify="center" py={12}>
            <Spinner size="lg" color="#4f46e5" />
          </Flex>
        ) : items.length === 0 ? (
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Mic />
              </EmptyState.Indicator>
              <EmptyState.Title>No speaking topics</EmptyState.Title>
              <EmptyState.Description>
                Create your first speaking topic to get started.
              </EmptyState.Description>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <Table.Root size="sm" interactive>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Title</Table.ColumnHeader>
                <Table.ColumnHeader>Mode</Table.ColumnHeader>
                <Table.ColumnHeader>Test</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {items.map((t) => (
                <Table.Row key={t.id}>
                  <Table.Cell fontWeight="500">{t.title}</Table.Cell>
                  <Table.Cell>
                    <Badge variant="subtle" colorPalette="gray">
                      {t.mode || "practice"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell color="gray.500">{t.test?.title || "—"}</Table.Cell>
                  <Table.Cell>
                    <Badge
                      variant="subtle"
                      colorPalette={t.is_active ? "green" : "gray"}
                    >
                      {t.is_active ? "active" : "inactive"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell textAlign="end">
                    <HStack justify="flex-end" gap={1}>
                      <IconButton
                        aria-label="Manage parts"
                        size="xs"
                        variant="ghost"
                        colorPalette="purple"
                        onClick={() =>
                          router.push(
                            `/ielts-test-builder/speakings/${t.id}/manage`,
                          )
                        }
                      >
                        <ListTree size={15} />
                      </IconButton>
                      <IconButton
                        aria-label="Edit"
                        size="xs"
                        variant="ghost"
                        onClick={() =>
                          router.push(
                            `/ielts-test-builder/speakings/${t.id}/edit`,
                          )
                        }
                      >
                        <Pencil size={15} />
                      </IconButton>
                      <IconButton
                        aria-label="Delete"
                        size="xs"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() => handleDelete(t.id, t.title)}
                      >
                        <Trash2 size={15} />
                      </IconButton>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Box>

      {total > PAGE_SIZE && (
        <Flex justify="center" mt={4}>
          <Pagination.Root
            count={total}
            pageSize={PAGE_SIZE}
            page={page}
            onPageChange={(e) => setPage(e.page)}
          >
            <ButtonGroup variant="ghost" size="sm">
              <Pagination.PrevTrigger asChild>
                <IconButton aria-label="Prev">
                  <LuChevronLeft />
                </IconButton>
              </Pagination.PrevTrigger>
              <Pagination.Items
                render={(p) => (
                  <IconButton
                    aria-label={`Page ${p.value}`}
                    variant={{ base: "ghost", _selected: "outline" }}
                  >
                    {p.value}
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
  );
}
