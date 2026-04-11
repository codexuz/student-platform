"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Spinner,
  Badge,
  HStack,
  VStack,
  Splitter,
  useSplitter,
  IconButton,
} from "@chakra-ui/react";
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  ieltsAnswersAPI,
  ieltsListeningPartsAPI,
} from "@/lib/ielts-api";
import { ieltsAPI } from "@/lib/api";
import {
  ReviewHeader,
  ReviewQuestionsList,
  ReviewPartNavigation,
  getQuestionNums,
  useToggleFullscreen,
} from "@/components/practice-test/review/shared";
import type {
  AttemptResult,
  PartInfo,
  QuestionResult,
} from "@/components/practice-test/review/types";

export default function ListeningReviewPage() {
  return (
    <ProtectedRoute>
      <ListeningReviewContent />
    </ProtectedRoute>
  );
}

function ListeningReviewContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = params?.attemptId as string;
  const partIdFromQuery = searchParams.get("part_id");
  const audioUrlFromQuery = searchParams.get("audio_url");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [parts, setParts] = useState<PartInfo[]>([]);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);
  const handleToggleFullscreen = useToggleFullscreen();

  useEffect(() => {
    if (!attemptId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await ieltsAnswersAPI.getAttemptResult(attemptId);
        const attemptResult: AttemptResult = data?.data ?? data;
        setResult(attemptResult);

        const resolvedModuleId =
          attemptResult.moduleId || attemptResult.module_id;

        if (attemptResult.listeningId || resolvedModuleId) {
          // MODULE scope
          try {
            const listeningData = await ieltsAPI.getListeningTestById(
              (attemptResult.listeningId || resolvedModuleId)!,
            );
            const listening = listeningData?.data ?? listeningData;
            if (listening?.parts?.length) {
              const sortedParts = [...listening.parts].sort(
                (a: { part?: string }, b: { part?: string }) =>
                  (a.part ?? "").localeCompare(b.part ?? ""),
              );
              const partInfos: PartInfo[] = sortedParts.map(
                (p: {
                  id: string;
                  part?: string;
                  title?: string;
                  audio_url?: string;
                  transcript_url?: string;
                  questions?: {
                    id?: string;
                    questionNumber?: number;
                    type?: string;
                    questionText?: string;
                    instruction?: string;
                    options?: { optionKey: string; optionText: string; isCorrect: boolean }[];
                    questions?: { questionNumber?: number; correctAnswer?: string }[];
                  }[];
                }) => {
                  const allNums = getQuestionNums(p.questions ?? []);
                  const partNum = p.part ? p.part.replace("PART_", "") : "1";
                  return {
                    id: p.id,
                    partLabel: `Part ${partNum}`,
                    title: p.title,
                    audioUrl: p.audio_url,
                    transcriptUrl: p.transcript_url,
                    instruction:
                      allNums.length > 0
                        ? `Listen and answer questions ${allNums[0]}-${allNums[allNums.length - 1]}.`
                        : "Listen and answer the questions.",
                    questionRange:
                      allNums.length > 0
                        ? [allNums[0], allNums[allNums.length - 1]]
                        : ([0, 0] as [number, number]),
                    rawQuestions: (p.questions ?? []).map((q) => ({
                      id: q.id ?? "",
                      questionNumber: q.questionNumber ?? 0,
                      type: q.type ?? "",
                      questionText: q.questionText ?? null,
                      instruction: q.instruction ?? null,
                      options: (q.options ?? []).map((o) => ({
                        optionKey: o.optionKey,
                        optionText: o.optionText,
                        isCorrect: o.isCorrect,
                      })),
                      questions: (q.questions ?? []).map((sq) => ({
                        questionNumber: sq.questionNumber ?? 0,
                        correctAnswer: sq.correctAnswer ?? "",
                      })),
                    })),
                  };
                },
              );
              setParts(partInfos);
            }
          } catch {
            // Module data fetch failed
          }
        } else if (
          attemptResult.partId ||
          attemptResult.part_id ||
          partIdFromQuery
        ) {
          // PART scope
          const resolvedPartId = (attemptResult.partId ||
            attemptResult.part_id ||
            partIdFromQuery)!;
          try {
            const lPartData =
              await ieltsListeningPartsAPI.getById(resolvedPartId);
            const lp = lPartData?.data ?? lPartData;
            if (lp) {
              const allNums = getQuestionNums(lp.questions ?? []);
              const partNum = lp.part ? lp.part.replace("PART_", "") : "1";
              setParts([
                {
                  id: lp.id,
                  partLabel: `Part ${partNum}`,
                  title: lp.title,
                  audioUrl: lp.audio_url,
                  transcriptUrl: lp.transcript_url,
                  instruction:
                    allNums.length > 0
                      ? `Listen and answer questions ${allNums[0]}-${allNums[allNums.length - 1]}.`
                      : "Listen and answer the questions.",
                  questionRange:
                    allNums.length > 0
                      ? [allNums[0], allNums[allNums.length - 1]]
                      : ([0, 0] as [number, number]),
                  rawQuestions: (lp.questions ?? []).map((q: { id?: string; questionNumber?: number; type?: string; questionText?: string; instruction?: string; options?: { optionKey: string; optionText: string; isCorrect: boolean }[]; questions?: { questionNumber?: number; correctAnswer?: string }[] }) => ({
                    id: q.id ?? "",
                    questionNumber: q.questionNumber ?? 0,
                    type: q.type ?? "",
                    questionText: q.questionText ?? null,
                    instruction: q.instruction ?? null,
                    options: (q.options ?? []).map((o) => ({
                      optionKey: o.optionKey,
                      optionText: o.optionText,
                      isCorrect: o.isCorrect,
                    })),
                    questions: (q.questions ?? []).map((sq) => ({
                      questionNumber: sq.questionNumber ?? 0,
                      correctAnswer: sq.correctAnswer ?? "",
                    })),
                  })),
                },
              ]);
            }
          } catch {
            // Part data fetch failed
          }
        }
      } catch (err: unknown) {
        console.error("Failed to load listening review:", err);
        setError("Failed to load review data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [attemptId, partIdFromQuery, audioUrlFromQuery]);

  const currentPart = parts[currentPartIndex] || null;

  const currentQuestions =
    result?.questionResults.filter((qr) => {
      if (!currentPart) return true;
      return (
        qr.questionNumber >= currentPart.questionRange[0] &&
        qr.questionNumber <= currentPart.questionRange[1]
      );
    }) ?? [];

  const allQuestions = result?.questionResults ?? [];

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

  if (error || !result) {
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
          {error || "Result not found"}
        </Text>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft size={16} />
          Go Back
        </Button>
      </Flex>
    );
  }

  return (
    <Flex direction="column" h="100vh" bg="white" _dark={{ bg: "gray.900" }}>
      <ReviewHeader
        onBack={() => router.push(`/practice/results`)}
        showCorrectAnswers={showCorrectAnswers}
        onToggleCorrect={(v) => setShowCorrectAnswers(v)}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {currentPart && (
        <Box
          px={4}
          py={3}
          bg="white"
          _dark={{ bg: "gray.800" }}
          borderBottomWidth="1px"
          borderColor="gray.200"
          flexShrink={0}
        >
          <Text fontWeight="bold" fontSize="sm">
            {currentPart.partLabel}
          </Text>
          {currentPart.instruction && (
            <Text fontSize="sm" color="gray.500">
              {currentPart.instruction}
            </Text>
          )}
        </Box>
      )}

      {/* Audio player for listening reviews (only when no transcript split view) */}
      {!currentPart?.transcriptUrl &&
        (() => {
          const audioSrc = currentPart?.audioUrl || audioUrlFromQuery;
          return audioSrc ? (
            <Box
              px={4}
              py={3}
              bg="gray.50"
              _dark={{ bg: "gray.800" }}
              borderBottomWidth="1px"
              borderColor="gray.200"
              flexShrink={0}
            >
              <HStack gap={3}>
                <Badge colorPalette="orange" fontSize="2xs">
                  Audio
                </Badge>
                <Box flex={1}>
                  <audio
                    controls
                    src={audioSrc}
                    style={{ width: "100%", height: "36px" }}
                  />
                </Box>
              </HStack>
            </Box>
          ) : null;
        })()}

      {currentPart?.transcriptUrl ? (
        <ListeningSplitView
          audioUrl={currentPart?.audioUrl || audioUrlFromQuery || undefined}
          transcriptUrl={currentPart.transcriptUrl}
          partTitle={currentPart?.title}
          questions={parts.length > 0 ? currentQuestions : allQuestions}
          showCorrectAnswers={showCorrectAnswers}
          rawQuestionGroups={currentPart?.rawQuestions ?? parts.flatMap((p) => p.rawQuestions ?? [])}
        />
      ) : (
        <Box flex={1} overflowY="auto" px={{ base: 4, md: 8 }} py={4}>
          <Box maxW="4xl" mx="auto">
            <ReviewQuestionsList
              questions={parts.length > 0 ? currentQuestions : allQuestions}
              showCorrectAnswers={showCorrectAnswers}
              rawQuestionGroups={currentPart?.rawQuestions ?? parts.flatMap((p) => p.rawQuestions ?? [])}
            />
          </Box>
        </Box>
      )}

      <ReviewPartNavigation
        parts={parts}
        currentPartIndex={currentPartIndex}
        onPartChange={setCurrentPartIndex}
        questionResults={allQuestions}
        onScrollToQuestion={(num) => {
          document.getElementById(`review-question-${num}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
      />
    </Flex>
  );
}

// ─── VTT Parser ───────────────────────────────────────────────────────────

interface VttCue {
  startTime: number;
  endTime: number;
  text: string;
}

function parseVtt(raw: string): VttCue[] {
  const cues: VttCue[] = [];
  const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  let i = 0;

  while (i < lines.length && !lines[i].includes("-->")) i++;

  while (i < lines.length) {
    const line = lines[i];
    if (line.includes("-->")) {
      const [startStr, endStr] = line.split("-->").map((s) => s.trim());
      const startTime = vttTimeToSeconds(startStr);
      const endTime = vttTimeToSeconds(endStr);
      i++;
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== "") {
        textLines.push(lines[i].trim());
        i++;
      }
      if (textLines.length > 0) {
        cues.push({ startTime, endTime, text: textLines.join(" ") });
      }
    } else {
      i++;
    }
  }
  return cues;
}

function vttTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(":");
  if (parts.length === 3) {
    const h = parseFloat(parts[0]);
    const m = parseFloat(parts[1]);
    const s = parseFloat(parts[2]);
    return h * 3600 + m * 60 + s;
  }
  if (parts.length === 2) {
    const m = parseFloat(parts[0]);
    const s = parseFloat(parts[1]);
    return m * 60 + s;
  }
  return parseFloat(timeStr) || 0;
}

function formatTimestamp(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Listening Split View (Transcript + Questions) ────────────────────────

function ListeningSplitView({
  audioUrl,
  transcriptUrl,
  partTitle,
  questions,
  showCorrectAnswers,
  rawQuestionGroups,
}: {
  audioUrl?: string;
  transcriptUrl: string;
  partTitle?: string;
  questions: QuestionResult[];
  showCorrectAnswers: boolean;
  rawQuestionGroups?: import("@/components/practice-test/review/types").RawQuestionGroup[];
}) {
  const splitter = useSplitter({
    defaultSize: [50, 50],
    panels: [{ id: "transcript" }, { id: "questions", minSize: 20 }],
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const activeCueRef = useRef<HTMLDivElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const userScrollingRef = useRef(false);
  const userScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cues, setCues] = useState<VttCue[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [vttLoading, setVttLoading] = useState(!!transcriptUrl);
  const [vttError, setVttError] = useState<string | null>(null);

  // Fetch & parse VTT
  useEffect(() => {
    if (!transcriptUrl) return;
    let cancelled = false;
    fetch(transcriptUrl)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch transcript");
        return r.text();
      })
      .then((raw) => {
        if (!cancelled) {
          setCues(parseVtt(raw));
        }
      })
      .catch((err) => {
        if (!cancelled) setVttError(err.message);
      })
      .finally(() => {
        if (!cancelled) setVttLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [transcriptUrl]);

  // Audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audioUrl]);

  // Auto-scroll to active cue
  useEffect(() => {
    if (userScrollingRef.current) return;
    activeCueRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [currentTime, cues]);

  // Detect user scroll to temporarily disable auto-scroll
  useEffect(() => {
    const container = transcriptContainerRef.current;
    if (!container) return;
    const onWheel = () => {
      userScrollingRef.current = true;
      if (userScrollTimerRef.current) clearTimeout(userScrollTimerRef.current);
      userScrollTimerRef.current = setTimeout(() => {
        userScrollingRef.current = false;
      }, 5000);
    };
    const onTouchMove = () => onWheel();
    container.addEventListener("wheel", onWheel, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("touchmove", onTouchMove);
      if (userScrollTimerRef.current) clearTimeout(userScrollTimerRef.current);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play().catch(() => {});
  }, [playing]);

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
    if (!audio.paused) return;
    audio.play().catch(() => {});
  }, []);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
  }, []);

  const activeCueIndex = cues.findIndex(
    (c) => currentTime >= c.startTime && currentTime < c.endTime,
  );

  return (
    <Splitter.RootProvider value={splitter} flex={1} overflow="hidden">
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}

      <Splitter.Panel id="transcript">
        <Flex direction="column" h="100%">
          {audioUrl && (
            <Box
              px={4}
              py={2.5}
              borderBottomWidth="1px"
              borderColor="gray.200"
              bg="gray.50"
              _dark={{ bg: "gray.800" }}
              flexShrink={0}
            >
              <HStack gap={2}>
                <IconButton
                  size="sm"
                  variant="ghost"
                  aria-label={playing ? "Pause" : "Play"}
                  onClick={togglePlay}
                  colorPalette="blue"
                >
                  {playing ? <Pause size={16} /> : <Play size={16} />}
                </IconButton>
                <IconButton
                  size="sm"
                  variant="ghost"
                  aria-label="Restart"
                  onClick={restart}
                >
                  <RotateCcw size={14} />
                </IconButton>
                <Box
                  flex={1}
                  h="6px"
                  bg="gray.200"
                  _dark={{ bg: "gray.600" }}
                  borderRadius="full"
                  cursor="pointer"
                  position="relative"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = (e.clientX - rect.left) / rect.width;
                    seekTo(pct * duration);
                  }}
                >
                  <Box
                    h="100%"
                    bg="blue.500"
                    borderRadius="full"
                    w={duration ? `${(currentTime / duration) * 100}%` : "0%"}
                    transition="width 0.1s linear"
                  />
                </Box>
                <Text fontSize="xs" color="gray.500" flexShrink={0}>
                  {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
                </Text>
              </HStack>
            </Box>
          )}

          <Box
            ref={transcriptContainerRef}
            flex={1}
            overflowY="auto"
            px={{ base: 4, md: 5 }}
            py={4}
          >
            {partTitle && (
              <Heading size="sm" mb={3}>
                {partTitle}
              </Heading>
            )}
            <Badge colorPalette="purple" mb={3} fontSize="2xs">
              Transcript
            </Badge>

            {vttLoading && (
              <HStack gap={2} py={4}>
                <Spinner size="sm" />
                <Text fontSize="sm" color="gray.400">
                  Loading transcript...
                </Text>
              </HStack>
            )}

            {vttError && (
              <Text fontSize="sm" color="red.500" py={4}>
                Failed to load transcript: {vttError}
              </Text>
            )}

            {!vttLoading && !vttError && cues.length === 0 && (
              <Text fontSize="sm" color="gray.400" py={4}>
                No transcript cues found.
              </Text>
            )}

            <VStack gap={0} align="stretch">
              {cues.map((cue, idx) => {
                const isActive = idx === activeCueIndex;
                const isPast =
                  activeCueIndex >= 0
                    ? idx < activeCueIndex
                    : currentTime > cue.endTime;
                return (
                  <Box
                    key={idx}
                    ref={isActive ? activeCueRef : undefined}
                    px={3}
                    py={2}
                    borderRadius="md"
                    cursor="pointer"
                    transition="all 0.15s"
                    bg="transparent"
                    _hover={{
                      bg: "gray.50",
                      _dark: {
                        bg: "gray.700",
                      },
                    }}
                    onClick={() => seekTo(cue.startTime)}
                  >
                    <HStack gap={2} align="flex-start">
                      <Text
                        fontSize="2xs"
                        color={isActive ? "blue.600" : "gray.400"}
                        _dark={{
                          color: isActive ? "blue.300" : "gray.500",
                        }}
                        fontFamily="mono"
                        flexShrink={0}
                        mt={0.5}
                        minW="40px"
                      >
                        {formatTimestamp(cue.startTime)}
                      </Text>
                      <Text
                        as="mark"
                        fontSize="sm"
                        lineHeight="1.6"
                        fontWeight={isActive ? "semibold" : "normal"}
                        bg={isActive ? "yellow.200" : "transparent"}
                        color={
                          isActive
                            ? "gray.900"
                            : isPast
                              ? "gray.500"
                              : "gray.800"
                        }
                        _dark={{
                          bg: isActive ? "yellow.800/60" : "transparent",
                          color: isActive
                            ? "yellow.100"
                            : isPast
                              ? "gray.400"
                              : "gray.200",
                        }}
                        px={isActive ? 1 : 0}
                        borderRadius="sm"
                        transition="background-color 0.4s ease, color 0.4s ease, font-weight 0.4s ease, padding 0.4s ease"
                      >
                        {cue.text}
                      </Text>
                    </HStack>
                  </Box>
                );
              })}
            </VStack>
          </Box>
        </Flex>
      </Splitter.Panel>

      <Splitter.ResizeTrigger
        id="transcript:questions"
        display={{ base: "none", lg: "flex" }}
      />

      <Splitter.Panel id="questions">
        <Box h="100%" overflowY="auto" px={{ base: 4, md: 6 }} py={4}>
          <ReviewQuestionsList
            questions={questions}
            showCorrectAnswers={showCorrectAnswers}
            rawQuestionGroups={rawQuestionGroups}
          />
        </Box>
      </Splitter.Panel>
    </Splitter.RootProvider>
  );
}
