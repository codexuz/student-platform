"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Flex, Spinner, Text, Button } from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import ReadingTestLayout from "@/components/practice-test/ReadingTestLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ieltsAPI } from "@/lib/api";
import type { PartData, AnswerMap } from "@/components/practice-test/types";
import type { IELTSReadingPart } from "@/components/ielts-builder/types";

/**
 * Practice page for a single reading part.
 * Route: /practice/reading/[id]
 * Loads a reading part by ID and renders it in the test layout.
 */
export default function ReadingPracticePage() {
  return (
    <ProtectedRoute>
      <ReadingPracticeContent />
    </ProtectedRoute>
  );
}

function ReadingPracticeContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parts, setParts] = useState<PartData[]>([]);
  const [testId, setTestId] = useState<string>("");

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await ieltsAPI.getReadingPartById(id);
        const part = data?.data ?? data;

        if (!part) {
          setError("Reading part not found");
          return;
        }

        const partData = transformReadingPart(part);
        setParts([partData]);
        setTestId(part.id || id);
      } catch (err: unknown) {
        console.error("Failed to load reading part:", err);
        setError("Failed to load reading part. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = (answers: AnswerMap) => {
    console.log("Submitted answers:", answers);
    // TODO: Submit answers to API for grading
  };

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

  if (error) {
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
          {error}
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
      timerMinutes={20} // Single part = ~20 minutes
      onSubmit={handleSubmit}
    />
  );
}

// ─── Transform API data to PartData ─────────────────────────────────────

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
