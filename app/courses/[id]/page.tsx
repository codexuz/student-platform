"use client";

import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  IconButton,
  Spinner,
} from "@chakra-ui/react";
import {
  LuChevronLeft,
  LuChevronDown,
  LuChevronRight,
  LuX,
  LuCircle,
  LuVideo,
  LuFileText,
  LuBookOpen,
} from "react-icons/lu";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ieltsCourseAPI } from "@/lib/api";

// ── Types ──────────────────────────────────────────────

interface Section {
  id: string;
  course_id: string;
  title: string;
  position: number;
  course?: {
    id: string;
    title: string;
    description: string | null;
  };
}

interface Lesson {
  id: string;
  section_id: string;
  title: string;
  position: number;
  lesson_type: string;
  content_url: string | null;
  content_text: string | null;
  duration_seconds: number | null;
  section?: Section;
}

interface SectionWithLessons extends Section {
  lessons: Lesson[];
  expanded: boolean;
}

// ── Helpers ────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    if (u.hostname === "www.youtube.com" || u.hostname === "youtube.com") {
      return u.searchParams.get("v");
    }
  } catch {
    /* ignore */
  }
  return null;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function parseContentText(raw: string | null): string {
  if (!raw) return "";
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      return arr
        .filter(
          (b: { type?: string; content?: string }) =>
            b.type === "text" && b.content,
        )
        .map((b: { content?: string }) => b.content)
        .join("\n\n");
    }
  } catch {
    /* not JSON, return as-is */
  }
  return raw;
}

function getLessonIcon(type: string) {
  switch (type) {
    case "video":
      return LuVideo;
    case "text":
      return LuFileText;
    default:
      return LuBookOpen;
  }
}

