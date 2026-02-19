"use client";

import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  HStack,
  Spinner,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ieltsAnswersAPI } from "@/lib/ielts-api";
import { studentsAPI } from "@/lib/teacher-api";

interface StudentProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

interface StudentAttempt {
  id: string;
  user_id?: string;
  scope?: "TEST" | "MODULE" | "PART" | "TASK" | string;
  test_id?: string | null;
  module_id?: string | null;
  part_id?: string | null;
  task_id?: string | null;
  status?: "IN_PROGRESS" | "SUBMITTED" | "ABANDONED" | string;
  started_at?: string;
  finished_at?: string | null;
  module?: {
    id?: string;
    title?: string;
    type?: string;
  } | null;
  part?: {
    id?: string;
    title?: string;
    type?: string;
  } | null;
  task?: {
    id?: string;
    task?: string;
    prompt?: string;
  } | null;
  test?: {
    id?: string;
    title?: string;
  } | null;
}

interface StudentAttemptsResponse {
  data?: StudentAttempt[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

const DEFAULT_LIMIT = 10;

export default function StudentResultsPage() {
  const params = useParams<{ studentId: string }>();
  const router = useRouter();
  const studentId = params?.studentId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [student, setStudent] = useState<StudentProfile | null>(null);

  // Fetch student profile
  useEffect(() => {
    if (!studentId || Array.isArray(studentId)) return;
    studentsAPI
      .getById(studentId)
      .then((res: StudentProfile | { data: StudentProfile }) => {
        const data = (res as { data: StudentProfile }).data ?? res;
        setStudent(data);
      })
      .catch(() => {});
  }, [studentId]);

  useEffect(() => {
    const fetchAttempts = async () => {
      if (!studentId || Array.isArray(studentId)) {
        setError("Invalid student ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = (await ieltsAnswersAPI.getMyStudentAttempts(
          studentId,
          {
            page,
            limit: DEFAULT_LIMIT,
          },
        )) as StudentAttemptsResponse;

        const rows = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];

        setAttempts(rows);
        setTotal(response?.total || rows.length || 0);
        setTotalPages(Math.max(response?.totalPages || 1, 1));
      } catch {
        setAttempts([]);
        setTotal(0);
        setTotalPages(1);
        setError("Failed to fetch student attempts.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttempts();
  }, [studentId, page]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const rangeText = useMemo(() => {
    if (!attempts.length) return "0-0";
    const start = (page - 1) * DEFAULT_LIMIT + 1;
    const end = start + attempts.length - 1;
    return `${start}-${end}`;
  }, [page, attempts.length]);

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
            <Heading size={{ base: "sm", md: "md" }}>
              Student IELTS Results
            </Heading>
            <HStack gap={{ base: 2, md: 4 }}>
              <NotificationsDrawer />
            </HStack>
          </Flex>

          <Container
            maxW="7xl"
            py={{ base: 4, md: 6, lg: 8 }}
            px={{ base: 4, md: 6 }}
          >
            <VStack gap={6} alignItems="stretch">
              <HStack>
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
                  onClick={() => router.back()}
                >
                  Back
                </Button>
              </HStack>

              <Card.Root borderRadius="2xl" overflow="hidden">
                <Card.Body p={{ base: 4, md: 6 }}>
                  <VStack alignItems="stretch" gap={4}>
                    <Box>
                      <Heading size={{ base: "md", md: "lg" }} mb={1}>
                        {student
                          ? `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
                            "Student"
                          : "Attempts"}
                      </Heading>
                    </Box>

                    {loading ? (
                      <Flex justify="center" align="center" minH="260px">
                        <Spinner size="xl" color="brand.500" />
                      </Flex>
                    ) : error ? (
                      <Text color="red.500">{error}</Text>
                    ) : (
                      <>
                        <Box overflowX="auto">
                          <Table.Root size="sm" variant="outline" striped>
                            <Table.Header>
                              <Table.Row>
                                <Table.ColumnHeader>Scope</Table.ColumnHeader>
                                <Table.ColumnHeader>Status</Table.ColumnHeader>
                                <Table.ColumnHeader>Title</Table.ColumnHeader>
                                <Table.ColumnHeader>Started</Table.ColumnHeader>
                                <Table.ColumnHeader>
                                  Finished
                                </Table.ColumnHeader>
                                <Table.ColumnHeader>Actions</Table.ColumnHeader>
                              </Table.Row>
                            </Table.Header>
                            <Table.Body>
                              {attempts.length === 0 ? (
                                <Table.Row>
                                  <Table.Cell colSpan={6}>
                                    <Text color="gray.500">
                                      No attempts found.
                                    </Text>
                                  </Table.Cell>
                                </Table.Row>
                              ) : (
                                attempts.map((attempt) => (
                                  <Table.Row key={attempt.id}>
                                    <Table.Cell>
                                      {attempt.scope || "-"}
                                    </Table.Cell>
                                    <Table.Cell>
                                      <Badge
                                        colorPalette={
                                          attempt.status === "SUBMITTED"
                                            ? "green"
                                            : attempt.status === "IN_PROGRESS"
                                              ? "orange"
                                              : "gray"
                                        }
                                      >
                                        {attempt.status || "-"}
                                      </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                      {attempt.test?.title ||
                                        attempt.module?.title ||
                                        attempt.part?.title ||
                                        attempt.task?.task ||
                                        "-"}
                                    </Table.Cell>
                                    <Table.Cell>
                                      {attempt.started_at
                                        ? new Date(
                                            attempt.started_at,
                                          ).toLocaleString()
                                        : "-"}
                                    </Table.Cell>
                                    <Table.Cell>
                                      {attempt.finished_at
                                        ? new Date(
                                            attempt.finished_at,
                                          ).toLocaleString()
                                        : "-"}
                                    </Table.Cell>
                                    <Table.Cell>
                                      <Button
                                        asChild
                                        size="xs"
                                        colorPalette="blue"
                                        variant="outline"
                                      >
                                        <Link
                                          href={`/results/${studentId}/${attempt.id}`}
                                        >
                                          View
                                        </Link>
                                      </Button>
                                    </Table.Cell>
                                  </Table.Row>
                                ))
                              )}
                            </Table.Body>
                          </Table.Root>
                        </Box>

                        <HStack justify="space-between" mt={2} flexWrap="wrap">
                          <Text
                            fontSize="sm"
                            color="gray.600"
                            _dark={{ color: "gray.400" }}
                          >
                            Showing {rangeText} of {total}
                          </Text>
                          <HStack>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPage((prev) => prev - 1)}
                              disabled={!canPrev}
                            >
                              Previous
                            </Button>
                            <Text fontSize="sm">
                              Page {page} / {totalPages}
                            </Text>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPage((prev) => prev + 1)}
                              disabled={!canNext}
                            >
                              Next
                            </Button>
                          </HStack>
                        </HStack>
                      </>
                    )}
                  </VStack>
                </Card.Body>
              </Card.Root>
            </VStack>
          </Container>
        </Box>

        <MobileBottomNav />
      </Flex>
    </ProtectedRoute>
  );
}
