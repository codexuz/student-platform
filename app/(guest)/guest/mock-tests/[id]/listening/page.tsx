"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Flex, Spinner, Text, Button } from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import ListeningTestLayout from "@/components/practice-test/ListeningTestLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ieltsAPI } from "@/lib/api";
import { ieltsMockTestsAPI, ieltsTestsAPI } from "@/lib/ielts-api";
import { toaster } from "@/components/ui/toaster";
import type { PartData, AnswerMap } from "@/components/practice-test/types";
import type { IELTSListeningPart } from "@/components/ielts-builder/types";

/**
 * Guest mock test listening module page.
 * Route: /guest/mock-tests/[id]/listening
 *
 * Same UI as the student version but without authentication,
 * attempt tracking, or progress saving.
 */
export default function GuestMockListeningPage() {
  return (
    <ProtectedRoute>
      <GuestMockListeningContent />
    </ProtectedRoute>
  );
}

function GuestMockListeningContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mockTestId = params?.id;
  const testId = searchParams?.get("testId") ?? undefined;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parts, setParts] = useState<PartData[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const [partAudioUrls, setPartAudioUrls] = useState<
    Record<number, string> | undefined
  >();

  useEffect(() => {
    if (!mockTestId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Get mock test to find the test_id, then fetch test to get listening module ID
        const mockRes = await ieltsMockTestsAPI.getById(mockTestId);
        const mockTest = mockRes?.data ?? mockRes;
        const tId = testId ?? mockTest?.test_id;

        if (!tId) {
          setError("No test ID found for this mock test.");
          return;
        }

        const testRes = await ieltsTestsAPI.getById(tId);
        const testData = testRes?.data ?? testRes;
        const lId = testData?.listenings?.[0]?.id;

        if (!lId) {
          setError("No listening module found for this mock test.");
          return;
        }

        // 2. Fetch the full listening module data
        const data = await ieltsAPI.getListeningTestById(lId);
        const listening = data?.data ?? data;

        if (!listening) {
          setError("Listening test not found.");
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
      } catch (err) {
        console.error("Failed to load listening test:", err);
        setError("Failed to load listening test.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mockTestId, testId]);

  const handleFinish = useCallback(async () => {
    router.push(`/guest/mock-tests/${mockTestId}`);
  }, [mockTestId, router]);

  const handleSubmit = useCallback(
    async (_answers: AnswerMap) => {
      toaster.success({ title: "Test completed!" });
      router.push(`/guest/mock-tests/${mockTestId}`);
    },
    [mockTestId, router],
  );

  const handleSaveProgress = useCallback(async (_answers: AnswerMap) => {
    // Guest mode: no progress saving
  }, []);

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
          {error || "No listening parts found."}
        </Text>
        <Button
          variant="outline"
          onClick={() => router.push(`/guest/mock-tests/${mockTestId}`)}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
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
      onFinish={handleFinish}
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
