// Practice Test UI Types — for student-facing test-taking experience

import type {
  IELTSQuestion,
  IELTSSubQuestion,
  IELTSQuestionOption,
} from "@/components/ielts-builder/types";

// Re-export for convenience
export type { IELTSQuestion, IELTSSubQuestion, IELTSQuestionOption };

// ─── Answer State ──────────────────────────────────────────────────────────

/** questionNumber → user answer string */
export type AnswerMap = Record<number, string>;

// ─── Question Component Props ──────────────────────────────────────────────

export interface QuestionComponentProps {
  question: IELTSQuestion;
  answers: AnswerMap;
  onAnswer: (questionNumber: number, answer: string) => void;
  disabled?: boolean;
  showResults?: boolean;
}

// ─── Part Data ─────────────────────────────────────────────────────────────

export interface PartData {
  id: string;
  partLabel: string; // "Part 1", "Part 2", etc.
  title?: string;
  content?: string; // HTML passage content
  instruction?: string; // "Read the text and answer questions 1-13."
  questions: IELTSQuestion[];
  totalQuestions: number;
  questionRange: [number, number]; // [startNum, endNum]
}

// ─── Test Session State ────────────────────────────────────────────────────

export interface TestSessionState {
  answers: AnswerMap;
  currentPartIndex: number;
  currentQuestionNumber: number | null;
  timerSeconds: number;
  isTimerRunning: boolean;
  isStarted: boolean;
  isSubmitted: boolean;
}

// ─── Test Header Props ─────────────────────────────────────────────────────

export interface TestHeaderProps {
  /** Starting value for the countdown (seconds). */
  initialTimerSeconds: number;
  isTimerRunning: boolean;
  isStarted: boolean;
  onStart: () => void;
  /** Called when countdown reaches 0. */
  onTimerEnd?: () => void;
  onToggleFullscreen?: () => void;
  /** Called when the user clicks Submit. */
  onSubmit?: () => void;
}

// ─── Part Navigation Props ─────────────────────────────────────────────────

export interface PartNavigationProps {
  parts: PartData[];
  currentPartIndex: number;
  currentQuestionNumber: number | null;
  answers: AnswerMap;
  onPartChange: (index: number) => void;
  onQuestionClick: (questionNumber: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onSubmit?: () => void;
  isStarted?: boolean;
}

// ─── Reading Passage Props ─────────────────────────────────────────────────

export interface ReadingPassageProps {
  content?: string; // HTML
  title?: string;
}

// ─── Question Panel Props ──────────────────────────────────────────────────

export interface QuestionPanelProps {
  questions: IELTSQuestion[];
  answers: AnswerMap;
  onAnswer: (questionNumber: number, answer: string) => void;
  disabled?: boolean;
  showResults?: boolean;
  highlightedQuestion?: number | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Derive question number range from a question group's sub-questions */
export function getQuestionRange(question: IELTSQuestion): [number, number] {
  const nums =
    question.questions
      ?.map((q) => q.questionNumber)
      .filter((n): n is number => n != null) ?? [];
  if (nums.length === 0)
    return [question.questionNumber ?? 0, question.questionNumber ?? 0];
  return [Math.min(...nums), Math.max(...nums)];
}

/** Derive all question numbers from a part's question groups */
export function getAllQuestionNumbers(questions: IELTSQuestion[]): number[] {
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

/** Format seconds as mm:ss */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/** Blank placeholder regex */
export const BLANK_PATTERN =
  /_{3,}|\{blank\}|\{answer\}|\[blank\]|\(\.\.\.\)/gi;
