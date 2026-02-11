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
  LuFileText,
  LuBookOpen,
} from "react-icons/lu";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LessonQuiz from "@/components/LessonQuiz";
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

interface ContentBlock {
  id: number | string;
  type: string;
  content: string;
}

interface VideoTrack {
  src: string;
  lang: string;
  label: string;
}

interface Lesson {
  id: string;
  section_id: string;
  title: string;
  position: number;
  content: ContentBlock[] | null;
  duration_seconds: number | null;
  tracks?: VideoTrack[];
  section?: Section;
}

interface SectionWithLessons extends Section {
  lessons: Lesson[];
  expanded: boolean;
}

// ── Helpers ────────────────────────────────────────────

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function hasContent(blocks: ContentBlock[] | null): boolean {
  return !!blocks && blocks.length > 0 && blocks.some((b) => b.content);
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
  const lessonHasContent = activeLesson
    ? hasContent(activeLesson.content)
    : false;

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
                          const LessonIcon = hasContent(lesson.content)
                            ? LuFileText
                            : LuBookOpen;

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
                      {/* Lesson title */}
                      <Heading
                        size={{ base: "md", md: "lg" }}
                        mb={6}
                        color="gray.900"
                        _dark={{ color: "gray.100" }}
                      >
                        {activeLesson.title}
                      </Heading>

                      {/* Render content blocks */}
                      {lessonHasContent ? (
                        <VStack gap={4} align="stretch">
                          {activeLesson.content!.map((block) => (
                            <ContentBlockView
                              key={block.id}
                              block={block}
                              tracks={
                                block.type === "video"
                                  ? activeLesson.tracks
                                  : undefined
                              }
                            />
                          ))}
                        </VStack>
                      ) : (
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

                      {/* Quizzes for this lesson */}
                      <Box mb={10}>
                        <LessonQuiz lessonId={activeLesson.id} />
                      </Box>
                    </Box>
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

// ── Content Block Renderer ─────────────────────────────

function ContentBlockView({
  block,
  tracks,
}: {
  block: ContentBlock;
  tracks?: VideoTrack[];
}) {
  switch (block.type) {
    case "heading":
      return (
        <Heading
          size="md"
          color="gray.900"
          _dark={{ color: "gray.100" }}
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      );
    case "paragraph":
      return (
        <Box
          color="gray.700"
          _dark={{ color: "gray.300" }}
          lineHeight="tall"
          fontSize={{ base: "sm", md: "md" }}
          css={{
            "& p": { margin: 0 },
            "& a": {
              color: "var(--chakra-colors-brand-500)",
              textDecoration: "underline",
            },
          }}
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      );
    case "document":
      return (
        <a
          href={block.content}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none" }}
        >
          <Box
            display="flex"
            alignItems="center"
            gap={3}
            p={4}
            border="1px solid"
            borderColor="gray.200"
            _dark={{ borderColor: "gray.600" }}
            borderRadius="lg"
            _hover={{ bg: "gray.50", _dark: { bg: "whiteAlpha.50" } }}
            transition="all 0.15s"
            cursor="pointer"
          >
            <Text fontSize="2xl">📄</Text>
            <Box flex={1} minW={0}>
              <Text
                fontSize="sm"
                fontWeight="600"
                color="gray.700"
                _dark={{ color: "gray.200" }}
              >
                {decodeURIComponent(
                  block.content.split("/").pop() || "Document",
                )}
              </Text>
              <Text fontSize="xs" color="gray.400">
                Click to download
              </Text>
            </Box>
          </Box>
        </a>
      );
    case "image":
      return (
        <Box borderRadius="lg" overflow="hidden" position="relative" w="100%">
          <Image
            src={block.content}
            alt=""
            width={860}
            height={480}
            style={{ width: "100%", height: "auto", display: "block" }}
            unoptimized
          />
        </Box>
      );
    case "video": {
      const ytId = extractVideoId(block.content);
      if (ytId) {
        return (
          <Box
            borderRadius="lg"
            overflow="hidden"
            position="relative"
            pb="56.25%"
            h={0}
            bg="black"
          >
            <iframe
              src={`https://www.youtube.com/embed/${ytId}`}
              title="Video"
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
        );
      }
      return (
        <Box borderRadius="lg" overflow="hidden">
          <video
            src={block.content}
            controls
            crossOrigin="anonymous"
            style={{ width: "100%" }}
          >
            {(tracks || []).map((t) => (
              <track
                key={t.lang}
                src={t.src}
                kind="subtitles"
                srcLang={t.lang}
                label={t.label}
              />
            ))}
          </video>
        </Box>
      );
    }
    case "embed": {
      const embedUrl = toYouTubeEmbed(block.content);
      if (!embedUrl) return null;
      return (
        <Box
          borderRadius="lg"
          overflow="hidden"
          position="relative"
          pb="56.25%"
          h={0}
          bg="black"
        >
          <iframe
            src={embedUrl}
            title="YouTube video"
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
      );
    }
    default:
      return (
        <Box
          color="gray.700"
          _dark={{ color: "gray.300" }}
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      );
  }
}

function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    if (u.hostname === "www.youtube.com" || u.hostname === "youtube.com") {
      return u.searchParams.get("v");
    }
  } catch {
    /* not a URL */
  }
  return null;
}

function toYouTubeEmbed(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (
      (u.hostname === "www.youtube.com" || u.hostname === "youtube.com") &&
      u.pathname.startsWith("/embed/")
    ) {
      return url;
    }
    if (u.hostname === "www.youtube.com" || u.hostname === "youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    /* invalid URL */
  }
  return null;
}
