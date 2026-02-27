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
  Button,
  Badge,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  Layers,
  BookOpen,
  Brain,
  Puzzle,
  RotateCcw,
  Download,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import NotificationsDrawer from "@/components/dashboard/NotificationsDrawer";
import { ieltsVocabStudentAPI } from "@/lib/api";
import type {
  IeltsVocabularyDeck,
  IeltsDeckWord,
  Paginated,
} from "@/components/vocabulary/types";
import FlashcardGame from "@/components/vocabulary/FlashcardGame";
import MultipleChoiceGame from "@/components/vocabulary/MultipleChoiceGame";
import MatchingGame from "@/components/vocabulary/MatchingGame";

type GameMode = "select" | "flashcard" | "multiple-choice" | "matching";

const GAME_MODES = [
  {
    id: "flashcard" as const,
    label: "Flashcards",
    description: "Flip cards to study words and definitions",
    icon: BookOpen,
    color: "blue",
    minWords: 1,
  },
  {
    id: "multiple-choice" as const,
    label: "Multiple Choice",
    description: "Test your knowledge with 4-option quizzes",
    icon: Brain,
    color: "green",
    minWords: 4,
  },
  {
    id: "matching" as const,
    label: "Matching",
    description: "Match words with their definitions",
    icon: Puzzle,
    color: "purple",
    minWords: 2,
  },
];

