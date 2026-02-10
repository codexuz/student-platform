"use client";

import { useState, useCallback, useEffect } from "react";
import { Box, HStack, Button, Text, Spinner, VStack } from "@chakra-ui/react";
import { ArrowLeft, BookOpen, MessageSquareMore, Settings } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import TOCSidebar from "@/components/course-builder/TOCSidebar";
import ContentEditor from "@/components/course-builder/ContentEditor";
import BlockPalette from "@/components/course-builder/BlockPalette";
import QuizzesTab from "@/components/course-builder/QuizzesTab";
import SettingsTab from "@/components/course-builder/SettingsTab";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  ieltsCourseBuilderAPI,
  ieltsCourseSectionsAPI,
  ieltsLessonsAPI,
} from "@/lib/teacher-api";
import { toaster } from "@/components/ui/toaster";
import type {
  Course,
  Section,
  Lesson,
  BlockType,
} from "@/components/course-builder/types";

type EditorTab = "content" | "quizzes" | "settings";

export default function CourseEditorPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>("content");
  const [loading, setLoading] = useState(true);

  /* ── Load course info ── */
  useEffect(() => {
    if (!courseId) return;
    ieltsCourseBuilderAPI
      .getById(courseId)
      .then((res: Record<string, unknown>) => {
        const course = (res?.data as Course) ?? (res as unknown as Course);
        setCourse(course);
      })
      .catch(() => {
        toaster.error({ title: "Course not found" });
        router.push("/course-builder");
      });
  }, [courseId, router]);

  /* ── Load sections + lessons ── */
  const loadSections = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await ieltsCourseSectionsAPI.getAll(id);
      const secs: Section[] = (res.data || res || []).sort(
        (a: Section, b: Section) => a.position - b.position,
      );

      const withLessons = await Promise.all(
        secs.map(async (sec) => {
          try {
            const lr = await ieltsLessonsAPI.getAll(sec.id);
            const lessons: Lesson[] = (lr.data || lr || []).sort(
              (a: Lesson, b: Lesson) => a.position - b.position,
            );
            return { ...sec, lessons };
          } catch {
            return { ...sec, lessons: [] };
          }
        }),
      );
      setSections(withLessons);

      // Auto-select first lesson if none selected
      const allLessons = withLessons.flatMap((s) => s.lessons || []);
      if (allLessons.length) {
        setActiveLessonId((prev) => prev ?? allLessons[0].id);
      }
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Failed to load course structure";
      toaster.error({ title: msg });
    }
    setLoading(false);
  }, []);

  const [sectionsLoaded] = useState(() => {
    if (courseId) loadSections(courseId);
    return true;
  });
  void sectionsLoaded;

  /* ── Section CRUD ── */
  const addSection = async () => {
    try {
      await ieltsCourseSectionsAPI.create({
        course_id: courseId,
        title: `Section ${sections.length + 1}`,
        position: sections.length + 1,
      });
      toaster.success({ title: "Section added!" });
      loadSections(courseId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to add section";
      toaster.error({ title: msg });
    }
  };

  const renameSection = async (id: string, title: string) => {
    try {
      await ieltsCourseSectionsAPI.update(id, { title });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to rename";
      toaster.error({ title: msg });
    }
  };

  const deleteSection = async (id: string) => {
    try {
      await ieltsCourseSectionsAPI.delete(id);
      toaster.success({ title: "Section deleted!" });
      loadSections(courseId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to delete section";
      toaster.error({ title: msg });
    }
  };

  /* ── Lesson CRUD ── */
  const addLesson = async (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    const position = (section?.lessons?.length || 0) + 1;
    try {
      const res = await ieltsLessonsAPI.create({
        section_id: sectionId,
        title: `Page ${position}`,
        position,
      });
      toaster.success({ title: "Page added!" });
      await loadSections(courseId);
      setActiveLessonId(res.id || res.data?.id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to add page";
      toaster.error({ title: msg });
    }
  };

  const deleteLesson = async (id: string) => {
    try {
      await ieltsLessonsAPI.delete(id);
      toaster.success({ title: "Page deleted!" });
      if (activeLessonId === id) setActiveLessonId(null);
      loadSections(courseId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to delete page";
      toaster.error({ title: msg });
    }
  };

  const reorderLessons = async (sectionId: string, lessons: Lesson[]) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, lessons } : s)),
    );
    try {
      await Promise.all(
        lessons.map((l) =>
          ieltsLessonsAPI.update(l.id, { position: l.position }),
        ),
      );
    } catch {
      // Silently fail, user can retry
    }
  };

  const saveLesson = async (
    lessonId: string,
    data: Record<string, unknown>,
  ) => {
    try {
      await ieltsLessonsAPI.update(lessonId, data);
      setSections((prev) =>
        prev.map((s) => ({
          ...s,
          lessons: (s.lessons || []).map((l) =>
            l.id === lessonId ? { ...l, ...data } : l,
          ),
        })),
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Auto-save failed";
      toaster.error({ title: msg });
    }
  };

  const handleAddBlock = (type: BlockType) => {
    const win = window as Window & {
      __addBlockFromPalette?: (type: BlockType) => void;
    };
    if (win.__addBlockFromPalette) {
      win.__addBlockFromPalette(type);
    }
  };

  /* ── Find active lesson ── */
  const activeLesson = sections
    .flatMap((s) => s.lessons || [])
    .find((l) => l.id === activeLessonId);

  /* ── Render ── */
  return (
    <ProtectedRoute>
      <Box h="100vh" display="flex" flexDirection="column" overflow="hidden">
        {/* Top bar */}
        <Box
          px={4}
          py={2.5}
          borderBottomWidth="1px"
          bg="white"
          _dark={{ bg: "gray.800" }}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flexShrink={0}
        >
          <HStack gap={3}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/course-builder")}
            >
              <ArrowLeft size={16} />
            </Button>
            <Text fontWeight="700" fontSize="md" lineClamp={1}>
              {course?.title || "Loading…"}
            </Text>
          </HStack>

          <HStack gap={1}>
            <TabBtn
              icon={<BookOpen size={15} />}
              label="Content"
              active={activeTab === "content"}
              onClick={() => setActiveTab("content")}
            />
            <TabBtn
              icon={<MessageSquareMore size={15} />}
              label="Quizzes"
              active={activeTab === "quizzes"}
              onClick={() => setActiveTab("quizzes")}
            />
            <TabBtn
              icon={<Settings size={15} />}
              label="Settings"
              active={activeTab === "settings"}
              onClick={() => setActiveTab("settings")}
            />
          </HStack>
        </Box>

        {/* Body */}
        {loading ? (
          <VStack flex={1} justify="center">
            <Spinner size="lg" />
            <Text color="gray.400" fontSize="sm">
              Loading course structure…
            </Text>
          </VStack>
        ) : activeTab === "quizzes" ? (
          <QuizzesTab courseId={courseId} sections={sections} />
        ) : activeTab === "settings" && course ? (
          <SettingsTab
            course={course}
            onUpdate={(updated) => setCourse(updated)}
          />
        ) : (
          <Box flex={1} display="flex" overflow="hidden">
            {/* TOC sidebar */}
            <Box display={{ base: "none", md: "block" }}>
              <TOCSidebar
                sections={sections}
                activeLessonId={activeLessonId}
                onSelectLesson={setActiveLessonId}
                onAddSection={addSection}
                onRenameSection={renameSection}
                onDeleteSection={deleteSection}
                onAddLesson={addLesson}
                onDeleteLesson={deleteLesson}
                onReorderLessons={reorderLessons}
              />
            </Box>

            {/* Content editor area */}
            {activeLesson ? (
              <ContentEditor lesson={activeLesson} onSave={saveLesson} />
            ) : (
              <VStack flex={1} justify="center" gap={3}>
                <Text fontSize="5xl">📄</Text>
                <Text fontWeight="600" color="gray.500">
                  Select a page to start editing
                </Text>
                <Text fontSize="sm" color="gray.400">
                  Choose a page from the sidebar or add a new one
                </Text>
              </VStack>
            )}

            {/* Block palette */}
            <Box display={{ base: "none", lg: "block" }}>
              <BlockPalette
                onAddBlock={handleAddBlock}
                hasActiveLesson={!!activeLesson}
              />
            </Box>
          </Box>
        )}
      </Box>
    </ProtectedRoute>
  );
}

/* ── Tab button ── */
function TabBtn({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant={active ? "solid" : "ghost"}
      colorPalette={active ? "blue" : "gray"}
      size="sm"
      onClick={onClick}
    >
      {icon}
      <Text ml={1} display={{ base: "none", sm: "inline" }}>
        {label}
      </Text>
    </Button>
  );
}
