"use client";

import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { groupsAPI, groupStudentsAPI } from "@/lib/teacher-api";
import { ClipboardList } from "lucide-react";

interface Group {
  id: string;
  name?: string;
  description?: string;
  status?: string;
}

interface StudentProfile {
  user_id?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar_url?: string;
  phone?: string;
}

interface GroupStudent {
  id: string;
  status?: string;
  student_id?: string;
  student?: StudentProfile;
}

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const groupId = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [group, setGroup] = useState<Group | null>(null);
  const [students, setStudents] = useState<GroupStudent[]>([]);

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!groupId || Array.isArray(groupId)) {
        setError("Invalid group ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [groupRes, studentsRes] = await Promise.all([
          groupsAPI.getById(groupId).catch(() => null),
          groupStudentsAPI.getByGroupId(groupId).catch(() => []),
        ]);

        setGroup(groupRes);
        setStudents(
          Array.isArray(studentsRes) ? studentsRes : studentsRes?.data || [],
        );
      } catch {
        setError("Failed to fetch group students.");
        setGroup(null);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId]);

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
            <Heading size={{ base: "sm", md: "md" }}>Group Students</Heading>
            <HStack gap={{ base: 2, md: 4 }}>
              <NotificationsDrawer />
            </HStack>
          </Flex>

          <Container
            maxW="7xl"
            py={{ base: 4, md: 6, lg: 8 }}
            px={{ base: 4, md: 6 }}
          >
            <VStack gap={{ base: 4, md: 6 }} alignItems="stretch">
              <HStack justify="space-between">
                <Button
                  size="sm"
                  bg="black"
                  color="white"
                  _hover={{ bg: "gray.800" }}
                  _dark={{
                    bg: "white",
                    color: "black",
                    _hover: { bg: "gray.200" },
                  }}
                  onClick={() => router.push(`/groups`)}
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  colorPalette="brand"
                  onClick={() => router.push(`/groups/${groupId}/mock-tests`)}
                >
                  <ClipboardList size={16} />
                  Assign Mock Test
                </Button>
              </HStack>

              <Box>
                <Heading size={{ base: "lg", md: "xl" }} mb={2}>
                  {group?.name || "Group"}
                </Heading>
                <HStack gap={3} flexWrap="wrap">
                  <Text color="gray.600" _dark={{ color: "gray.400" }}>
                    {group?.description || "Students in this group"}
                  </Text>
                  {group?.status ? (
                    <Badge colorPalette="green">{group.status}</Badge>
                  ) : null}
                </HStack>
              </Box>

              {loading ? (
                <Flex justify="center" align="center" minH="300px">
                  <Spinner size="xl" color="brand.500" />
                </Flex>
              ) : error ? (
                <Card.Root>
                  <Card.Body>
                    <Text color="red.500">{error}</Text>
                  </Card.Body>
                </Card.Root>
              ) : students.length === 0 ? (
                <Card.Root>
                  <Card.Body>
                    <Text color="gray.500">
                      No students found in this group.
                    </Text>
                  </Card.Body>
                </Card.Root>
              ) : (
                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: "repeat(2, 1fr)",
                    xl: "repeat(3, 1fr)",
                  }}
                  gap={4}
                >
                  {students.map((item) => {
                    const fullName = [
                      item.student?.first_name,
                      item.student?.last_name,
                    ]
                      .filter(Boolean)
                      .join(" ");
                    const studentId = item.student?.user_id || item.student_id;

                    return (
                      <Card.Root
                        key={item.id}
                        borderRadius="xl"
                        overflow="hidden"
                        cursor={studentId ? "pointer" : "default"}
                        transition="all 0.2s"
                        _hover={
                          studentId
                            ? { transform: "translateY(-2px)", shadow: "md" }
                            : undefined
                        }
                        onClick={() => {
                          if (studentId) {
                            router.push(`/results/${studentId}`);
                          }
                        }}
                      >
                        <Card.Body>
                          <VStack alignItems="flex-start" gap={3}>
                            <HStack justify="space-between" w="full">
                              <HStack>
                                <Avatar.Root size="md">
                                  <Avatar.Fallback
                                    name={
                                      fullName ||
                                      item.student?.username ||
                                      "Student"
                                    }
                                  />
                                  {item.student?.avatar_url ? (
                                    <Avatar.Image
                                      src={item.student.avatar_url}
                                    />
                                  ) : null}
                                </Avatar.Root>
                                <Box>
                                  <Text fontWeight="semibold">
                                    {fullName ||
                                      item.student?.username ||
                                      "Unknown Student"}
                                  </Text>
                                  <Text
                                    fontSize="sm"
                                    color="gray.600"
                                    _dark={{ color: "gray.400" }}
                                  >
                                    @{item.student?.username || "-"}
                                  </Text>
                                </Box>
                              </HStack>
                              <Badge
                                colorPalette={
                                  item.status === "active" ? "green" : "gray"
                                }
                              >
                                {item.status || "-"}
                              </Badge>
                            </HStack>
                          </VStack>
                        </Card.Body>
                      </Card.Root>
                    );
                  })}
                </Grid>
              )}
            </VStack>
          </Container>
        </Box>

        <MobileBottomNav />
      </Flex>
    </ProtectedRoute>
  );
}
