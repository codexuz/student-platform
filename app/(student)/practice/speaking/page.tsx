"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Box,
  Heading,
  Grid,
  Card,
  Badge,
  HStack,
  VStack,
  Button,
  Flex,
  Input,
  Spinner,
  EmptyState,
  Text,
  Icon,
} from "@chakra-ui/react";
import { Mic, Search, History, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import { ieltsSpeakingAPI } from "@/lib/ielts-api";

const PAGE_SIZE = 12;

interface SpeakingTopic {
  id: string;
  title: string;
  description?: string;
  mode?: string;
}

export default function SpeakingPracticePage() {
  return (
    <ProtectedRoute>
      <SpeakingBrowser />
    </ProtectedRoute>
  );
}

function SpeakingBrowser() {
  const router = useRouter();
  const [items, setItems] = useState<SpeakingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(search), 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ieltsSpeakingAPI.getAll({
        limit: PAGE_SIZE,
        isActive: true,
        ...(debounced && { search: debounced }),
      });
      setItems(res?.data || res || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [debounced]);

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
          alignItems="center"
          justifyContent="space-between"
          bg="white"
          _dark={{ bg: "gray.800" }}
          borderBottomWidth="1px"
        >
          <Heading size={{ base: "sm", md: "md" }}>Speaking Practice</Heading>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/practice/speaking/attempts")}
          >
            <History size={16} /> My Attempts
          </Button>
        </Flex>

        <Box p={{ base: 4, md: 6 }} maxW="1400px" mx="auto">
          {/* Hero */}
          <Box
            position="relative"
            p={{ base: 8, md: 10 }}
            borderRadius="3xl"
            overflow="hidden"
            bg="purple.600"
            _dark={{ bg: "purple.800" }}
            color="white"
            shadow="xl"
            mb={8}
          >
            <Box position="relative" zIndex={1}>
              <Heading size={{ base: "xl", md: "3xl" }} mb={2}>
                AI Speaking Examiner 🎙️
              </Heading>
              <Text fontSize={{ base: "md", md: "lg" }} color="purple.100" maxW="2xl">
                Take a full IELTS Speaking test with a real-time AI examiner —
                Parts 1, 2 and 3, with a timed cue-card long turn and instant
                band-score feedback.
              </Text>
            </Box>
          </Box>

          {/* Search */}
          <Box position="relative" width={{ base: "100%", md: "320px" }} mb={6}>
            <Box
              position="absolute"
              left="10px"
              top="50%"
              transform="translateY(-50%)"
              color="gray.400"
              zIndex={1}
              pointerEvents="none"
            >
              <Search size={16} />
            </Box>
            <Input
              size="sm"
              pl="34px"
              placeholder="Search topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              borderRadius="md"
            />
          </Box>

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
                <EmptyState.Title>No speaking topics yet</EmptyState.Title>
                <EmptyState.Description>
                  Check back soon — new speaking topics are added regularly.
                </EmptyState.Description>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Grid
              templateColumns={{
                base: "1fr",
                md: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              }}
              gap={6}
            >
              {items.map((item) => (
                <Card.Root
                  key={item.id}
                  cursor="pointer"
                  borderRadius="2xl"
                  overflow="hidden"
                  transition="all 0.2s"
                  bg="white"
                  _dark={{ bg: "gray.800", color: "white" }}
                  _hover={{ transform: "translateY(-4px)", shadow: "lg" }}
                  onClick={() => router.push(`/practice/speaking/${item.id}`)}
                >
                  <Flex
                    align="center"
                    justify="center"
                    py={6}
                    background="linear-gradient(135deg, rgba(147,51,234,0.18), rgba(147,51,234,0.03))"
                  >
                    <Flex
                      align="center"
                      justify="center"
                      w="56px"
                      h="56px"
                      borderRadius="xl"
                      bg="white"
                      _dark={{ bg: "gray.900" }}
                      shadow="sm"
                    >
                      <Icon as={Mic} boxSize={7} color="purple.500" />
                    </Flex>
                  </Flex>
                  <Card.Body pt={4}>
                    <VStack align="stretch" gap={3}>
                      <Heading size="sm" lineClamp={2}>
                        {item.title}
                      </Heading>
                      {item.description && (
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          _dark={{ color: "gray.400" }}
                          lineClamp={2}
                        >
                          {item.description.replace(/<[^>]*>/g, "")}
                        </Text>
                      )}
                      <HStack justify="space-between">
                        <Badge
                          colorPalette="purple"
                          variant="subtle"
                          borderRadius="full"
                          px={2}
                        >
                          Speaking
                        </Badge>
                        <HStack color="purple.500" fontSize="sm" fontWeight="600">
                          <Text>Start</Text>
                          <ArrowRight size={14} />
                        </HStack>
                      </HStack>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
      <MobileBottomNav />
    </Box>
  );
}
