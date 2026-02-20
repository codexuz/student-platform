"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  HStack,
  IconButton,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Headphones,
  BookOpen,
  PenTool,
  Lock,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ieltsMockTestsAPI, ieltsTestsAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";

// ── Types ──────────────────────────────────────────────────────────────────

interface MockTestDetail {
  id: string;
  title: string;
  test_id?: string;
  listening_confirmed?: boolean;
  reading_confirmed?: boolean;
  writing_confirmed?: boolean;
  listening_finished?: boolean;
  reading_finished?: boolean;
  writing_finished?: boolean;
  archived?: boolean;
  meta?: {
    listening_videoUrl?: string;
    reading_videoUrl?: string;
    writing_videoUrl?: string;
  };
  test?: {
    id: string;
    title?: string;
    listening?: { id: string; title?: string; parts?: unknown[] };
    reading?: { id: string; title?: string; parts?: unknown[] };
    writing?: { id: string; title?: string; tasks?: unknown[] };
  };
}

type Skill = "listening" | "reading" | "writing";

// ── Page ───────────────────────────────────────────────────────────────────

export default function GuestMockTestDashboardPage() {
  return (
    <ProtectedRoute>
      <GuestMockTestDashboard />
    </ProtectedRoute>
  );
}

interface TestModules {
  listeningId?: string;
  readingId?: string;
  writingId?: string;
}

