"use client";

import { request } from "@/lib/api";

// ─── IELTS Test Builder API endpoints ────────────────────────────────────────
// Aligned with the NestJS backend controllers (see IELTS_TEST_CREATION_GUIDE.md)

// Tests API — /ielts-tests
export const ieltsTestsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.search) qs.set("search", params.search);
    if (params.mode) qs.set("mode", params.mode);
    if (params.status) qs.set("status", params.status);
    if (params.category) qs.set("category", params.category);
    const q = qs.toString();
    return request({ url: `/ielts-tests${q ? `?${q}` : ""}`, method: "GET" });
  },

  getById: (id) => request({ url: `/ielts-tests/${id}`, method: "GET" }),

  create: (data) =>
    request({ url: "/ielts-tests", method: "POST", content: data }),

  update: (id, data) =>
    request({ url: `/ielts-tests/${id}`, method: "PATCH", content: data }),

  delete: (id) => request({ url: `/ielts-tests/${id}`, method: "DELETE" }),
};

// Reading API — /ielts-reading
export const ieltsReadingAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.search) qs.set("search", params.search);
    if (params.testId) qs.set("testId", params.testId);
    if (params.mode) qs.set("mode", params.mode);
    if (params.part) qs.set("part", params.part);
    const q = qs.toString();
    return request({
      url: `/ielts-reading${q ? `?${q}` : ""}`,
      method: "GET",
    });
  },

  getById: (id) => request({ url: `/ielts-reading/${id}`, method: "GET" }),

  create: (data) =>
    request({ url: "/ielts-reading", method: "POST", content: data }),

  update: (id, data) =>
    request({ url: `/ielts-reading/${id}`, method: "PATCH", content: data }),

  delete: (id) => request({ url: `/ielts-reading/${id}`, method: "DELETE" }),
};

// Reading Parts API — /ielts-reading-parts
// Supports deeply nested creation (questions → sub-questions + options)
export const ieltsReadingPartsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.readingId) qs.set("readingId", params.readingId);
    if (params.part) qs.set("part", params.part);
    if (params.mode) qs.set("mode", params.mode);
    const q = qs.toString();
    return request({
      url: `/ielts-reading-parts${q ? `?${q}` : ""}`,
      method: "GET",
    });
  },

  getById: (id) =>
    request({ url: `/ielts-reading-parts/${id}`, method: "GET" }),

  create: (data) =>
    request({ url: "/ielts-reading-parts", method: "POST", content: data }),

  update: (id, data) =>
    request({
      url: `/ielts-reading-parts/${id}`,
      method: "PATCH",
      content: data,
    }),

  delete: (id) =>
    request({ url: `/ielts-reading-parts/${id}`, method: "DELETE" }),
};

// Listening API — /ielts-listening
export const ieltsListeningAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.testId) qs.set("testId", params.testId);
    if (params.isActive !== undefined)
      qs.set("isActive", String(params.isActive));
    if (params.mode) qs.set("mode", params.mode);
    const q = qs.toString();
    return request({
      url: `/ielts-listening${q ? `?${q}` : ""}`,
      method: "GET",
    });
  },

  getById: (id) => request({ url: `/ielts-listening/${id}`, method: "GET" }),

  create: (data) =>
    request({ url: "/ielts-listening", method: "POST", content: data }),

  update: (id, data) =>
    request({ url: `/ielts-listening/${id}`, method: "PATCH", content: data }),

  delete: (id) => request({ url: `/ielts-listening/${id}`, method: "DELETE" }),
};

// Listening Parts API — /ielts-listening-parts
// Supports nested creation (audio + questions → sub-questions + options)
export const ieltsListeningPartsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.listeningId) qs.set("listeningId", params.listeningId);
    if (params.part) qs.set("part", params.part);
    if (params.mode) qs.set("mode", params.mode);
    const q = qs.toString();
    return request({
      url: `/ielts-listening-parts${q ? `?${q}` : ""}`,
      method: "GET",
    });
  },

  getById: (id) =>
    request({ url: `/ielts-listening-parts/${id}`, method: "GET" }),

  create: (data) =>
    request({ url: "/ielts-listening-parts", method: "POST", content: data }),

  update: (id, data) =>
    request({
      url: `/ielts-listening-parts/${id}`,
      method: "PATCH",
      content: data,
    }),

  delete: (id) =>
    request({ url: `/ielts-listening-parts/${id}`, method: "DELETE" }),
};

// Writing API — /ielts-writing
export const ieltsWritingAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.testId) qs.set("testId", params.testId);
    if (params.isActive !== undefined)
      qs.set("isActive", String(params.isActive));
    if (params.mode) qs.set("mode", params.mode);
    const q = qs.toString();
    return request({
      url: `/ielts-writing${q ? `?${q}` : ""}`,
      method: "GET",
    });
  },

  getById: (id) => request({ url: `/ielts-writing/${id}`, method: "GET" }),

  create: (data) =>
    request({ url: "/ielts-writing", method: "POST", content: data }),

  update: (id, data) =>
    request({ url: `/ielts-writing/${id}`, method: "PATCH", content: data }),

  delete: (id) => request({ url: `/ielts-writing/${id}`, method: "DELETE" }),
};

