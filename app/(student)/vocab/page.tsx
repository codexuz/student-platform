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
  Badge,
  Input,
} from "@chakra-ui/react";
import { BookA, Search, Layers } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import { ieltsVocabStudentAPI } from "@/lib/api";
import type { IeltsVocabulary, Paginated } from "@/components/vocabulary/types";

export default function StudentVocabularyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vocabularies, setVocabularies] = useState<IeltsVocabulary[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVocabularies = async () => {
      try {
        setLoading(true);
        setError(null);
        const res: Paginated<IeltsVocabulary> =
          await ieltsVocabStudentAPI.getAll(1, 100);
        setVocabularies(res.data ?? []);
      } catch (err) {
        console.error("Failed to fetch vocabularies:", err);
        setError("Failed to load vocabularies. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchVocabularies();
  }, []);

  const filtered = vocabularies.filter(
    (v) =>
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.description?.toLowerCase().includes(search.toLowerCase()),
  );

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
          {/* Header */}
          <Flex
            h={{ base: "14", md: "16" }}
            px={{ base: 4, md: 8 }}
            alignItems="center"
            justifyContent="space-between"
            bg="white"
            _dark={{ bg: "gray.800", borderColor: "gray.700" }}
            borderBottomWidth="1px"
            borderColor="gray.200"
          >
            <Heading size={{ base: "sm", md: "md" }}>Vocabulary</Heading>
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
              <Box>
                <Heading size={{ base: "lg", md: "xl" }} mb={2}>
                  IELTS Vocabulary
                </Heading>
                <Text color="gray.600" _dark={{ color: "gray.400" }}>
                  Browse vocabulary collections and practice with flashcards,
                  quizzes, and matching games
                </Text>
              </Box>

              {/* Search */}
              <Box position="relative" maxW="400px">
                <Box
                  position="absolute"
                  left={3}
                  top="50%"
                  transform="translateY(-50%)"
                  zIndex={1}
                >
                  <Search size={16} color="gray" />
                </Box>
                <Input
                  pl={10}
                  placeholder="Search vocabularies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  bg="white"
                  _dark={{ bg: "gray.800" }}
                />
              </Box>

              {/* Loading */}
              {loading && (
                <Flex
                  justify="center"
                  align="center"
                  minH="300px"
                  direction="column"
                  gap={4}
                >
                  <Spinner size="xl" color="brand.500" />
                  <Text color="gray.500" _dark={{ color: "gray.400" }}>
                    Loading vocabularies...
                  </Text>
                </Flex>
              )}

              {/* Error */}
              {!loading && error && (
                <Card.Root>
                  <Card.Body>
                    <VStack gap={4} py={8}>
                      <Icon fontSize="4xl" color="red.500">
                        <BookA />
                      </Icon>
                      <Text color="red.500" textAlign="center">
                        {error}
                      </Text>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              )}

              {/* Empty */}
              {!loading && !error && filtered.length === 0 && (
                <Card.Root>
                  <Card.Body>
                    <VStack gap={4} py={12}>
                      <Icon fontSize="4xl" color="gray.400">
                        <BookA />
                      </Icon>
                      <Heading size="md" color="gray.500">
                        No vocabularies found
                      </Heading>
                      <Text color="gray.400" textAlign="center">
                        {search
                          ? "Try a different search term"
                          : "Vocabulary collections will appear here once available"}
                      </Text>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              )}

              {/* Grid */}
              {!loading && !error && filtered.length > 0 && (
                <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={5}>
                  {filtered.map((vocab) => {
                    const deckCount = vocab.decks?.length ?? 0;
                    return (
                      <Card.Root
                        key={vocab.id}
                        cursor="pointer"
                        _hover={{
                          shadow: "lg",
                          borderColor: "brand.300",
                          transform: "translateY(-2px)",
                        }}
                        transition="all 0.2s"
                        onClick={() => router.push(`/vocab/${vocab.id}`)}
                      >
                        <Card.Body gap={3}>
                          <Flex align="center" gap={3}>
                            <Flex
                              w={10}
                              h={10}
                              bg="brand.50"
                              _dark={{ bg: "brand.900" }}
                              borderRadius="lg"
                              align="center"
                              justify="center"
                              flexShrink={0}
                            >
                              <BookA
                                size={20}
                                color="var(--chakra-colors-brand-500)"
                              />
                            </Flex>
                            <Heading size="sm" lineClamp={1}>
                              {vocab.title}
                            </Heading>
                          </Flex>

                          {vocab.description && (
                            <Text
                              fontSize="sm"
                              color="gray.600"
                              _dark={{ color: "gray.400" }}
                              lineClamp={2}
                            >
                              {vocab.description}
                            </Text>
                          )}

                          <HStack gap={2} mt={1}>
                            <Badge
                              colorPalette="blue"
                              variant="subtle"
                              px={2}
                              py={0.5}
                            >
                              <HStack gap={1}>
                                <Layers size={12} />
                                <Text>
                                  {deckCount}{" "}
                                  {deckCount === 1 ? "deck" : "decks"}
                                </Text>
                              </HStack>
                            </Badge>
                          </HStack>
                        </Card.Body>
                      </Card.Root>
                    );
                  })}
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
