// ── Course Builder Types ──

export interface Course {
  id: string;
  title: string;
  description?: string;
  status?: "draft" | "published" | "archived";
  thumbnail_url?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Section {
  id: string;
  course_id: string;
  title: string;
  position: number;
  lessons?: Lesson[];
}

export interface VideoTrack {
  src: string;
  lang: "uz" | "en" | "ru";
  label: string;
}

export interface Lesson {
  id: string;
  section_id: string;
  title: string;
  position: number;
  content?: ContentBlock[];
  duration_seconds?: number;
  tracks?: VideoTrack[];
}

export type BlockType =
  | "paragraph"
  | "heading"
  | "video"
  | "image"
  | "embed"
  | "document"
  | "ielts_practice";

export interface ContentBlock {
  id: number | string;
  type: BlockType;
  content: string;
}

export interface Quiz {
  id: string;
  course_id: string;
  lesson_id?: string;
  title: string;
  time_limit_seconds?: number;
  attempts_allowed: number;
  is_published: boolean;
}

export type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "true_false"
  | "short_text";

export interface QuizChoice {
  id?: string;
  choice_text: string;
  is_correct: boolean;
  position: number;
}

export interface AcceptedAnswer {
  id?: string;
  answer_text: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_type: QuestionType;
  prompt: string;
  explanation?: string;
  points: number;
  position: number;
  choices?: QuizChoice[];
  accepted_answers?: AcceptedAnswer[];
}