// Writing Tasks API — /ielts-writing/task(s)
export const ieltsWritingTasksAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.search) qs.set("search", params.search);
    if (params.writingId) qs.set("writingId", params.writingId);
    if (params.task) qs.set("task", params.task);
    if (params.mode) qs.set("mode", params.mode);
    const q = qs.toString();
    return request({
      url: `/ielts-writing/tasks${q ? `?${q}` : ""}`,
      method: "GET",
    });
  },

  getById: (id) => request({ url: `/ielts-writing/task/${id}`, method: "GET" }),

  create: (data) =>
    request({ url: "/ielts-writing/task", method: "POST", content: data }),

  update: (id, data) =>
    request({
      url: `/ielts-writing/task/${id}`,
      method: "PATCH",
      content: data,
    }),

  delete: (id) =>
    request({ url: `/ielts-writing/task/${id}`, method: "DELETE" }),
};

// Questions API — /ielts-questions
export const ieltsQuestionsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.readingPartId) qs.set("readingPartId", params.readingPartId);
    if (params.listeningPartId)
      qs.set("listeningPartId", params.listeningPartId);
    const q = qs.toString();
    return request({
      url: `/ielts-questions${q ? `?${q}` : ""}`,
      method: "GET",
    });
  },

  getById: (id) => request({ url: `/ielts-questions/${id}`, method: "GET" }),

  create: (data) =>
    request({ url: "/ielts-questions", method: "POST", content: data }),

  update: (id, data) =>
    request({
      url: `/ielts-questions/${id}`,
      method: "PATCH",
      content: data,
    }),

  delete: (id) => request({ url: `/ielts-questions/${id}`, method: "DELETE" }),

  getByReadingPart: (readingPartId) =>
    request({
      url: `/ielts-questions?readingPartId=${readingPartId}`,
      method: "GET",
    }),

  getByListeningPart: (listeningPartId) =>
    request({
      url: `/ielts-questions?listeningPartId=${listeningPartId}`,
      method: "GET",
    }),
};

// Question Choices (Options) API — /ielts-question-choices
export const ieltsQuestionChoicesAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.questionId) qs.set("questionId", params.questionId);
    const q = qs.toString();
    return request({
      url: `/ielts-question-choices${q ? `?${q}` : ""}`,
      method: "GET",
    });
  },

  getById: (id) =>
    request({ url: `/ielts-question-choices/${id}`, method: "GET" }),

  create: (data) =>
    request({
      url: "/ielts-question-choices",
      method: "POST",
      content: data,
    }),

  update: (id, data) =>
    request({
      url: `/ielts-question-choices/${id}`,
      method: "PATCH",
      content: data,
    }),

  delete: (id) =>
    request({ url: `/ielts-question-choices/${id}`, method: "DELETE" }),

  getByQuestion: (questionId) =>
    request({
      url: `/ielts-question-choices?questionId=${questionId}`,
      method: "GET",
    }),
};

// Sub Questions API — /ielts-sub-questions
export const ieltsSubQuestionsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.questionId) qs.set("questionId", params.questionId);
    const q = qs.toString();
    return request({
      url: `/ielts-sub-questions${q ? `?${q}` : ""}`,
      method: "GET",
    });
  },

  getById: (id) =>
    request({ url: `/ielts-sub-questions/${id}`, method: "GET" }),

  create: (data) =>
    request({
      url: "/ielts-sub-questions",
      method: "POST",
      content: data,
    }),

  update: (id, data) =>
    request({
      url: `/ielts-sub-questions/${id}`,
      method: "PATCH",
      content: data,
    }),

  delete: (id) =>
    request({ url: `/ielts-sub-questions/${id}`, method: "DELETE" }),

  getByQuestion: (questionId) =>
    request({
      url: `/ielts-sub-questions?questionId=${questionId}`,
      method: "GET",
    }),
};

// Mock Tests API — /ielts-mock-tests
// Assign mock tests to students and track confirmation/completion status
export const ieltsMockTestsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.user_id) qs.set("user_id", params.user_id);
    if (params.test_id) qs.set("test_id", params.test_id);
    if (params.group_id) qs.set("group_id", params.group_id);
    if (params.teacher_id) qs.set("teacher_id", params.teacher_id);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return request({
      url: `/ielts-mock-tests${q ? `?${q}` : ""}`,
      method: "GET",
    });
  },

  getMy: () => request({ url: "/ielts-mock-tests/my", method: "GET" }),

  getByGroup: (groupId) =>
    request({ url: `/ielts-mock-tests/group/${groupId}`, method: "GET" }),

  getById: (id) => request({ url: `/ielts-mock-tests/${id}`, method: "GET" }),

  create: (data) =>
    request({ url: "/ielts-mock-tests", method: "POST", content: data }),

  update: (id, data) =>
    request({
      url: `/ielts-mock-tests/${id}`,
      method: "PATCH",
      content: data,
    }),

  archive: (id) =>
    request({ url: `/ielts-mock-tests/${id}/archive`, method: "PATCH" }),

  unarchive: (id) =>
    request({ url: `/ielts-mock-tests/${id}/unarchive`, method: "PATCH" }),

  delete: (id) => request({ url: `/ielts-mock-tests/${id}`, method: "DELETE" }),
};