function GuestMockTestDashboard() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mockTestId = params?.id;
  const testId = searchParams?.get("testId") ?? undefined;

  const [mockTest, setMockTest] = useState<MockTestDetail | null>(null);
  const [modules, setModules] = useState<TestModules>({});
  const [loading, setLoading] = useState(true);

  // Which skill sections are expanded
  const [expanded, setExpanded] = useState<Record<Skill, boolean>>({
    listening: false,
    reading: false,
    writing: false,
  });

  const fetchMockTest = useCallback(async () => {
    if (!mockTestId) return;
    setLoading(true);
    try {
      const res = await ieltsMockTestsAPI.getById(mockTestId);
      const data = res?.data ?? res;
      setMockTest(data);

      // Fetch the IELTS test to get module IDs
      const tId = testId ?? data?.test_id;
      if (tId) {
        const testRes = await ieltsTestsAPI.getById(tId);
        const testData = testRes?.data ?? testRes;
        setModules({
          listeningId: testData?.listenings?.[0]?.id,
          readingId: testData?.readings?.[0]?.id,
          writingId: testData?.writings?.[0]?.id,
        });
      }
    } catch {
      toaster.error({ title: "Failed to load mock test" });
    } finally {
      setLoading(false);
    }
  }, [mockTestId, testId]);

  useEffect(() => {
    fetchMockTest();
  }, [fetchMockTest]);

  // ── Skill timing ──────────────────────────────────────────────────────

  const skillTimings: Record<Skill, number> = {
    listening: 30,
    reading: 60,
    writing: 60,
  };

  const skillIcons: Record<Skill, React.ReactNode> = {
    listening: <Headphones size={22} />,
    reading: <BookOpen size={22} />,
    writing: <PenTool size={22} />,
  };

  const skillColors: Record<Skill, string> = {
    listening: "orange",
    reading: "purple",
    writing: "green",
  };

  const skillPosters: Record<Skill, string> = {
    listening: "/listening.png",
    reading: "/reading.png",
    writing: "/writing.png",
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
        <Flex h="100vh" align="center" justify="center">
          <Spinner size="xl" color="brand.500" />
        </Flex>
      </Box>
    );
  }

  if (!mockTest) {
    return (
      <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
        <Box p={8}>
          <Text color="red.500">Mock test not found.</Text>
          <Button mt={4} variant="outline" onClick={() => router.back()}>
            <ArrowLeft size={16} /> Go Back
          </Button>
        </Box>
      </Box>
    );
  }

  const skills: Skill[] = ["listening", "reading", "writing"];

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
      {/* Guest Header Bar */}
      <Flex
        h={{ base: "14", md: "16" }}
        px={{ base: 4, md: 8 }}
        alignItems="center"
        justifyContent="space-between"
        bg="white"
        _dark={{ bg: "gray.800" }}
        borderBottomWidth="1px"
      >
        <HStack gap={2}>
          <IconButton
            aria-label="Back"
            size="sm"
            variant="ghost"
            onClick={() => router.push("/guest/mock-tests")}
          >
            <ArrowLeft size={18} />
          </IconButton>
          <Heading size={{ base: "sm", md: "md" }}>Mock Test</Heading>
        </HStack>
      </Flex>

      {/* Content */}
      <Box p={{ base: 4, md: 6 }} maxW="900px" mx="auto">
        <VStack gap={6} align="stretch">
          {/* Title */}
          <Heading size={{ base: "lg", md: "xl" }}>{mockTest.title}</Heading>

          {/* Skill Sections */}
          {skills.map((skill) => {
            const videoUrl =
              mockTest.meta?.[
                `${skill}_videoUrl` as keyof NonNullable<MockTestDetail["meta"]>
              ];
            const isExpanded = expanded[skill];

            // Sequential unlock: listening → reading → writing
            const locked =
              (skill === "reading" && !mockTest.listening_finished) ||
              (skill === "writing" && !mockTest.reading_finished);

            return (
              <Card.Root
                key={skill}
                borderRadius="xl"
                borderWidth="1px"
                overflow="hidden"
              >
                {/* Colored left border */}
                <Flex>
                  <Box
                    w="4px"
                    bg={`${skillColors[skill]}.500`}
                    flexShrink={0}
                  />
                  <Card.Body p={{ base: 4, md: 6 }} flex="1">
                    <VStack align="stretch" gap={3}>
                      {/* Header */}
                      <HStack gap={2}>
                        {skillIcons[skill]}
                        <Heading
                          size={{ base: "md", md: "lg" }}
                          textTransform="capitalize"
                        >
                          {skill}
                        </Heading>
                        {locked && (
                          <HStack gap={1} ml="auto">
                            <Lock size={14} color="gray" />
                            <Text fontSize="xs" color="gray.400">
                              Complete{" "}
                              {skill === "reading" ? "Listening" : "Reading"}{" "}
                              first
                            </Text>
                          </HStack>
                        )}
                      </HStack>

                      {/* Timing */}
                      <Text fontSize="sm" color="gray.500">
                        Timing: {skillTimings[skill]} minutes
                      </Text>

                      {/* Expandable test info */}
                      {!locked && (
                        <Card.Root
                          bg="gray.50"
                          _dark={{ bg: "gray.700" }}
                          borderRadius="lg"
                        >
                          <Box
                            px={4}
                            py={2}
                            cursor="pointer"
                            onClick={() =>
                              setExpanded((prev) => ({
                                ...prev,
                                [skill]: !prev[skill],
                              }))
                            }
                          >
                            <HStack justify="space-between">
                              <HStack gap={2}>
                                {isExpanded ? (
                                  <ChevronUp size={18} />
                                ) : (
                                  <ChevronDown size={18} />
                                )}
                                <Text fontSize="sm" fontWeight="500">
                                  Test information
                                </Text>
                              </HStack>
                            </HStack>
                          </Box>

                          {isExpanded && (
                            <Box px={4} pb={4}>
                              {/* Video */}
                              {videoUrl && (
                                <Box
                                  mt={2}
                                  borderRadius="md"
                                  overflow="hidden"
                                  bg="black"
                                >
                                  <video
                                    src={videoUrl}
                                    poster={skillPosters[skill]}
                                    controls
                                    style={{
                                      width: "100%",
                                      maxHeight: "400px",
                                    }}
                                  />
                                </Box>
                              )}

                              {/* Start button */}
                              <Box mt={4}>
                                <Button
                                  size="sm"
                                  bg="gray.900"
                                  color="white"
                                  _hover={{ bg: "gray.700" }}
                                  _dark={{
                                    bg: "white",
                                    color: "black",
                                    _hover: { bg: "gray.200" },
                                  }}
                                  disabled={
                                    (skill === "listening" &&
                                      !modules.listeningId) ||
                                    (skill === "reading" &&
                                      !modules.readingId) ||
                                    (skill === "writing" && !modules.writingId)
                                  }
                                  onClick={() => {
                                    const tId = testId ?? mockTest?.test_id;
                                    const qs = tId ? `?testId=${tId}` : "";
                                    router.push(
                                      `/guest/mock-tests/${mockTestId}/${skill}${qs}`,
                                    );
                                  }}
                                >
                                  <ArrowRight size={14} />
                                  Start{" "}
                                  {skill.charAt(0).toUpperCase() +
                                    skill.slice(1)}
                                </Button>
                              </Box>
                            </Box>
                          )}
                        </Card.Root>
                      )}
                    </VStack>
                  </Card.Body>
                </Flex>
              </Card.Root>
            );
          })}
        </VStack>
      </Box>
    </Box>
  );
}
