"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Flex, Spinner, Text, Button } from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import WritingTestLayout from "@/components/practice-test/WritingTestLayout";
import type { WritingPartData } from "@/components/practice-test/WritingTestLayout";
import { ieltsAPI } from "@/lib/api";
import { ieltsMockTestsAPI, ieltsTestsAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import { useIeltsAttempt } from "@/hooks/useIeltsAttempt";

/**
 * Mock test writing module page.
 * Route: /mock-tests/[id]/writing
 *
 * - Timer starts automatically (autoStart)
 * - On timer end or submit → marks writing_finished and redirects to dashboard
 */
export default function MockWritingPage() {
  return (
    <ProtectedRoute>
      <MockWritingContent />
    </ProtectedRoute>
  );
}

function MockWritingContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mockTestId = params?.id;
  const testId = searchParams?.get("testId") ?? undefined;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parts, setParts] = useState<WritingPartData[]>([]);
  const [writingId, setWritingId] = useState<string>("");

  const { createAttempt, saveWritingAnswers, submitAttempt } = useIeltsAttempt({
    scope: "MODULE",
    entityId: writingId,
  });

  const attemptCreatedRef = useRef(false);

  useEffect(() => {
    if (!mockTestId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Get mock test to find the writing module ID
        // 1. Get mock test to find the test_id, then fetch test to get writing module ID
        const mockRes = await ieltsMockTestsAPI.getById(mockTestId);
        const mockTest = mockRes?.data ?? mockRes;
        const tId = testId ?? mockTest?.test_id;

        if (!tId) {
          setError("No test ID found for this mock test.");
          return;
        }

        const testRes = await ieltsTestsAPI.getById(tId);
        const testData = testRes?.data ?? testRes;
        const wId = testData?.writings?.[0]?.id;

        if (!wId) {
          setError("No writing module found for this mock test.");
          return;
        }

        setWritingId(wId);

        // 2. Fetch the full writing module data
        const data = await ieltsAPI.getWritingTestById(wId);
        const result = data?.data ?? data;

        if (!result || !result.tasks?.length) {
          setError("No writing tasks found.");
          return;
        }

        const sortedTasks = [...result.tasks].sort(
          (a: { task: string }, b: { task: string }) =>
            a.task.localeCompare(b.task),
        );

        const writingParts: WritingPartData[] = sortedTasks.map(
          (task: {
            id?: string;
            _id?: string;
            task: string;
            prompt?: string;
            image_url?: string;
            min_words?: number;
            suggested_time?: number;
          }) => {
            const taskNum = task.task?.replace("TASK_", "") || "1";
            return {
              id: task.id || task._id || "",
              partLabel: `Task ${taskNum}`,
              task: task.task || "TASK_1",
              prompt: task.prompt,
              image_url: task.image_url,
              min_words: task.min_words,
              suggested_time: task.suggested_time,
            };
          },
        );

        setParts(writingParts);
      } catch (err) {
        console.error("Failed to load writing test:", err);
        setError("Failed to load writing test.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mockTestId]);

  // Create attempt once data is loaded
  useEffect(() => {
    if (parts.length > 0 && writingId && !attemptCreatedRef.current) {
      attemptCreatedRef.current = true;
      createAttempt();
    }
  }, [parts, writingId, createAttempt]);

  // Mark writing_finished and go back to dashboard
  const markFinishedAndRedirect = useCallback(async () => {
    if (!mockTestId) return;
    try {
      await ieltsMockTestsAPI.update(mockTestId, {
        writing_finished: true,
      });
    } catch {
      toaster.error({ title: "Failed to mark writing as finished" });
    }
    router.push(`/mock-tests/${mockTestId}`);
  }, [mockTestId, router]);

  const handleSaveProgress = useCallback(
    async (essays: Record<string, string>) => {
      await saveWritingAnswers(essays);
    },
    [saveWritingAnswers],
  );

  const handleSubmit = useCallback(
    async (essays: Record<string, string>) => {
      await saveWritingAnswers(essays);
      await submitAttempt();
      await markFinishedAndRedirect();
    },
    [saveWritingAnswers, submitAttempt, markFinishedAndRedirect],
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
          {error || "No writing tasks found."}
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
    <WritingTestLayout
      parts={parts}
      timerMinutes={60}
      autoStart
      onSubmit={handleSubmit}
      onSaveProgress={handleSaveProgress}
      onFinish={handleFinish}
    />
  );
}
