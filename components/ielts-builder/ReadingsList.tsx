"use client";

import {
  Box,
  Button,
  Combobox,
  Flex,
  Heading,
  HStack,
  Text,
  Badge,
  Spinner,
  IconButton,
  Input,
  Pagination,
  ButtonGroup,
  Portal,
  createListCollection,
} from "@chakra-ui/react";
import {
  Plus,
  Trash2,
  Pencil,
  Link2,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ieltsReadingAPI, ieltsTestsAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type { IELTSReading, IELTSTest, PageId } from "./types";

interface ReadingsListProps {
  onNavigate: (page: PageId, data?: Record<string, string>) => void;
}

export default function ReadingsList({ onNavigate }: ReadingsListProps) {
  const [items, setItems] = useState<IELTSReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 10;
  const [selectedTestId, setSelectedTestId] = useState("");
  const [tests, setTests] = useState<IELTSTest[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [testSearchInput, setTestSearchInput] = useState("");

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const testSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const testCollection = useMemo(
    () =>
      createListCollection({
        items: tests,
        itemToValue: (t) => t.id,
        itemToString: (t) => t.title,
      }),
    [tests],
  );

  const load = useCallback(async (currentPage: number, search: string, testId?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: PAGE_SIZE,
      };
      if (search.trim()) params.search = search.trim();
      if (testId) params.testId = testId;

      const res = await ieltsReadingAPI.getAll(params);
      setItems(res?.data || []);
      setTotal(res?.total || 0);
    } catch (e: unknown) {
      toaster.error({ title: "Error", description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load tests for combobox
  useEffect(() => {
    ieltsTestsAPI
      .getAll({ limit: 20 })
      .then((res: IELTSTest[] | { data: IELTSTest[] }) => {
        const list = Array.isArray(res) ? res : res.data || [];
        setTests(list);
      })
      .catch(() => {})
      .finally(() => setLoadingTests(false));
  }, []);

  // Debounced search for tests combobox
  useEffect(() => {
    if (testSearchTimer.current) clearTimeout(testSearchTimer.current);
    testSearchTimer.current = setTimeout(() => {
      ieltsTestsAPI
        .getAll({ limit: 20, search: testSearchInput || undefined })
        .then((res: IELTSTest[] | { data: IELTSTest[] }) => {
          const list = Array.isArray(res) ? res : res.data || [];
          setTests(list);
        })
        .catch(() => {});
    }, 400);
    return () => {
      if (testSearchTimer.current) clearTimeout(testSearchTimer.current);
    };
  }, [testSearchInput]);

  // Reload when page or testId changes
  useEffect(() => {
    load(page, searchTerm, selectedTestId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedTestId, load]);

  // Debounced search: reset to page 1
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      load(1, searchTerm, selectedTestId);
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchTerm, load, selectedTestId]);

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this reading?")) return;
    try {
      await ieltsReadingAPI.delete(id);
      toaster.success({ title: "Deleted!" });
      load(page, searchTerm, selectedTestId);
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
          📖 Readings
        </Heading>
        <Button
          size="sm"
          bg="#4f46e5"
          color="white"
          _hover={{ bg: "#3730a3" }}
          onClick={() => onNavigate("reading-form")}
        >
          <Plus size={14} /> Create Reading
        </Button>
      </Flex>

      <Flex mb={3} gap={2} flexWrap="wrap" alignItems="center">
        <Input
          maxW="220px"
          size="sm"
          placeholder="Search readings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Box w="220px">
          {loadingTests ? (
            <HStack gap={2} py={2}>
              <Spinner size="xs" />
              <Text fontSize="sm" color="gray.400">
                Loading tests...
              </Text>
            </HStack>
          ) : (
            <Combobox.Root
              collection={testCollection}
              value={selectedTestId ? [selectedTestId] : []}
              onValueChange={(details) => {
                setSelectedTestId(details.value[0] || "");
                setPage(1);
              }}
              onInputValueChange={(details) => {
                setTestSearchInput(details.inputValue);
              }}
              inputBehavior="autohighlight"
              openOnClick
              size="sm"
              w="full"
            >
              <Combobox.Control>
                <Combobox.Input placeholder="Filter by test..." />
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
                    <Combobox.Empty>No tests found</Combobox.Empty>
                    {testCollection.items.map((t) => (
                      <Combobox.Item key={t.id} item={t}>
                        {t.title}
                        <Combobox.ItemIndicator />
                      </Combobox.Item>
                    ))}
                  </Combobox.Content>
                </Combobox.Positioner>
              </Portal>
            </Combobox.Root>
          )}
        </Box>
      </Flex>

      {items.length === 0 && !searchTerm ? (
        <Box textAlign="center" py={12} color="gray.400">
          <Text fontSize="4xl" mb={3}>
            📖
          </Text>
          <Heading size="sm" color="gray.500">
            No readings yet
          </Heading>
        </Box>
      ) : items.length === 0 ? (
        <Box textAlign="center" py={12} color="gray.400">
          <Heading size="sm" color="gray.500">
            No matching readings
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
                      _dark={{
                        bg: "gray.700",
                        color: "gray.400",
                        borderColor: "gray.600",
                      }}
                      fontSize="xs"
                      textTransform="uppercase"
                      color="gray.500"
                      fontWeight="700"
                      borderBottomWidth="2px"
                      borderColor="gray.200"
                    >
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box as="tbody">
                {items.map((r) => (
                  <Box
                    as="tr"
                    key={r.id}
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
                      {r.title || "-"}
                    </Box>
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      {r.test_id ? (
                        <Link
                          href={`/ielts-test-builder/tests/${r.test_id}`}
                          style={{
                            color: "#4f46e5",
                            fontWeight: 500,
                            textDecoration: "none",
                          }}
                        >
                          {r.test?.title || "Untitled test"}
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
                        onClick={() => copyId(r.id)}
                        variant="plain"
                      >
                        {truncId(r.id)}
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
                            onNavigate("reading-part-form", { readingId: r.id })
                          }
                        >
                          <Plus size={12} /> Part
                        </Button>
                        <IconButton
                          size="xs"
                          colorPalette="teal"
                          variant="ghost"
                          onClick={() =>
                            onNavigate("reading-linked-parts", {
                              readingId: r.id,
                            })
                          }
                          aria-label="Manage linked parts"
                          title="Manage linked parts (many-to-many)"
                        >
                          <Link2 size={14} />
                        </IconButton>
                        <IconButton
                          size="xs"
                          colorPalette="blue"
                          variant="ghost"
                          onClick={() =>
                            onNavigate("reading-form", { editId: r.id })
                          }
                          aria-label="Edit"
                        >
                          <Pencil size={14} />
                        </IconButton>
                        <IconButton
                          size="xs"
                          colorPalette="red"
                          variant="ghost"
                          onClick={() => deleteItem(r.id)}
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
