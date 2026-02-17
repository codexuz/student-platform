"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Spinner,
  Badge,
  HStack,
  VStack,
  Card,
  EmptyState,
  Pagination,
  ButtonGroup,
  IconButton,
  NativeSelect,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  Clock,
  BookOpen,
  Headphones,
  PenTool,
  Eye,
  Target,
} from "lucide-react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import { ieltsAnswersAPI } from "@/lib/ielts-api";

const PAGE_SIZE = 10;

interface AttemptItem {
  id: string;
  user_id: string;
  scope: string;
  test_id: string | null;
  module_id: string | null;
  part_id: string | null;
  task_id: string | null;
  started_at: string;
  finished_at: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  test: { id: string; title: string } | null;
  part: {
    id: string;
    reading_id?: string;
    listening_id?: string;
    part: string;
    title: string;
    audio_url?: string;
    timeLimitMinutes: number;
    difficulty: string;
    isActive: boolean;
    totalQuestions: number;
    type: string;
  } | null;
  module: {
    id: string;
    title: string;
    test_id: string;
    full_audio_url?: string | null;
    type: string;
  } | null;
  task: {
    id: string;
    writing_id: string;
    task: string;
    prompt: string | null;
    image_url: string | null;
    min_words: number;
    suggested_time: number;
  } | null;
}

export default function ResultsListPage() {
  return (
    <ProtectedRoute>
      <ResultsListContent />
    </ProtectedRoute>
  );
}

function ResultsListContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<AttemptItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [scopeFilter, setScopeFilter] = useState<string>("");

  const fetchAttempts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: PAGE_SIZE,
        status: "SUBMITTED",
      };
      if (scopeFilter) params.scope = scopeFilter;

      const data = await ieltsAnswersAPI.getAttempts(params);
      const result = data?.data ?? data;
      setAttempts(result?.data ?? result ?? []);
      setTotal(result?.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch attempts:", err);
      setAttempts([]);
    } finally {
      setLoading(false);
    }
  }, [page, scopeFilter]);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  const handleAttemptClick = (attempt: AttemptItem) => {
    router.push(`/practice/results/${attempt.id}`);
  };

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
      <Sidebar />
      <Box ml={{ base: 0, lg: "240px" }} pb={{ base: "80px", lg: 0 }}>
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
          <HStack gap={3}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/practice")}
            >
              <ArrowLeft size={16} />
            </Button>
            <Heading size={{ base: "sm", md: "md" }}>My Results</Heading>
          </HStack>
          <HStack gap={2}>
            <NotificationsDrawer />
          </HStack>
        </Flex>

        <Box p={{ base: 4, md: 6 }} maxW="1000px" mx="auto">
          {/* Scope Filter */}
          <Flex mb={6}>
            <NativeSelect.Root size="sm" width={{ base: "100%", sm: "180px" }}>
              <NativeSelect.Field
                value={scopeFilter}
                onChange={(e) => {
                  setScopeFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Scopes</option>
                <option value="TEST">Full Test</option>
                <option value="MODULE">Module</option>
                <option value="PART">Part</option>
                <option value="TASK">Task</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </Flex>

          {/* Attempts list */}
          {loading ? (
            <Flex justify="center" py={12}>
              <Spinner size="xl" color="brand.500" />
            </Flex>
          ) : attempts.length === 0 ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Title>No attempts found</EmptyState.Title>
                <EmptyState.Description>
                  Start practicing to see your results here.
                </EmptyState.Description>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <VStack gap={3} align="stretch">
              {attempts.map((attempt) => (
                <AttemptCard
                  key={attempt.id}
                  attempt={attempt}
                  onClick={() => handleAttemptClick(attempt)}
                  onViewResults={() =>
                    router.push(`/practice/results/${attempt.id}`)
                  }
                  onReview={() => {
                    const params = new URLSearchParams();
                    if (attempt.part_id) params.set("part_id", attempt.part_id);
                    if (attempt.scope) params.set("scope", attempt.scope);
                    const type =
                      attempt.part?.type ||
                      attempt.module?.type ||
                      (attempt.task ? "writing" : "");
                    if (type) params.set("type", type);
                    // Pass audio URL for listening reviews
                    if (type === "listening") {
                      const audioUrl =
                        attempt.module?.full_audio_url ||
                        attempt.part?.audio_url;
                      if (audioUrl) params.set("audio_url", audioUrl);
                    }
                    const qs = params.toString();
                    router.push(
                      `/practice/review/${attempt.id}${qs ? `?${qs}` : ""}`,
                    );
                  }}
                />
              ))}
            </VStack>
          )}

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <Flex justify="center" mt={8}>
              <Pagination.Root
                count={total}
                pageSize={PAGE_SIZE}
                page={page}
                onPageChange={(e) => setPage(e.page)}
              >
                <ButtonGroup variant="ghost" size="sm">
                  <Pagination.PrevTrigger asChild>
                    <IconButton>
                      <LuChevronLeft />
                    </IconButton>
                  </Pagination.PrevTrigger>
                  <Pagination.Items
                    render={(p) => (
                      <IconButton
                        variant={{ base: "ghost", _selected: "outline" }}
                      >
                        {p.value}
                      </IconButton>
                    )}
                  />
                  <Pagination.NextTrigger asChild>
                    <IconButton>
                      <LuChevronRight />
                    </IconButton>
                  </Pagination.NextTrigger>
                </ButtonGroup>
              </Pagination.Root>
            </Flex>
          )}
        </Box>
      </Box>
      <MobileBottomNav />
    </Box>
  );
}

