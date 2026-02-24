"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
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
  Switch,
  Splitter,
  useSplitter,
  Circle,
  Card,
  Separator,
  IconButton,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  ieltsAnswersAPI,
  ieltsWritingTasksAPI,
  ieltsReadingPartsAPI,
  ieltsListeningPartsAPI,
} from "@/lib/ielts-api";
import { ieltsAPI } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────

interface QuestionResult {
  questionId: string;
  questionNumber: number;
  questionType: string;
  questionText: string | null;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean | null;
  points: number;
  earnedPoints: number | null;
  explanation: string | null;
  fromPassage: string | null;
  questionParts: unknown[];
  answerText: string | null;
  optionText: string | null;
}

interface WritingAnswerResult {
  taskId: string;
  taskNumber: number;
  answerText: string;
  wordCount: number;
  score: {
    task_response: number | null;
    lexical_resources: number | null;
    grammar_range_and_accuracy: number | null;
    coherence_and_cohesion: number | null;
    overall: number | null;
  } | null;
  feedback: string | null;
}

interface AttemptResult {
  attemptId: string;
  scope?: string;
  partId?: string;
  part_id?: string;
  moduleId?: string;
  module_id?: string;
  testId?: string;
  test_id?: string;
  readingId?: string;
  listeningId?: string;
  writingId?: string;
  userId: string;
  totalQuestions: number;
  correctAnswers: number;
  totalPoints: number;
  earnedPoints: number;
  score: number;
  ieltsBandScore: number;
  timeSpentMinutes: number;
  isCompleted: boolean;
  startedAt: string;
  completedAt: string | null;
  questionResults: QuestionResult[];
  writingAnswers: WritingAnswerResult[];
}

interface PartInfo {
  id: string;
  partLabel: string;
  title?: string;
  content?: string; // HTML passage for reading
  instruction?: string;
  questionRange: [number, number];
  audioUrl?: string;
  transcriptUrl?: string;
}

interface WritingTaskDetail {
  id: string;
  task: string;
  prompt: string | null;
  min_words: number | null;
  suggested_time: number | null;
  image_url: string | null;
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  return (
    <ProtectedRoute>
      <ReviewContent />
    </ProtectedRoute>
  );
}

function ReviewContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = params?.attemptId as string;
  const partIdFromQuery = searchParams.get("part_id");
  const typeFromQuery = searchParams.get("type");
  const audioUrlFromQuery = searchParams.get("audio_url");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [parts, setParts] = useState<PartInfo[]>([]);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);
  const [moduleType, setModuleType] = useState<
    "reading" | "listening" | "writing"
  >("reading");
  const [writingTasks, setWritingTasks] = useState<
    Record<string, WritingTaskDetail>
  >({});

  // Fetch result + module data
  useEffect(() => {
    if (!attemptId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await ieltsAnswersAPI.getAttemptResult(attemptId);
        const attemptResult: AttemptResult = data?.data ?? data;
        setResult(attemptResult);

        // Determine module type and fetch module data for passages
        // If typeFromQuery is provided, use it to avoid ambiguous ID fields
        const effectiveType =
          typeFromQuery ||
          (attemptResult.writingAnswers?.length > 0 &&
          !attemptResult.questionResults?.length
            ? "writing"
            : attemptResult.readingId
              ? "reading"
              : attemptResult.listeningId
                ? "listening"
                : null);

        // Resolve the entity ID for module-level fetches
        const resolvedModuleId =
          attemptResult.moduleId || attemptResult.module_id;

        if (
          effectiveType === "writing" &&
          attemptResult.writingAnswers?.length > 0
        ) {
          setModuleType("writing");
          // Fetch writing task details
          const taskMap: Record<string, WritingTaskDetail> = {};
          await Promise.all(
            attemptResult.writingAnswers.map(
              async (wa: WritingAnswerResult) => {
                try {
                  const taskData = await ieltsWritingTasksAPI.getById(
                    wa.taskId,
                  );
                  const task = taskData?.data ?? taskData;
                  taskMap[wa.taskId] = task;
                } catch {
                  // skip if task fetch fails
                }
              },
            ),
          );
          setWritingTasks(taskMap);
        } else if (
          effectiveType === "reading" &&
          (attemptResult.readingId || resolvedModuleId)
        ) {
          setModuleType("reading");
          try {
            const readingData = await ieltsAPI.getReadingTestById(
              (attemptResult.readingId || resolvedModuleId)!,
            );
            const reading = readingData?.data ?? readingData;
            if (reading?.parts?.length) {
              const sortedParts = [...reading.parts].sort(
                (a: { part?: string }, b: { part?: string }) =>
                  (a.part ?? "").localeCompare(b.part ?? ""),
              );
              const partInfos: PartInfo[] = sortedParts.map(
                (p: {
                  id: string;
                  part?: string;
                  title?: string;
                  content?: string;
                  questions?: {
                    questionNumber?: number;
                    questions?: { questionNumber?: number }[];
                  }[];
                }) => {
                  const allNums = getQuestionNums(p.questions ?? []);
                  const partNum = p.part ? p.part.replace("PART_", "") : "1";
                  return {
                    id: p.id,
                    partLabel: `Part ${partNum}`,
                    title: p.title,
                    content: p.content,
                    instruction:
                      allNums.length > 0
                        ? `Read the text and answer questions ${allNums[0]}-${allNums[allNums.length - 1]}.`
                        : "Read the text and answer the questions.",
                    questionRange:
                      allNums.length > 0
                        ? [allNums[0], allNums[allNums.length - 1]]
                        : ([0, 0] as [number, number]),
                  };
                },
              );
              setParts(partInfos);
            }
          } catch {
            // Module data fetch failed, still show questions
          }
        } else if (
          effectiveType === "listening" &&
          (attemptResult.listeningId || resolvedModuleId)
        ) {
          setModuleType("listening");
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
                    questionNumber?: number;
                    questions?: { questionNumber?: number }[];
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
                  };
                },
              );
              setParts(partInfos);
            }
          } catch {
            // Module data fetch failed
          }
        } else if (
          (attemptResult.partId || attemptResult.part_id || partIdFromQuery) &&
          attemptResult.questionResults?.length > 0
        ) {
          // PART scope — fetch single part data using type param
          const resolvedPartId = (attemptResult.partId ||
            attemptResult.part_id ||
            partIdFromQuery)!;
          const partType = typeFromQuery; // "reading" | "listening" from query

          const fetchReadingPart = async () => {
            const partData = await ieltsReadingPartsAPI.getById(resolvedPartId);
            const p = partData?.data ?? partData;
            if (p?.content) {
              setModuleType("reading");
              const allNums = getQuestionNums(p.questions ?? []);
              const partNum = p.part ? p.part.replace("PART_", "") : "1";
              setParts([
                {
                  id: p.id,
                  partLabel: `Part ${partNum}`,
                  title: p.title,
                  content: p.content,
                  instruction:
                    allNums.length > 0
                      ? `Read the text and answer questions ${allNums[0]}-${allNums[allNums.length - 1]}.`
                      : "Read the text and answer the questions.",
                  questionRange:
                    allNums.length > 0
                      ? [allNums[0], allNums[allNums.length - 1]]
                      : ([0, 0] as [number, number]),
                },
              ]);
              return true;
            }
            return false;
          };

          const fetchListeningPart = async () => {
            const lPartData =
              await ieltsListeningPartsAPI.getById(resolvedPartId);
            const lp = lPartData?.data ?? lPartData;
            if (lp) {
              setModuleType("listening");
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
                },
              ]);
              return true;
            }
            return false;
          };

          try {
            if (partType === "listening") {
              await fetchListeningPart();
            } else if (partType === "reading") {
              await fetchReadingPart();
            } else {
              // No type hint — try reading first, fallback to listening
              const ok = await fetchReadingPart();
              if (!ok) await fetchListeningPart();
            }
          } catch {
            // If the typed fetch failed, try the other type as fallback
            try {
              if (partType === "listening") await fetchReadingPart();
              else await fetchListeningPart();
            } catch {
              // Part data fetch failed
            }
          }
        } else if (attemptResult.writingAnswers?.length > 0) {
          // Fallback: writing answers present but no typeFromQuery
          setModuleType("writing");
          const taskMap: Record<string, WritingTaskDetail> = {};
          await Promise.all(
            attemptResult.writingAnswers.map(
              async (wa: WritingAnswerResult) => {
                try {
                  const taskData = await ieltsWritingTasksAPI.getById(
                    wa.taskId,
                  );
                  const task = taskData?.data ?? taskData;
                  taskMap[wa.taskId] = task;
                } catch {
                  // skip if task fetch fails
                }
              },
            ),
          );
          setWritingTasks(taskMap);
        }
      } catch (err: unknown) {
        console.error("Failed to load review:", err);
        setError("Failed to load review data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [attemptId, partIdFromQuery, typeFromQuery]);

  const currentPart = parts[currentPartIndex] || null;

  // Filter questions for current part
  const currentQuestions =
    result?.questionResults.filter((qr) => {
      if (!currentPart) return true;
      return (
        qr.questionNumber >= currentPart.questionRange[0] &&
        qr.questionNumber <= currentPart.questionRange[1]
      );
    }) ?? [];

  const allQuestions = result?.questionResults ?? [];

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  // ─── Loading / Error ────────────────────────────────────────────────

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

  // ─── Writing Review ─────────────────────────────────────────────────

  if (moduleType === "writing") {
    return (
      <WritingReview
        result={result}
        writingTasks={writingTasks}
        onBack={() => router.push(`/practice/results`)}
      />
    );
  }

  // ─── Reading / Listening Review ─────────────────────────────────────

  const hasPassage = moduleType === "reading" && currentPart?.content;

  return (
    <Flex direction="column" h="100vh" bg="white" _dark={{ bg: "gray.900" }}>
      {/* Header */}
      <ReviewHeader
        onBack={() => router.push(`/practice/results`)}
        showCorrectAnswers={showCorrectAnswers}
        onToggleCorrect={(v) => setShowCorrectAnswers(v)}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Part header */}
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
      {moduleType === "listening" &&
        !currentPart?.transcriptUrl &&
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

      {/* Main content */}
      {hasPassage ? (
        <ReadingSplitView
          passage={currentPart?.content}
          passageTitle={currentPart?.title}
          questions={currentQuestions}
          showCorrectAnswers={showCorrectAnswers}
        />
      ) : moduleType === "listening" && currentPart?.transcriptUrl ? (
        <ListeningSplitView
          audioUrl={currentPart?.audioUrl || audioUrlFromQuery || undefined}
          transcriptUrl={currentPart.transcriptUrl}
          partTitle={currentPart?.title}
          questions={parts.length > 0 ? currentQuestions : allQuestions}
          showCorrectAnswers={showCorrectAnswers}
        />
      ) : (
        <Box flex={1} overflowY="auto" px={{ base: 4, md: 8 }} py={4}>
          <ReviewQuestionsList
            questions={parts.length > 0 ? currentQuestions : allQuestions}
            showCorrectAnswers={showCorrectAnswers}
          />
        </Box>
      )}

      {/* Bottom navigation */}
      <ReviewPartNavigation
        parts={parts}
        currentPartIndex={currentPartIndex}
        onPartChange={setCurrentPartIndex}
        questionResults={allQuestions}
      />
    </Flex>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────

function ReviewHeader({
  onBack,
  showCorrectAnswers,
  onToggleCorrect,
  onToggleFullscreen,
}: {
  onBack: () => void;
  showCorrectAnswers: boolean;
  onToggleCorrect: (v: boolean) => void;
  onToggleFullscreen: () => void;
}) {
  return (
    <Flex
      h="14"
      px={{ base: 2, md: 4 }}
      alignItems="center"
      justifyContent="space-between"
      bg="white"
      _dark={{ bg: "gray.800" }}
      borderBottomWidth="1px"
      borderColor="gray.200"
      position="sticky"
      top={0}
      zIndex={20}
    >
      {/* Left */}
      <HStack gap={2}>
        <Button variant="ghost" size="sm" onClick={onBack} px={2}>
          <ArrowLeft size={16} />
          <Text ml={1} display={{ base: "none", sm: "inline" }}>
            Back to Results
          </Text>
        </Button>
        <Badge
          bg="red.500"
          color="white"
          px={3}
          py={1}
          borderRadius="md"
          fontWeight="bold"
          fontSize="sm"
        >
          IELTS
        </Badge>
      </HStack>

      {/* Right */}
      <HStack gap={2}>
        <HStack gap={1}>
          <Switch.Root
            checked={showCorrectAnswers}
            onCheckedChange={(e) => onToggleCorrect(e.checked)}
            colorPalette="orange"
          >
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
          <Text fontSize="sm" display={{ base: "none", sm: "inline" }}>
            Show Correct Answers
          </Text>
        </HStack>
        <IconButton
          variant="ghost"
          size="sm"
          aria-label="Fullscreen"
          onClick={onToggleFullscreen}
        >
          <Maximize2 size={16} />
        </IconButton>
      </HStack>
    </Flex>
  );
}

// ─── Reading Split View ───────────────────────────────────────────────────

function ReadingSplitView({
  passage,
  passageTitle,
  questions,
  showCorrectAnswers,
}: {
  passage?: string;
  passageTitle?: string;
  questions: QuestionResult[];
  showCorrectAnswers: boolean;
}) {
  const splitter = useSplitter({
    defaultSize: [50, 50],
    panels: [{ id: "passage" }, { id: "questions", minSize: 20 }],
  });

  return (
    <Splitter.RootProvider value={splitter} flex={1} overflow="hidden">
      {/* Left — Passage */}
      <Splitter.Panel id="passage">
        <Box h="100%" overflowY="auto" px={{ base: 4, md: 6 }} py={4}>
          {passageTitle && (
            <Heading size="sm" mb={3}>
              {passageTitle}
            </Heading>
          )}
          {passage && (
            <Box
              className="reading-passage"
              dangerouslySetInnerHTML={{ __html: passage }}
              fontSize="sm"
              lineHeight="1.8"
              css={{
                "& p": { marginBottom: "1em" },
                "& h1, & h2, & h3": {
                  fontWeight: "bold",
                  marginBottom: "0.5em",
                },
              }}
            />
          )}
        </Box>
      </Splitter.Panel>

      <Splitter.ResizeTrigger
        id="passage:questions"
        display={{ base: "none", lg: "flex" }}
      />

      {/* Right — Questions with answers */}
      <Splitter.Panel id="questions">
        <Box h="100%" overflowY="auto" px={{ base: 4, md: 6 }} py={4}>
          <ReviewQuestionsList
            questions={questions}
            showCorrectAnswers={showCorrectAnswers}
          />
        </Box>
      </Splitter.Panel>
    </Splitter.RootProvider>
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
  // Normalise line endings
  const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  let i = 0;

  // Skip WEBVTT header and any metadata lines
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
  // Supports both HH:MM:SS.mmm and MM:SS.mmm
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
}: {
  audioUrl?: string;
  transcriptUrl: string;
  partTitle?: string;
  questions: QuestionResult[];
  showCorrectAnswers: boolean;
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

  // Auto-scroll to active cue (pauses when user scrolls manually)
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
      {/* Hidden audio element */}
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}

      {/* Left — Transcript with audio controls */}
      <Splitter.Panel id="transcript">
        <Flex direction="column" h="100%">
          {/* Audio controls bar */}
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
                {/* Progress bar */}
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

          {/* Transcript cues */}
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

      {/* Right — Questions with answers */}
      <Splitter.Panel id="questions">
        <Box h="100%" overflowY="auto" px={{ base: 4, md: 6 }} py={4}>
          <ReviewQuestionsList
            questions={questions}
            showCorrectAnswers={showCorrectAnswers}
          />
        </Box>
      </Splitter.Panel>
    </Splitter.RootProvider>
  );
}

// ─── Questions List for Review ────────────────────────────────────────────

function ReviewQuestionsList({
  questions,
  showCorrectAnswers,
}: {
  questions: QuestionResult[];
  showCorrectAnswers: boolean;
}) {
  // Group consecutive questions by type for shared headers
  const groups = groupQuestionsByType(questions);

  return (
    <VStack align="stretch" gap={6}>
      {groups.map((group, gIdx) => (
        <Box key={gIdx}>
          {/* Group header */}
          <Heading size="sm" mb={1}>
            Questions {group.startNum}-{group.endNum}
          </Heading>
          <Text fontSize="sm" color="gray.500" mb={4}>
            {getInstructionForType(group.type)}
          </Text>

          {/* Question text (shared for note completion, etc.) */}
          {group.sharedText && (
            <Box
              mb={4}
              dangerouslySetInnerHTML={{ __html: group.sharedText }}
              fontSize="sm"
              lineHeight="1.7"
              css={{
                "& p": { marginBottom: "0.5em" },
                "& strong": { fontWeight: "bold" },
                "& ul, & ol": {
                  paddingLeft: "1.5em",
                  marginBottom: "0.5em",
                },
              }}
            />
          )}

          <VStack align="stretch" gap={3}>
            {group.questions.map((qr) => (
              <ReviewQuestionItem
                key={qr.questionId}
                question={qr}
                questionType={group.type}
                showCorrectAnswers={showCorrectAnswers}
              />
            ))}
          </VStack>

          {gIdx < groups.length - 1 && <Separator mt={6} />}
        </Box>
      ))}
    </VStack>
  );
}

// ─── Single Question Review Item ──────────────────────────────────────────

function ReviewQuestionItem({
  question,
  questionType,
  showCorrectAnswers,
}: {
  question: QuestionResult;
  questionType: string;
  showCorrectAnswers: boolean;
}) {
  const { questionNumber, userAnswer, correctAnswer, isCorrect, questionText } =
    question;
  const answered = userAnswer != null && userAnswer !== "";
  const correct = isCorrect === true;
  const wrong = isCorrect === false;

  // For input-based types (NOTE_COMPLETION, SHORT_ANSWER, SENTENCE_COMPLETION, etc.)
  const isInputType = [
    "NOTE_COMPLETION",
    "SHORT_ANSWER",
    "SENTENCE_COMPLETION",
    "SUMMARY_COMPLETION",
    "TABLE_COMPLETION",
    "FLOW_CHART_COMPLETION",
    "DIAGRAM_LABELLING",
    "PLAN_MAP_LABELLING",
  ].includes(questionType);

  // For selection-based types (TRUE_FALSE, MULTIPLE_CHOICE, MATCHING, etc.)
  const isSelectionType = [
    "TRUE_FALSE_NOT_GIVEN",
    "YES_NO_NOT_GIVEN",
    "MULTIPLE_CHOICE",
    "MULTIPLE_ANSWER",
    "MATCHING_HEADINGS",
    "MATCHING_INFORMATION",
    "MATCHING_FEATURES",
    "MATCHING_SENTENCE_ENDINGS",
    "SUMMARY_COMPLETION_DRAG_DROP",
  ].includes(questionType);

  return (
    <Flex
      id={`review-question-${questionNumber}`}
      align="flex-start"
      gap={3}
      py={2}
    >
      {/* Question number */}
      <Circle
        size="28px"
        bg={correct ? "green.500" : wrong ? "red.500" : "gray.400"}
        color="white"
        fontSize="xs"
        fontWeight="bold"
        flexShrink={0}
        mt={0.5}
      >
        {questionNumber}
      </Circle>

      <Box flex={1}>
        {/* Question text (for non-shared questions) */}
        {questionText && !isInputType && (
          <Text
            fontSize="sm"
            mb={2}
            dangerouslySetInnerHTML={{ __html: questionText }}
          />
        )}

        {/* Input-type answer display */}
        {isInputType && (
          <Flex align="center" gap={2} flexWrap="wrap">
            <Box
              px={3}
              py={1.5}
              borderWidth="2px"
              borderColor={
                correct ? "green.400" : wrong ? "red.400" : "gray.300"
              }
              borderRadius="md"
              bg={correct ? "green.50" : wrong ? "red.50" : "gray.50"}
              _dark={{
                bg: correct
                  ? "green.900/30"
                  : wrong
                    ? "red.900/30"
                    : "gray.700",
              }}
              minW="80px"
              fontSize="sm"
            >
              {answered ? userAnswer : "N/A"}
            </Box>
            {showCorrectAnswers && !correct && (
              <Text fontSize="sm" color="green.600" fontWeight="semibold">
                (Correct:{" "}
                <Text as="span" fontWeight="bold" textDecoration="underline">
                  {correctAnswer}
                </Text>
                )
              </Text>
            )}
            {correct && (
              <CheckCircle2 size={16} color="var(--chakra-colors-green-500)" />
            )}
            {(wrong || !answered) && (
              <Badge colorPalette="red" fontSize="xs">
                Wrong
              </Badge>
            )}
          </Flex>
        )}

        {/* Selection-type answer display */}
        {isSelectionType && (
          <Box>
            {/* User answer */}
            <Flex align="center" gap={2} mb={1}>
              <Text fontSize="sm" color={answered ? undefined : "gray.400"}>
                Your answer:{" "}
                <Text as="span" fontWeight="semibold">
                  {answered ? userAnswer : "N/A"}
                </Text>
              </Text>
              {correct && (
                <CheckCircle2
                  size={14}
                  color="var(--chakra-colors-green-500)"
                />
              )}
              {(wrong || !answered) && (
                <Badge colorPalette="red" fontSize="xs">
                  Wrong
                </Badge>
              )}
            </Flex>

            {/* Correct answer */}
            {showCorrectAnswers && !correct && (
              <Text fontSize="sm" color="green.600">
                Correct answer:{" "}
                <Text as="span" fontWeight="bold">
                  {correctAnswer}
                </Text>
              </Text>
            )}

            {/* FROM PASSAGE hint */}
            {question.fromPassage && showCorrectAnswers && (
              <Box
                mt={2}
                p={2}
                bg="blue.50"
                _dark={{ bg: "blue.900/30" }}
                borderRadius="md"
                borderLeftWidth="3px"
                borderLeftColor="blue.400"
              >
                <Text
                  fontSize="xs"
                  color="blue.600"
                  fontWeight="semibold"
                  mb={0.5}
                >
                  From passage:
                </Text>
                <Text fontSize="xs" fontStyle="italic">
                  {question.fromPassage}
                </Text>
              </Box>
            )}
          </Box>
        )}

        {/* Explanation */}
        {question.explanation && showCorrectAnswers && (
          <Box
            mt={2}
            p={2}
            bg="yellow.50"
            _dark={{ bg: "yellow.900/30" }}
            borderRadius="md"
          >
            <Text
              fontSize="xs"
              color="yellow.700"
              fontWeight="semibold"
              mb={0.5}
            >
              Explanation:
            </Text>
            <Text fontSize="xs">{question.explanation}</Text>
          </Box>
        )}
      </Box>
    </Flex>
  );
}

// ─── Part Navigation for Review ───────────────────────────────────────────

function ReviewPartNavigation({
  parts,
  currentPartIndex,
  onPartChange,
  questionResults,
}: {
  parts: PartInfo[];
  currentPartIndex: number;
  onPartChange: (idx: number) => void;
  questionResults: QuestionResult[];
}) {
  if (parts.length === 0) return null;

  return (
    <Flex
      px={{ base: 2, md: 4 }}
      py={2}
      bg="white"
      _dark={{ bg: "gray.800" }}
      borderTopWidth="1px"
      borderColor="gray.200"
      align="center"
      justify="space-between"
      flexShrink={0}
    >
      {/* Prev/Next */}
      <IconButton
        variant="ghost"
        size="sm"
        aria-label="Previous part"
        disabled={currentPartIndex === 0}
        onClick={() => onPartChange(currentPartIndex - 1)}
      >
        <ChevronLeft size={20} />
      </IconButton>

      {/* Part tabs */}
      <HStack gap={2} overflowX="auto" flex={1} justify="center">
        {parts.map((part, idx) => {
          const partQuestions = questionResults.filter(
            (qr) =>
              qr.questionNumber >= part.questionRange[0] &&
              qr.questionNumber <= part.questionRange[1],
          );
          const correctCount = partQuestions.filter(
            (q) => q.isCorrect === true,
          ).length;
          const totalCount = partQuestions.length;
          const isActive = idx === currentPartIndex;

          return (
            <Button
              key={part.id}
              size="sm"
              variant={isActive ? "solid" : "ghost"}
              colorPalette={isActive ? "brand" : "gray"}
              onClick={() => onPartChange(idx)}
              fontWeight={isActive ? "semibold" : "normal"}
            >
              {part.partLabel}
              <Badge
                ml={1}
                fontSize="2xs"
                colorPalette={
                  correctCount === totalCount
                    ? "green"
                    : correctCount > 0
                      ? "orange"
                      : "red"
                }
              >
                {correctCount}/{totalCount}
              </Badge>
            </Button>
          );
        })}
      </HStack>

      <IconButton
        variant="ghost"
        size="sm"
        aria-label="Next part"
        disabled={currentPartIndex === parts.length - 1}
        onClick={() => onPartChange(currentPartIndex + 1)}
      >
        <ChevronRight size={20} />
      </IconButton>
    </Flex>
  );
}

// ─── Writing Review ───────────────────────────────────────────────────────

function WritingReview({
  result,
  writingTasks,
  onBack,
}: {
  result: AttemptResult;
  writingTasks: Record<string, WritingTaskDetail>;
  onBack: () => void;
}) {
  const [currentTask, setCurrentTask] = useState(0);
  const wa = result.writingAnswers[currentTask];

  return (
    <Flex direction="column" h="100vh" bg="white" _dark={{ bg: "gray.900" }}>
      {/* Header */}
      <Flex
        h="14"
        px={4}
        alignItems="center"
        justifyContent="space-between"
        bg="white"
        _dark={{ bg: "gray.800" }}
        borderBottomWidth="1px"
      >
        <HStack gap={2}>
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft size={16} />
            Back to Results
          </Button>
          <Badge
            bg="red.500"
            color="white"
            px={3}
            py={1}
            borderRadius="md"
            fontWeight="bold"
          >
            IELTS
          </Badge>
        </HStack>
      </Flex>

      {/* Task tabs */}
      {result.writingAnswers.length > 1 && (
        <HStack px={4} py={2} borderBottomWidth="1px" gap={2}>
          {result.writingAnswers.map((w, idx) => (
            <Button
              key={w.taskId}
              size="sm"
              variant={idx === currentTask ? "solid" : "ghost"}
              colorPalette={idx === currentTask ? "brand" : "gray"}
              onClick={() => setCurrentTask(idx)}
            >
              Task {w.taskNumber || idx + 1}
            </Button>
          ))}
        </HStack>
      )}

      {/* Content */}
      {wa && (
        <Box
          flex={1}
          overflowY="auto"
          p={{ base: 4, md: 8 }}
          maxW="900px"
          mx="auto"
          w="100%"
        >
          {/* Task Prompt */}
          {writingTasks[wa.taskId]?.prompt && (
            <Card.Root mb={6} variant="outline" borderColor="blue.200">
              <Card.Body>
                <Flex align="center" gap={2} mb={2}>
                  <Heading size="sm">Task Prompt</Heading>
                  {writingTasks[wa.taskId]?.task && (
                    <Badge colorPalette="purple" fontSize="2xs">
                      {writingTasks[wa.taskId].task.replace("_", " ")}
                    </Badge>
                  )}
                </Flex>
                <Box
                  fontSize="sm"
                  lineHeight="1.7"
                  color="gray.700"
                  _dark={{ color: "gray.300" }}
                  dangerouslySetInnerHTML={{
                    __html: writingTasks[wa.taskId].prompt!,
                  }}
                  css={{ "& p": { marginBottom: "0.5em" } }}
                />
                {writingTasks[wa.taskId]?.image_url && (
                  <Box mt={4} position="relative">
                    <Image
                      src={writingTasks[wa.taskId].image_url!}
                      alt="Task visual"
                      width={800}
                      height={500}
                      style={{
                        maxWidth: "100%",
                        height: "auto",
                        borderRadius: "8px",
                        border: "1px solid var(--chakra-colors-gray-200)",
                      }}
                      unoptimized
                    />
                  </Box>
                )}
              </Card.Body>
            </Card.Root>
          )}

          {/* Score Card */}
          {wa.score && (
            <Card.Root mb={6} variant="outline">
              <Card.Body>
                <Heading size="sm" mb={3}>
                  Score Breakdown
                </Heading>
                <Flex gap={3} flexWrap="wrap">
                  <ScorePill
                    label="Task Response"
                    value={wa.score.task_response}
                  />
                  <ScorePill
                    label="Coherence"
                    value={wa.score.coherence_and_cohesion}
                  />
                  <ScorePill
                    label="Lexical"
                    value={wa.score.lexical_resources}
                  />
                  <ScorePill
                    label="Grammar"
                    value={wa.score.grammar_range_and_accuracy}
                  />
                  {wa.score.overall != null && (
                    <ScorePill
                      label="Overall"
                      value={wa.score.overall}
                      highlight
                    />
                  )}
                </Flex>
              </Card.Body>
            </Card.Root>
          )}

          {/* Feedback */}
          {wa.feedback && (
            <Card.Root mb={6} variant="outline">
              <Card.Body>
                <Heading size="sm" mb={2}>
                  Feedback
                </Heading>
                <Text fontSize="sm" lineHeight="1.7">
                  {wa.feedback}
                </Text>
              </Card.Body>
            </Card.Root>
          )}

          {!wa.score && !wa.feedback && (
            <Card.Root mb={6} variant="outline">
              <Card.Body>
                <Text color="gray.500" textAlign="center" py={4}>
                  This task has not been graded yet.
                </Text>
              </Card.Body>
            </Card.Root>
          )}

          {/* Essay */}
          <Card.Root variant="outline">
            <Card.Body>
              <Flex justify="space-between" align="center" mb={3}>
                <Heading size="sm">Your Response</Heading>
                <Badge colorPalette="blue">{wa.wordCount} words</Badge>
              </Flex>
              <Box
                p={4}
                bg="gray.50"
                _dark={{ bg: "gray.700" }}
                borderRadius="md"
                fontSize="sm"
                lineHeight="1.8"
                whiteSpace="pre-wrap"
              >
                {wa.answerText}
              </Box>
            </Card.Body>
          </Card.Root>
        </Box>
      )}
    </Flex>
  );
}

function ScorePill({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number | null;
  highlight?: boolean;
}) {
  return (
    <Flex
      align="center"
      gap={2}
      bg={highlight ? "blue.50" : "gray.50"}
      _dark={{ bg: highlight ? "blue.900/30" : "gray.700" }}
      px={3}
      py={2}
      borderRadius="lg"
      borderWidth={highlight ? "2px" : "1px"}
      borderColor={highlight ? "blue.300" : "gray.200"}
    >
      <Text fontSize="xs" color="gray.500">
        {label}
      </Text>
      <Text
        fontWeight="bold"
        fontSize="md"
        color={highlight ? "blue.600" : undefined}
      >
        {value != null ? value : "—"}
      </Text>
    </Flex>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function getQuestionNums(
  questions: {
    questionNumber?: number;
    questions?: { questionNumber?: number }[];
  }[],
): number[] {
  const nums: number[] = [];
  for (const q of questions) {
    if (q.questions?.length) {
      for (const sub of q.questions) {
        if (sub.questionNumber != null) nums.push(sub.questionNumber);
      }
    } else if (q.questionNumber != null) {
      nums.push(q.questionNumber);
    }
  }
  return nums.sort((a, b) => a - b);
}

interface QuestionGroup {
  type: string;
  startNum: number;
  endNum: number;
  questions: QuestionResult[];
  sharedText: string | null;
}

function groupQuestionsByType(questions: QuestionResult[]): QuestionGroup[] {
  if (questions.length === 0) return [];

  const groups: QuestionGroup[] = [];
  let current: QuestionGroup | null = null;

  for (const q of questions) {
    if (!current || current.type !== q.questionType) {
      if (current) groups.push(current);
      current = {
        type: q.questionType,
        startNum: q.questionNumber,
        endNum: q.questionNumber,
        questions: [q],
        sharedText: null,
      };
    } else {
      current.endNum = q.questionNumber;
      current.questions.push(q);
    }
  }
  if (current) groups.push(current);

  // Set shared text for note-completion style question groups
  for (const group of groups) {
    const inputTypes = [
      "NOTE_COMPLETION",
      "SENTENCE_COMPLETION",
      "SUMMARY_COMPLETION",
      "TABLE_COMPLETION",
      "FLOW_CHART_COMPLETION",
    ];
    if (inputTypes.includes(group.type) && group.questions[0]?.questionText) {
      group.sharedText = group.questions[0].questionText;
    }
  }

  return groups;
}

function getInstructionForType(type: string): string {
  switch (type) {
    case "TRUE_FALSE_NOT_GIVEN":
      return "Choose TRUE if the statement agrees with the information given in the text, choose FALSE if the statement contradicts the information, or choose NOT GIVEN if there is no information on this.";
    case "YES_NO_NOT_GIVEN":
      return "Choose YES if the statement agrees with the views of the writer, choose NO if the statement contradicts the views of the writer, or choose NOT GIVEN if it is impossible to say what the writer thinks about this.";
    case "MATCHING_HEADINGS":
      return "Choose the correct heading for each paragraph from the list of headings below.";
    case "MATCHING_INFORMATION":
      return "Which paragraph contains the following information?";
    case "MATCHING_FEATURES":
      return "Match each statement with the correct option.";
    case "MATCHING_SENTENCE_ENDINGS":
      return "Complete each sentence with the correct ending.";
    case "NOTE_COMPLETION":
      return "Complete the notes. Write ONE WORD ONLY from the text for each answer.";
    case "SENTENCE_COMPLETION":
      return "Complete the sentences below. Write NO MORE THAN TWO WORDS from the text for each answer.";
    case "SUMMARY_COMPLETION":
      return "Complete the summary below.";
    case "SUMMARY_COMPLETION_DRAG_DROP":
      return "Complete the summary below. Choose words from the box.";
    case "MULTIPLE_CHOICE":
      return "Choose the correct answer.";
    case "MULTIPLE_ANSWER":
      return "Choose the correct answers.";
    case "SHORT_ANSWER":
      return "Answer the questions below.";
    case "TABLE_COMPLETION":
      return "Complete the table below.";
    case "FLOW_CHART_COMPLETION":
      return "Complete the flow chart below.";
    case "DIAGRAM_LABELLING":
      return "Label the diagram below.";
    default:
      return "";
  }
}
