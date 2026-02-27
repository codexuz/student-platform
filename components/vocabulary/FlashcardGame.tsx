"use client";

import { useState, useCallback } from "react";
import {
  Box,
  Flex,
  Text,
  Heading,
  Button,
  HStack,
  IconButton,
  Badge,
} from "@chakra-ui/react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Volume2,
  Check,
} from "lucide-react";
import type { IeltsDeckWord } from "@/components/vocabulary/types";

interface FlashcardGameProps {
  words: IeltsDeckWord[];
  onComplete: () => void;
}

export default function FlashcardGame({
  words,
  onComplete,
}: FlashcardGameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());

  const word = words[currentIndex];
  const progress = currentIndex + 1;
  const total = words.length;

  const goNext = useCallback(() => {
    setFlipped(false);
    if (currentIndex < words.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, words.length]);

  const goPrev = useCallback(() => {
    setFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const markKnown = () => {
    setKnownIds((prev) => new Set(prev).add(word.id));
    if (currentIndex < words.length - 1) {
      goNext();
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setFlipped(false);
    setKnownIds(new Set());
  };

  const playAudio = () => {
    if (!word.audio_url) return;
    new Audio(word.audio_url).play();
  };

  const isLastCard = currentIndex === words.length - 1;
  const allDone = knownIds.size === words.length;

  if (allDone) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        minH="400px"
        gap={6}
      >
        <Heading size="xl" color="green.500">
          🎉 Well done!
        </Heading>
        <Text fontSize="lg" color="gray.600" _dark={{ color: "gray.400" }}>
          You&apos;ve reviewed all {words.length} words!
        </Text>
        <HStack gap={3}>
          <Button variant="outline" onClick={restart}>
            <RotateCcw size={16} />
            Study Again
          </Button>
          <Button colorPalette="brand" onClick={onComplete}>
            Back to Deck
          </Button>
        </HStack>
      </Flex>
    );
  }

  return (
    <Flex direction="column" align="center" gap={6}>
      {/* Progress */}
      <HStack justify="space-between" w="full" maxW="500px">
        <Badge colorPalette="blue">
          {progress} / {total}
        </Badge>
        <Badge colorPalette="green">{knownIds.size} known</Badge>
      </HStack>

      {/* Progress bar */}
      <Box
        w="full"
        maxW="500px"
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
          w={`${(progress / total) * 100}%`}
        />
      </Box>

      {/* Card */}
      <Box
        w="full"
        maxW="500px"
        minH="320px"
        perspective="1000px"
        cursor="pointer"
        onClick={() => setFlipped(!flipped)}
      >
        <Box
          w="full"
          minH="320px"
          position="relative"
          transition="transform 0.5s"
          transformStyle="preserve-3d"
          transform={flipped ? "rotateY(180deg)" : "rotateY(0deg)"}
        >
          {/* Front */}
          <Flex
            position="absolute"
            inset={0}
            direction="column"
            align="center"
            justify="center"
            bg="white"
            _dark={{ bg: "gray.800" }}
            borderWidth="2px"
            borderColor="brand.200"
            _hover={{ borderColor: "brand.400" }}
            borderRadius="2xl"
            p={8}
            backfaceVisibility="hidden"
            gap={3}
            shadow="lg"
          >
            <Text fontSize="xs" color="gray.400" textTransform="uppercase">
              Tap to flip
            </Text>
            <Heading size="2xl" textAlign="center">
              {word.word}
            </Heading>
            {word.partOfSpeech && (
              <Badge variant="subtle" colorPalette="purple">
                {word.partOfSpeech}
              </Badge>
            )}
            {word.audio_url && (
              <IconButton
                aria-label="Play audio"
                variant="ghost"
                colorPalette="blue"
                size="sm"
                mt={2}
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio();
                }}
              >
                <Volume2 size={20} />
              </IconButton>
            )}
          </Flex>

          {/* Back */}
          <Flex
            position="absolute"
            inset={0}
            direction="column"
            align="center"
            justify="center"
            bg="white"
            _dark={{ bg: "gray.800" }}
            borderWidth="2px"
            borderColor="green.200"
            borderRadius="2xl"
            p={8}
            backfaceVisibility="hidden"
            transform="rotateY(180deg)"
            gap={4}
            shadow="lg"
          >
            <Text fontSize="xs" color="gray.400" textTransform="uppercase">
              Definition
            </Text>
            {word.definition && (
              <Text fontSize="lg" textAlign="center" fontWeight="medium">
                {word.definition}
              </Text>
            )}
            {word.example && (
              <Text
                fontSize="sm"
                color="gray.600"
                _dark={{ color: "gray.400" }}
                textAlign="center"
                fontStyle="italic"
              >
                &quot;{word.example}&quot;
              </Text>
            )}
            <HStack gap={4} mt={2} flexWrap="wrap" justify="center">
              {word.uzbek && (
                <Badge colorPalette="teal" size="lg">
                  🇺🇿 {word.uzbek}
                </Badge>
              )}
              {word.rus && (
                <Badge colorPalette="orange" size="lg">
                  🇷🇺 {word.rus}
                </Badge>
              )}
            </HStack>
          </Flex>
        </Box>
      </Box>

      {/* Controls */}
      <HStack gap={3}>
        <IconButton
          aria-label="Previous"
          variant="outline"
          size="lg"
          onClick={goPrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={20} />
        </IconButton>

        <Button
          colorPalette="green"
          variant="outline"
          size="lg"
          onClick={markKnown}
          disabled={knownIds.has(word.id)}
        >
          <Check size={18} />
          {knownIds.has(word.id) ? "Known" : "I Know This"}
        </Button>

        <IconButton
          aria-label="Next"
          variant="outline"
          size="lg"
          onClick={
            isLastCard && knownIds.size < words.length ? restart : goNext
          }
          disabled={isLastCard && knownIds.size >= words.length - 1}
        >
          <ChevronRight size={20} />
        </IconButton>
      </HStack>
    </Flex>
  );
}
