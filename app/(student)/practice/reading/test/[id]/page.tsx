"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Flex, Spinner, Text, Button } from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import ReadingTestLayout from "@/components/practice-test/ReadingTestLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ieltsAPI } from "@/lib/api";
import type { PartData, AnswerMap } from "@/components/practice-test/types";
import type { IELTSReadingPart } from "@/components/ielts-builder/types";
import {
  useIeltsAttempt,
  buildPartMappings,
  type PartQuestionMapping,
} from "@/hooks/useIeltsAttempt";

/**
 * Full reading test practice page.
 * Route: /practice/reading/test/[id]
 * Scope: MODULE — saves answers for all parts in a reading module.
 */
export default function ReadingTestPracticePage() {
  return (
    <ProtectedRoute>
      <ReadingTestPracticeContent />
    </ProtectedRoute>
  );
}

function ReadingTestPracticeContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parts, setParts] = useState<PartData[]>([]);
  const [timerMinutes, setTimerMinutes] = useState(60);
  const [partMappings, setPartMappings] = useState<PartQuestionMapping[]>([]);

  const {
    attempt,
    isSaving,
    createAttempt,
    saveReadingAnswers,
    submitAttempt,
  } = useIeltsAttempt({ scope: "MODULE", entityId: id });

  const attemptCreatedRef = useRef(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await ieltsAPI.getReadingTestById(id);
        const reading = data?.data ?? data;

        if (!reading) {
          setError("Reading not found");
          return;
        }

        const allParts: PartData[] = [];

        if (reading.parts?.length) {
          for (const part of reading.parts) {
            allParts.push(transformReadingPart(part));
          }
        }

        allParts.sort((a, b) => a.partLabel.localeCompare(b.partLabel));

        const totalMinutes =
          reading.parts?.reduce(
            (sum: number, p: IELTSReadingPart) =>
              sum + (p.timeLimitMinutes ?? 20),
            0,
          ) ?? 60;
        setTimerMinutes(totalMinutes);

        setParts(allParts);
        setPartMappings(buildPartMappings(allParts));
      } catch (err: unknown) {
        console.error("Failed to load reading test:", err);
        setError("Failed to load reading test. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Create attempt once data is loaded
  useEffect(() => {
    if (parts.length > 0 && !attemptCreatedRef.current) {
      attemptCreatedRef.current = true;
      createAttempt();
    }
  }, [parts, createAttempt]);

  const handleSaveProgress = useCallback(
    async (answers: AnswerMap) => {
      if (partMappings.length > 0) {
        await saveReadingAnswers(answers, partMappings);
      }
    },
    [saveReadingAnswers, partMappings],
  );

  const handleSubmit = useCallback(
    async (answers: AnswerMap) => {
      if (partMappings.length > 0) {
        await saveReadingAnswers(answers, partMappings);
      }
      const success = await submitAttempt();
      if (success && attempt?.id) {
        router.push(`/practice/results/${attempt.id}`);
      }
    },
    [saveReadingAnswers, submitAttempt, partMappings, attempt?.id, router],
  );

  if (loading) {
    return (
      <Flex
        h="100vh"
        align="center"
        justify="center"
        bg="gray.50"
        _dark={{ bg: "gray.900" }}
      >
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  if (error || parts.length === 0) {
    return (
      <Flex
        h="100vh"
        align="center"
        justify="center"
        direction="column"
        gap={4}
        bg="gray.50"
        _dark={{ bg: "gray.900" }}
      >
        <Text color="red.500" fontSize="lg">
          {error || "No reading parts found in this test."}
        </Text>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft size={16} />
          Go Back
        </Button>
      </Flex>
    );
  }

  return (
    <ReadingTestLayout
      parts={parts}
      timerMinutes={timerMinutes}
      onSubmit={handleSubmit}
      onSaveProgress={handleSaveProgress}
    />
  );
}

function transformReadingPart(part: IELTSReadingPart): PartData {
  const questions = part.questions ?? [];
  const allNums: number[] = [];

  for (const q of questions) {
    if (q.questions?.length) {
      for (const sub of q.questions) {
        if (sub.questionNumber != null) allNums.push(sub.questionNumber);
      }
    } else if (q.questionNumber != null) {
      allNums.push(q.questionNumber);
    }
  }

  allNums.sort((a, b) => a - b);
  const range: [number, number] =
    allNums.length > 0 ? [allNums[0], allNums[allNums.length - 1]] : [0, 0];

  const partLabel = part.part
    ? `Part ${part.part.replace("PART_", "")}`
    : "Part 1";

  return {
    id: part.id,
    partLabel,
    title: part.title ?? "",
    content: part.content ?? "",
    instruction:
      range[0] > 0
        ? `Read the text and answer questions ${range[0]}-${range[1]}.`
        : "Read the text and answer the questions.",
    questions,
    totalQuestions: allNums.length,
    questionRange: range,
  };
}
