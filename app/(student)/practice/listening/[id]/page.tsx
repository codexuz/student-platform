"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Flex, Spinner, Text, Button } from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import ListeningTestLayout from "@/components/practice-test/ListeningTestLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ieltsAPI } from "@/lib/api";
import type { PartData } from "@/components/practice-test/types";
import type { IELTSListeningPart } from "@/components/ielts-builder/types";

/**
 * Practice page for a single listening part.
 * Route: /practice/listening/[id]
 * Loads a listening part by ID and renders it in the test layout.
 */
export default function ListeningPracticePage() {
  return (
    <ProtectedRoute>
      <ListeningPracticeContent />
    </ProtectedRoute>
  );
}

function ListeningPracticeContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parts, setParts] = useState<PartData[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await ieltsAPI.getListeningPartById(id);
        const part = data?.data ?? data;

        if (!part) {
          setError("Listening part not found");
          return;
        }

        const partData = transformListeningPart(part);
        setParts([partData]);

        // Set audio URL from part or parent listening
        if (part.audio_url) {
          setAudioUrl(part.audio_url);
        } else if (part.listening?.full_audio_url) {
          setAudioUrl(part.listening.full_audio_url);
        }
      } catch (err: unknown) {
        console.error("Failed to load listening part:", err);
        setError("Failed to load listening part. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = (answers: Record<number, string>) => {
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
          {error || "No listening part found."}
        </Text>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft size={16} />
          Go Back
        </Button>
      </Flex>
    );
  }

  return (
    <ListeningTestLayout
      parts={parts}
      audioUrl={audioUrl}
      onSubmit={handleSubmit}
    />
  );
}

// ─── Transform API data to PartData ─────────────────────────────────────

function transformListeningPart(part: IELTSListeningPart): PartData {
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
    instruction:
      range[0] > 0
        ? `Listen and answer questions ${range[0]}-${range[1]}.`
        : "Listen and answer the questions.",
    questions,
    totalQuestions: allNums.length,
    questionRange: range,
  };
}
