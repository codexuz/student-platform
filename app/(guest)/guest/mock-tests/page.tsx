"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Heading,
  Grid,
  Card,
  Badge,
  HStack,
  VStack,
  Button,
  Icon,
  Flex,
  Input,
  Spinner,
  Text,
  ButtonGroup,
  IconButton,
  Pagination,
  EmptyState,
} from "@chakra-ui/react";
import {
  ClipboardList,
  Clock,
  BookOpen,
  Headphones,
  PenTool,
  Search,
  Play,
} from "lucide-react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ieltsMockTestsAPI } from "@/lib/ielts-api";

const PAGE_SIZE = 9;

interface MockTest {
  id: string;
  title: string;
  test_id?: string;
  group_id?: string;
  teacher_id?: string;
  listening_confirmed?: boolean;
  reading_confirmed?: boolean;
  writing_confirmed?: boolean;
  listening_finished?: boolean;
  reading_finished?: boolean;
  writing_finished?: boolean;
  archived?: boolean;
  meta?: {
    listening_videoUrl?: string;
    reading_videoUrl?: string;
    writing_videoUrl?: string;
  };
  test?: {
    id: string;
    title?: string;
    category?: string;
    reading?: { id: string; title?: string; parts?: unknown[] };
    listening?: { id: string; title?: string; parts?: unknown[] };
    writing?: { id: string; title?: string; tasks?: unknown[] };
  };
  createdAt?: string;
}

const categoryLabels: Record<string, string> = {
  authentic: "Authentic",
  "pre-test": "Pre-test",
  "cambridge books": "Cambridge",
};

export default function GuestMockTestsPage() {
  return (
    <ProtectedRoute>
      <GuestMockTestsContent />
    </ProtectedRoute>
  );
}

