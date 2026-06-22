"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Heading,
  HStack,
  VStack,
  Button,
  Flex,
  Spinner,
  Text,
  Badge,
  Icon,
  IconButton,
  Progress,
} from "@chakra-ui/react";
import {
  Mic,
  MicOff,
  PhoneOff,
  Clock,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ieltsSpeakingAPI } from "@/lib/ielts-api";
import { useSpeakingExam, type ExamPhase } from "@/hooks/useSpeakingExam";
import { usePreventPageLeave } from "@/hooks/usePreventPageLeave";
import SpeakingFeedbackCard from "@/components/speaking/SpeakingFeedbackCard";

const phaseMeta: Record<ExamPhase, { label: string; color: string }> = {
  idle: { label: "Ready", color: "gray" },
  connecting: { label: "Connecting…", color: "yellow" },
  live: { label: "In conversation", color: "green" },
  prep: { label: "Preparation time", color: "orange" },
  speaking: { label: "Your long turn", color: "purple" },
  ended: { label: "Finished", color: "gray" },
  error: { label: "Error", color: "red" },
};

function formatClock(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function SpeakingExamPage() {
  return (
    <ProtectedRoute>
      <ExamContent />
    </ProtectedRoute>
  );
}

function ExamContent() {
  const params = useParams();
  const router = useRouter();
  const speakingId = String(params.id);

  const [topicTitle, setTopicTitle] = useState("");
  const [loadingTopic, setLoadingTopic] = useState(true);
  const [started, setStarted] = useState(false);

  const exam = useSpeakingExam(speakingId);

  // Warn before reload / closing the tab while the live exam is in progress.
  usePreventPageLeave(started && exam.phase !== "ended" && exam.phase !== "error");

  useEffect(() => {
    ieltsSpeakingAPI
      .getById(speakingId)
      .then((r: { title?: string }) => setTopicTitle(r?.title || "Speaking Test"))
      .catch(() => setTopicTitle("Speaking Test"))
      .finally(() => setLoadingTopic(false));
  }, [speakingId]);

  const handleStart = async () => {
    setStarted(true);
    await exam.start();
  };

  const meta = phaseMeta[exam.phase];
  const orbActive = exam.examinerSpeaking || exam.phase === "speaking";

  if (loadingTopic) {
    return (
      <Flex h="100vh" align="center" justify="center" bg="gray.950">
        <Spinner size="xl" color="purple.400" />
      </Flex>
    );
  }

  return (
    <Box
      minH="100vh"
      bg="linear-gradient(160deg, #1a1430 0%, #0f0a1f 60%, #0a0814 100%)"
      color="white"
    >
      <Flex
        h="14"
        px={{ base: 4, md: 8 }}
        align="center"
        justify="space-between"
        borderBottomWidth="1px"
        borderColor="whiteAlpha.200"
      >
        <HStack>
          <IconButton
            aria-label="Back"
            variant="ghost"
            color="whiteAlpha.800"
            size="sm"
            onClick={() => router.push("/practice/speaking")}
          >
            <ArrowLeft size={18} />
          </IconButton>
          <Heading size="sm" lineClamp={1}>
            {exam.title || topicTitle}
          </Heading>
        </HStack>
        <Badge colorPalette={meta.color} variant="solid" borderRadius="full" px={3}>
          {meta.label}
        </Badge>
      </Flex>

      <Box maxW="900px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 6, md: 10 }}>
        {/* Pre-start */}
        {!started && (
          <VStack gap={6} textAlign="center" py={10}>
            <Flex
              align="center"
              justify="center"
              w="96px"
              h="96px"
              borderRadius="full"
              bg="purple.500"
              shadow="0 0 60px rgba(168,85,247,0.6)"
            >
              <Icon as={Mic} boxSize={10} />
            </Flex>
            <Heading size="lg">{topicTitle}</Heading>
            <Text color="whiteAlpha.700" maxW="lg">
              You&apos;ll speak with an AI examiner across three parts. In Part 2
              you&apos;ll get <b>1 minute</b> to prepare and <b>2 minutes</b> to
              speak. Find a quiet place and allow microphone access when prompted.
            </Text>
            <Button
              colorPalette="purple"
              size="lg"
              borderRadius="full"
              px={10}
              onClick={handleStart}
            >
              <Mic size={18} /> Start Speaking Test
            </Button>
          </VStack>
        )}

        {/* Live / ended */}
        {started && (
          <VStack gap={8} align="stretch">
            {exam.phase === "error" && (
              <Box
                bg="red.900"
                borderWidth="1px"
                borderColor="red.500"
                rounded="lg"
                p={4}
              >
                <Text fontWeight="600">Something went wrong</Text>
                <Text fontSize="sm" color="red.200">
                  {exam.error}
                </Text>
              </Box>
            )}

            {exam.phase !== "ended" && exam.phase !== "error" && (
              <>
                {/* Mic orb */}
                <Flex direction="column" align="center" gap={4} py={4}>
                  <Box position="relative">
                    <Flex
                      align="center"
                      justify="center"
                      w="140px"
                      h="140px"
                      borderRadius="full"
                      bg={orbActive ? "purple.500" : "whiteAlpha.200"}
                      transition="all 0.3s"
                      shadow={
                        orbActive ? "0 0 70px rgba(168,85,247,0.7)" : "none"
                      }
                      animation={orbActive ? "pulse 1.5s infinite" : undefined}
                    >
                      <Icon
                        as={exam.muted ? MicOff : Mic}
                        boxSize={12}
                        color="white"
                      />
                    </Flex>
                  </Box>
                  <Text color="whiteAlpha.700" fontSize="sm">
                    {exam.phase === "connecting"
                      ? "Connecting to your examiner…"
                      : exam.examinerSpeaking
                        ? "Examiner is speaking…"
                        : exam.phase === "prep"
                          ? "Prepare your answer — mic is muted"
                          : "Listening — speak naturally"}
                  </Text>
                </Flex>

                {/* Part 2 timer */}
                {exam.timer && (
                  <Box
                    bg="whiteAlpha.100"
                    borderWidth="1px"
                    borderColor="whiteAlpha.200"
                    rounded="xl"
                    p={4}
                  >
                    <HStack justify="space-between" mb={2}>
                      <HStack color="whiteAlpha.800">
                        <Clock size={16} />
                        <Text fontWeight="600">{exam.timer.label}</Text>
                      </HStack>
                      <Text
                        fontWeight="700"
                        fontSize="lg"
                        color={
                          exam.timer.secondsLeft <= 10 ? "red.300" : "white"
                        }
                      >
                        {formatClock(exam.timer.secondsLeft)}
                      </Text>
                    </HStack>
                    <Progress.Root
                      value={
                        ((exam.timer.total - exam.timer.secondsLeft) /
                          exam.timer.total) *
                        100
                      }
                      colorPalette={exam.phase === "prep" ? "orange" : "purple"}
                      size="sm"
                      rounded="full"
                    >
                      <Progress.Track>
                        <Progress.Range />
                      </Progress.Track>
                    </Progress.Root>
                  </Box>
                )}

                {/* Controls */}
                <HStack justify="center" gap={4}>
                  <Button
                    variant="outline"
                    borderColor="whiteAlpha.400"
                    color="white"
                    borderRadius="full"
                    onClick={exam.toggleMute}
                    disabled={exam.phase === "connecting" || exam.phase === "prep"}
                    _hover={{ bg: "whiteAlpha.200" }}
                  >
                    {exam.muted ? <MicOff size={16} /> : <Mic size={16} />}
                    {exam.muted ? "Unmute" : "Mute"}
                  </Button>
                  <Button
                    colorPalette="red"
                    borderRadius="full"
                    onClick={exam.end}
                  >
                    <PhoneOff size={16} /> End Test
                  </Button>
                </HStack>
              </>
            )}

            {/* Feedback after end */}
            {exam.phase === "ended" && (
              <VStack gap={5} align="stretch">
                {exam.feedback ? (
                  <SpeakingFeedbackCard feedback={exam.feedback} />
                ) : (
                  <Flex
                    direction="column"
                    align="center"
                    gap={3}
                    py={8}
                    color="whiteAlpha.800"
                  >
                    <Sparkles />
                    <Text>Generating your band-score feedback…</Text>
                    <Spinner color="purple.300" />
                  </Flex>
                )}
                <HStack justify="center" gap={3}>
                  <Button
                    variant="outline"
                    borderColor="whiteAlpha.400"
                    color="white"
                    borderRadius="full"
                    onClick={() => router.push("/practice/speaking/attempts")}
                  >
                    View all attempts
                  </Button>
                  <Button
                    colorPalette="purple"
                    borderRadius="full"
                    onClick={() => router.push("/practice/speaking")}
                  >
                    Back to topics
                  </Button>
                </HStack>
              </VStack>
            )}

            {/* Live transcript */}
            {exam.transcript.length > 0 || exam.aiPartial ? (
              <Box
                bg="whiteAlpha.50"
                borderWidth="1px"
                borderColor="whiteAlpha.200"
                rounded="xl"
                p={4}
              >
                <Text
                  fontSize="xs"
                  fontWeight="700"
                  color="whiteAlpha.600"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                  mb={3}
                >
                  Transcript
                </Text>
                <VStack align="stretch" gap={3}>
                  {exam.transcript.map((t, i) => (
                    <TranscriptLine key={i} role={t.role} text={t.text} />
                  ))}
                  {exam.aiPartial && (
                    <TranscriptLine role="examiner" text={exam.aiPartial} partial />
                  )}
                </VStack>
              </Box>
            ) : null}
          </VStack>
        )}
      </Box>
    </Box>
  );
}

function TranscriptLine({
  role,
  text,
  partial,
}: {
  role: "examiner" | "candidate";
  text: string;
  partial?: boolean;
}) {
  const isExaminer = role === "examiner";
  return (
    <Flex justify={isExaminer ? "flex-start" : "flex-end"}>
      <Box
        maxW="80%"
        bg={isExaminer ? "whiteAlpha.200" : "purple.500"}
        color="white"
        px={4}
        py={2}
        rounded="xl"
        opacity={partial ? 0.7 : 1}
      >
        <Text
          fontSize="10px"
          fontWeight="700"
          textTransform="uppercase"
          color={isExaminer ? "whiteAlpha.600" : "purple.100"}
          mb={0.5}
        >
          {isExaminer ? "Examiner" : "You"}
        </Text>
        <Text fontSize="sm">{text}</Text>
      </Box>
    </Flex>
  );
}