export default function StudentDeckPlayPage() {
  const router = useRouter();
  const params = useParams();
  const vocabId = params.id as string;
  const deckId = params.deckId as string;

  const [loading, setLoading] = useState(true);
  const [deck, setDeck] = useState<IeltsVocabularyDeck | null>(null);
  const [words, setWords] = useState<IeltsDeckWord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<GameMode>("select");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [deckRes, wordsRes] = await Promise.all([
          ieltsVocabStudentAPI.getDeck(deckId),
          ieltsVocabStudentAPI.getWords(deckId, 1, 500),
        ]);

        setDeck(deckRes.data ?? deckRes);

        const wordsData: Paginated<IeltsDeckWord> = wordsRes;
        setWords(wordsData.data ?? []);
      } catch (err) {
        console.error("Failed to fetch deck:", err);
        setError("Failed to load deck data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [deckId]);

  const handleBackToSelect = () => setMode("select");

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
                onClick={() => {
                  if (mode !== "select") {
                    setMode("select");
                  } else {
                    router.push(`/vocab/${vocabId}`);
                  }
                }}
              >
                <ArrowLeft size={16} />
              </Button>
              <Heading size={{ base: "sm", md: "md" }} lineClamp={1}>
                {mode === "select"
                  ? (deck?.title ?? "Deck")
                  : (GAME_MODES.find((g) => g.id === mode)?.label ??
                    "Practice")}
              </Heading>
            </HStack>
            <HStack gap={{ base: 2, md: 4 }}>
              {mode !== "select" && (
                <Button variant="ghost" size="sm" onClick={handleBackToSelect}>
                  <RotateCcw size={16} />
                  <Text display={{ base: "none", md: "inline" }} ml={1}>
                    Change Mode
                  </Text>
                </Button>
              )}
              <NotificationsDrawer />
            </HStack>
          </Flex>

          {/* Content */}
          <Container
            maxW="5xl"
            py={{ base: 4, md: 6, lg: 8 }}
            px={{ base: 4, md: 6 }}
          >
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
                <Text color="gray.500">Loading deck...</Text>
              </Flex>
            )}

            {/* Error */}
            {!loading && error && (
              <Card.Root>
                <Card.Body>
                  <VStack gap={4} py={8}>
                    <Icon fontSize="4xl" color="red.500">
                      <Layers />
                    </Icon>
                    <Text color="red.500">{error}</Text>
                  </VStack>
                </Card.Body>
              </Card.Root>
            )}

            {/* No Words */}
            {!loading && !error && words.length === 0 && (
              <Card.Root>
                <Card.Body>
                  <VStack gap={4} py={12}>
                    <Icon fontSize="4xl" color="gray.400">
                      <Layers />
                    </Icon>
                    <Heading size="md" color="gray.500">
                      No words in this deck
                    </Heading>
                    <Text color="gray.400" textAlign="center">
                      Words will appear here once the teacher adds them.
                    </Text>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/vocab/${vocabId}`)}
                    >
                      Back to Decks
                    </Button>
                  </VStack>
                </Card.Body>
              </Card.Root>
            )}

            {/* Game Mode Selection */}
            {!loading && !error && words.length > 0 && mode === "select" && (
              <VStack gap={6} alignItems="stretch">
                <Flex
                  align={{ base: "start", md: "center" }}
                  justify="space-between"
                  direction={{ base: "column", md: "row" }}
                  gap={3}
                >
                  <Box>
                    <Heading size={{ base: "lg", md: "xl" }} mb={2}>
                      Choose Practice Mode
                    </Heading>
                    <Text color="gray.600" _dark={{ color: "gray.400" }}>
                      {deck?.title} &middot; {words.length}{" "}
                      {words.length === 1 ? "word" : "words"} available
                    </Text>
                  </Box>
                  <Button
                    variant="outline"
                    size="sm"
                    flexShrink={0}
                    onClick={async () => {
                      const { default: jsPDF } = await import("jspdf");
                      const autoTable = (await import("jspdf-autotable"))
                        .default;

                      // Load Cyrillic-supporting font
                      const fontBytes = await fetch(
                        "/fonts/Roboto-Regular.ttf",
                      ).then((r) => r.arrayBuffer());
                      const bytes = new Uint8Array(fontBytes);
                      let binary = "";
                      for (let i = 0; i < bytes.length; i += 1024) {
                        binary += String.fromCharCode(
                          ...bytes.subarray(i, i + 1024),
                        );
                      }
                      const fontBase64 = btoa(binary);

                      const doc = new jsPDF({ orientation: "landscape" });

                      // Register Roboto for UTF-8 / Cyrillic support
                      doc.addFileToVFS("Roboto-Regular.ttf", fontBase64);
                      doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
                      doc.addFont("Roboto-Regular.ttf", "Roboto", "bold");
                      doc.setFont("Roboto");

                      doc.setFontSize(16);
                      doc.text(deck?.title ?? "Vocabulary", 14, 18);

                      const head = [
                        [
                          "#",
                          "Word",
                          "Part of Speech",
                          "Definition",
                          "Example",
                          "Uzbek",
                          "Russian",
                        ],
                      ];
                      const body = words.map((w, i) => [
                        String(i + 1),
                        w.word,
                        w.partOfSpeech ?? "",
                        w.definition ?? "",
                        w.example ?? "",
                        w.uzbek ?? "",
                        w.rus ?? "",
                      ]);

                      autoTable(doc, {
                        head,
                        body,
                        startY: 24,
                        styles: {
                          font: "Roboto",
                          fontSize: 9,
                          cellPadding: 3,
                        },
                        headStyles: { fillColor: [59, 130, 246] },
                        alternateRowStyles: { fillColor: [245, 247, 250] },
                      });

                      doc.save(
                        `${(deck?.title ?? "vocabulary").replace(/\s+/g, "_")}.pdf`,
                      );
                    }}
                  >
                    <Download size={16} />
                    Download as PDF
                  </Button>
                </Flex>

                <SimpleGrid columns={{ base: 1, md: 3 }} gap={5}>
                  {GAME_MODES.map((game) => {
                    const GameIcon = game.icon;
                    const disabled = words.length < game.minWords;
                    return (
                      <Card.Root
                        key={game.id}
                        cursor={disabled ? "not-allowed" : "pointer"}
                        opacity={disabled ? 0.5 : 1}
                        _hover={
                          disabled
                            ? {}
                            : {
                                shadow: "lg",
                                borderColor: `${game.color}.300`,
                                transform: "translateY(-2px)",
                              }
                        }
                        transition="all 0.2s"
                        onClick={() => {
                          if (!disabled) setMode(game.id);
                        }}
                      >
                        <Card.Body gap={4} py={8} textAlign="center">
                          <Flex justify="center">
                            <Flex
                              w={16}
                              h={16}
                              bg={`${game.color}.50`}
                              _dark={{ bg: `${game.color}.900` }}
                              borderRadius="full"
                              align="center"
                              justify="center"
                            >
                              <GameIcon
                                size={28}
                                color={`var(--chakra-colors-${game.color}-500)`}
                              />
                            </Flex>
                          </Flex>
                          <Heading size="md">{game.label}</Heading>
                          <Text
                            fontSize="sm"
                            color="gray.600"
                            _dark={{ color: "gray.400" }}
                          >
                            {game.description}
                          </Text>
                          {disabled && (
                            <Badge colorPalette="orange" variant="subtle">
                              Needs at least {game.minWords} words
                            </Badge>
                          )}
                        </Card.Body>
                      </Card.Root>
                    );
                  })}
                </SimpleGrid>
              </VStack>
            )}

            {/* Flashcard Game */}
            {!loading && !error && words.length > 0 && mode === "flashcard" && (
              <FlashcardGame words={words} onComplete={handleBackToSelect} />
            )}

            {/* Multiple Choice Game */}
            {!loading &&
              !error &&
              words.length >= 4 &&
              mode === "multiple-choice" && (
                <MultipleChoiceGame
                  words={words}
                  onComplete={handleBackToSelect}
                />
              )}

            {/* Matching Game */}
            {!loading && !error && words.length >= 2 && mode === "matching" && (
              <MatchingGame words={words} onComplete={handleBackToSelect} />
            )}
          </Container>
        </Box>

        <MobileBottomNav />
      </Flex>
    </ProtectedRoute>
  );
}
