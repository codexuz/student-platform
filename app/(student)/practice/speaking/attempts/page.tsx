"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Heading,
  HStack,
  VStack,
  Flex,
  Spinner,
  Text,
  Badge,
  EmptyState,
  Button,
  IconButton,
  ButtonGroup,
  Pagination,
} from "@chakra-ui/react";
import { Mic, ArrowLeft, ChevronRight } from "lucide-react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import { ieltsSpeakingAPI } from "@/lib/ielts-api";

const PAGE_SIZE = 10;

interface Attempt {
  id: string;
  status: string;
  duration_seconds: number;
  started_at: string;
  speaking?: { title?: string } | null;
  feedback?: { overall_band?: number } | string | null;
}

function bandColor(band?: number): string {
  if (band === undefined) return "gray";
  if (band >= 7) return "green";
  if (band >= 5.5) return "blue";
  if (band >= 4) return "orange";
  return "red";
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

export default function SpeakingAttemptsPage() {
  return (
    <ProtectedRoute>
      <AttemptsList />
    </ProtectedRoute>
  );
}

function AttemptsList() {
  const router = useRouter();
  const [items, setItems] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ieltsSpeakingAPI.getMyAttempts({ page, limit: PAGE_SIZE });
      setItems(res?.data || []);
      setTotal(res?.total ?? 0);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
      <Sidebar />
      <Box ml={{ base: 0, lg: "240px" }} pb={{ base: "80px", lg: 0 }}>
        <Flex
          h={{ base: "14", md: "16" }}
          px={{ base: 4, md: 8 }}
          align="center"
          gap={3}
          bg="white"
          _dark={{ bg: "gray.800" }}
          borderBottomWidth="1px"
        >
          <IconButton
            aria-label="Back"
            variant="ghost"
            size="sm"
            onClick={() => router.push("/practice/speaking")}
          >
            <ArrowLeft size={18} />
          </IconButton>
          <Heading size={{ base: "sm", md: "md" }}>My Speaking Attempts</Heading>
        </Flex>

        <Box p={{ base: 4, md: 6 }} maxW="900px" mx="auto">
          {loading ? (
            <Flex justify="center" py={12}>
              <Spinner size="xl" color="purple.500" />
            </Flex>
          ) : items.length === 0 ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Mic />
                </EmptyState.Indicator>
                <EmptyState.Title>No attempts yet</EmptyState.Title>
                <EmptyState.Description>
                  Take a speaking test to see your transcript and band feedback
                  here.
                </EmptyState.Description>
                <Button
                  colorPalette="purple"
                  mt={3}
                  onClick={() => router.push("/practice/speaking")}
                >
                  Start a speaking test
                </Button>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <>
              <VStack align="stretch" gap={3}>
                {items.map((a) => {
                  const band =
                    a.feedback && typeof a.feedback === "object"
                      ? a.feedback.overall_band
                      : undefined;
                  return (
                    <Flex
                      key={a.id}
                      align="center"
                      justify="space-between"
                      bg="white"
                      _dark={{ bg: "gray.800" }}
                      borderWidth="1px"
                      rounded="xl"
                      px={4}
                      py={3}
                      cursor="pointer"
                      transition="all 0.15s"
                      _hover={{ shadow: "md", transform: "translateY(-1px)" }}
                      onClick={() =>
                        router.push(`/practice/speaking/attempts/${a.id}`)
                      }
                    >
                      <HStack gap={4}>
                        <Flex
                          align="center"
                          justify="center"
                          w="44px"
                          h="44px"
                          rounded="lg"
                          bg="purple.50"
                          _dark={{ bg: "whiteAlpha.100" }}
                          color="purple.500"
                        >
                          <Mic size={20} />
                        </Flex>
                        <Box>
                          <Text fontWeight="600" lineClamp={1}>
                            {a.speaking?.title || "Speaking Test"}
                          </Text>
                          <HStack
                            gap={2}
                            fontSize="xs"
                            color="gray.500"
                            _dark={{ color: "gray.400" }}
                          >
                            <Text>
                              {new Date(a.started_at).toLocaleDateString()}
                            </Text>
                            <Text>•</Text>
                            <Text>{formatDuration(a.duration_seconds || 0)}</Text>
                            <Badge
                              size="sm"
                              variant="subtle"
                              colorPalette={
                                a.status === "COMPLETED" ? "green" : "gray"
                              }
                            >
                              {a.status?.toLowerCase()}
                            </Badge>
                          </HStack>
                        </Box>
                      </HStack>
                      <HStack gap={3}>
                        {band !== undefined && (
                          <Flex
                            align="center"
                            justify="center"
                            w="44px"
                            h="44px"
                            rounded="full"
                            bg={`${bandColor(band)}.500`}
                            color="white"
                            fontWeight="800"
                          >
                            {band.toFixed(1)}
                          </Flex>
                        )}
                        <ChevronRight size={18} color="gray" />
                      </HStack>
                    </Flex>
                  );
                })}
              </VStack>

              {total > PAGE_SIZE && (
                <Flex justify="center" mt={6}>
                  <Pagination.Root
                    count={total}
                    pageSize={PAGE_SIZE}
                    page={page}
                    onPageChange={(e) => setPage(e.page)}
                  >
                    <ButtonGroup variant="ghost" size="sm">
                      <Pagination.PrevTrigger asChild>
                        <IconButton aria-label="Prev">
                          <LuChevronLeft />
                        </IconButton>
                      </Pagination.PrevTrigger>
                      <Pagination.Items
                        render={(p) => (
                          <IconButton
                            aria-label={`Page ${p.value}`}
                            variant={{ base: "ghost", _selected: "outline" }}
                          >
                            {p.value}
                          </IconButton>
                        )}
                      />
                      <Pagination.NextTrigger asChild>
                        <IconButton aria-label="Next">
                          <LuChevronRight />
                        </IconButton>
                      </Pagination.NextTrigger>
                    </ButtonGroup>
                  </Pagination.Root>
                </Flex>
              )}
            </>
          )}
        </Box>
      </Box>
      <MobileBottomNav />
    </Box>
  );
}
