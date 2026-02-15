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
  ButtonGroup,
  IconButton,
  Pagination,
  NativeSelect,
  EmptyState,
} from "@chakra-ui/react";
import {
  Headphones,
  BookOpen,
  PenTool,
  ClipboardList,
  Search,
} from "lucide-react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import { ieltsAPI } from "@/lib/api";

const PAGE_SIZE = 9;

interface PracticeItem {
  id?: string;
  _id?: string;
  title?: string;
  name?: string;
  completed?: number;
  total?: number;
  types?: string[];
  part?: string;
  task?: string;
  type?: string;
  skill?: string;
}

const skillMeta: Record<
  string,
  { icon: typeof BookOpen; bg: string; color: string; label: string }
> = {
  reading: {
    icon: BookOpen,
    bg: "#EEF2FF",
    color: "#4F46E5",
    label: "Reading",
  },
  listening: {
    icon: Headphones,
    bg: "#FEF3C7",
    color: "#D97706",
    label: "Listening",
  },
  writing: {
    icon: PenTool,
    bg: "#ECFDF5",
    color: "#059669",
    label: "Writing",
  },
  default: {
    icon: ClipboardList,
    bg: "#F0F4FF",
    color: "#3B82F6",
    label: "Test",
  },
};

function getSkillMeta(type?: string, category?: string) {
  if (type && skillMeta[type.toLowerCase()])
    return skillMeta[type.toLowerCase()];
  if (category && skillMeta[category.toLowerCase()])
    return skillMeta[category.toLowerCase()];
  return skillMeta.default;
}

const categories = [
  { id: "full-tests", label: "Full Tests", icon: ClipboardList },
  { id: "listening", label: "Listening", icon: Headphones },
  { id: "reading", label: "Reading", icon: BookOpen },
  { id: "writing", label: "Writing", icon: PenTool },
];

export default function PracticePage() {
  return (
    <ProtectedRoute>
      <PracticeContent />
    </ProtectedRoute>
  );
}