// ─── Attempt Card ─────────────────────────────────────────────────────────

function AttemptCard({
  attempt,
  onClick,
  onViewResults,
  onReview,
}: {
  attempt: AttemptItem;
  onClick: () => void;
  onViewResults: () => void;
  onReview: () => void;
}) {
  const timeAgo = getTimeAgo(attempt.started_at);
  const duration = getDuration(attempt.started_at, attempt.finished_at);

  return (
    <Card.Root
      cursor="pointer"
      onClick={onClick}
      transition="all 0.2s"
      _hover={{ shadow: "md", borderColor: "brand.200" }}
      overflow="hidden"
    >
      <Card.Body py={4} px={5}>
        <Flex justify="space-between" align="flex-start" gap={4}>
          {/* Left */}
          <HStack gap={3} align="flex-start" flex={1}>
            <Flex
              align="center"
              justify="center"
              w="40px"
              h="40px"
              borderRadius="lg"
              bg={getScopeBg(attempt.scope)}
              flexShrink={0}
            >
              {getScopeIcon(attempt.scope, attempt)}
            </Flex>
            <Box flex={1}>
              <Text fontWeight="semibold" fontSize="sm" lineClamp={1}>
                {getAttemptTitle(attempt)}
              </Text>
              <HStack gap={2} mt={1} flexWrap="wrap">
                <Badge
                  fontSize="2xs"
                  colorPalette={getTypePalette(getAttemptType(attempt))}
                >
                  {getAttemptType(attempt)}
                </Badge>
                <Badge fontSize="2xs" variant="outline">
                  {attempt.scope}
                </Badge>
                {getQuestionCount(attempt) > 0 && (
                  <Text fontSize="xs" color="gray.500">
                    {getQuestionCount(attempt)} Qs
                  </Text>
                )}
                <Text fontSize="xs" color="gray.500">
                  {timeAgo}
                </Text>
                {duration && (
                  <HStack gap={1}>
                    <Clock size={10} />
                    <Text fontSize="xs" color="gray.500">
                      {duration}
                    </Text>
                  </HStack>
                )}
              </HStack>
            </Box>
          </HStack>

          {/* Right — Action buttons */}
          <HStack gap={1} flexShrink={0} onClick={(e) => e.stopPropagation()}>
            <Button
              size="xs"
              variant="outline"
              colorPalette="brand"
              onClick={onViewResults}
            >
              <Target size={12} />
              Results
            </Button>
            <Button size="xs" variant="outline" onClick={onReview}>
              <Eye size={12} />
              Review
            </Button>
          </HStack>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function getScopeLabel(attempt: AttemptItem): string {
  switch (attempt.scope) {
    case "TEST":
      return "Full Test";
    case "MODULE":
      return "Module Practice";
    case "PART":
      return "Part Practice";
    case "TASK":
      return "Writing Task";
    default:
      return "Practice";
  }
}

function getScopeIcon(scope: string, attempt?: AttemptItem) {
  switch (scope) {
    case "TEST":
      return <Target size={18} color="var(--chakra-colors-purple-500)" />;
    case "MODULE": {
      const mType = attempt?.module?.type;
      if (mType === "listening")
        return <Headphones size={18} color="var(--chakra-colors-blue-500)" />;
      return <BookOpen size={18} color="var(--chakra-colors-blue-500)" />;
    }
    case "PART": {
      const pType = attempt?.part?.type;
      if (pType === "listening")
        return <Headphones size={18} color="var(--chakra-colors-orange-500)" />;
      return <BookOpen size={18} color="var(--chakra-colors-orange-500)" />;
    }
    case "TASK":
      return <PenTool size={18} color="var(--chakra-colors-green-500)" />;
    default:
      return <Target size={18} color="var(--chakra-colors-gray-500)" />;
  }
}

function getAttemptTitle(attempt: AttemptItem): string {
  if (attempt.part) {
    const partNum = attempt.part.part?.replace("PART_", "") || "";
    return `Part ${partNum}: ${attempt.part.title}`;
  }
  if (attempt.module) return attempt.module.title;
  if (attempt.task) {
    const taskNum = attempt.task.task?.replace("TASK_", "") || "";
    if (attempt.task.prompt) {
      const plain = attempt.task.prompt.replace(/<[^>]*>/g, "").trim();
      const truncated =
        plain.length > 80 ? plain.slice(0, 80).trimEnd() + "…" : plain;
      return `Task ${taskNum}: ${truncated}`;
    }
    return `Writing Task ${taskNum}`;
  }
  if (attempt.test) return attempt.test.title;
  return getScopeLabel(attempt);
}

function getAttemptType(attempt: AttemptItem): string {
  if (attempt.part?.type) return attempt.part.type;
  if (attempt.module?.type) return attempt.module.type;
  if (attempt.task) return "writing";
  return attempt.scope.toLowerCase();
}

function getTypePalette(type: string): string {
  switch (type) {
    case "reading":
      return "blue";
    case "listening":
      return "orange";
    case "writing":
      return "green";
    default:
      return "purple";
  }
}

function getQuestionCount(attempt: AttemptItem): number {
  if (attempt.part?.totalQuestions) return attempt.part.totalQuestions;
  return 0;
}

function getScopeBg(scope: string): string {
  switch (scope) {
    case "TEST":
      return "purple.50";
    case "MODULE":
      return "blue.50";
    case "PART":
      return "orange.50";
    case "TASK":
      return "green.50";
    default:
      return "gray.50";
  }
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getDuration(start: string, end: string | null): string | null {
  if (!end) return null;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}
