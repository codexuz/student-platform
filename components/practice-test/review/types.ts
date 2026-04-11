export interface QuestionResult {
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

export interface WritingAnswerResult {
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

export interface AttemptResult {
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

export interface PartInfo {
  id: string;
  partLabel: string;
  title?: string;
  content?: string;
  instruction?: string;
  questionRange: [number, number];
  audioUrl?: string;
  transcriptUrl?: string;
  rawQuestions?: RawQuestionGroup[];
}

export interface WritingTaskDetail {
  id: string;
  task: string;
  prompt: string | null;
  min_words: number | null;
  suggested_time: number | null;
  image_url: string | null;
}

// ─── Raw question data (from part/module fetch) ───────────────────────────

export interface RawOption {
  optionKey: string;
  optionText: string;
  isCorrect: boolean;
}

export interface RawSubQuestion {
  questionNumber: number;
  correctAnswer: string;
}

export interface RawQuestionGroup {
  id: string;
  questionNumber: number;
  type: string;
  questionText: string | null;
  instruction: string | null;
  options: RawOption[];
  questions: RawSubQuestion[];
  headingOptions?: Record<string, string>;
}
