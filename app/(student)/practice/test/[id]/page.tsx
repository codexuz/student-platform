"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Flex, Spinner, Text, Button } from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import ReadingTestLayout from "@/components/practice-test/ReadingTestLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ieltsAPI } from "@/lib/api";
import type { PartData, AnswerMap } from "@/components/practice-test/types";
import type {
  IELTSTest,
  IELTSReadingPart,
} from "@/components/ielts-builder/types";

/**
 * Full test practice page.
 * Route: /practice/test/[id]
 * Loads a full IELTS test and renders the reading section.
 */
export default function TestPracticePage() {
  return (
    <ProtectedRoute>
      <TestPracticeContent />
    </ProtectedRoute>
  );
}

function TestPracticeContent() {
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
        const data = await ieltsAPI.getTestById(id);
        const test: IELTSTest = data?.data ?? data;

        if (!test) {
          setError("Test not found");
          return;
        }

        setTestId(test.id || id);

        // Build parts from the test's readings
        const allParts: PartData[] = [];

        if (test.readings?.length) {
          for (const reading of test.readings) {
            if (reading.parts?.length) {
              for (const part of reading.parts) {
                allParts.push(transformReadingPart(part));
              }
            }
          }
        }

        // Sort by part label
        allParts.sort((a, b) => a.partLabel.localeCompare(b.partLabel));
        setParts(allParts);
      } catch (err: unknown) {
        console.error("Failed to load test:", err);
        setError("Failed to load test. Please try again.");
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
      timerMinutes={60}
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
