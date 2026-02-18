"use client";

import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Text,
  Badge,
  Spinner,
  IconButton,
  Input,
  NativeSelect,
} from "@chakra-ui/react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { ieltsReadingPartsAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type { IELTSReadingPart, PageId } from "./types";

interface ReadingPartsListProps {
  onNavigate: (page: PageId, data?: Record<string, string>) => void;
}

export default function ReadingPartsList({
  onNavigate,
}: ReadingPartsListProps) {
  const [items, setItems] = useState<IELTSReadingPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [partFilter, setPartFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [readingFilter, setReadingFilter] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ieltsReadingPartsAPI.getAll();
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
    if (!confirm("Delete this reading part?")) return;
    try {
      await ieltsReadingPartsAPI.delete(id);
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

  const readingOptions = useMemo(
    () =>
      [
        ...new Map(
          items
            .filter((p) => p.reading?.title)
            .map((p) => [p.reading_id, p.reading!.title]),
        ).entries(),
      ].map(([id, title]) => ({ id, title })),
    [items],
  );

  const filteredItems = useMemo(() => {
    let result = items;

    if (partFilter) result = result.filter((p) => p.part === partFilter);
    if (modeFilter) result = result.filter((p) => p.mode === modeFilter);
    if (readingFilter)
      result = result.filter((p) => p.reading_id === readingFilter);

    const query = searchTerm.trim().toLowerCase();
    if (query) {
      result = result.filter((part) =>
        [
          part.title,
          part.id,
          part.part,
          part.mode,
          part.reading?.title,
          part.reading_id,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query),
      );
    }

    return result;
  }, [items, searchTerm, partFilter, modeFilter, readingFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const paginatedItems = filteredItems.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, partFilter, modeFilter, readingFilter]);

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
          📄 Reading Parts
        </Heading>
        <Button
          size="sm"
          bg="#4f46e5"
          color="white"
          _hover={{ bg: "#3730a3" }}
          onClick={() => onNavigate("reading-part-form")}
        >
          <Plus size={14} /> Create Reading Part
        </Button>
      </Flex>

      <Flex mb={3} gap={2} flexWrap="wrap" alignItems="center">
        <Input
          maxW="220px"
          size="sm"
          placeholder="Search reading parts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <NativeSelect.Root size="sm" width="130px">
          <NativeSelect.Field
            value={partFilter}
            onChange={(e) => setPartFilter(e.target.value)}
          >
            <option value="">All Parts</option>
            <option value="PART_1">Part 1</option>
            <option value="PART_2">Part 2</option>
            <option value="PART_3">Part 3</option>
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        <NativeSelect.Root size="sm" width="140px">
          <NativeSelect.Field
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
          >
            <option value="">All Modes</option>
            <option value="practice">Practice</option>
            <option value="mock">Mock</option>
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        {readingOptions.length > 0 && (
          <NativeSelect.Root size="sm" width="180px">
            <NativeSelect.Field
              value={readingFilter}
              onChange={(e) => setReadingFilter(e.target.value)}
            >
              <option value="">All Readings</option>
              {readingOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
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
            📄
          </Text>
          <Heading size="sm" color="gray.500">
            No reading parts yet
          </Heading>
        </Box>
      ) : filteredItems.length === 0 ? (
        <Box textAlign="center" py={12} color="gray.400">
          <Heading size="sm" color="gray.500">
            No matching reading parts
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
                  {["Title", "Part", "Mode", "Reading", "ID", "Actions"].map(
                    (h) => (
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
                    ),
                  )}
                </Box>
              </Box>
              <Box as="tbody">
                {paginatedItems.map((p) => (
                  <Box
                    as="tr"
                    key={p.id}
                    _hover={{ bg: "gray.50", _dark: { bg: "gray.700" } }}
                  >
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      {p.title || "-"}
                    </Box>
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      <Badge colorPalette="red" variant="subtle" fontSize="xs">
                        {p.part.toLowerCase().replace("_", " ")}
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
                      <Badge
                        colorPalette={p.mode === "mock" ? "purple" : "blue"}
                        variant="subtle"
                        fontSize="xs"
                      >
                        {p.mode === "mock" ? "Mock" : "Practice"}
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
                      {p.reading?.title && p.reading_id ? (
                        <Link
                          href={`/ielts-test-builder/readings/${p.reading_id}/edit`}
                          style={{
                            color: "#4f46e5",
                            fontWeight: 500,
                            textDecoration: "none",
                          }}
                        >
                          {p.reading.title}
                        </Link>
                      ) : (
                        <Text>{p.reading?.title || "-"}</Text>
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
                        onClick={() => copyId(p.id)}
                        variant="plain"
                      >
                        {truncId(p.id)}
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
                        <IconButton
                          size="xs"
                          variant="outline"
                          onClick={() =>
                            onNavigate("reading-part-form", { editId: p.id })
                          }
                          aria-label="Edit"
                        >
                          <Pencil size={14} />
                        </IconButton>
                        <IconButton
                          size="xs"
                          colorPalette="red"
                          variant="ghost"
                          onClick={() => deleteItem(p.id)}
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
