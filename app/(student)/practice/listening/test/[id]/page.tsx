"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Flex, Spinner, Text, Button } from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import ListeningTestLayout from "@/components/practice-test/ListeningTestLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ieltsAPI } from "@/lib/api";
import type { PartData, AnswerMap } from "@/components/practice-test/types";
import type { IELTSListeningPart } from "@/components/ielts-builder/types";
import {
  useIeltsAttempt,
  buildPartMappings,
  type PartQuestionMapping,
} from "@/hooks/useIeltsAttempt";

/**
 * Full listening test practice page.
 * Route: /practice/listening/test/[id]
 * Scope: MODULE — saves answers for all parts in a listening module.
 */
export default function ListeningTestPracticePage() {
  return (
    <ProtectedRoute>
      <ListeningTestPracticeContent />
    </ProtectedRoute>
  );
}

function ListeningTestPracticeContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parts, setParts] = useState<PartData[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const [partAudioUrls, setPartAudioUrls] = useState<
    Record<number, string> | undefined
  >();
  const [partMappings, setPartMappings] = useState<PartQuestionMapping[]>([]);

  const { attempt, createAttempt, saveListeningAnswers, submitAttempt } =
    useIeltsAttempt({ scope: "MODULE", entityId: id });

  const attemptCreatedRef = useRef(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await ieltsAPI.getListeningTestById(id);
        const listening = data?.data ?? data;

        if (!listening) {
          setError("Listening test not found");
          return;
        }

        if (listening.full_audio_url) {
          setAudioUrl(listening.full_audio_url);
        }

        const allParts: PartData[] = [];
        const perPartAudio: Record<number, string> = {};

        if (listening.parts?.length) {
          for (let i = 0; i < listening.parts.length; i++) {
            const part = listening.parts[i];
            allParts.push(transformListeningPart(part));
            if (part.audio_url) {
              perPartAudio[i] = part.audio_url;
            }
          }
        }

        allParts.sort((a, b) => a.partLabel.localeCompare(b.partLabel));

        if (!listening.full_audio_url && Object.keys(perPartAudio).length > 0) {
          setPartAudioUrls(perPartAudio);
        }

        setParts(allParts);
        setPartMappings(buildPartMappings(allParts));
      } catch (err: unknown) {
        console.error("Failed to load listening test:", err);
        setError("Failed to load listening test. Please try again.");
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
        await saveListeningAnswers(answers, partMappings);
      }
    },
    [saveListeningAnswers, partMappings],
  );

  const handleSubmit = useCallback(
    async (answers: AnswerMap) => {
      if (partMappings.length > 0) {
        await saveListeningAnswers(answers, partMappings);
      }
      await submitAttempt();
    },
    [saveListeningAnswers, submitAttempt, partMappings],
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
          {error || "No listening parts found in this test."}
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
      partAudioUrls={partAudioUrls}
      onSubmit={handleSubmit}
      onSaveProgress={handleSaveProgress}
    />
  );
}

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
