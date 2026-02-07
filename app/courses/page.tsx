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
  Badge,
  Spinner,
  SimpleGrid,
  Image,
} from "@chakra-ui/react";
import { LuBell, LuBookOpen, LuPlay } from "react-icons/lu";
import { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { progressAPI } from "@/lib/api";
import { ProgressBar } from "@/components/ui/progress";

interface Course {
  course_id: string;
  course_name: string;
  completed: number;
  total: number;
  percentage: number;
}

export default function MyCoursesPage() {
  const { user } = useAuth();
  const userName = user?.first_name || user?.username || "Student";
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Small delay to ensure userStore is set
        await new Promise((resolve) => setTimeout(resolve, 100));

        const response = await progressAPI.getCourseProgress(user.id);

        // Handle different response formats
        if (Array.isArray(response)) {
          setCourses(response);
        } else if (response?.courses) {
          setCourses(response.courses);
        } else if (response?.data) {
          setCourses(
            Array.isArray(response.data) ? response.data : [response.data],
          );
        } else if (response?.course_id) {
          // Single course object
          setCourses([response]);
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
  }, [user]);

  const getStatusColor = (percentage: number) => {
    if (percentage === 100) return "green";
    if (percentage > 0) return "orange";
    return "gray";
  };

  const getStatusLabel = (percentage: number) => {
    if (percentage === 100) return "Completed";
    if (percentage > 0) return "In Progress";
    return "Not Started";
  };

  const getCourseIcon = (name: string) => {
    const initial = name?.charAt(0)?.toUpperCase() || "C";
    return initial;
  };

  const getCourseColor = (index: number) => {
    const colors = ["blue", "purple", "teal", "orange", "pink", "cyan"];
    return colors[index % colors.length];
  };

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
              <Icon fontSize={{ base: "lg", md: "xl" }} color="gray.600">
                <LuBell />
              </Icon>
              <HStack gap={2} display={{ base: "none", sm: "flex" }}>
                {user?.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={userName}
                    w={{ base: 8, md: 10 }}
                    h={{ base: 8, md: 10 }}
                    rounded="full"
                    objectFit="cover"
                  />
                ) : (
                  <Box
                    w={{ base: 8, md: 10 }}
                    h={{ base: 8, md: 10 }}
                    rounded="full"
                    bg="brand.300"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text
                      fontWeight="medium"
                      fontSize={{ base: "sm", md: "md" }}
                    >
                      {userName.charAt(0).toUpperCase()}
                    </Text>
                  </Box>
                )}
                <Text
                  fontWeight="medium"
                  display={{ base: "none", md: "block" }}
                >
                  {userName}
                </Text>
              </HStack>
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
                  My Courses
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
                    columns={{ base: 1, md: 2, xl: 3 }}
                    gap={{ base: 4, md: 6 }}
                  >
                    {courses.map((course, index) => (
                      <Card.Root
                        key={course.course_id}
                        overflow="hidden"
                        transition="all 0.2s"
                        _hover={{
                          transform: "translateY(-4px)",
                          shadow: "lg",
                        }}
                        cursor="pointer"
                      >
                        {/* Course Thumbnail/Header */}
                        <Box
                          h="120px"
                          bg={`${getCourseColor(index)}.500`}
                          position="relative"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text
                            fontSize="4xl"
                            fontWeight="bold"
                            color="white"
                            opacity={0.9}
                          >
                            {getCourseIcon(course.course_name)}
                          </Text>
                          <Badge
                            position="absolute"
                            top={3}
                            right={3}
                            colorPalette={getStatusColor(course.percentage)}
                            variant="solid"
                          >
                            {getStatusLabel(course.percentage)}
                          </Badge>
                        </Box>

                        <Card.Body>
                          <VStack gap={3} alignItems="stretch">
                            {/* Course Title */}
                            <Heading size="md" lineClamp={2}>
                              {course.course_name}
                            </Heading>

                            {/* Course Meta Info */}
                            <HStack gap={4} fontSize="sm" color="gray.500">
                              <HStack gap={1}>
                                <Icon>
                                  <LuPlay />
                                </Icon>
                                <Text>
                                  {course.completed}/{course.total} lessons
                                </Text>
                              </HStack>
                            </HStack>

                            {/* Progress Bar */}
                            <Box>
                              <Flex justify="space-between" mb={1}>
                                <Text fontSize="sm" color="gray.600">
                                  Progress
                                </Text>
                                <Text
                                  fontSize="sm"
                                  fontWeight="semibold"
                                  color={
                                    course.percentage === 100
                                      ? "green.500"
                                      : "gray.700"
                                  }
                                >
                                  {Math.round(course.percentage || 0)}%
                                </Text>
                              </Flex>
                              <ProgressBar
                                value={course.percentage || 0}
                                colorPalette={
                                  course.percentage === 100 ? "green" : "blue"
                                }
                                size="sm"
                              />
                            </Box>
                          </VStack>
                        </Card.Body>

                        {/* Continue Button */}
                        <Card.Footer borderTopWidth="1px" pt={3}>
                          <Box
                            as="button"
                            w="full"
                            py={2}
                            px={4}
                            bg={
                              course.percentage === 100
                                ? "green.500"
                                : "blue.500"
                            }
                            color="white"
                            rounded="md"
                            fontWeight="medium"
                            fontSize="sm"
                            textAlign="center"
                            _hover={{
                              bg:
                                course.percentage === 100
                                  ? "green.600"
                                  : "blue.600",
                            }}
                            transition="all 0.2s"
                          >
                            {course.percentage === 100
                              ? "Review Course"
                              : course.percentage > 0
                                ? "Continue Learning"
                                : "Start Course"}
                          </Box>
                        </Card.Footer>
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
