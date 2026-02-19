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
  Pagination,
  ButtonGroup,
} from "@chakra-ui/react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { ieltsListeningPartsAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type { IELTSListeningPart, PageId } from "./types";

interface ListeningPartsListProps {
  onNavigate: (page: PageId, data?: Record<string, string>) => void;
}

export default function ListeningPartsList({
  onNavigate,
}: ListeningPartsListProps) {
  const router = useRouter();
  const [items, setItems] = useState<IELTSListeningPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [partFilter, setPartFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 10;

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    async (currentPage: number, search: string, part: string, mode: string) => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = {
          page: currentPage,
          limit: PAGE_SIZE,
        };
        if (search.trim()) params.search = search.trim();
        if (part) params.part = part;
        if (mode) params.mode = mode;

        const res = await ieltsListeningPartsAPI.getAll(params);
        setItems(res?.data || []);
        setTotal(res?.total || 0);
      } catch (e: unknown) {
        toaster.error({ title: "Error", description: (e as Error).message });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Reload when page or dropdown filters change
  useEffect(() => {
    load(page, searchTerm, partFilter, modeFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, partFilter, modeFilter, load]);

  // Debounced search: reset to page 1
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      load(1, searchTerm, partFilter, modeFilter);
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchTerm, partFilter, modeFilter, load]);

  // Reset to page 1 when dropdown filters change
  useEffect(() => {
    setPage(1);
  }, [partFilter, modeFilter]);

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this listening part?")) return;
    try {
      await ieltsListeningPartsAPI.delete(id);
      toaster.success({ title: "Deleted!" });
      load(page, searchTerm, partFilter, modeFilter);
    } catch (e: unknown) {
      toaster.error({ title: "Error", description: (e as Error).message });
    }
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toaster.success({ title: "ID copied!" });
  };

  const truncId = (id: string) => (id ? id.substring(0, 8) + "..." : "-");

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
          🔊 Listening Parts
        </Heading>
        <Button
          size="sm"
          bg="#4f46e5"
          color="white"
          _hover={{ bg: "#3730a3" }}
          onClick={() => onNavigate("listening-part-form")}
        >
          <Plus size={14} /> Create Listening Part
        </Button>
      </Flex>

      <Flex mb={3} gap={2} flexWrap="wrap" alignItems="center">
        <Input
          maxW="220px"
          size="sm"
          placeholder="Search listening parts..."
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
            <option value="PART_4">Part 4</option>
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
      </Flex>

      {items.length === 0 && !searchTerm && !partFilter && !modeFilter ? (
        <Box textAlign="center" py={12} color="gray.400">
          <Text fontSize="4xl" mb={3}>
            🔊
          </Text>
          <Heading size="sm" color="gray.500">
            No listening parts yet
          </Heading>
        </Box>
      ) : items.length === 0 ? (
        <Box textAlign="center" py={12} color="gray.400">
          <Heading size="sm" color="gray.500">
            No matching listening parts
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
                  {["Title", "Part", "Mode", "Listening", "ID", "Actions"].map(
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
                {items.map((p) => (
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
                      {p.listening?.title && p.listening_id ? (
                        <Link
                          href={`/ielts-test-builder/listenings/${p.listening_id}/edit`}
                          style={{
                            color: "#4f46e5",
                            fontWeight: 500,
                            textDecoration: "none",
                          }}
                        >
                          {p.listening.title}
                        </Link>
                      ) : (
                        <Text>{p.listening?.title || "-"}</Text>
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
                          variant="ghost"
                          colorPalette="green"
                          onClick={() =>
                            router.push(`/practice/listening/${p.id}`)
                          }
                          aria-label="Preview"
                          title="Preview as student"
                        >
                          <Eye size={14} />
                        </IconButton>
                        <IconButton
                          size="xs"
                          variant="outline"
                          onClick={() =>
                            onNavigate("listening-part-form", { editId: p.id })
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
              {Math.min(page * PAGE_SIZE, total)} of {total}
            </Text>
            <Pagination.Root
              count={total}
              pageSize={PAGE_SIZE}
              page={page}
              onPageChange={(e) => setPage(e.page)}
            >
              <ButtonGroup variant="ghost" size="sm" wrap="wrap">
                <Pagination.PrevTrigger asChild>
                  <IconButton aria-label="Previous page">
                    <ChevronLeft size={16} />
                  </IconButton>
                </Pagination.PrevTrigger>

                <Pagination.Items
                  render={(p) => (
                    <IconButton
                      variant={{ base: "ghost", _selected: "outline" }}
                    >
                      {p.value}
                    </IconButton>
                  )}
                />

                <Pagination.NextTrigger asChild>
                  <IconButton aria-label="Next page">
                    <ChevronRight size={16} />
                  </IconButton>
                </Pagination.NextTrigger>
              </ButtonGroup>
            </Pagination.Root>
          </Flex>
        </Box>
      )}
    </Box>
  );
}
