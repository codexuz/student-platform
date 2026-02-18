"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Flex, Spinner, Text, Button } from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import ReadingTestLayout from "@/components/practice-test/ReadingTestLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ieltsAPI } from "@/lib/api";
import { ieltsMockTestsAPI, ieltsTestsAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type { PartData, AnswerMap } from "@/components/practice-test/types";
import type { IELTSReadingPart } from "@/components/ielts-builder/types";
import {
  useIeltsAttempt,
  buildPartMappings,
  type PartQuestionMapping,
} from "@/hooks/useIeltsAttempt";

/**
 * Mock test reading module page.
 * Route: /mock-tests/[id]/reading
 *
 * - Timer starts automatically (autoStart)
 * - On timer end or submit → marks reading_finished and redirects to dashboard
 */
export default function MockReadingPage() {
  return (
    <ProtectedRoute>
      <MockReadingContent />
    </ProtectedRoute>
  );
}

function MockReadingContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mockTestId = params?.id;
  const testId = searchParams?.get("testId") ?? undefined;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parts, setParts] = useState<PartData[]>([]);
  const [timerMinutes, setTimerMinutes] = useState(60);
  const [readingId, setReadingId] = useState<string>("");
  const [partMappings, setPartMappings] = useState<PartQuestionMapping[]>([]);

  const { createAttempt, saveReadingAnswers, submitAttempt } = useIeltsAttempt({
    scope: "MODULE",
    entityId: readingId,
  });

  const attemptCreatedRef = useRef(false);

  useEffect(() => {
    if (!mockTestId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Get mock test to find the test_id, then fetch test to get reading module ID
        const mockRes = await ieltsMockTestsAPI.getById(mockTestId);
        const mockTest = mockRes?.data ?? mockRes;
        const tId = testId ?? mockTest?.test_id;

        if (!tId) {
          setError("No test ID found for this mock test.");
          return;
        }

        const testRes = await ieltsTestsAPI.getById(tId);
        const testData = testRes?.data ?? testRes;
        const rId = testData?.readings?.[0]?.id;

        if (!rId) {
          setError("No reading module found for this mock test.");
          return;
        }

        setReadingId(rId);

        // 2. Fetch the full reading module data
        const data = await ieltsAPI.getReadingTestById(rId);
        const reading = data?.data ?? data;

        if (!reading) {
          setError("Reading test not found.");
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
      } catch (err) {
        console.error("Failed to load reading test:", err);
        setError("Failed to load reading test.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mockTestId]);

  // Create attempt once data is loaded
  useEffect(() => {
    if (parts.length > 0 && readingId && !attemptCreatedRef.current) {
      attemptCreatedRef.current = true;
      createAttempt();
    }
  }, [parts, readingId, createAttempt]);

  // Mark reading_finished and go back to dashboard
  const markFinishedAndRedirect = useCallback(async () => {
    if (!mockTestId) return;
    try {
      await ieltsMockTestsAPI.update(mockTestId, {
        reading_finished: true,
      });
    } catch {
      toaster.error({ title: "Failed to mark reading as finished" });
    }
    router.push(`/mock-tests/${mockTestId}`);
  }, [mockTestId, router]);

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
      await submitAttempt();
      await markFinishedAndRedirect();
    },
    [saveReadingAnswers, submitAttempt, partMappings, markFinishedAndRedirect],
  );

  const handleFinish = useCallback(async () => {
    await markFinishedAndRedirect();
  }, [markFinishedAndRedirect]);

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
          {error || "No reading parts found."}
        </Text>
        <Button
          variant="outline"
          onClick={() => router.push(`/mock-tests/${mockTestId}`)}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Button>
      </Flex>
    );
  }

  return (
    <ReadingTestLayout
      parts={parts}
      timerMinutes={timerMinutes}
      autoStart
      onSubmit={handleSubmit}
      onSaveProgress={handleSaveProgress}
      onFinish={handleFinish}
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