function GuestMockTestsContent() {
  const router = useRouter();
  const [allTests, setAllTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;
    requestAnimationFrame(() => {
      if (!cancelled) setLoading(true);
    });
    ieltsMockTestsAPI
      .getMy()
      .then((res: MockTest[] | { data?: MockTest[] }) => {
        if (!cancelled) {
          const list = Array.isArray(res) ? res : res?.data || [];
          setAllTests(list.filter((t) => !t.archived));
        }
      })
      .catch(() => {
        if (!cancelled) setAllTests([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Client-side filtering
  const filteredTests = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    if (!q) return allTests;
    return allTests.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.test?.title?.toLowerCase().includes(q) ||
        t.test?.category?.toLowerCase().includes(q),
    );
  }, [allTests, debouncedSearch]);

  const totalCount = filteredTests.length;
  const tests = filteredTests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getModuleBadges = (test: MockTest) => {
    const badges: { label: string; icon: typeof BookOpen; color: string }[] =
      [];
    if (test.test?.reading)
      badges.push({ label: "Reading", icon: BookOpen, color: "#4F46E5" });
    if (test.test?.listening)
      badges.push({ label: "Listening", icon: Headphones, color: "#D97706" });
    if (test.test?.writing)
      badges.push({ label: "Writing", icon: PenTool, color: "#059669" });
    return badges;
  };

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
      {/* Guest Header */}
      <Flex
        h={{ base: "14", md: "16" }}
        px={{ base: 4, md: 8 }}
        alignItems="center"
        justifyContent="space-between"
        bg="white"
        _dark={{ bg: "gray.800" }}
        borderBottomWidth="1px"
      >
        <Heading size={{ base: "sm", md: "md" }}>Mock Tests</Heading>
      </Flex>

      {/* Main Content */}
      <Box p={{ base: 4, md: 6 }} maxW="1400px" mx="auto">
        {/* Hero */}
        <Box
          bg="linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
          borderRadius="2xl"
          p={{ base: 6, md: 8 }}
          mb={8}
          color="white"
        >
          <HStack gap={3} mb={3}>
            <Flex
              align="center"
              justify="center"
              w="48px"
              h="48px"
              borderRadius="xl"
              bg="whiteAlpha.200"
            >
              <ClipboardList size={24} />
            </Flex>
            <Heading size={{ base: "lg", md: "xl" }}>
              Full IELTS Mock Tests
            </Heading>
          </HStack>
          <Text
            color="whiteAlpha.800"
            fontSize={{ base: "sm", md: "md" }}
            maxW="600px"
          >
            Browse available mock tests. Each test includes Reading, Listening,
            and Writing modules with timed conditions.
          </Text>
          <HStack gap={6} mt={5}>
            <HStack gap={2} color="whiteAlpha.700" fontSize="sm">
              <Clock size={16} />
              <Text>~2h 45min</Text>
            </HStack>
            <HStack gap={2} color="whiteAlpha.700" fontSize="sm">
              <BookOpen size={16} />
              <Text>3 Modules</Text>
            </HStack>
          </HStack>
        </Box>

        {/* Filters */}
        <Flex
          mb={6}
          gap={3}
          direction={{ base: "column", md: "row" }}
          align={{ base: "stretch", md: "center" }}
          flexWrap="wrap"
        >
          <Box position="relative" width={{ base: "100%", md: "280px" }}>
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
              placeholder="Search mock tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              borderRadius="md"
            />
          </Box>
        </Flex>

        {/* Results header */}
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">
            {totalCount > 0
              ? `${totalCount} Mock Test${totalCount !== 1 ? "s" : ""}`
              : "Mock Tests"}
          </Heading>
        </Flex>

        {/* Grid */}
        {loading ? (
          <Flex justify="center" py={12}>
            <Spinner size="xl" color="brand.500" />
          </Flex>
        ) : tests.length === 0 ? (
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator />
              <EmptyState.Title>No mock tests found</EmptyState.Title>
              <EmptyState.Description>
                There are no mock tests available at the moment. Check back
                later!
              </EmptyState.Description>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <>
            <Grid
              templateColumns={{
                base: "1fr",
                md: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              }}
              gap={6}
            >
              {tests.map((test) => {
                const testId = test.id;
                const moduleBadges = getModuleBadges(test);

                return (
                  <Card.Root
                    key={testId}
                    transition="all 0.2s"
                    borderRadius="2xl"
                    overflow="hidden"
                  >
                    {/* Header banner */}
                    <Flex
                      align="center"
                      justify="center"
                      bg="linear-gradient(135deg, #0f172a 0%, #334155 100%)"
                      py={8}
                      position="relative"
                    >
                      <Flex
                        align="center"
                        justify="center"
                        w="64px"
                        h="64px"
                        borderRadius="2xl"
                        bg="whiteAlpha.200"
                        backdropFilter="blur(8px)"
                      >
                        <ClipboardList size={32} color="white" />
                      </Flex>
                      {test.test?.category && (
                        <Badge
                          position="absolute"
                          top={3}
                          right={3}
                          fontSize="xs"
                          px={2}
                          py={0.5}
                          borderRadius="full"
                          bg="whiteAlpha.200"
                          color="white"
                          fontWeight="semibold"
                        >
                          {categoryLabels[test.test.category] ||
                            test.test.category}
                        </Badge>
                      )}
                    </Flex>

                    <Card.Body pt={4} pb={5}>
                      <VStack align="stretch" gap={3}>
                        <Heading size="sm" lineClamp={2}>
                          {test.title}
                        </Heading>
                        {test.test?.title && test.test.title !== test.title && (
                          <Text fontSize="xs" color="gray.500">
                            {test.test.title}
                          </Text>
                        )}

                        {/* Module badges */}
                        <HStack gap={2} flexWrap="wrap">
                          {moduleBadges.map((badge) => {
                            const BadgeIcon = badge.icon;
                            return (
                              <Badge
                                key={badge.label}
                                fontSize="xs"
                                px={2}
                                py={0.5}
                                borderRadius="full"
                                variant="subtle"
                                colorPalette={
                                  badge.label === "Reading"
                                    ? "purple"
                                    : badge.label === "Listening"
                                      ? "orange"
                                      : "green"
                                }
                              >
                                <Icon fontSize="xs" mr={0.5}>
                                  <BadgeIcon size={12} />
                                </Icon>
                                {badge.label}
                              </Badge>
                            );
                          })}
                        </HStack>

                        <Button
                          size="sm"
                          colorPalette="brand"
                          variant="solid"
                          mt={1}
                          onClick={() =>
                            router.push(
                              `/guest/mock-tests/${testId}${test.test_id ? `?testId=${test.test_id}` : ""}`,
                            )
                          }
                        >
                          <Icon fontSize="sm" mr={1}>
                            <Play size={14} />
                          </Icon>
                          Start Test
                        </Button>
                      </VStack>
                    </Card.Body>
                  </Card.Root>
                );
              })}
            </Grid>

            {/* Pagination */}
            {totalCount > PAGE_SIZE && (
              <Flex justify="center" mt={8}>
                <Pagination.Root
                  count={totalCount}
                  pageSize={PAGE_SIZE}
                  page={page}
                  onPageChange={(e) => setPage(e.page)}
                >
                  <ButtonGroup variant="ghost" size="sm">
                    <Pagination.PrevTrigger asChild>
                      <IconButton>
                        <LuChevronLeft />
                      </IconButton>
                    </Pagination.PrevTrigger>

                    <Pagination.Items
                      render={(page) => (
                        <IconButton
                          variant={{ base: "ghost", _selected: "outline" }}
                        >
                          {page.value}
                        </IconButton>
                      )}
                    />

                    <Pagination.NextTrigger asChild>
                      <IconButton>
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
  );
}
