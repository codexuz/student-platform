"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Heading,
  HStack,
  VStack,
  Flex,
  Spinner,
  Text,
  Badge,
  IconButton,
} from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import { ieltsSpeakingAPI } from "@/lib/ielts-api";
import SpeakingFeedbackCard from "@/components/speaking/SpeakingFeedbackCard";
import type { BandFeedback } from "@/hooks/useSpeakingExam";

interface AttemptDetail {
  id: string;
  status: string;
  duration_seconds: number;
  started_at: string;
  speaking?: { title?: string } | null;
  transcript?: { role: "examiner" | "candidate"; text: string }[] | null;
  feedback?: BandFeedback | string | null;
}

export default function SpeakingAttemptDetailPage() {
  return (
    <ProtectedRoute>
      <AttemptDetailContent />
    </ProtectedRoute>
  );
}

function AttemptDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ieltsSpeakingAPI
      .getAttemptById(id)
      .then((r: AttemptDetail) => setAttempt(r))
      .catch(() => setAttempt(null))
      .finally(() => setLoading(false));
  }, [id]);

  const feedback =
    attempt?.feedback && typeof attempt.feedback === "object"
      ? attempt.feedback
      : null;

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
      <Sidebar />
      <Box ml={{ base: 0, lg: "240px" }} pb={{ base: "80px", lg: 0 }}>
        <Flex
          h={{ base: "14", md: "16" }}
          px={{ base: 4, md: 8 }}
          align="center"
          gap={3}
          bg="white"
          _dark={{ bg: "gray.800" }}
          borderBottomWidth="1px"
        >
          <IconButton
            aria-label="Back"
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft size={18} />
          </IconButton>
          <Heading size={{ base: "sm", md: "md" }} lineClamp={1}>
            {attempt?.speaking?.title || "Speaking Attempt"}
          </Heading>
        </Flex>

        <Box p={{ base: 4, md: 6 }} maxW="900px" mx="auto">
          {loading ? (
            <Flex justify="center" py={12}>
              <Spinner size="xl" color="purple.500" />
            </Flex>
          ) : !attempt ? (
            <Text color="gray.500">Attempt not found.</Text>
          ) : (
            <VStack align="stretch" gap={6}>
              <HStack gap={2} color="gray.500" fontSize="sm" _dark={{ color: "gray.400" }}>
                <Text>{new Date(attempt.started_at).toLocaleString()}</Text>
                <Text>•</Text>
                <Badge
                  variant="subtle"
                  colorPalette={attempt.status === "COMPLETED" ? "green" : "gray"}
                >
                  {attempt.status?.toLowerCase()}
                </Badge>
              </HStack>

              {feedback && <SpeakingFeedbackCard feedback={feedback} />}

              {/* Transcript */}
              <Box>
                <Heading size="sm" mb={3}>
                  Transcript
                </Heading>
                {attempt.transcript && attempt.transcript.length > 0 ? (
                  <VStack align="stretch" gap={3}>
                    {attempt.transcript.map((t, i) => {
                      const isExaminer = t.role === "examiner";
                      return (
                        <Flex
                          key={i}
                          justify={isExaminer ? "flex-start" : "flex-end"}
                        >
                          <Box
                            maxW="80%"
                            bg={isExaminer ? "white" : "purple.500"}
                            color={isExaminer ? "gray.800" : "white"}
                            _dark={{
                              bg: isExaminer ? "gray.800" : "purple.500",
                              color: "white",
                            }}
                            borderWidth={isExaminer ? "1px" : "0"}
                            px={4}
                            py={2}
                            rounded="xl"
                          >
                            <Text
                              fontSize="10px"
                              fontWeight="700"
                              textTransform="uppercase"
                              color={isExaminer ? "gray.400" : "purple.100"}
                              mb={0.5}
                            >
                              {isExaminer ? "Examiner" : "You"}
                            </Text>
                            <Text fontSize="sm">{t.text}</Text>
                          </Box>
                        </Flex>
                      );
                    })}
                  </VStack>
                ) : (
                  <Text color="gray.500" fontSize="sm">
                    No transcript was recorded for this attempt.
                  </Text>
                )}
              </Box>
            </VStack>
          )}
        </Box>
      </Box>
      <MobileBottomNav />
    </Box>
  );
}
