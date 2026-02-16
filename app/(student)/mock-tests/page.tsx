"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  NativeSelect,
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
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import { ieltsAPI } from "@/lib/api";

const PAGE_SIZE = 9;

interface MockTest {
  id?: string;
  _id?: string;
  title?: string;
  mode?: string;
  status?: string;
  category?: string;
  reading?: { id: string; title?: string; parts?: unknown[] };
  listening?: { id: string; title?: string; parts?: unknown[] };
  writing?: { id: string; title?: string; tasks?: unknown[] };
  createdAt?: string;
}

const categoryLabels: Record<string, string> = {
  authentic: "Authentic",
  "pre-test": "Pre-test",
  "cambridge books": "Cambridge",
};

export default function MockTestsPage() {
  return (
    <ProtectedRoute>
      <MockTestsContent />
    </ProtectedRoute>
  );
}

function MockTestsContent() {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [category, setCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ieltsAPI.getTests({
        page,
        limit: PAGE_SIZE,
        mode: "mock",
        ...(category && { category }),
        ...(debouncedSearch && { search: debouncedSearch }),
      });
      setTests(response?.data || response?.results || response || []);
      setTotalCount(
        response?.total || response?.count || response?.totalCount || 0,
      );
    } catch (error) {
      console.error("Error fetching mock tests:", error);
      setTests([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, category, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
    setPage(1);
  };

  const getModuleBadges = (test: MockTest) => {
    const badges: { label: string; icon: typeof BookOpen; color: string }[] =
      [];
    if (test.reading)
      badges.push({ label: "Reading", icon: BookOpen, color: "#4F46E5" });
    if (test.listening)
      badges.push({ label: "Listening", icon: Headphones, color: "#D97706" });
    if (test.writing)
      badges.push({ label: "Writing", icon: PenTool, color: "#059669" });
    return badges;
  };

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
      <Sidebar />
      <Box ml={{ base: 0, lg: "240px" }} pb={{ base: "80px", lg: 0 }}>
        {/* Header Bar */}
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
          <HStack gap={{ base: 2, md: 4 }}>
            <NotificationsDrawer />
          </HStack>
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
              Simulate the real IELTS exam experience. Each mock test includes
              Reading, Listening, and Writing modules with timed conditions.
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

            <NativeSelect.Root size="sm" width={{ base: "100%", md: "180px" }}>
              <NativeSelect.Field
                value={category}
                onChange={handleCategoryChange}
              >
                <option value="">All Categories</option>
                <option value="authentic">Authentic</option>
                <option value="pre-test">Pre-test</option>
                <option value="cambridge books">Cambridge Books</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
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
                  const testId = test.id || test._id;
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
                        {test.category && (
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
                            {categoryLabels[test.category] || test.category}
                          </Badge>
                        )}
                      </Flex>

                      <Card.Body pt={4} pb={5}>
                        <VStack align="stretch" gap={3}>
                          <Heading size="sm" lineClamp={2}>
                            {test.title}
                          </Heading>

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
                            variant="subtle"
                            mt={1}
                            disabled
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
      <MobileBottomNav />
    </Box>
  );
}
