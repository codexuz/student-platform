"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  Text,
  Heading,
  Button,
  HStack,
  VStack,
  Badge,
} from "@chakra-ui/react";
import { RotateCcw } from "lucide-react";
import type { IeltsDeckWord } from "@/components/vocabulary/types";

interface MatchingGameProps {
  words: IeltsDeckWord[];
  onComplete: () => void;
}

interface MatchItem {
  id: string;
  text: string;
  type: "word" | "definition";
  wordId: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const BATCH_SIZE = 6; // Number of pairs per round

export default function MatchingGame({ words, onComplete }: MatchingGameProps) {
  // Split words into batches
  const allBatches = useMemo(() => {
    const shuffled = shuffle(words);
    const batches: IeltsDeckWord[][] = [];
    for (let i = 0; i < shuffled.length; i += BATCH_SIZE) {
      batches.push(shuffled.slice(i, i + BATCH_SIZE));
    }
    return batches;
  }, [words]);

  const [batchIndex, setBatchIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<[string, string] | null>(null);
  const [moves, setMoves] = useState(0);
  const startTimeRef = useRef(0);
  const [elapsed, setElapsed] = useState(0);

  // Set start time on mount (avoids impure Date.now during render)
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  const currentBatch = useMemo(
    () => allBatches[batchIndex] ?? [],
    [allBatches, batchIndex],
  );
  const isLastBatch = batchIndex >= allBatches.length - 1;

  // Build items for current batch
  const items = useMemo(() => {
    const leftItems: MatchItem[] = currentBatch.map((w) => ({
      id: `w-${w.id}`,
      text: w.word,
      type: "word" as const,
      wordId: w.id,
    }));

    const rightItems: MatchItem[] = currentBatch.map((w) => ({
      id: `d-${w.id}`,
      text: w.definition || w.uzbek || w.rus || "—",
      type: "definition" as const,
      wordId: w.id,
    }));

    return {
      left: shuffle(leftItems),
      right: shuffle(rightItems),
    };
  }, [currentBatch]);

  const batchCompleted = matchedIds.size === currentBatch.length * 2;
  const allCompleted = batchCompleted && isLastBatch;

  // Timer — stops when all completed
  useEffect(() => {
    if (allCompleted) return;
    const timer = setInterval(
      () => setElapsed(Date.now() - startTimeRef.current),
      1000,
    );
    return () => clearInterval(timer);
  }, [allCompleted]);

  const handleSelect = (item: MatchItem) => {
    if (matchedIds.has(item.id)) return;

    // Clear wrong highlight
    if (wrongPair) setWrongPair(null);

    if (!selectedId) {
      setSelectedId(item.id);
      return;
    }

    // Find the previously selected item
    const allItems = [...items.left, ...items.right];
    const prev = allItems.find((i) => i.id === selectedId);
    if (!prev) {
      setSelectedId(item.id);
      return;
    }

    // Don't allow selecting same type
    if (prev.type === item.type) {
      setSelectedId(item.id);
      return;
    }

    setMoves((m) => m + 1);

    // Check if same wordId
    if (prev.wordId === item.wordId) {
      // Match!
      setMatchedIds((s) => {
        const next = new Set(s);
        next.add(prev.id);
        next.add(item.id);
        return next;
      });
      setSelectedId(null);
    } else {
      // Wrong pair
      setWrongPair([prev.id, item.id]);
      setSelectedId(null);
      setTimeout(() => setWrongPair(null), 800);
    }
  };

  const handleNextBatch = () => {
    setBatchIndex((i) => i + 1);
    setMatchedIds(new Set());
    setSelectedId(null);
    setWrongPair(null);
  };

  const restart = () => {
    setBatchIndex(0);
    setMatchedIds(new Set());
    setSelectedId(null);
    setWrongPair(null);
    setMoves(0);
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, "0")}`;
  };

  const getItemStyle = (item: MatchItem) => {
    if (matchedIds.has(item.id)) {
      return {
        bg: "green.50",
        darkBg: "green.900",
        borderColor: "green.400",
        opacity: 0.6,
      };
    }
    if (wrongPair?.includes(item.id)) {
      return {
        bg: "red.50",
        darkBg: "red.900",
        borderColor: "red.400",
        opacity: 1,
      };
    }
    if (selectedId === item.id) {
      return {
        bg: "brand.50",
        darkBg: "brand.900",
        borderColor: "brand.400",
        opacity: 1,
      };
    }
    return {
      bg: "white",
      darkBg: "gray.800",
      borderColor: "gray.200",
      opacity: 1,
    };
  };

  // Finished all
  if (allCompleted) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        minH="400px"
        gap={6}
      >
        <Heading size="xl" color="green.500">
          🎉 All matched!
        </Heading>
        <Text fontSize="lg" color="gray.600" _dark={{ color: "gray.400" }}>
          {words.length} pairs in {moves} moves — {formatTime(elapsed)}
        </Text>
        <HStack gap={3}>
          <Button variant="outline" onClick={restart}>
            <RotateCcw size={16} />
            Play Again
          </Button>
          <Button colorPalette="brand" onClick={onComplete}>
            Back to Deck
          </Button>
        </HStack>
      </Flex>
    );
  }

  return (
    <Flex direction="column" align="center" gap={6} w="full">
      {/* Stats bar */}
      <HStack justify="space-between" w="full" maxW="700px" flexWrap="wrap">
        <Badge colorPalette="blue">
          Round {batchIndex + 1} / {allBatches.length}
        </Badge>
        <Badge colorPalette="purple">{moves} moves</Badge>
        <Badge colorPalette="orange">⏱ {formatTime(elapsed)}</Badge>
      </HStack>

      {/* Progress bar */}
      <Box
        w="full"
        maxW="700px"
        h="2"
        bg="gray.200"
        borderRadius="full"
        _dark={{ bg: "gray.700" }}
      >
        <Box
          h="full"
          bg="brand.500"
          borderRadius="full"
          transition="width 0.3s"
          w={`${(matchedIds.size / (currentBatch.length * 2)) * 100}%`}
        />
      </Box>

      <Text fontSize="sm" color="gray.500">
        Match each word with its definition
      </Text>

      {/* Game grid — two columns */}
      <Flex
        w="full"
        maxW="700px"
        gap={4}
        direction={{ base: "column", md: "row" }}
      >
        {/* Words column */}
        <VStack flex={1} gap={3}>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="gray.400"
            textTransform="uppercase"
          >
            Words
          </Text>
          {items.left.map((item) => {
            const style = getItemStyle(item);
            return (
              <Box
                key={item.id}
                w="full"
                p={4}
                borderWidth="2px"
                borderColor={style.borderColor}
                bg={style.bg}
                _dark={{ bg: style.darkBg, borderColor: style.borderColor }}
                borderRadius="xl"
                cursor={matchedIds.has(item.id) ? "default" : "pointer"}
                opacity={style.opacity}
                onClick={() => handleSelect(item)}
                transition="all 0.2s"
                _hover={
                  matchedIds.has(item.id)
                    ? {}
                    : { borderColor: "brand.300", shadow: "sm" }
                }
                textAlign="center"
              >
                <Text fontWeight="bold" fontSize="md">
                  {item.text}
                </Text>
              </Box>
            );
          })}
        </VStack>

        {/* Definitions column */}
        <VStack flex={1} gap={3}>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="gray.400"
            textTransform="uppercase"
          >
            Definitions
          </Text>
          {items.right.map((item) => {
            const style = getItemStyle(item);
            return (
              <Box
                key={item.id}
                w="full"
                p={4}
                borderWidth="2px"
                borderColor={style.borderColor}
                bg={style.bg}
                _dark={{ bg: style.darkBg, borderColor: style.borderColor }}
                borderRadius="xl"
                cursor={matchedIds.has(item.id) ? "default" : "pointer"}
                opacity={style.opacity}
                onClick={() => handleSelect(item)}
                transition="all 0.2s"
                _hover={
                  matchedIds.has(item.id)
                    ? {}
                    : { borderColor: "brand.300", shadow: "sm" }
                }
                textAlign="center"
              >
                <Text fontSize="sm">{item.text}</Text>
              </Box>
            );
          })}
        </VStack>
      </Flex>

      {/* Next batch button */}
      {batchCompleted && !isLastBatch && (
        <Button colorPalette="brand" size="lg" onClick={handleNextBatch}>
          Next Round →
        </Button>
      )}
    </Flex>
  );
}
