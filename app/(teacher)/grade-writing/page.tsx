"use client";

import {
  Box,
  Button,
  ButtonGroup,
  Card,
  Container,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Pagination,
  Spinner,
  Table,
  Text,
  VStack,
  Badge,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import Link from "next/link";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ieltsAnswersAPI } from "@/lib/ielts-api";

interface StudentInfo {
  user_id?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

interface WritingTaskItem {
  writingAnswerId: string;
  attemptId: string;
  submittedAt: string;
  test?: {
    id?: string;
    title?: string;
  };
  task?: {
    id?: string;
    task?: string;
    prompt?: string;
  };
  answerText?: string;
  wordCount?: number;
  feedback?: string | null;
}

interface WritingTaskGroup {
  student?: StudentInfo;
  writingTasks?: WritingTaskItem[];
}

interface WritingTaskRow extends WritingTaskItem {
  student?: StudentInfo;
}

interface AttemptsResultsResponse {
  writingTasksToGrade?: WritingTaskGroup[];
  totals?: {
    students?: number;
    writingTasksToGrade?: number;
  };
  pagination?: {
    page?: number;
    limit?: number;
    writingTasksToGradeTotalPages?: number;
  };
}

const DEFAULT_QUERY = {
  limit: 10,
  from: "2026-01-01T00:00:00.000Z",
  to: "2026-12-31T23:59:59.999Z",
} as const;

const toDateTimeLocal = (iso: string) => {
  const date = new Date(iso);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const toIsoString = (value: string) => {
  if (!value) return "";
  return new Date(value).toISOString();
};

export default function GradeWritingPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [page, setPage] = useState(1);
  const [fromInput, setFromInput] = useState(
    toDateTimeLocal(DEFAULT_QUERY.from),
  );
  const [toInput, setToInput] = useState(toDateTimeLocal(DEFAULT_QUERY.to));
  const [fromFilter, setFromFilter] = useState<string>(DEFAULT_QUERY.from);
  const [toFilter, setToFilter] = useState<string>(DEFAULT_QUERY.to);
  const [rows, setRows] = useState<WritingTaskRow[]>([]);
  const [totalPending, setTotalPending] = useState(0);

  useEffect(() => {
    const fetchRows = async () => {
      try {
        setLoading(true);
        setError("");

        const response = (await ieltsAnswersAPI.getMyStudentsAttemptsResults({
          page,
          limit: DEFAULT_QUERY.limit,
          from: fromFilter,
          to: toFilter,
        })) as AttemptsResultsResponse;

        const tableRows = Array.isArray(response?.writingTasksToGrade)
          ? response.writingTasksToGrade.flatMap((group) => {
              const student = group?.student;
              const tasks = Array.isArray(group?.writingTasks)
                ? group.writingTasks
                : [];

              return tasks.map((task) => ({
                ...task,
                student,
              }));
            })
          : [];

        setRows(tableRows);
        setTotalPending(response?.totals?.writingTasksToGrade || 0);
      } catch {
        setRows([]);
        setTotalPending(0);
        setError("Failed to fetch grade writing data.");
      } finally {
        setLoading(false);
      }
    };

    fetchRows();
  }, [page, fromFilter, toFilter]);

  const rangeText = useMemo(() => {
    if (!rows.length) return "0-0";
    const start = (page - 1) * DEFAULT_QUERY.limit + 1;
    const end = start + rows.length - 1;
    return `${start}-${end}`;
  }, [page, rows.length]);

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
            <Heading size={{ base: "sm", md: "md" }}>Grade Writing</Heading>
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
              <Card.Root borderRadius="2xl" overflow="hidden">
                <Card.Body p={{ base: 4, md: 6 }}>
                  <VStack alignItems="stretch" gap={4}>
                    <HStack justify="space-between" flexWrap="wrap" gap={3}>
                      <Box>
                        <Heading size={{ base: "md", md: "lg" }} mb={1}>
                          Writing Tasks to Grade
                        </Heading>
                        <Text color="gray.600" _dark={{ color: "gray.400" }}>
                          Filter by date range
                        </Text>
                      </Box>
                      <Badge colorPalette="orange" size="lg">
                        Pending: {totalPending}
                      </Badge>
                    </HStack>

                    <HStack gap={3} flexWrap="wrap" align="end">
                      <Box minW={{ base: "100%", md: "260px" }}>
                        <Text
                          fontSize="sm"
                          mb={1}
                          color="gray.600"
                          _dark={{ color: "gray.400" }}
                        >
                          From
                        </Text>
                        <Input
                          type="datetime-local"
                          value={fromInput}
                          onChange={(event) => setFromInput(event.target.value)}
                        />
                      </Box>
                      <Box minW={{ base: "100%", md: "260px" }}>
                        <Text
                          fontSize="sm"
                          mb={1}
                          color="gray.600"
                          _dark={{ color: "gray.400" }}
                        >
                          To
                        </Text>
                        <Input
                          type="datetime-local"
                          value={toInput}
                          onChange={(event) => setToInput(event.target.value)}
                        />
                      </Box>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPage(1);
                          setFromFilter(toIsoString(fromInput));
                          setToFilter(toIsoString(toInput));
                        }}
                      >
                        Apply Filters
                      </Button>
                    </HStack>

                    {loading ? (
                      <Flex justify="center" align="center" minH="260px">
                        <Spinner size="xl" color="brand.500" />
                      </Flex>
                    ) : error ? (
                      <Text color="red.500">{error}</Text>
                    ) : (
                      <>
                        <Box overflowX="auto">
                          <Table.Root size="sm" variant="outline" interactive>
                            <Table.Header>
                              <Table.Row>
                                <Table.ColumnHeader>Student</Table.ColumnHeader>
                                <Table.ColumnHeader>Test</Table.ColumnHeader>
                                <Table.ColumnHeader>Task</Table.ColumnHeader>
                                <Table.ColumnHeader>
                                  Submitted
                                </Table.ColumnHeader>
                                <Table.ColumnHeader textAlign="right">
                                  Words
                                </Table.ColumnHeader>
                                <Table.ColumnHeader textAlign="right">
                                  Action
                                </Table.ColumnHeader>
                              </Table.Row>
                            </Table.Header>
                            <Table.Body>
                              {rows.length === 0 ? (
                                <Table.Row>
                                  <Table.Cell colSpan={6}>
                                    <Text color="gray.500">No data found.</Text>
                                  </Table.Cell>
                                </Table.Row>
                              ) : (
                                rows.map((row) => {
                                  const studentName = [
                                    row.student?.first_name,
                                    row.student?.last_name,
                                  ]
                                    .filter(Boolean)
                                    .join(" ");

                                  return (
                                    <Table.Row key={row.writingAnswerId}>
                                      <Table.Cell>
                                        {studentName ||
                                          row.student?.username ||
                                          "-"}
                                      </Table.Cell>
                                      <Table.Cell>
                                        {row.test?.title || "-"}
                                      </Table.Cell>
                                      <Table.Cell>
                                        {row.task?.task || "-"}
                                      </Table.Cell>
                                      <Table.Cell>
                                        {row.submittedAt
                                          ? new Date(
                                              row.submittedAt,
                                            ).toLocaleString()
                                          : "-"}
                                      </Table.Cell>
                                      <Table.Cell textAlign="right">
                                        {row.wordCount ?? 0}
                                      </Table.Cell>
                                      <Table.Cell textAlign="right">
                                        <Link
                                          href={`/grade-writing/${row.writingAnswerId}`}
                                        >
                                          <Button size="xs" variant="outline">
                                            Grade
                                          </Button>
                                        </Link>
                                      </Table.Cell>
                                    </Table.Row>
                                  );
                                })
                              )}
                            </Table.Body>
                          </Table.Root>
                        </Box>

                        <HStack
                          justify="space-between"
                          mt={2}
                          flexWrap="wrap"
                          gap={3}
                        >
                          <Text
                            fontSize="sm"
                            color="gray.600"
                            _dark={{ color: "gray.400" }}
                          >
                            Showing {rangeText} of {totalPending}
                          </Text>

                          <Pagination.Root
                            count={Math.max(totalPending, 1)}
                            pageSize={DEFAULT_QUERY.limit}
                            page={page}
                            onPageChange={(details) => setPage(details.page)}
                          >
                            <ButtonGroup variant="ghost" size="sm" wrap="wrap">
                              <Pagination.PrevTrigger asChild>
                                <IconButton aria-label="Previous page">
                                  <LuChevronLeft />
                                </IconButton>
                              </Pagination.PrevTrigger>

                              <Pagination.Items
                                render={(paginationPage) => (
                                  <IconButton
                                    variant={{
                                      base: "ghost",
                                      _selected: "outline",
                                    }}
                                  >
                                    {paginationPage.value}
                                  </IconButton>
                                )}
                              />

                              <Pagination.NextTrigger asChild>
                                <IconButton aria-label="Next page">
                                  <LuChevronRight />
                                </IconButton>
                              </Pagination.NextTrigger>
                            </ButtonGroup>
                          </Pagination.Root>
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