// ── Component ──────────────────────────────────────────

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [courseTitle, setCourseTitle] = useState("");
  const [sections, setSections] = useState<SectionWithLessons[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "notes">("overview");

  // ── Data fetching ──

  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch sections
      const sectionsRes = await ieltsCourseAPI.getSections(courseId);
      const sectionsData: Section[] = sectionsRes?.data ?? [];

      // Get course title from the first section's course relation
      if (sectionsData.length > 0 && sectionsData[0].course) {
        setCourseTitle(sectionsData[0].course.title);
      } else {
        // Fallback: fetch course directly
        try {
          const courseRes = await ieltsCourseAPI.getCourseById(courseId);
          setCourseTitle(courseRes?.title ?? "Course");
        } catch {
          setCourseTitle("Course");
        }
      }

      // Fetch lessons for each section in parallel
      const sectionsWithLessons: SectionWithLessons[] = await Promise.all(
        sectionsData
          .sort((a, b) => a.position - b.position)
          .map(async (section, idx) => {
            try {
              const lessonsRes = await ieltsCourseAPI.getLessons(section.id);
              const lessons: Lesson[] = (lessonsRes?.data ?? []).sort(
                (a: Lesson, b: Lesson) => a.position - b.position,
              );
              return { ...section, lessons, expanded: idx === 0 };
            } catch {
              return { ...section, lessons: [], expanded: idx === 0 };
            }
          }),
      );

      setSections(sectionsWithLessons);

      // Auto-select first lesson of first section
      const firstSection = sectionsWithLessons[0];
      if (firstSection?.lessons?.length > 0) {
        setActiveLesson(firstSection.lessons[0]);
      }
    } catch (err) {
      console.error("Failed to load course:", err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) fetchCourseData();
  }, [courseId, fetchCourseData]);

  // ── Handlers ──

  const toggleSection = (sectionId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, expanded: !s.expanded } : s,
      ),
    );
  };

  const selectLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setActiveTab("overview");
    // On mobile, close sidebar after selecting
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  // ── Computed ──

  const totalLessons = sections.reduce((a, s) => a + s.lessons.length, 0);
  const videoId = activeLesson?.content_url
    ? extractYouTubeId(activeLesson.content_url)
    : null;
  const contentText = activeLesson
    ? parseContentText(activeLesson.content_text)
    : "";

  // ── Loading ──

  if (loading) {
    return (
      <ProtectedRoute>
        <Flex
          h="100vh"
          align="center"
          justify="center"
          bg="gray.50"
          _dark={{ bg: "gray.900" }}
        >
          <VStack gap={4}>
            <Spinner size="xl" color="brand.500" />
            <Text color="gray.500">Loading course…</Text>
          </VStack>
        </Flex>
      </ProtectedRoute>
    );
  }

  // ── Render ──

  return (
    <ProtectedRoute>
      <Flex h="100vh" direction="column" bg="white" _dark={{ bg: "gray.900" }}>
        {/* ── Top Header ── */}
        <Flex
          h="50px"
          flexShrink={0}
          align="center"
          justify="space-between"
          px={4}
          bg="brand.500"
          color="white"
        >
          {/* Left: back + title */}
          <HStack gap={2} flex={1} minW={0}>
            <IconButton
              aria-label="Back"
              variant="ghost"
              color="white"
              size="sm"
              _hover={{ bg: "whiteAlpha.200" }}
              onClick={() => router.push("/courses")}
            >
              <LuChevronLeft />
            </IconButton>
            <Text
              fontWeight="semibold"
              fontSize={{ base: "sm", md: "md" }}
              truncate
            >
              {courseTitle}
            </Text>
          </HStack>

          {/* Right: progress + close */}
          <HStack gap={3} flexShrink={0}>
            <Text fontSize="sm" display={{ base: "none", md: "block" }}>
              Your Progress: 0 of {totalLessons} (0%)
            </Text>
            <IconButton
              aria-label="Close"
              variant="ghost"
              color="white"
              size="sm"
              _hover={{ bg: "whiteAlpha.200" }}
              onClick={() => router.push("/courses")}
            >
              <LuX />
            </IconButton>
          </HStack>
        </Flex>

        {/* ── Body ── */}
        <Flex flex={1} overflow="hidden">
          {/* ── Left Sidebar ── */}
          {sidebarOpen && (
            <Box
              w={{ base: "100%", lg: "340px" }}
              flexShrink={0}
              borderRightWidth="1px"
              overflowY="auto"
              bg="white"
              _dark={{ bg: "gray.800" }}
              position={{ base: "absolute", lg: "relative" }}
              zIndex={{ base: 20, lg: "auto" }}
              h={{ base: "calc(100vh - 50px)", lg: "auto" }}
            >
              {/* Sidebar header */}
              <Flex
                px={4}
                py={3}
                align="center"
                justify="space-between"
                borderBottomWidth="1px"
              >
                <Text fontWeight="bold" fontSize="md">
                  Course Content
                </Text>
                <IconButton
                  aria-label="Close sidebar"
                  variant="ghost"
                  size="sm"
                  display={{ base: "flex", lg: "none" }}
                  onClick={() => setSidebarOpen(false)}
                >
                  <LuX />
                </IconButton>
              </Flex>

              {/* Sections */}
              <VStack gap={0} align="stretch">
                {sections.map((section) => (
                  <Box key={section.id}>
                    {/* Section header */}
                    <Flex
                      px={4}
                      py={3}
                      align="center"
                      justify="space-between"
                      cursor="pointer"
                      borderBottomWidth="1px"
                      bg={section.expanded ? "brand.50" : "transparent"}
                      _dark={{
                        bg: section.expanded ? "whiteAlpha.100" : "transparent",
                      }}
                      _hover={{ bg: "gray.50", _dark: { bg: "whiteAlpha.50" } }}
                      onClick={() => toggleSection(section.id)}
                      borderLeftWidth="3px"
                      borderLeftColor={
                        section.expanded ? "brand.500" : "transparent"
                      }
                    >
                      <VStack gap={0} align="start" flex={1} minW={0}>
                        <Text
                          fontWeight="semibold"
                          fontSize="sm"
                          color={section.expanded ? "brand.600" : "gray.800"}
                          _dark={{
                            color: section.expanded ? "brand.300" : "gray.200",
                          }}
                        >
                          {section.title}
                        </Text>
                      </VStack>
                      <HStack gap={2} flexShrink={0}>
                        <Text fontSize="xs" color="gray.500">
                          0/{section.lessons.length}
                        </Text>
                        <Icon
                          fontSize="md"
                          color="gray.500"
                          transform={
                            section.expanded ? "rotate(0deg)" : "rotate(-90deg)"
                          }
                          transition="transform 0.2s"
                        >
                          <LuChevronDown />
                        </Icon>
                      </HStack>
                    </Flex>

                    {/* Lessons list */}
                    {section.expanded && (
                      <VStack gap={0} align="stretch">
                        {section.lessons.map((lesson) => {
                          const isActive = activeLesson?.id === lesson.id;
                          const LessonIcon = getLessonIcon(lesson.lesson_type);

                          return (
                            <Flex
                              key={lesson.id}
                              px={4}
                              py={2.5}
                              pl={6}
                              align="center"
                              gap={3}
                              cursor="pointer"
                              bg={isActive ? "blue.50" : "transparent"}
                              _dark={{
                                bg: isActive ? "whiteAlpha.100" : "transparent",
                              }}
                              _hover={{
                                bg: isActive ? "blue.50" : "gray.50",
                                _dark: {
                                  bg: isActive
                                    ? "whiteAlpha.100"
                                    : "whiteAlpha.50",
                                },
                              }}
                              borderBottomWidth="1px"
                              borderColor="gray.100"
                              onClick={() => selectLesson(lesson)}
                            >
                              {/* Lesson type icon */}
                              <Icon
                                fontSize="md"
                                color={isActive ? "brand.500" : "gray.400"}
                                flexShrink={0}
                              >
                                <LessonIcon />
                              </Icon>

                              {/* Lesson title + duration */}
                              <VStack gap={0} align="start" flex={1} minW={0}>
                                <Text
                                  fontSize="sm"
                                  fontWeight={isActive ? "semibold" : "normal"}
                                  color={isActive ? "brand.600" : "gray.700"}
                                  _dark={{
                                    color: isActive ? "brand.300" : "gray.300",
                                  }}
                                  lineClamp={2}
                                >
                                  {lesson.title}
                                </Text>
                                {lesson.duration_seconds != null &&
                                  lesson.duration_seconds > 0 && (
                                    <Text fontSize="xs" color="gray.400">
                                      {formatDuration(lesson.duration_seconds)}
                                    </Text>
                                  )}
                              </VStack>

                              {/* Completion circle */}
                              <Icon
                                fontSize="lg"
                                color="gray.300"
                                flexShrink={0}
                              >
                                <LuCircle />
                              </Icon>
                            </Flex>
                          );
                        })}
                      </VStack>
                    )}
                  </Box>
                ))}
              </VStack>
            </Box>
          )}

          {/* ── Main Content ── */}
          <Box flex={1} overflowY="auto">
            {/* Toggle sidebar button (when sidebar hidden on mobile) */}
            {!sidebarOpen && (
              <Flex
                display={{ base: "flex", lg: "none" }}
                px={4}
                py={2}
                borderBottomWidth="1px"
              >
                <IconButton
                  aria-label="Open sidebar"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                >
                  <LuChevronRight />
                </IconButton>
              </Flex>
            )}

            {activeLesson ? (
              <Box>
                {/* Tabs: Overview / Notes */}
                <Flex
                  borderBottomWidth="1px"
                  px={{ base: 4, md: 8 }}
                  align="center"
                  justify="space-between"
                >
                  <HStack gap={0}>
                    <Box
                      as="button"
                      px={4}
                      py={3}
                      fontSize="sm"
                      fontWeight="semibold"
                      borderBottomWidth="2px"
                      borderColor={
                        activeTab === "overview" ? "brand.500" : "transparent"
                      }
                      color={
                        activeTab === "overview" ? "brand.600" : "gray.500"
                      }
                      _dark={{
                        color:
                          activeTab === "overview" ? "brand.300" : "gray.400",
                      }}
                      onClick={() => setActiveTab("overview")}
                    >
                      <HStack gap={1.5}>
                        <Icon fontSize="sm">
                          <LuBookOpen />
                        </Icon>
                        <Text>Overview</Text>
                      </HStack>
                    </Box>
                    <Box
                      as="button"
                      px={4}
                      py={3}
                      fontSize="sm"
                      fontWeight="semibold"
                      borderBottomWidth="2px"
                      borderColor={
                        activeTab === "notes" ? "brand.500" : "transparent"
                      }
                      color={activeTab === "notes" ? "brand.600" : "gray.500"}
                      _dark={{
                        color: activeTab === "notes" ? "brand.300" : "gray.400",
                      }}
                      onClick={() => setActiveTab("notes")}
                    >
                      <HStack gap={1.5}>
                        <Icon fontSize="sm">
                          <LuFileText />
                        </Icon>
                        <Text>Notes</Text>
                      </HStack>
                    </Box>
                  </HStack>
                </Flex>

                {/* Tab content */}
                {activeTab === "overview" && (
                  <Box px={{ base: 4, md: 8 }} py={6}>
                    <Box maxW="860px" mx="auto">
                      {/* Video player */}
                      {videoId && (
                        <Box
                          mb={6}
                          borderRadius="lg"
                          overflow="hidden"
                          position="relative"
                          pb="56.25%" /* 16:9 */
                          h={0}
                        >
                          <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title={activeLesson.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              border: "none",
                            }}
                          />
                        </Box>
                      )}

                      {/* Lesson title */}
                      <Heading
                        size={{ base: "md", md: "lg" }}
                        mb={4}
                        color="gray.900"
                        _dark={{ color: "gray.100" }}
                      >
                        {activeLesson.title}
                      </Heading>

                      {/* Text content */}
                      {contentText && (
                        <Text
                          color="gray.700"
                          _dark={{ color: "gray.300" }}
                          lineHeight="tall"
                          whiteSpace="pre-wrap"
                          fontSize={{ base: "sm", md: "md" }}
                        >
                          {contentText}
                        </Text>
                      )}
                    </Box>

                    {/* Empty state when no video and no text */}
                    {!videoId && !contentText && (
                      <Flex
                        justify="center"
                        align="center"
                        minH="200px"
                        direction="column"
                        gap={3}
                      >
                        <Icon fontSize="4xl" color="gray.300">
                          <LuBookOpen />
                        </Icon>
                        <Text color="gray.400" fontSize="sm">
                          No content available for this lesson yet.
                        </Text>
                      </Flex>
                    )}
                  </Box>
                )}

                {activeTab === "notes" && (
                  <Box px={{ base: 4, md: 8 }} py={6}>
                    <Flex
                      justify="center"
                      align="center"
                      minH="200px"
                      direction="column"
                      gap={3}
                    >
                      <Icon fontSize="4xl" color="gray.300">
                        <LuFileText />
                      </Icon>
                      <Text color="gray.400" fontSize="sm">
                        Notes feature coming soon.
                      </Text>
                    </Flex>
                  </Box>
                )}
              </Box>
            ) : (
              /* No lesson selected */
              <Flex
                h="100%"
                align="center"
                justify="center"
                direction="column"
                gap={3}
              >
                <Icon fontSize="5xl" color="gray.300">
                  <LuBookOpen />
                </Icon>
                <Text color="gray.500">Select a lesson to get started</Text>
              </Flex>
            )}
          </Box>
        </Flex>
      </Flex>
    </ProtectedRoute>
  );
}
