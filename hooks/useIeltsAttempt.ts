"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ieltsAnswersAPI } from "@/lib/ielts-api";
import type { AnswerMap } from "@/components/practice-test/types";

// ─── Types ────────────────────────────────────────────────────────────────

export type AttemptScope = "TEST" | "MODULE" | "PART" | "TASK";
export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "ABANDONED";

export interface AttemptData {
  id: string;
  user_id: string;
  scope: AttemptScope;
  test_id: string | null;
  module_id: string | null;
  part_id: string | null;
  task_id: string | null;
  started_at: string;
  finished_at: string | null;
  status: AttemptStatus;
}

export interface AttemptConfig {
  scope: AttemptScope;
  /** The entity ID — test_id, module_id, part_id, or task_id depending on scope */
  entityId: string;
  /** Which module types to save answers for */
  modules?: ("reading" | "listening" | "writing")[];
}

export interface PartQuestionMapping {
  partId: string;
  questionIds: Record<number, string>;
  // questionNumber → questionId
}

/** Reading/Listening answer shape used internally */
interface ReadingListeningAnswer {
  part_id: string;
  question_id: string;
  question_number: string;
  answer: string;
}

/** Writing answer shape used internally */
interface WritingAnswer {
  task_id: string;
  answer_text: string;
  word_count: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useIeltsAttempt(config: AttemptConfig) {
  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Track the latest answers for auto-save (avoids stale closure issues)
  const latestAnswersRef = useRef<AnswerMap>({});
  const latestEssaysRef = useRef<Record<string, string>>({});
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Create attempt ───────────────────────────────────────────────────

  const createAttempt = useCallback(async (): Promise<AttemptData | null> => {
    try {
      setError(null);

      const scopeField = getScopeField(config.scope);
      const body: Record<string, string> = {
        scope: config.scope,
        [scopeField]: config.entityId,
      };

      const data = await ieltsAnswersAPI.createAttempt(body);
      const attemptData = data?.data ?? data;
      setAttempt(attemptData);
      return attemptData;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create attempt";
      setError(msg);
      console.error("Failed to create attempt:", err);
      return null;
    }
  }, [config.scope, config.entityId]);

  // ─── Save Reading Answers ─────────────────────────────────────────────

  const saveReadingAnswers = useCallback(
    async (
      answers: AnswerMap,
      partMappings: PartQuestionMapping[],
    ): Promise<boolean> => {
      const attemptId = attempt?.id;
      if (!attemptId) {
        console.warn("No attempt ID — skipping reading save");
        return false;
      }

      const answerPayload: ReadingListeningAnswer[] = [];

      for (const mapping of partMappings) {
        for (const [qNumStr, qId] of Object.entries(mapping.questionIds)) {
          const qNum = Number(qNumStr);
          if (answers[qNum] !== undefined && answers[qNum] !== "") {
            answerPayload.push({
              part_id: mapping.partId,
              question_id: qId,
              question_number: String(qNum),
              answer: answers[qNum],
            });
          }
        }
      }

      if (answerPayload.length === 0) return true;

      try {
        setIsSaving(true);
        setError(null);
        await ieltsAnswersAPI.saveReadingAnswers({
          attempt_id: attemptId,
          answers: answerPayload,
        });
        setLastSavedAt(new Date());
        return true;
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to save reading answers";
        setError(msg);
        console.error("Failed to save reading answers:", err);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [attempt?.id],
  );

  // ─── Save Listening Answers ───────────────────────────────────────────

  const saveListeningAnswers = useCallback(
    async (
      answers: AnswerMap,
      partMappings: PartQuestionMapping[],
    ): Promise<boolean> => {
      const attemptId = attempt?.id;
      if (!attemptId) {
        console.warn("No attempt ID — skipping listening save");
        return false;
      }

      const answerPayload: ReadingListeningAnswer[] = [];

      for (const mapping of partMappings) {
        for (const [qNumStr, qId] of Object.entries(mapping.questionIds)) {
          const qNum = Number(qNumStr);
          if (answers[qNum] !== undefined && answers[qNum] !== "") {
            answerPayload.push({
              part_id: mapping.partId,
              question_id: qId,
              question_number: String(qNum),
              answer: answers[qNum],
            });
          }
        }
      }

      if (answerPayload.length === 0) return true;

      try {
        setIsSaving(true);
        setError(null);
        await ieltsAnswersAPI.saveListeningAnswers({
          attempt_id: attemptId,
          answers: answerPayload,
        });
        setLastSavedAt(new Date());
        return true;
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to save listening answers";
        setError(msg);
        console.error("Failed to save listening answers:", err);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [attempt?.id],
  );

  // ─── Save Writing Answers ─────────────────────────────────────────────

  const saveWritingAnswers = useCallback(
    async (essays: Record<string, string>): Promise<boolean> => {
      const attemptId = attempt?.id;
      if (!attemptId) {
        console.warn("No attempt ID — skipping writing save");
        return false;
      }

      const answerPayload: WritingAnswer[] = [];

      for (const [taskId, essayText] of Object.entries(essays)) {
        if (essayText && essayText.trim()) {
          const wordCount = essayText
            .trim()
            .split(/\s+/)
            .filter((w) => w.length > 0).length;
          answerPayload.push({
            task_id: taskId,
            answer_text: essayText,
            word_count: wordCount,
          });
        }
      }

      if (answerPayload.length === 0) return true;

      try {
        setIsSaving(true);
        setError(null);
        await ieltsAnswersAPI.saveWritingAnswers({
          attempt_id: attemptId,
          answers: answerPayload,
        });
        setLastSavedAt(new Date());
        return true;
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to save writing answers";
        setError(msg);
        console.error("Failed to save writing answers:", err);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [attempt?.id],
  );

  // ─── Submit Attempt ───────────────────────────────────────────────────

  const submitAttempt = useCallback(async (): Promise<boolean> => {
    const attemptId = attempt?.id;
    if (!attemptId) {
      console.warn("No attempt ID — cannot submit");
      return false;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const data = await ieltsAnswersAPI.submitAttempt(attemptId);
      const updated = data?.data ?? data;
      setAttempt((prev) =>
        prev
          ? {
              ...prev,
              status: "SUBMITTED",
              finished_at: updated?.finished_at ?? new Date().toISOString(),
            }
          : prev,
      );
      return true;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to submit attempt";
      setError(msg);
      console.error("Failed to submit attempt:", err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [attempt?.id]);

  // ─── Abandon Attempt ──────────────────────────────────────────────────

  const abandonAttempt = useCallback(async (): Promise<boolean> => {
    const attemptId = attempt?.id;
    if (!attemptId) return false;

    try {
      setError(null);
      await ieltsAnswersAPI.abandonAttempt(attemptId);
      setAttempt((prev) =>
        prev
          ? {
              ...prev,
              status: "ABANDONED",
              finished_at: new Date().toISOString(),
            }
          : prev,
      );
      return true;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to abandon attempt";
      setError(msg);
      console.error("Failed to abandon attempt:", err);
      return false;
    }
  }, [attempt?.id]);

  // ─── Auto-save setup ─────────────────────────────────────────────────

  const startAutoSave = useCallback(
    (intervalMs: number, saveCallback: () => Promise<void>) => {
      stopAutoSave();
      autoSaveTimerRef.current = setInterval(async () => {
        if (!isSaving && attempt?.status === "IN_PROGRESS") {
          await saveCallback();
        }
      }, intervalMs);
    },
    [isSaving, attempt?.status],
  );

  const stopAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);

  // Cleanup auto-save on unmount
  useEffect(() => {
    return () => {
      stopAutoSave();
    };
  }, [stopAutoSave]);

  // ─── Update refs for latest answers ───────────────────────────────────

  const updateLatestAnswers = useCallback((answers: AnswerMap) => {
    latestAnswersRef.current = answers;
  }, []);

  const updateLatestEssays = useCallback((essays: Record<string, string>) => {
    latestEssaysRef.current = essays;
  }, []);

  return {
    // State
    attempt,
    isSaving,
    isSubmitting,
    error,
    lastSavedAt,

    // Actions
    createAttempt,
    saveReadingAnswers,
    saveListeningAnswers,
    saveWritingAnswers,
    submitAttempt,
    abandonAttempt,

    // Auto-save
    startAutoSave,
    stopAutoSave,
    updateLatestAnswers,
    updateLatestEssays,
    latestAnswersRef,
    latestEssaysRef,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getScopeField(scope: AttemptScope): string {
  switch (scope) {
    case "TEST":
      return "test_id";
    case "MODULE":
      return "module_id";
    case "PART":
      return "part_id";
    case "TASK":
      return "task_id";
  }
}

/**
 * Build PartQuestionMapping[] from PartData[].
 * Maps each question number to its question ID so the API gets proper UUIDs.
 */
export function buildPartMappings(
  parts: {
    id: string;
    questions: Array<{
      id?: string;
      questionNumber?: number | null;
      questions?: Array<{ id?: string; questionNumber?: number | null }>;
    }>;
  }[],
): PartQuestionMapping[] {
  return parts.map((part) => {
    const questionIds: Record<number, string> = {};

    for (const q of part.questions) {
      if (q.questions?.length) {
        // Parent question with sub-questions
        for (const sub of q.questions) {
          if (sub.questionNumber != null && sub.id) {
            questionIds[sub.questionNumber] = sub.id;
          }
        }
      } else if (q.questionNumber != null && q.id) {
        questionIds[q.questionNumber] = q.id;
      }
    }

    return { partId: part.id, questionIds };
  });
}
