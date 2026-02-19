"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Flex, Text, Button, Spinner } from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import WritingTestLayout from "@/components/practice-test/WritingTestLayout";
import type { WritingPartData } from "@/components/practice-test/WritingTestLayout";
import { ieltsAPI } from "@/lib/api";
import { useIeltsAttempt } from "@/hooks/useIeltsAttempt";

/**
 * Full writing test practice page.
 * Route: /practice/writing/test/[id]
 * Scope: MODULE — saves answers for all tasks in a writing module.
 */
export default function WritingTestPracticePage() {
  return (
    <ProtectedRoute>
      <WritingTestPracticeContent />
    </ProtectedRoute>
  );
}

function WritingTestPracticeContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parts, setParts] = useState<WritingPartData[]>([]);

  const { attempt, createAttempt, saveWritingAnswers, submitAttempt } =
    useIeltsAttempt({ scope: "MODULE", entityId: id });

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await ieltsAPI.getWritingTestById(id);
        const result = data?.data ?? data;

        if (!result || !result.tasks?.length) {
          setError("No writing tasks found in this test.");
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
      } catch (err: unknown) {
        console.error("Failed to load writing test:", err);
        setError("Failed to load writing test. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSaveProgress = useCallback(
    async (essays: Record<string, string>) => {
      await saveWritingAnswers(essays);
    },
    [saveWritingAnswers],
  );

  const handleSubmit = useCallback(
    async (essays: Record<string, string>) => {
      await saveWritingAnswers(essays);
      const success = await submitAttempt();
      if (success && attempt?.id) {
        router.push(`/practice/results/${attempt.id}`);
      }
    },
    [saveWritingAnswers, submitAttempt, attempt?.id, router],
  );

  if (loading) {
    return (
      <Flex h="100vh" align="center" justify="center" bg="gray.50">
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
      >
        <Text color="red.500" fontSize="lg">
          {error || "No writing tasks found in this test."}
        </Text>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft size={16} />
          Go Back
        </Button>
      </Flex>
    );
  }

  return (
    <WritingTestLayout
      parts={parts}
      timerMinutes={60}
      onSubmit={handleSubmit}
      onSaveProgress={handleSaveProgress}
      onStartAttempt={createAttempt}
    />
  );
}
