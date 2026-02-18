"use client";

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Text,
  Badge,
  IconButton,
  Spinner,
  Input,
  NativeSelect,
} from "@chakra-ui/react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { ieltsListeningAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type { IELTSListening, PageId } from "./types";

interface ListeningsListProps {
  onNavigate: (page: PageId, data?: Record<string, string>) => void;
}

export default function ListeningsList({ onNavigate }: ListeningsListProps) {
  const [items, setItems] = useState<IELTSListening[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [testFilter, setTestFilter] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ieltsListeningAPI.getAll();
      setItems(data?.data || data || []);
    } catch (e: unknown) {
      toaster.error({ title: "Error", description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this listening?")) return;
    try {
      await ieltsListeningAPI.delete(id);
      toaster.success({ title: "Deleted!" });
      load();
    } catch (e: unknown) {
      toaster.error({ title: "Error", description: (e as Error).message });
    }
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toaster.success({ title: "ID copied!" });
  };

  const truncId = (id: string) => (id ? id.substring(0, 8) + "..." : "-");

  const testOptions = useMemo(
    () =>
      [
        ...new Map(
          items
            .filter((l) => l.test?.title)
            .map((l) => [l.test_id, l.test!.title]),
        ).entries(),
      ].map(([id, title]) => ({ id, title })),
    [items],
  );

  const filteredItems = useMemo(() => {
    let result = items;

    if (testFilter) result = result.filter((l) => l.test_id === testFilter);

    const query = searchTerm.trim().toLowerCase();
    if (query) {
      result = result.filter((listening) =>
        [
          listening.title,
          listening.id,
          listening.test?.title,
          listening.test_id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query),
      );
    }

    return result;
  }, [items, searchTerm, testFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const paginatedItems = filteredItems.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, testFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (loading)
    return (
      <Flex justifyContent="center" py={12}>
        <Spinner size="lg" color="#4f46e5" />
      </Flex>
    );

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="md" fontWeight="700">
          🎧 Listenings
        </Heading>
        <Button
          size="sm"
          bg="#4f46e5"
          color="white"
          _hover={{ bg: "#3730a3" }}
          onClick={() => onNavigate("listening-form")}
        >
          <Plus size={14} /> Create Listening
        </Button>
      </Flex>

      <Flex mb={3} gap={2} flexWrap="wrap" alignItems="center">
        <Input
          maxW="220px"
          size="sm"
          placeholder="Search listenings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {testOptions.length > 0 && (
          <NativeSelect.Root size="sm" width="180px">
            <NativeSelect.Field
              value={testFilter}
              onChange={(e) => setTestFilter(e.target.value)}
            >
              <option value="">All Tests</option>
              {testOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        )}
      </Flex>

      {items.length === 0 ? (
        <Box textAlign="center" py={12} color="gray.400">
          <Text fontSize="4xl" mb={3}>
            🎧
          </Text>
          <Heading size="sm" color="gray.500">
            No listenings yet
          </Heading>
        </Box>
      ) : filteredItems.length === 0 ? (
        <Box textAlign="center" py={12} color="gray.400">
          <Heading size="sm" color="gray.500">
            No matching listenings
          </Heading>
        </Box>
      ) : (
        <Box
          bg="white"
          _dark={{ bg: "gray.800" }}
          rounded="lg"
          borderWidth="1px"
          shadow="sm"
          overflow="hidden"
        >
          <Box overflowX="auto">
            <Box as="table" w="full" fontSize="sm">
              <Box as="thead">
                <Box as="tr">
                  {["Title", "Test", "ID", "Actions"].map((h) => (
                    <Box
                      as="th"
                      key={h}
                      textAlign="left"
                      px={4}
                      py={2.5}
                      bg="gray.50"
                      _dark={{ bg: "gray.700", color: "gray.400" }}
                      fontSize="xs"
                      textTransform="uppercase"
                      color="gray.500"
                      fontWeight="700"
                      borderBottomWidth="2px"
                    >
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box as="tbody">
                {paginatedItems.map((l) => (
                  <Box
                    as="tr"
                    key={l.id}
                    _hover={{ bg: "gray.50", _dark: { bg: "gray.700" } }}
                  >
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      fontWeight="600"
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      {l.title || "-"}
                    </Box>
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      {l.test_id ? (
                        <Link
                          href={`/ielts-test-builder/tests/${l.test_id}`}
                          style={{
                            color: "#4f46e5",
                            fontWeight: 500,
                            textDecoration: "none",
                          }}
                        >
                          {l.test?.title || "Untitled test"}
                        </Link>
                      ) : (
                        <Text color="gray.500">-</Text>
                      )}
                    </Box>
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      <Badge
                        bg="gray.100"
                        color="gray.500"
                        _dark={{ bg: "gray.700", color: "gray.400" }}
                        fontSize="xs"
                        fontFamily="mono"
                        px={1.5}
                        rounded="sm"
                        cursor="pointer"
                        onClick={() => copyId(l.id)}
                        variant="plain"
                      >
                        {truncId(l.id)}
                      </Badge>
                    </Box>
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      <HStack gap={1}>
                        <Button
                          size="xs"
                          bg="#4f46e5"
                          color="white"
                          _hover={{ bg: "#3730a3" }}
                          onClick={() =>
                            onNavigate("listening-part-form", {
                              listeningId: l.id,
                            })
                          }
                        >
                          <Plus size={12} /> Part
                        </Button>
                        <IconButton
                          size="xs"
                          colorPalette="blue"
                          variant="ghost"
                          onClick={() =>
                            onNavigate("listening-form", { editId: l.id })
                          }
                          aria-label="Edit"
                        >
                          <Pencil size={14} />
                        </IconButton>
                        <IconButton
                          size="xs"
                          colorPalette="red"
                          variant="ghost"
                          onClick={() => deleteItem(l.id)}
                          aria-label="Delete"
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      </HStack>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
          <Flex
            px={4}
            py={3}
            borderTopWidth="1px"
            borderColor="gray.100"
            _dark={{ borderColor: "gray.700" }}
            alignItems="center"
            justifyContent="space-between"
            gap={3}
          >
            <Text fontSize="xs" color="gray.500">
              Showing {(page - 1) * PAGE_SIZE + 1}-
              {Math.min(page * PAGE_SIZE, filteredItems.length)} of{" "}
              {filteredItems.length}
            </Text>
            <HStack gap={2}>
              <Button
                size="xs"
                variant="outline"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Prev
              </Button>
              <Text fontSize="xs" color="gray.500">
                Page {page} / {totalPages}
              </Text>
              <Button
                size="xs"
                variant="outline"
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </HStack>
          </Flex>
        </Box>
      )}
    </Box>
  );
}
