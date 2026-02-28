"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Flex,
  Text,
  Heading,
  Button,
  HStack,
  VStack,
  Badge,
  Icon,
} from "@chakra-ui/react";
import { RotateCcw, Check, X, Volume2 } from "lucide-react";
import type { IeltsDeckWord } from "@/components/vocabulary/types";

interface MultipleChoiceGameProps {
  words: IeltsDeckWord[];
  onComplete: () => void;
}

interface Question {
  word: IeltsDeckWord;
  options: string[];
  correctIndex: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(words: IeltsDeckWord[]): Question[] {
  const allDefinitions = words
    .map((w) => w.definition || w.uzbek || w.rus || "")
    .filter(Boolean);

  return shuffle(words).map((word) => {
    const correct = word.definition || word.uzbek || word.rus || word.word;

    // Pick 3 random wrong answers
    const wrongs = shuffle(allDefinitions.filter((d) => d !== correct)).slice(
      0,
      3,
    );

    // If not enough wrong answers, pad with generic
    while (wrongs.length < 3) {
      wrongs.push("—");
    }

    const options = shuffle([correct, ...wrongs]);
    return {
      word,
      options,
      correctIndex: options.indexOf(correct),
    };
  });
}

export default function MultipleChoiceGame({
  words,
  onComplete,
}: MultipleChoiceGameProps) {
  const questions = useMemo(() => buildQuestions(words), [words]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  const q = questions[currentIndex];
  const total = questions.length;
  const isFinished = currentIndex >= total;

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const isCorrect = idx === q.correctIndex;
    if (isCorrect) setScore((s) => s + 1);
    setResults((r) => [...r, isCorrect]);
  };

  const handleNext = () => {
    setSelected(null);
    setAnswered(false);
    setCurrentIndex((i) => i + 1);
  };

  const restart = () => {
    setCurrentIndex(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setResults([]);
  };

  const playAudio = () => {
    if (!q.word.audio_url) return;
    new Audio(q.word.audio_url).play();
  };

  if (isFinished) {
    const pct = Math.round((score / total) * 100);
    const emoji = pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪";
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        minH="400px"
        gap={6}
      >
        <Heading size="xl" color={pct >= 80 ? "green.500" : "orange.500"}>
          {emoji} {pct}% Correct
        </Heading>
        <Text fontSize="lg" color="gray.600" _dark={{ color: "gray.400" }}>
          You got {score} out of {total} right!
        </Text>

        {/* Mini result strip */}
        <HStack gap={1} flexWrap="wrap" justify="center">
          {results.map((r, i) => (
            <Box
              key={i}
              w="8"
              h="8"
              borderRadius="md"
              bg={r ? "green.100" : "red.100"}
              _dark={{ bg: r ? "green.900" : "red.900" }}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon color={r ? "green.500" : "red.500"} fontSize="sm">
                {r ? <Check size={14} /> : <X size={14} />}
              </Icon>
            </Box>
          ))}
        </HStack>

        <HStack gap={3}>
          <Button variant="outline" onClick={restart}>
            <RotateCcw size={16} />
            Try Again
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
      {/* Progress */}
      <HStack justify="space-between" w="full" maxW="500px">
        <Badge colorPalette="blue">
          {currentIndex + 1} / {total}
        </Badge>
        <Badge colorPalette="green">Score: {score}</Badge>
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
          w={`${((currentIndex + 1) / total) * 100}%`}
        />
      </Box>

      {/* Question */}
      <Flex
        direction="column"
        align="center"
        gap={3}
        bg="white"
        _dark={{ bg: "gray.800" }}
        borderWidth="1px"
        borderRadius="2xl"
        p={8}
        w="full"
        maxW="500px"
        shadow="md"
      >
        <Text fontSize="xs" color="gray.400" textTransform="uppercase">
          What does this word mean?
        </Text>
        <HStack>
          <Heading size="xl" textAlign="center">
            {q.word.word}
          </Heading>
          {q.word.audio_url && (
            <IconButton
              aria-label="Play audio"
              variant="ghost"
              colorPalette="blue"
              size="xs"
              onClick={playAudio}
            >
              <Volume2 size={16} />
            </IconButton>
          )}
        </HStack>
        {q.word.partOfSpeech && (
          <Badge variant="subtle" colorPalette="purple">
            {q.word.partOfSpeech}
          </Badge>
        )}
      </Flex>

      {/* Options */}
      <VStack w="full" maxW="500px" gap={3}>
        {q.options.map((opt, idx) => {
          let borderColor = "gray.200";
          let darkBorderColor = "gray.600";
          let bg = "white";
          let darkBg = "gray.800";

          if (answered) {
            if (idx === q.correctIndex) {
              borderColor = "green.400";
              darkBorderColor = "green.400";
              bg = "green.50";
              darkBg = "green.900";
            } else if (idx === selected && idx !== q.correctIndex) {
              borderColor = "red.400";
              darkBorderColor = "red.400";
              bg = "red.50";
              darkBg = "red.900";
            }
          } else if (idx === selected) {
            borderColor = "brand.400";
            darkBorderColor = "brand.400";
          }

          return (
            <Box
              key={idx}
              w="full"
              p={4}
              borderWidth="2px"
              borderColor={borderColor}
              bg={bg}
              _dark={{ bg: darkBg, borderColor: darkBorderColor }}
              borderRadius="xl"
              cursor={answered ? "default" : "pointer"}
              onClick={() => handleSelect(idx)}
              transition="all 0.2s"
              _hover={
                answered ? {} : { borderColor: "brand.300", shadow: "sm" }
              }
            >
              <HStack justify="space-between">
                <Text fontWeight="medium">{opt}</Text>
                {answered && idx === q.correctIndex && (
                  <Icon color="green.500">
                    <Check size={18} />
                  </Icon>
                )}
                {answered && idx === selected && idx !== q.correctIndex && (
                  <Icon color="red.500">
                    <X size={18} />
                  </Icon>
                )}
              </HStack>
            </Box>
          );
        })}
      </VStack>

      {/* Next button */}
      {answered && (
        <Button colorPalette="brand" size="lg" onClick={handleNext}>
          {currentIndex === total - 1 ? "See Results" : "Next Question"}
        </Button>
      )}
    </Flex>
  );
}

function IconButton({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button {...props} p={0} minW="auto">
      {children}
    </Button>
  );
}
