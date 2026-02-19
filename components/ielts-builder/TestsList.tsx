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
  Eye,
  Pencil,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { ieltsTestsAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type { IELTSTest, PageId } from "./types";

interface TestsListProps {
  onNavigate: (page: PageId, data?: Record<string, string>) => void;
}

export default function TestsList({ onNavigate }: TestsListProps) {
  const [tests, setTests] = useState<IELTSTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 10;

  // Debounce timer ref for search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadTests = useCallback(
    async (
      currentPage: number,
      search: string,
      status: string,
      mode: string,
      category: string,
    ) => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = {
          page: currentPage,
          limit: PAGE_SIZE,
        };
        if (search.trim()) params.search = search.trim();
        if (status) params.status = status;
        if (mode) params.mode = mode;
        if (category) params.category = category;

        const res = await ieltsTestsAPI.getAll(params);
        setTests(res?.data || []);
        setTotal(res?.total || 0);
      } catch (e: unknown) {
        toaster.error({
          title: "Error loading tests",
          description: (e as Error).message,
        });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Reload when page or filters change
  useEffect(() => {
    loadTests(page, searchTerm, statusFilter, modeFilter, categoryFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, modeFilter, categoryFilter, loadTests]);

  // Debounced search: reset to page 1 whenever search text changes
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      loadTests(1, searchTerm, statusFilter, modeFilter, categoryFilter);
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchTerm, statusFilter, modeFilter, categoryFilter, loadTests]);

  // Reset to page 1 when dropdown filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, modeFilter, categoryFilter]);

  const deleteTest = async (id: string) => {
    if (!confirm("Delete this test?")) return;
    try {
      await ieltsTestsAPI.delete(id);
      toaster.success({ title: "Test deleted" });
      loadTests(page, searchTerm, statusFilter, modeFilter, categoryFilter);
    } catch (e: unknown) {
      toaster.error({ title: "Error", description: (e as Error).message });
    }
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toaster.success({ title: "ID copied!" });
  };

  const truncId = (id: string) => (id ? id.substring(0, 8) + "..." : "-");

  if (loading) {
    return (
      <Flex justifyContent="center" py={12}>
        <Spinner size="lg" color="#4f46e5" />
      </Flex>
    );
  }

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="md" fontWeight="700">
          📋 Tests
        </Heading>
        <Button
          size="sm"
          bg="#4f46e5"
          color="white"
          _hover={{ bg: "#3730a3" }}
          onClick={() => onNavigate("test-form")}
        >
          <Plus size={14} /> Create Test
        </Button>
      </Flex>

      <Flex mb={3} gap={2} flexWrap="wrap" alignItems="center">
        <Input
          maxW="220px"
          size="sm"
          placeholder="Search tests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <NativeSelect.Root size="sm" width="140px">
          <NativeSelect.Field
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
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
        <NativeSelect.Root size="sm" width="160px">
          <NativeSelect.Field
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="cambridge books">Cambridge Books</option>
            <option value="authentic">Autentic Tests</option>
            <option value="pre-test">Pre Test</option>
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Flex>

      {tests.length === 0 &&
      !searchTerm &&
      !statusFilter &&
      !modeFilter &&
      !categoryFilter ? (
        <Box textAlign="center" py={12} color="gray.400">
          <Text fontSize="4xl" mb={3}>
            📋
          </Text>
          <Heading size="sm" color="gray.500" mb={1}>
            No tests yet
          </Heading>
          <Text fontSize="sm">Create your first test</Text>
        </Box>
      ) : tests.length === 0 ? (
        <Box textAlign="center" py={12} color="gray.400">
          <Heading size="sm" color="gray.500">
            No matching tests
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
                  {["Title", "Mode", "Category", "Status", "ID", "Actions"].map(
                    (h) => (
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
                        borderBottomWidth="2px"
                        borderColor="gray.200"
                        fontSize="xs"
                        textTransform="uppercase"
                        letterSpacing="0.4px"
                        color="gray.500"
                        fontWeight="700"
                      >
                        {h}
                      </Box>
                    ),
                  )}
                </Box>
              </Box>
              <Box as="tbody">
                {tests.map((t) => (
                  <Box
                    as="tr"
                    key={t.id}
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
                      {t.title || "Untitled"}
                    </Box>
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      {t.mode}
                    </Box>
                    <Box
                      as="td"
                      px={4}
                      py={2.5}
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      _dark={{ borderColor: "gray.700" }}
                    >
                      {t.category || "-"}
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
                        bg={t.status === "published" ? "#d1fae5" : "#fef3c7"}
                        color={t.status === "published" ? "#065f46" : "#92400e"}
                        _dark={{
                          bg:
                            t.status === "published"
                              ? "green.900"
                              : "yellow.900",
                          color:
                            t.status === "published"
                              ? "green.200"
                              : "yellow.200",
                        }}
                        fontSize="xs"
                        fontWeight="700"
                        textTransform="uppercase"
                        px={2}
                        rounded="full"
                        variant="plain"
                      >
                        {t.status}
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
                        bg="gray.100"
                        color="gray.500"
                        _dark={{ bg: "gray.700", color: "gray.400" }}
                        fontSize="xs"
                        fontFamily="mono"
                        px={1.5}
                        rounded="sm"
                        cursor="pointer"
                        onClick={() => copyId(t.id)}
                        variant="plain"
                        _hover={{ bg: "gray.200", _dark: { bg: "gray.600" } }}
                        title={t.id}
                      >
                        <Copy size={10} /> {truncId(t.id)}
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
                          bg="#4f46e5"
                          color="white"
                          _hover={{ bg: "#3730a3" }}
                          onClick={() =>
                            onNavigate("test-detail", { testId: t.id })
                          }
                          aria-label="View"
                          title="View"
                        >
                          <Eye size={14} />
                        </IconButton>
                        <IconButton
                          size="xs"
                          variant="outline"
                          onClick={() =>
                            onNavigate("test-form", { editId: t.id })
                          }
                          aria-label="Edit"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </IconButton>
                        <IconButton
                          size="xs"
                          colorPalette="red"
                          variant="ghost"
                          onClick={() => deleteTest(t.id)}
                          aria-label="Delete"
                          title="Delete"
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
