// IELTS Test Builder Types

export type QuestionType =
  | "completion"
  | "multiple-choice"
  | "multi-select"
  | "selection"
  | "draggable-selection"
  | "matching-information";

export interface QuestionOption {
  value: string;
  label: string;
  order: number;
}

export interface MCQQuestion {
  question: string;
  order: number;
  options: QuestionOption[];
}

export interface QuestionContent {
  type: QuestionType;
  title: string;
  condition: string | null;
  content: string | null;
  limit: number | null;
  showOptions: boolean;
  optionsTitle: string | null;
  order: number;
  options: QuestionOption[];
  multipleChoiceQuestions: MCQQuestion[];
}

export interface QuestionGroup {
  number_of_questions: number;
  contents: QuestionContent[];
}

export interface IELTSTest {
  id: string;
  title: string;
  mode: "practice" | "mock";
  status: "draft" | "published";
  category?: string;
  readings?: IELTSReading[];
  listenings?: IELTSListening[];
  writings?: IELTSWriting[];
}

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
  passage?: string;
  answers?: Record<string, string>;
  questions?: QuestionGroup[];
}

export interface AudioInfo {
  url: string;
  file_name?: string;
  duration?: number;
}

export interface IELTSListening {
  id: string;
  title: string;
  description?: string;
  test_id: string;
  full_audio_url?: string;
  parts?: IELTSListeningPart[];
}

export interface IELTSListeningPart {
  id: string;
  listening_id: string;
  part: "PART_1" | "PART_2" | "PART_3" | "PART_4";
  title?: string;
  audio?: AudioInfo;
  answers?: Record<string, string>;
  questions?: QuestionGroup[];
}

export interface IELTSWriting {
  id: string;
  title: string;
  description?: string;
  test_id: string;
  tasks?: IELTSWritingTask[];
}

export interface IELTSWritingTask {
  id: string;
  writing_id: string;
  task: "TASK_1" | "TASK_2";
  prompt?: string;
  instructions?: string;
  min_words?: number;
  suggested_time?: number;
}

// Navigation page IDs
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
