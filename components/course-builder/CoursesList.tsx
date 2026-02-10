"use client";

import {
  Box,
  Heading,
  Text,
  HStack,
  VStack,
  Input,
  Button,
  Icon,
  SimpleGrid,
  Spinner,
} from "@chakra-ui/react";
import { Plus, Trash2, BarChart3 } from "lucide-react";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ieltsCourseBuilderAPI } from "@/lib/teacher-api";
import { toaster } from "@/components/ui/toaster";
import type { Course } from "./types";
import CreateCourseModal from "./CreateCourseModal";

interface CoursesListProps {
  onOpenCourse?: (course: Course) => void;
}

export default function CoursesList({ onOpenCourse }: CoursesListProps) {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await ieltsCourseBuilderAPI.getAll();
      setCourses(d.data || d || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load courses";
      toaster.error({ title: msg });
    }
    setLoading(false);
  }, []);

  // Initial fetch on mount
  useState(() => {
    load();
    return true;
  });

  const filtered = courses.filter(
    (c) =>
      !search || (c.title || "").toLowerCase().includes(search.toLowerCase()),
  );

  const sorted = [...filtered].sort((a, b) => {
    return (
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime()
    );
  });

  const deleteCourse = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this course and all its contents?")) return;
    try {
      await ieltsCourseBuilderAPI.delete(id);
      toaster.success({ title: "Course deleted!" });
      load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete";
      toaster.error({ title: msg });
    }
  };

  const fmtDate = (d?: string) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const statusColor: Record<string, string> = {
    published: "#10b981",
    draft: "#f59e0b",
    archived: "#9ca3af",
  };

  return (
    <Box maxW="1280px" mx="auto" p={{ base: 4, md: 8 }}>
      {/* Header */}
      <HStack justify="space-between" mb={7}>
        <Heading size="2xl" fontWeight="800">
          Courses
        </Heading>
        <Button
          colorPalette="blue"
          size="sm"
          onClick={() => setShowCreate(true)}
        >
          <Icon mr={1}>
            <Plus size={16} />
          </Icon>
          Create Course
        </Button>
      </HStack>

      {/* Toolbar */}
      <Box mb={6}>
        <Input
          placeholder="Search courses…"
          fontSize="sm"
          size="sm"
          w={{ base: "full", sm: "240px" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>

      {/* Content */}
      {loading ? (
        <VStack py={16}>
          <Spinner size="lg" />
          <Text color="gray.400" fontSize="sm">
            Loading courses…
          </Text>
        </VStack>
      ) : !sorted.length ? (
        <VStack py={16} gap={3}>
          <Text fontSize="5xl">📚</Text>
          <Heading size="md" color="gray.500">
            No courses yet
          </Heading>
          <Text fontSize="sm" color="gray.400">
            Create your first course to get started
          </Text>
        </VStack>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={6}>
          {sorted.map((c) => (
            <Box
              key={c.id}
              bg="white"
              _dark={{ bg: "gray.800", borderColor: "gray.700" }}
              rounded="xl"
              overflow="hidden"
              borderWidth="1px"
              borderColor="gray.100"
              cursor="pointer"
              transition="all 0.2s"
              _hover={{
                shadow: "lg",
                transform: "translateY(-2px)",
              }}
              onClick={() => {
                if (onOpenCourse) onOpenCourse(c);
                else router.push(`/course-builder/${c.id}`);
              }}
            >
              {/* Thumbnail */}
              <Box
                h="160px"
                bg={c.thumbnail_url ? undefined : "linear-gradient(to bottom right, #3b82f6, #1d4ed8)"}
                position="relative"
                overflow="hidden"
                {...(c.thumbnail_url
                  ? {
                      bgImage: `url(${c.thumbnail_url})`,
                      bgSize: "cover",
                      bgPosition: "center",
                    }
                  : {})}
              >
                <Box
                  position="absolute"
                  w="200px"
                  h="200px"
                  bg="whiteAlpha.200"
                  rounded="full"
                  top="-60px"
                  left="-40px"
                />
                <Box
                  position="absolute"
                  w="120px"
                  h="120px"
                  bg="whiteAlpha.100"
                  rounded="full"
                  bottom="-20px"
                  right="20px"
                />
              </Box>

              {/* Body */}
              <Box px={4} py={3}>
                <HStack justify="space-between" mb={1.5}>
                  <Text
                    fontSize="xs"
                    fontWeight="700"
                    textTransform="uppercase"
                    letterSpacing="0.5px"
                    color="blue.500"
                  >
                    MOCKMEE COURSE
                  </Text>
                  <Box
                    w={2}
                    h={2}
                    rounded="full"
                    bg={statusColor[c.status || "draft"]}
                    title={c.status || "draft"}
                  />
                </HStack>

                <Text fontWeight="600" fontSize="md" mb={3} lineClamp={2}>
                  {c.title || "Untitled"}
                </Text>

                <HStack justify="space-between">
                  <Text fontSize="xs" color="gray.400">
                    {fmtDate(c.createdAt)}
                  </Text>
                  <HStack gap={1}>
                    <Box
                      as="button"
                      w={8}
                      h={8}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      rounded="md"
                      color="gray.400"
                      _hover={{ bg: "gray.100", color: "gray.600" }}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      <BarChart3 size={14} />
                    </Box>
                    <Box
                      as="button"
                      w={8}
                      h={8}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      rounded="md"
                      color="gray.400"
                      _hover={{ bg: "red.50", color: "red.500" }}
                      onClick={(e: React.MouseEvent) => deleteCourse(e, c.id)}
                    >
                      <Trash2 size={14} />
                    </Box>
                  </HStack>
                </HStack>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      )}

      {showCreate && (
        <CreateCourseModal
          onClose={() => setShowCreate(false)}
          onCreated={(c) => {
            load();
            setShowCreate(false);
            if (onOpenCourse) onOpenCourse(c);
            else router.push(`/course-builder/${c.id}`);
          }}
        />
      )}
    </Box>
  );
}
