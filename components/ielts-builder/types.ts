// IELTS Test Builder Types — aligned with backend API

// ─── Question Types (17 IELTS question types) ─────────────────────────────

export type IELTSQuestionType =
  | "NOTE_COMPLETION"
  | "TRUE_FALSE_NOT_GIVEN"
  | "YES_NO_NOT_GIVEN"
  | "MATCHING_INFORMATION"
  | "MATCHING_HEADINGS"
  | "SUMMARY_COMPLETION"
  | "SUMMARY_COMPLETION_DRAG_DROP"
  | "MULTIPLE_CHOICE"
  | "SENTENCE_COMPLETION"
  | "SHORT_ANSWER"
  | "TABLE_COMPLETION"
  | "FLOW_CHART_COMPLETION"
  | "DIAGRAM_LABELLING"
  | "MATCHING_FEATURES"
  | "MATCHING_SENTENCE_ENDINGS"
  | "PLAN_MAP_LABELLING"
  | "MULTIPLE_ANSWER";

export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";

// ─── Question Option (Choice) ──────────────────────────────────────────────

export interface IELTSQuestionOption {
  id?: string;
  question_id?: string;
  optionKey: string; // e.g. "A", "B", "C", "D"
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
  explanation?: string;
  fromPassage?: string;
}

// ─── Sub Question ──────────────────────────────────────────────────────────

export interface IELTSSubQuestion {
  id?: string;
  question_id?: string;
  questionNumber?: number;
  questionText?: string;
  points?: number;
  correctAnswer?: string;
  explanation?: string;
  fromPassage?: string;
  order?: number;
}

// ─── Question (group-level) ────────────────────────────────────────────────

export interface IELTSQuestion {
  id?: string;
  reading_part_id?: string;
  listening_part_id?: string;
  questionNumber?: number;
  type?: IELTSQuestionType;
  questionText?: string;
  instruction?: string;
  context?: string;
  headingOptions?: Record<string, string>;
  tableData?: { headers: string[]; rows: string[][] };
  points?: number;
  isActive?: boolean;
  explanation?: string;
  fromPassage?: string;
  // Nested relations
  questions?: IELTSSubQuestion[]; // sub-questions
  options?: IELTSQuestionOption[]; // choices
}

// ─── Test ──────────────────────────────────────────────────────────────────

export interface IELTSTest {
  id: string;
  title: string;
  mode: "practice" | "mock";
  status: "draft" | "published";
  category?: string;
  created_by?: string;
  createdAt?: string;
  updatedAt?: string;
  readings?: IELTSReading[];
  listenings?: IELTSListening[];
  writings?: IELTSWriting[];
}

// ─── Reading ───────────────────────────────────────────────────────────────

export interface IELTSReading {
  id: string;
  title: string;
  test_id: string;
  parts?: IELTSReadingPart[];
}

export interface IELTSReadingPart {
  id: string;
  reading_id: string;
  part: "PART_1" | "PART_2" | "PART_3";
  title?: string;
  content?: string; // reading passage (HTML)
  timeLimitMinutes?: number;
  difficulty?: DifficultyLevel;
  isActive?: boolean;
  totalQuestions?: number;
  questions?: IELTSQuestion[];
}

// ─── Listening ─────────────────────────────────────────────────────────────

export interface IELTSListening {
  id: string;
  title: string;
  description?: string;
  test_id: string;
  full_audio_url?: string;
  is_active?: boolean;
  parts?: IELTSListeningPart[];
}

export interface IELTSListeningPart {
  id: string;
  listening_id: string;
  part: "PART_1" | "PART_2" | "PART_3" | "PART_4";
  title?: string;
  audio_url?: string;
  timeLimitMinutes?: number;
  difficulty?: DifficultyLevel;
  isActive?: boolean;
  totalQuestions?: number;
  questions?: IELTSQuestion[];
}

// ─── Writing ───────────────────────────────────────────────────────────────

export interface IELTSWriting {
  id: string;
  title: string;
  description?: string;
  test_id: string;
  is_active?: boolean;
  tasks?: IELTSWritingTask[];
}

export interface IELTSWritingTask {
  id: string;
  writing_id: string;
  task: "TASK_1" | "TASK_2";
  prompt?: string;
  image_url?: string;
  min_words?: number;
  suggested_time?: number;
}

// ─── Navigation page IDs ──────────────────────────────────────────────────

export type PageId =
  | "tests"
  | "test-form"
  | "test-detail"
  | "readings"
  | "reading-form"
  | "reading-parts"
  | "reading-part-form"
  | "listenings"
  | "listening-form"
  | "listening-parts"
  | "listening-part-form"
  | "writings"
  | "writing-form"
  | "writing-tasks"
  | "writing-task-form"
  | "reading-part-questions"
  | "listening-part-questions";
