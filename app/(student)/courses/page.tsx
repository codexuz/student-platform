"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Icon,
  HStack,
  VStack,
  Card,
  Spinner,
  SimpleGrid,
  IconButton,
} from "@chakra-ui/react";
import { LuBookOpen, LuChartNoAxesColumn as LuBarChart3 } from "react-icons/lu";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import { useAuth } from "@/contexts/AuthContext";
import { ieltsCourseAPI } from "@/lib/api";

interface Course {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function MyCoursesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await ieltsCourseAPI.getCourses();

        if (response?.data) {
          setCourses(
            Array.isArray(response.data) ? response.data : [response.data],
          );
        } else if (Array.isArray(response)) {
          setCourses(response);
        } else {
          setCourses([]);
        }
      } catch (err) {
        console.error("Failed to fetch courses:", err);
        setError("Failed to load courses. Please try again later.");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <ProtectedRoute>
      <Flex
        h="100vh"
        bg="gray.50"
        _dark={{ bg: "gray.900" }}
        direction={{ base: "column", lg: "row" }}
      >
        {/* Left Sidebar */}
        <Box display={{ base: "none", lg: "block" }}>
          <Sidebar />
        </Box>

        {/* Main Content */}
        <Box
          flex="1"
          overflowY="auto"
          pb={{ base: "16", lg: "0" }}
          ml={{ base: 0, lg: "240px" }}
        >
          {/* Header */}
          <Flex
            h={{ base: "14", md: "16" }}
            px={{ base: 4, md: 8 }}
            alignItems="center"
            justifyContent="space-between"
            bg="white"
            _dark={{ bg: "gray.800" }}
            borderBottomWidth="1px"
          >
            <Heading size={{ base: "sm", md: "md" }}>My Courses</Heading>
            <HStack gap={{ base: 2, md: 4 }}>
              <NotificationsDrawer />
            </HStack>
          </Flex>

          {/* Content */}
          <Container
            maxW="7xl"
            py={{ base: 4, md: 6, lg: 8 }}
            px={{ base: 4, md: 6 }}
          >
            <VStack gap={{ base: 4, md: 6 }} alignItems="stretch">
              {/* Page Title */}
              <Box>
                <Heading size={{ base: "lg", md: "xl" }} mb={2}>
                  Courses
                </Heading>
                <Text color="gray.600" _dark={{ color: "gray.400" }}>
                  Track your progress and continue learning
                </Text>
              </Box>

              {/* Loading State */}
              {loading && (
                <Flex
                  justify="center"
                  align="center"
                  minH="300px"
                  direction="column"
                  gap={4}
                >
                  <Spinner size="xl" color="brand.500" />
                  <Text color="gray.500">Loading your courses...</Text>
                </Flex>
              )}

              {/* Error State */}
              {!loading && error && (
                <Card.Root>
                  <Card.Body>
                    <VStack gap={4} py={8}>
                      <Icon fontSize="4xl" color="red.500">
                        <LuBookOpen />
                      </Icon>
                      <Text color="red.500" textAlign="center">
                        {error}
                      </Text>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              )}

              {/* Empty State */}
              {!loading && !error && courses.length === 0 && (
                <Card.Root>
                  <Card.Body>
                    <VStack gap={4} py={12}>
                      <Icon fontSize="5xl" color="gray.400">
                        <LuBookOpen />
                      </Icon>
                      <Heading size="md" color="gray.600">
                        No courses yet
                      </Heading>
                      <Text color="gray.500" textAlign="center" maxW="md">
                        You haven&apos;t enrolled in any courses yet. Your
                        enrolled courses will appear here once you join them.
                      </Text>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              )}

              {/* Courses Grid */}
              {!loading && !error && courses.length > 0 && (
                <>
                  <SimpleGrid
                    columns={{ base: 1, md: 2, lg: 3, xl: 4 }}
                    gap={{ base: 4, md: 5 }}
                  >
                    {courses.map((course, index) => (
                      <Card.Root
                        key={course.id}
                        overflow="hidden"
                        transition="all 0.2s"
                        _hover={{
                          transform: "translateY(-2px)",
                          shadow: "md",
                        }}
                        cursor="pointer"
                        borderRadius="xl"
                        maxW="320px"
                        onClick={() => router.push(`/courses/${course.id}`)}
                      >
                        {/* Course Gradient Header */}
                        <Box
                          h="140px"
                          bgGradient="to-br"
                          gradientFrom="blue.400"
                          gradientTo="blue.600"
                          position="relative"
                          borderTopRadius="xl"
                        />

                        <Card.Body p={4}>
                          <VStack gap={3} alignItems="stretch">
                            {/* Mini Course Badge with Icon */}
                            <HStack justify="space-between" alignItems="center">
                              <Icon fontSize="md" color="gray.400">
                                <LuBookOpen />
                              </Icon>
                            </HStack>

                            {/* Course Title */}
                            <Heading
                              size="md"
                              lineClamp={2}
                              fontWeight="semibold"
                              color="gray.900"
                              _dark={{ color: "gray.100" }}
                            >
                              {course.title}
                            </Heading>

                            {course.description && (
                              <Text
                                fontSize="sm"
                                color="gray.600"
                                _dark={{ color: "gray.400" }}
                                lineClamp={2}
                              >
                                {course.description}
                              </Text>
                            )}

                            {/* Date and Icons Footer */}
                            <Flex
                              justify="space-between"
                              alignItems="center"
                              pt={2}
                            >
                              <Text
                                fontSize="sm"
                                color="gray.500"
                                _dark={{ color: "gray.400" }}
                              >
                                {new Date(course.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </Text>
                              <HStack gap={1}>
                                <IconButton
                                  variant="ghost"
                                  size="sm"
                                  aria-label="View stats"
                                >
                                  <LuBarChart3 />
                                </IconButton>
                              </HStack>
                            </Flex>
                          </VStack>
                        </Card.Body>
                      </Card.Root>
                    ))}
                  </SimpleGrid>
                </>
              )}
            </VStack>
          </Container>
        </Box>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </Flex>
    </ProtectedRoute>
  );
}