function PracticeContent() {
  const [activeCategory, setActiveCategory] = useState<string>("full-tests");
  const [items, setItems] = useState<PracticeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [readingPart, setReadingPart] = useState<string>("");
  const [listeningPart, setListeningPart] = useState<string>("");
  const [writingTask, setWritingTask] = useState<string>("");
  const [testCategory, setTestCategory] = useState<string>("");
  const [skillType, setSkillType] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  /* debounce search input */
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
      let response;

      switch (activeCategory) {
        case "full-tests":
          response = await ieltsAPI.getSkills({
            page,
            limit: PAGE_SIZE,
            ...(debouncedSearch && { search: debouncedSearch }),
            ...(skillType && { type: skillType }),
            ...(testCategory && { category: testCategory }),
          });
          break;
        case "listening":
          response = await ieltsAPI.getListeningParts({
            page,
            limit: PAGE_SIZE,
            ...(listeningPart && { part: listeningPart }),
          });
          break;
        case "reading":
          response = await ieltsAPI.getReadingParts({
            page,
            limit: PAGE_SIZE,
            ...(readingPart && { part: readingPart }),
          });
          break;
        case "writing":
          response = await ieltsAPI.getWritingTasks({
            page,
            limit: PAGE_SIZE,
            ...(writingTask && { task: writingTask }),
          });
          break;
      }

      if (response) {
        setItems(response.data || response.results || response || []);
        setTotalCount(
          response.total || response.count || response.totalCount || 0,
        );
      }
    } catch (error) {
      console.error(`Error fetching ${activeCategory} tests:`, error);
      setItems([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    activeCategory,
    page,
    readingPart,
    listeningPart,
    writingTask,
    testCategory,
    skillType,
    debouncedSearch,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setPage(1);
    if (category !== "reading") setReadingPart("");
    if (category !== "listening") setListeningPart("");
    if (category !== "writing") setWritingTask("");
    if (category !== "full-tests") {
      setTestCategory("");
      setSkillType("");
      setSearchQuery("");
      setDebouncedSearch("");
    }
  };

  const handleTestCategoryChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setTestCategory(e.target.value);
    setPage(1);
  };

  const handleSkillTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSkillType(e.target.value);
    setPage(1);
  };

  const handleReadingPartChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReadingPart(e.target.value);
    setPage(1);
  };

  const handleListeningPartChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setListeningPart(e.target.value);
    setPage(1);
  };

  const handleWritingTaskChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setWritingTask(e.target.value);
    setPage(1);
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
          <Heading size={{ base: "sm", md: "md" }}>Practice</Heading>
          <HStack gap={{ base: 2, md: 4 }}>
            <NotificationsDrawer />
          </HStack>
        </Flex>

        {/* Main Content */}
        <Box p={{ base: 4, md: 6 }} maxW="1400px" mx="auto">
          {/* Category Tabs */}
          <HStack
            gap={4}
            mb={6}
            pb={4}
            borderBottomWidth="2px"
            overflowX="auto"
            css={{
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
          >
            {categories.map((category) => {
              const IconComponent = category.icon;
              const isActive = activeCategory === category.id;

              return (
                <Button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  variant="ghost"
                  colorPalette={isActive ? "brand" : "gray"}
                  size="lg"
                  borderBottomWidth={isActive ? "3px" : "0"}
                  borderBottomColor={isActive ? "brand.500" : "transparent"}
                  borderRadius="0"
                  pb={2}
                  minW="fit-content"
                  fontWeight={isActive ? "semibold" : "medium"}
                  color={isActive ? "brand.600" : "gray.600"}
                  _dark={{
                    color: isActive ? "brand.400" : "gray.400",
                  }}
                >
                  <Icon fontSize="xl" mr={2}>
                    <IconComponent />
                  </Icon>
                  {category.label}
                </Button>
              );
            })}
          </HStack>

          {/* Full Tests Filters */}
          {activeCategory === "full-tests" && (
            <Flex
              mb={4}
              gap={3}
              direction={{ base: "column", md: "row" }}
              align={{ base: "stretch", md: "center" }}
              flexWrap="wrap"
            >
              {/* Search */}
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
                  placeholder="Search by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  borderRadius="md"
                />
              </Box>

              {/* Type filter */}
              <NativeSelect.Root
                size="sm"
                width={{ base: "100%", md: "160px" }}
              >
                <NativeSelect.Field
                  value={skillType}
                  onChange={handleSkillTypeChange}
                >
                  <option value="">All Types</option>
                  <option value="reading">Reading</option>
                  <option value="listening">Listening</option>
                  <option value="writing">Writing</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>

              {/* Category filter */}
              <NativeSelect.Root
                size="sm"
                width={{ base: "100%", md: "180px" }}
              >
                <NativeSelect.Field
                  value={testCategory}
                  onChange={handleTestCategoryChange}
                >
                  <option value="">All Categories</option>
                  <option value="authentic">Authentic</option>
                  <option value="pre-test">Pre-test</option>
                  <option value="cambridge books">Cambridge Books</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Flex>
          )}

          {/* Listening Part Filter */}
          {activeCategory === "listening" && (
            <Box mb={4}>
              <NativeSelect.Root size="sm" width="200px">
                <NativeSelect.Field
                  value={listeningPart}
                  onChange={handleListeningPartChange}
                >
                  <option value="">All Parts</option>
                  <option value="PART_1">Part 1</option>
                  <option value="PART_2">Part 2</option>
                  <option value="PART_3">Part 3</option>
                  <option value="PART_4">Part 4</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Box>
          )}

          {/* Reading Part Filter */}
          {activeCategory === "reading" && (
            <Box mb={4}>
              <NativeSelect.Root size="sm" width="200px">
                <NativeSelect.Field
                  value={readingPart}
                  onChange={handleReadingPartChange}
                >
                  <option value="">All Parts</option>
                  <option value="PART_1">Part 1</option>
                  <option value="PART_2">Part 2</option>
                  <option value="PART_3">Part 3</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Box>
          )}

          {/* Writing Task Filter */}
          {activeCategory === "writing" && (
            <Box mb={4}>
              <NativeSelect.Root size="sm" width="200px">
                <NativeSelect.Field
                  value={writingTask}
                  onChange={handleWritingTaskChange}
                >
                  <option value="">All Tasks</option>
                  <option value="TASK_1">Task 1</option>
                  <option value="TASK_2">Task 2</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Box>
          )}

          {/* Practice Questions Header */}
          <Flex justify="space-between" align="start" mb={4}>
            <Box>
              <Heading size="xl" mb={3}>
                Practice Tests
              </Heading>
            </Box>
          </Flex>

          {/* Questions Grid */}
          {loading ? (
            <Flex justify="center" py={12}>
              <Spinner size="xl" color="brand.500" />
            </Flex>
          ) : items.length === 0 ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator />
                <EmptyState.Title>
                  No {activeCategory} tests found
                </EmptyState.Title>
                <EmptyState.Description>
                  There are no tests available in this category at the moment.
                </EmptyState.Description>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <>
              <Grid
                templateColumns={{
                  base: "1fr",
                  md: "repeat(2, 1fr)",
                  lg: "repeat(4, 1fr)",
                }}
                gap={6}
                mt={8}
              >
                {items.map((item) => {
                  const itemId = item.id || item._id;
                  const handleClick = () => {
                    if (activeCategory === "full-tests") {
                      const skill = item.skill?.toLowerCase();
                      if (skill === "reading") {
                        router.push(`/practice/reading/test/${itemId}`);
                      } else if (skill === "listening") {
                        router.push(`/practice/listening/test/${itemId}`);
                      } else if (skill === "writing") {
                        router.push(`/practice/writing/test/${itemId}`);
                      }
                    } else if (activeCategory === "reading") {
                      router.push(`/practice/reading/${itemId}`);
                    } else if (activeCategory === "listening") {
                      router.push(`/practice/listening/${itemId}`);
                    } else if (activeCategory === "writing") {
                      router.push(`/practice/writing/${itemId}`);
                    }
                  };

                  const meta = getSkillMeta(
                    item.skill || item.type,
                    activeCategory,
                  );
                  const SkillIcon = meta.icon;

                  return (
                    <Card.Root
                      key={itemId}
                      cursor="pointer"
                      transition="all 0.2s"
                      borderRadius="2xl"
                      overflow="hidden"
                      onClick={handleClick}
                      _hover={{
                        transform: "translateY(-4px)",
                        shadow: "lg",
                      }}
                    >
                      {/* Icon banner */}
                      <Flex align="center" justify="center" bg={meta.bg} py={6}>
                        <Flex
                          align="center"
                          justify="center"
                          w="56px"
                          h="56px"
                          borderRadius="xl"
                          bg="white"
                          shadow="sm"
                        >
                          <SkillIcon size={28} color={meta.color} />
                        </Flex>
                      </Flex>

                      <Card.Body pt={3}>
                        <VStack align="stretch" gap={3}>
                          <Heading size="sm" lineClamp={2}>
                            {item.title || item.name}
                          </Heading>

                          <HStack gap={2} flexWrap="wrap">
                            <Badge
                              fontSize="xs"
                              px={2}
                              py={0.5}
                              borderRadius="full"
                              bg={meta.bg}
                              color={meta.color}
                              fontWeight="semibold"
                            >
                              {(() => {
                                const label = item.skill || item.type;
                                return label
                                  ? label.charAt(0).toUpperCase() +
                                      label.slice(1).toLowerCase()
                                  : meta.label;
                              })()}
                            </Badge>
                            {(activeCategory === "reading" ||
                              activeCategory === "listening") &&
                              item.part && (
                                <Badge
                                  colorPalette="blue"
                                  variant="subtle"
                                  fontSize="xs"
                                  px={2}
                                  py={0.5}
                                  borderRadius="full"
                                >
                                  {item.part.replace("_", " ")}
                                </Badge>
                              )}
                            {activeCategory === "writing" && item.task && (
                              <Badge
                                colorPalette="green"
                                variant="subtle"
                                fontSize="xs"
                                px={2}
                                py={0.5}
                                borderRadius="full"
                              >
                                {item.task.replace("_", " ")}
                              </Badge>
                            )}
                            {item.types?.map((type: string, idx: number) => (
                              <Badge
                                key={idx}
                                colorPalette="gray"
                                variant="subtle"
                                fontSize="xs"
                                px={2}
                                py={0.5}
                                borderRadius="full"
                              >
                                {type}
                              </Badge>
                            ))}
                          </HStack>
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
