"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Spinner,
  Splitter,
  useSplitter,
} from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  ieltsAnswersAPI,
  ieltsReadingPartsAPI,
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

export default function ReadingReviewPage() {
  return (
    <ProtectedRoute>
      <ReadingReviewContent />
    </ProtectedRoute>
  );
}

function ReadingReviewContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = params?.attemptId as string;
  const partIdFromQuery = searchParams.get("part_id");

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

        if (attemptResult.readingId || resolvedModuleId) {
          // MODULE scope
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
                    id?: string;
                    questionNumber?: number;
                    type?: string;
                    questionText?: string;
                    instruction?: string;
                    headingOptions?: Record<string, string>;
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
                    content: p.content,
                    instruction:
                      allNums.length > 0
                        ? `Read the text and answer questions ${allNums[0]}-${allNums[allNums.length - 1]}.`
                        : "Read the text and answer the questions.",
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
                      headingOptions: q.headingOptions ?? undefined,
                    })),
                  };
                },
              );
              setParts(partInfos);
            }
          } catch {
            // Module data fetch failed, still show questions
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
            const partData = await ieltsReadingPartsAPI.getById(resolvedPartId);
            const p = partData?.data ?? partData;
            if (p?.content) {
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
                  rawQuestions: (p.questions ?? []).map((q: { id?: string; questionNumber?: number; type?: string; questionText?: string; instruction?: string; headingOptions?: Record<string, string>; options?: { optionKey: string; optionText: string; isCorrect: boolean }[]; questions?: { questionNumber?: number; correctAnswer?: string }[] }) => ({
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
                    headingOptions: q.headingOptions ?? undefined,
                  })),
                },
              ]);
            }
          } catch {
            // Part data fetch failed
          }
        }
      } catch (err: unknown) {
        console.error("Failed to load reading review:", err);
        setError("Failed to load review data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [attemptId, partIdFromQuery]);

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

  const hasPassage = currentPart?.content;

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

      {hasPassage ? (
        <ReadingSplitView
          passage={currentPart?.content}
          passageTitle={currentPart?.title}
          questions={currentQuestions}
          showCorrectAnswers={showCorrectAnswers}
          rawQuestionGroups={currentPart?.rawQuestions ?? parts.flatMap((p) => p.rawQuestions ?? [])}
        />
      ) : (
        <Box flex={1} overflowY="auto" px={{ base: 4, md: 8 }} py={4}>
          <ReviewQuestionsList
            questions={parts.length > 0 ? currentQuestions : allQuestions}
            showCorrectAnswers={showCorrectAnswers}
            rawQuestionGroups={currentPart?.rawQuestions ?? parts.flatMap((p) => p.rawQuestions ?? [])}
          />
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

// ─── Reading Split View ───────────────────────────────────────────────────

function ReadingSplitView({
  passage,
  passageTitle,
  questions,
  showCorrectAnswers,
  rawQuestionGroups,
}: {
  passage?: string;
  passageTitle?: string;
  questions: QuestionResult[];
  showCorrectAnswers: boolean;
  rawQuestionGroups?: import("@/components/practice-test/review/types").RawQuestionGroup[];
}) {
  const splitter = useSplitter({
    defaultSize: [50, 50],
    panels: [{ id: "passage" }, { id: "questions", minSize: 20 }],
  });

  const highlightedPassage =
    passage && showCorrectAnswers
      ? buildHighlightedPassage(passage, questions)
      : passage;

  return (
    <Splitter.RootProvider value={splitter} flex={1} overflow="hidden">
      <Splitter.Panel id="passage">
        <Box h="100%" overflowY="auto" px={{ base: 4, md: 6 }} py={4}>
          {passageTitle && (
            <Heading size="sm" mb={3}>
              {passageTitle}
            </Heading>
          )}
          {highlightedPassage && (
            <Box
              className="reading-passage"
              dangerouslySetInnerHTML={{ __html: highlightedPassage }}
              fontSize="sm"
              lineHeight="1.8"
              css={{
                "& p": { marginBottom: "1em" },
                "& h1, & h2, & h3": {
                  fontWeight: "bold",
                  marginBottom: "0.5em",
                },
                "& mark.from-passage-highlight": {
                  backgroundColor: "#FED7AA",
                  borderRadius: "2px",
                  padding: "1px 2px",
                  position: "relative",
                },
                "& .from-passage-qnum": {
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  backgroundColor: "#EA580C",
                  color: "white",
                  fontSize: "10px",
                  fontWeight: "bold",
                  marginLeft: "3px",
                  verticalAlign: "middle",
                  lineHeight: 1,
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

      <Splitter.Panel id="questions">
        <Box h="100%" overflowY="auto" px={{ base: 4, md: 6 }} py={4}>
          <ReviewQuestionsList
            questions={questions}
            showCorrectAnswers={showCorrectAnswers}
            hideFromPassage
            rawQuestionGroups={rawQuestionGroups}
          />
        </Box>
      </Splitter.Panel>
    </Splitter.RootProvider>
  );
}

// ─── Passage Highlighting Helper ──────────────────────────────────────────

function buildHighlightedPassage(
  passageHtml: string,
  questions: QuestionResult[],
): string {
  const entries: { questionNumber: number; text: string }[] = [];
  for (const q of questions) {
    if (q.fromPassage) {
      entries.push({ questionNumber: q.questionNumber, text: q.fromPassage });
    }
  }
  if (entries.length === 0) return passageHtml;

  const stripHtml = (html: string) =>
    html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

  const normalize = (text: string) =>
    text
      .replace(/[\u2013\u2014\u2012\u2015]/g, "-")
      .replace(/[\u2018\u2019\u201A\u0060\u00B4]/g, "'")
      .replace(/[\u201C\u201D\u201E]/g, '"')
      .replace(/\s+/g, " ")
      .toLowerCase();

  const passagePlain = stripHtml(passageHtml);
  const passageNorm = normalize(passagePlain);

  type RawRange = { start: number; end: number; questionNumber: number };
  const rawRanges: RawRange[] = [];

  for (const entry of entries) {
    const needle = stripHtml(entry.text);
    if (!needle) continue;
    const needleNorm = normalize(needle);

    let idx = passageNorm.indexOf(needleNorm);

    if (idx === -1 && needleNorm.length > 80) {
      const shorter = needleNorm.substring(0, 80);
      idx = passageNorm.indexOf(shorter);
    }

    if (idx === -1 && needleNorm.length > 40) {
      const shorter = needleNorm.substring(0, 40);
      idx = passageNorm.indexOf(shorter);
    }

    if (idx !== -1) {
      rawRanges.push({
        start: idx,
        end: Math.min(idx + needleNorm.length, passagePlain.length),
        questionNumber: entry.questionNumber,
      });
    }
  }

  if (rawRanges.length === 0) return passageHtml;

  rawRanges.sort((a, b) => a.start - b.start);

  type MergedRange = { start: number; end: number; questionNumbers: number[] };
  const merged: MergedRange[] = [];

  for (const r of rawRanges) {
    const last = merged[merged.length - 1];
    if (last && r.start <= last.end) {
      last.end = Math.max(last.end, r.end);
      if (!last.questionNumbers.includes(r.questionNumber)) {
        last.questionNumbers.push(r.questionNumber);
      }
    } else {
      merged.push({
        start: r.start,
        end: r.end,
        questionNumbers: [r.questionNumber],
      });
    }
  }

  for (const m of merged) {
    m.questionNumbers.sort((a, b) => a - b);
  }

  let result = "";
  let plainIdx = 0;
  let htmlIdx = 0;
  let rangeIdx = 0;

  while (htmlIdx < passageHtml.length && rangeIdx < merged.length) {
    const range = merged[rangeIdx];

    if (passageHtml[htmlIdx] === "<") {
      const tagEnd = passageHtml.indexOf(">", htmlIdx);
      if (tagEnd === -1) {
        result += passageHtml.substring(htmlIdx);
        htmlIdx = passageHtml.length;
      } else {
        result += passageHtml.substring(htmlIdx, tagEnd + 1);
        htmlIdx = tagEnd + 1;
      }
    } else if (passageHtml[htmlIdx] === "&") {
      const entityEnd = passageHtml.indexOf(";", htmlIdx);
      const entityStr =
        entityEnd !== -1
          ? passageHtml.substring(htmlIdx, entityEnd + 1)
          : passageHtml[htmlIdx];
      const entityLen = entityEnd !== -1 ? entityEnd + 1 - htmlIdx : 1;

      if (plainIdx === range.start) {
        result += `<mark class="from-passage-highlight">${entityStr}`;
      } else if (plainIdx >= range.start && plainIdx < range.end) {
        result += entityStr;
      } else {
        result += entityStr;
      }
      plainIdx++;
      htmlIdx += entityLen;

      if (plainIdx >= range.end) {
        const badges = range.questionNumbers
          .map((n) => `<span class="from-passage-qnum">${n}</span>`)
          .join("");
        result += `${badges}</mark>`;
        rangeIdx++;
      }
    } else {
      const ch = passageHtml[htmlIdx];
      const isWhitespace = /\s/.test(ch);

      if (plainIdx === range.start) {
        result += `<mark class="from-passage-highlight">`;
      }

      result += ch;
      htmlIdx++;

      if (isWhitespace) {
        while (
          htmlIdx < passageHtml.length &&
          /\s/.test(passageHtml[htmlIdx]) &&
          passageHtml[htmlIdx] !== "<"
        ) {
          result += passageHtml[htmlIdx];
          htmlIdx++;
        }
      }
      plainIdx++;

      if (plainIdx >= range.end) {
        const badges = range.questionNumbers
          .map((n) => `<span class="from-passage-qnum">${n}</span>`)
          .join("");
        result += `${badges}</mark>`;
        rangeIdx++;
      }
    }
  }

  if (htmlIdx < passageHtml.length) {
    result += passageHtml.substring(htmlIdx);
  }

  return result;
}
