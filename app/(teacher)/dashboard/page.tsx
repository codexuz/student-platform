"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  HStack,
  VStack,
  Card,
  Icon,
  SimpleGrid,
  Spinner,
} from "@chakra-ui/react";
import {
  LuUsers,
  LuBookOpen,
  LuClipboardCheck,
  LuCalendar,
} from "react-icons/lu";
import { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { groupsAPI, groupStudentsAPI } from "@/lib/teacher-api";

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const userName = user?.first_name || user?.username || "Teacher";
  const [loading, setLoading] = useState(true);
  const [groupCount, setGroupCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [groups, students] = await Promise.all([
          groupsAPI.getByTeacherId(user.id).catch(() => []),
          groupStudentsAPI
            .getTeacherStudentCount(user.id)
            .catch(() => ({ count: 0 })),
        ]);

        setGroupCount(Array.isArray(groups) ? groups.length : 0);
        setStudentCount(students?.count || 0);
      } catch (error) {
        console.error("Failed to fetch teacher dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <ProtectedRoute>
      <Flex
        h="100vh"
        bg="gray.50"
        _dark={{ bg: "gray.900" }}
        direction={{ base: "column", lg: "row" }}
      >
        <Box display={{ base: "none", lg: "block" }}>
          <Sidebar />
        </Box>

        <Box
          flex="1"
          overflowY="auto"
          pb={{ base: "16", lg: "0" }}
          ml={{ base: 0, lg: "240px" }}
        >
          <Flex
            h={{ base: "14", md: "16" }}
            px={{ base: 4, md: 8 }}
            alignItems="center"
            justifyContent="space-between"
            bg="white"
            _dark={{ bg: "gray.800" }}
            borderBottomWidth="1px"
          >
            <Heading size={{ base: "sm", md: "md" }}>Teacher Dashboard</Heading>
            <HStack gap={{ base: 2, md: 4 }}>
              <NotificationsDrawer />
            </HStack>
          </Flex>

          <Container
            maxW="7xl"
            py={{ base: 4, md: 6, lg: 8 }}
            px={{ base: 4, md: 6 }}
          >
            <VStack gap={{ base: 4, md: 6, lg: 8 }} alignItems="stretch">
              <Box>
                <Heading size={{ base: "xl", md: "2xl" }} mb={2}>
                  {getGreeting()}, {userName.split(" ")[0]}! 👋
                </Heading>
                <Text
                  fontSize={{ base: "md", md: "lg" }}
                  color="gray.600"
                  _dark={{ color: "gray.400" }}
                >
                  Welcome to your teaching dashboard
                </Text>
              </Box>

              {loading ? (
                <Flex justify="center" align="center" minH="200px">
                  <Spinner size="xl" color="brand.500" />
                </Flex>
              ) : (
                <SimpleGrid
                  columns={{ base: 1, sm: 2, md: 4 }}
                  gap={{ base: 3, md: 4 }}
                >
                  <Card.Root borderRadius="2xl">
                    <Card.Body p={{ base: 4, md: 6 }}>
                      <VStack gap={2} alignItems="flex-start">
                        <HStack justify="space-between" w="full">
                          <Text
                            fontSize={{ base: "xs", md: "sm" }}
                            color="gray.600"
                          >
                            My Groups
                          </Text>
                          <Icon
                            color="blue.500"
                            fontSize={{ base: "md", md: "lg" }}
                          >
                            <LuUsers />
                          </Icon>
                        </HStack>
                        <Heading size={{ base: "xl", md: "2xl" }}>
                          {groupCount}
                        </Heading>
                      </VStack>
                    </Card.Body>
                  </Card.Root>

                  <Card.Root borderRadius="2xl">
                    <Card.Body p={{ base: 4, md: 6 }}>
                      <VStack gap={2} alignItems="flex-start">
                        <HStack justify="space-between" w="full">
                          <Text
                            fontSize={{ base: "xs", md: "sm" }}
                            color="gray.600"
                          >
                            Total Students
                          </Text>
                          <Icon
                            color="green.500"
                            fontSize={{ base: "md", md: "lg" }}
                          >
                            <LuUsers />
                          </Icon>
                        </HStack>
                        <Heading size={{ base: "xl", md: "2xl" }}>
                          {studentCount}
                        </Heading>
                      </VStack>
                    </Card.Body>
                  </Card.Root>

                  <Card.Root borderRadius="2xl">
                    <Card.Body p={{ base: 4, md: 6 }}>
                      <VStack gap={2} alignItems="flex-start">
                        <HStack justify="space-between" w="full">
                          <Text
                            fontSize={{ base: "xs", md: "sm" }}
                            color="gray.600"
                          >
                            Courses
                          </Text>
                          <Icon
                            color="purple.500"
                            fontSize={{ base: "md", md: "lg" }}
                          >
                            <LuBookOpen />
                          </Icon>
                        </HStack>
                        <Heading size={{ base: "xl", md: "2xl" }}>—</Heading>
                      </VStack>
                    </Card.Body>
                  </Card.Root>

                  <Card.Root borderRadius="2xl">
                    <Card.Body p={{ base: 4, md: 6 }}>
                      <VStack gap={2} alignItems="flex-start">
                        <HStack justify="space-between" w="full">
                          <Text
                            fontSize={{ base: "xs", md: "sm" }}
                            color="gray.600"
                          >
                            Homeworks
                          </Text>
                          <Icon
                            color="orange.500"
                            fontSize={{ base: "md", md: "lg" }}
                          >
                            <LuClipboardCheck />
                          </Icon>
                        </HStack>
                        <Heading size={{ base: "xl", md: "2xl" }}>—</Heading>
                      </VStack>
                    </Card.Body>
                  </Card.Root>
                </SimpleGrid>
              )}
            </VStack>
          </Container>
        </Box>

        <MobileBottomNav />
      </Flex>
    </ProtectedRoute>
  );
}
