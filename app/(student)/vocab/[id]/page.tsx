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
  Button,
} from "@chakra-ui/react";
import { BookA, Layers, ArrowLeft, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import { ieltsVocabStudentAPI } from "@/lib/api";
import type {
  IeltsVocabulary,
  IeltsVocabularyDeck,
} from "@/components/vocabulary/types";

export default function StudentVocabularyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const vocabId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [vocabulary, setVocabulary] = useState<IeltsVocabulary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await ieltsVocabStudentAPI.getById(vocabId);
        setVocabulary(res.data ?? res);
      } catch (err) {
        console.error("Failed to fetch vocabulary:", err);
        setError("Failed to load vocabulary details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [vocabId]);

  const decks: IeltsVocabularyDeck[] = vocabulary?.decks ?? [];

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
            _dark={{ bg: "gray.800" }}
            borderBottomWidth="1px"
          >
            <HStack gap={2}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/vocab")}
              >
                <ArrowLeft size={16} />
              </Button>
              <Heading size={{ base: "sm", md: "md" }} lineClamp={1}>
                {vocabulary?.title ?? "Vocabulary"}
              </Heading>
            </HStack>
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
                  <Text color="gray.500">Loading...</Text>
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
                      <Text color="red.500">{error}</Text>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              )}

              {/* Vocabulary Info */}
              {!loading && !error && vocabulary && (
                <>
                  <Box>
                    <Heading size={{ base: "lg", md: "xl" }} mb={2}>
                      {vocabulary.title}
                    </Heading>
                    {vocabulary.description && (
                      <Text color="gray.600" _dark={{ color: "gray.400" }}>
                        {vocabulary.description}
                      </Text>
                    )}
                  </Box>

                  <HStack gap={2}>
                    <Badge colorPalette="blue" variant="subtle" px={2} py={1}>
                      <HStack gap={1}>
                        <Layers size={14} />
                        <Text>
                          {decks.length} {decks.length === 1 ? "deck" : "decks"}
                        </Text>
                      </HStack>
                    </Badge>
                  </HStack>

                  {/* Decks Grid */}
                  {decks.length === 0 ? (
                    <Card.Root>
                      <Card.Body>
                        <VStack gap={4} py={12}>
                          <Icon fontSize="4xl" color="gray.400">
                            <Layers />
                          </Icon>
                          <Heading size="md" color="gray.500">
                            No decks yet
                          </Heading>
                          <Text color="gray.400" textAlign="center">
                            This vocabulary collection doesn&apos;t have any
                            decks yet.
                          </Text>
                        </VStack>
                      </Card.Body>
                    </Card.Root>
                  ) : (
                    <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={5}>
                      {decks.map((deck) => {
                        const wordCount = deck.words?.length ?? 0;
                        return (
                          <Card.Root
                            key={deck.id}
                            cursor="pointer"
                            _hover={{
                              shadow: "lg",
                              borderColor: "brand.300",
                              transform: "translateY(-2px)",
                            }}
                            transition="all 0.2s"
                            onClick={() =>
                              router.push(`/vocab/${vocabId}/decks/${deck.id}`)
                            }
                          >
                            <Card.Body gap={3}>
                              <Flex align="center" gap={3}>
                                <Flex
                                  w={10}
                                  h={10}
                                  bg="purple.50"
                                  _dark={{ bg: "purple.900" }}
                                  borderRadius="lg"
                                  align="center"
                                  justify="center"
                                  flexShrink={0}
                                >
                                  <Layers
                                    size={20}
                                    color="var(--chakra-colors-purple-500)"
                                  />
                                </Flex>
                                <Box flex={1} minW={0}>
                                  <Heading size="sm" lineClamp={1}>
                                    {deck.title}
                                  </Heading>
                                  <Text
                                    fontSize="xs"
                                    color="gray.500"
                                    _dark={{ color: "gray.400" }}
                                  >
                                    {wordCount}{" "}
                                    {wordCount === 1 ? "word" : "words"}
                                  </Text>
                                </Box>
                              </Flex>

                              <HStack gap={2} mt={1}>
                                <Badge
                                  colorPalette="green"
                                  variant="subtle"
                                  px={2}
                                  py={0.5}
                                >
                                  <HStack gap={1}>
                                    <Sparkles size={12} />
                                    <Text>Practice</Text>
                                  </HStack>
                                </Badge>
                              </HStack>
                            </Card.Body>
                          </Card.Root>
                        );
                      })}
                    </SimpleGrid>
                  )}
                </>
              )}
            </VStack>
          </Container>
        </Box>

        <MobileBottomNav />
      </Flex>
    </ProtectedRoute>
  );
}
