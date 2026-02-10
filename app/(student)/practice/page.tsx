"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Heading,
  Text,
  Grid,
  Card,
  Badge,
  HStack,
  VStack,
  Button,
  Icon,
  Flex,
  Image,
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
  MessageSquare,
  ClipboardList,
} from "lucide-react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import { useAuth } from "@/contexts/AuthContext";
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
  const [testCategory, setTestCategory] = useState<string>("");
  const { user } = useAuth();
  const userName = user?.first_name
    ? `${user.first_name}`.trim()
    : user?.username || "User";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      const params = { page, limit: PAGE_SIZE, mode: "practice" as const };

      switch (activeCategory) {
        case "full-tests":
          response = await ieltsAPI.getTests({
            ...params,
            ...(testCategory && { category: testCategory }),
          });
          break;
        case "listening":
          response = await ieltsAPI.getListeningTests(params);
          break;
        case "reading":
          response = await ieltsAPI.getReadingParts({
            page,
            limit: PAGE_SIZE,
            ...(readingPart && { part: readingPart }),
          });
          break;
        case "writing":
          response = await ieltsAPI.getWritingTests(params);
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
  }, [activeCategory, page, readingPart, testCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setPage(1);
    if (category !== "reading") setReadingPart("");
    if (category !== "full-tests") setTestCategory("");
  };

  const handleTestCategoryChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setTestCategory(e.target.value);
    setPage(1);
  };

  const handleReadingPartChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReadingPart(e.target.value);
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

          {/* Full Tests Category Filter */}
          {activeCategory === "full-tests" && (
            <Box mb={4}>
              <NativeSelect.Root size="sm" width="200px">
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
                <EmptyState.Title>No {activeCategory} tests found</EmptyState.Title>
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
                {items.map((item) => (
                  <Card.Root
                    key={item.id || item._id}
                    cursor="pointer"
                    transition="all 0.2s"
                    borderRadius="2xl"
                    overflow="hidden"
                    _hover={{
                      transform: "translateY(-4px)",
                      shadow: "lg",
                    }}
                  >
                    <Card.Body>
                      <VStack align="stretch" gap={4}>
                        <Flex justify="space-between" align="start">
                          <Heading size="md" flex="1">
                            {item.title || item.name}
                          </Heading>
                          {item.total != null && (
                            <Badge
                              colorPalette="gray"
                              fontSize="sm"
                              px={2}
                              py={1}
                              borderRadius="md"
                            >
                              {item.completed || 0}/{item.total}
                            </Badge>
                          )}
                        </Flex>

                        <HStack gap={2} flexWrap="wrap">
                          {activeCategory === "reading" && item.part && (
                            <Badge
                              colorPalette="blue"
                              variant="subtle"
                              fontSize="xs"
                              px={2}
                              py={1}
                            >
                              {item.part.replace("_", " ")}
                            </Badge>
                          )}
                          {item.types?.map((type: string, idx: number) => (
                            <Badge
                              key={idx}
                              colorPalette="gray"
                              variant="subtle"
                              fontSize="xs"
                              px={2}
                              py={1}
                            >
                              {type}
                            </Badge>
                          ))}
                        </HStack>
                      </VStack>
                    </Card.Body>
                  </Card.Root>
                ))}
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