// Audio API — /ielts-tests/audio
export const ieltsAudioAPI = {
  getAll: () => request({ url: "/ielts-tests/audio", method: "GET" }),

  getById: (id) => request({ url: `/ielts-tests/audio/${id}`, method: "GET" }),

  create: (data) =>
    request({ url: "/ielts-tests/audio", method: "POST", content: data }),
};

// Answers & Attempts API — /ielts-answers
export const ieltsAnswersAPI = {
  // Attempts
  createAttempt: (data) =>
    request({ url: "/ielts-answers/attempts", method: "POST", content: data }),

  getAttempts: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.test_id) qs.set("test_id", params.test_id);
    if (params.scope) qs.set("scope", params.scope);
    if (params.status) qs.set("status", params.status);
    const q = qs.toString();
    return request({
      url: `/ielts-answers/attempts${q ? `?${q}` : ""}`,
      method: "GET",
    });
  },

  getAttemptById: (id) =>
    request({ url: `/ielts-answers/attempts/${id}`, method: "GET" }),

  getAttemptResult: (id) =>
    request({ url: `/ielts-answers/attempts/${id}`, method: "GET" }),

  submitAttempt: (id) =>
    request({
      url: `/ielts-answers/attempts/${id}/submit`,
      method: "PATCH",
    }),

  abandonAttempt: (id) =>
    request({
      url: `/ielts-answers/attempts/${id}/abandon`,
      method: "PATCH",
    }),

  // Answers
  saveReadingAnswers: (data) =>
    request({ url: "/ielts-answers/reading", method: "POST", content: data }),

  saveListeningAnswers: (data) =>
    request({
      url: "/ielts-answers/listening",
      method: "POST",
      content: data,
    }),

  saveWritingAnswers: (data) =>
    request({ url: "/ielts-answers/writing", method: "POST", content: data }),

  getReadingAnswers: (attemptId) =>
    request({ url: `/ielts-answers/reading/${attemptId}`, method: "GET" }),

  getListeningAnswers: (attemptId) =>
    request({ url: `/ielts-answers/listening/${attemptId}`, method: "GET" }),

  getWritingAnswers: (attemptId) =>
    request({ url: `/ielts-answers/writing/${attemptId}`, method: "GET" }),

  // Statistics
  getStatistics: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.scope) qs.set("scope", params.scope);
    if (params.test_id) qs.set("test_id", params.test_id);
    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);
    const q = qs.toString();
    return request({
      url: `/ielts-answers/statistics${q ? `?${q}` : ""}`,
      method: "GET",
    });
  },

  // Unfinished Tests
  getUnfinishedTests: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.scope) qs.set("scope", params.scope);
    if (params.include_abandoned !== undefined)
      qs.set("include_abandoned", String(params.include_abandoned));
    const q = qs.toString();
    return request({
      url: `/ielts-answers/unfinished${q ? `?${q}` : ""}`,
      method: "GET",
    });
  },

  // Grade Writing (ADMIN, TEACHER only)
  gradeWriting: (answerId, data) =>
    request({
      url: `/ielts-answers/writing/${answerId}/grade`,
      method: "PATCH",
      content: data,
    }),

  // Teacher Tools
  getMyStudents: () =>
    request({ url: "/ielts-answers/my-students", method: "GET" }),

  getMyStudentsAttemptsResults: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.student_id) qs.set("student_id", params.student_id);
    if (params.test_id) qs.set("test_id", params.test_id);
    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);
    if (params.only_ungraded !== undefined)
      qs.set("only_ungraded", String(params.only_ungraded));
    const q = qs.toString();
    return request({
      url: `/ielts-answers/my-students-attempts-results${q ? `?${q}` : ""}`,
      method: "GET",
    });
  },

  getMyStudentAttempts: (studentId, params = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.test_id) qs.set("test_id", params.test_id);
    if (params.scope) qs.set("scope", params.scope);
    qs.set("status", params.status || "submitted");
    const q = qs.toString();
    return request({
      url: `/ielts-answers/my-students/${studentId}/attempts${q ? `?${q}` : ""}`,
      method: "GET",
    });
  },

  getMyStudentAttemptResult: (studentId, attemptId) =>
    request({
      url: `/ielts-answers/my-students/${studentId}/attempts/${attemptId}`,
      method: "GET",
    }),
};
