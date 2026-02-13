"use client";

import { request } from "@/lib/api";

// ─── IELTS Test Builder API endpoints ────────────────────────────────────────

// Tests API
export const ieltsTestsAPI = {
  getAll: (limit = 100) =>
    request({ url: `/ielts-tests?limit=${limit}`, method: "GET" }),

  getById: (id) => request({ url: `/ielts-tests/${id}`, method: "GET" }),

  create: (data) =>
    request({ url: "/ielts-tests", method: "POST", content: data }),

  update: (id, data) =>
    request({ url: `/ielts-tests/${id}`, method: "PATCH", content: data }),

  delete: (id) => request({ url: `/ielts-tests/${id}`, method: "DELETE" }),
};

// Reading API
export const ieltsReadingAPI = {
  getAll: (limit = 100) =>
    request({ url: `/ielts-reading?limit=${limit}`, method: "GET" }),

  getById: (id) => request({ url: `/ielts-reading/${id}`, method: "GET" }),

  create: (data) =>
    request({ url: "/ielts-reading", method: "POST", content: data }),

  update: (id, data) =>
    request({ url: `/ielts-reading/${id}`, method: "PATCH", content: data }),

  delete: (id) => request({ url: `/ielts-reading/${id}`, method: "DELETE" }),
};

// Reading Parts API
export const ieltsReadingPartsAPI = {
  getAll: (limit = 100) =>
    request({ url: `/ielts-reading-parts?limit=${limit}`, method: "GET" }),

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

// Listening API
export const ieltsListeningAPI = {
  getAll: (limit = 100) =>
    request({ url: `/ielts-listening?limit=${limit}`, method: "GET" }),

  getById: (id) => request({ url: `/ielts-listening/${id}`, method: "GET" }),

  create: (data) =>
    request({ url: "/ielts-listening", method: "POST", content: data }),

  update: (id, data) =>
    request({ url: `/ielts-listening/${id}`, method: "PATCH", content: data }),

  delete: (id) => request({ url: `/ielts-listening/${id}`, method: "DELETE" }),
};

// Listening Parts API
export const ieltsListeningPartsAPI = {
  getAll: (limit = 100) =>
    request({ url: `/ielts-listening-parts?limit=${limit}`, method: "GET" }),

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

// Writing API
export const ieltsWritingAPI = {
  getAll: (limit = 100) =>
    request({ url: `/ielts-writing?limit=${limit}`, method: "GET" }),

  getById: (id) => request({ url: `/ielts-writing/${id}`, method: "GET" }),

  create: (data) =>
    request({ url: "/ielts-writing", method: "POST", content: data }),

  update: (id, data) =>
    request({ url: `/ielts-writing/${id}`, method: "PATCH", content: data }),

  delete: (id) => request({ url: `/ielts-writing/${id}`, method: "DELETE" }),
};

// Writing Tasks API
export const ieltsWritingTasksAPI = {
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

// Questions API
export const ieltsQuestionsAPI = {
  getAll: (limit = 100) =>
    request({ url: `/ielts-questions?limit=${limit}`, method: "GET" }),

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
      url: `/ielts-questions?reading_part_id=${readingPartId}`,
      method: "GET",
    }),

  getByListeningPart: (listeningPartId) =>
    request({
      url: `/ielts-questions?listening_part_id=${listeningPartId}`,
      method: "GET",
    }),
};

// Question Contents API
export const ieltsQuestionContentsAPI = {
  getAll: (limit = 100) =>
    request({
      url: `/ielts-question-contents?limit=${limit}`,
      method: "GET",
    }),

  getById: (id) =>
    request({ url: `/ielts-question-contents/${id}`, method: "GET" }),

  create: (data) =>
    request({
      url: "/ielts-question-contents",
      method: "POST",
      content: data,
    }),

  update: (id, data) =>
    request({
      url: `/ielts-question-contents/${id}`,
      method: "PATCH",
      content: data,
    }),

  delete: (id) =>
    request({ url: `/ielts-question-contents/${id}`, method: "DELETE" }),

  getByQuestion: (questionId) =>
    request({
      url: `/ielts-question-contents?question_id=${questionId}`,
      method: "GET",
    }),
};

// Question Choices API
export const ieltsQuestionChoicesAPI = {
  getAll: (limit = 100) =>
    request({
      url: `/ielts-question-choices?limit=${limit}`,
      method: "GET",
    }),

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

  getByContent: (questionContentId) =>
    request({
      url: `/ielts-question-choices?question_content_id=${questionContentId}`,
      method: "GET",
    }),
};

// Multiple Choice Questions API
export const ieltsMultipleChoiceQuestionsAPI = {
  getAll: (limit = 100) =>
    request({
      url: `/ielts-multiple-choice-questions?limit=${limit}`,
      method: "GET",
    }),

  getById: (id) =>
    request({ url: `/ielts-multiple-choice-questions/${id}`, method: "GET" }),

  create: (data) =>
    request({
      url: "/ielts-multiple-choice-questions",
      method: "POST",
      content: data,
    }),

  update: (id, data) =>
    request({
      url: `/ielts-multiple-choice-questions/${id}`,
      method: "PATCH",
      content: data,
    }),

  delete: (id) =>
    request({
      url: `/ielts-multiple-choice-questions/${id}`,
      method: "DELETE",
    }),

  getByContent: (questionContentId) =>
    request({
      url: `/ielts-multiple-choice-questions?question_content_id=${questionContentId}`,
      method: "GET",
    }),
};

// Multiple Choice Options API
export const ieltsMultipleChoiceOptionsAPI = {
  getAll: (limit = 100) =>
    request({
      url: `/ielts-multiple-choice-options?limit=${limit}`,
      method: "GET",
    }),

  getById: (id) =>
    request({ url: `/ielts-multiple-choice-options/${id}`, method: "GET" }),

  create: (data) =>
    request({
      url: "/ielts-multiple-choice-options",
      method: "POST",
      content: data,
    }),

  update: (id, data) =>
    request({
      url: `/ielts-multiple-choice-options/${id}`,
      method: "PATCH",
      content: data,
    }),

  delete: (id) =>
    request({
      url: `/ielts-multiple-choice-options/${id}`,
      method: "DELETE",
    }),

  getByMcqQuestion: (multipleChoiceQuestionId) =>
    request({
      url: `/ielts-multiple-choice-options?multiple_choice_question_id=${multipleChoiceQuestionId}`,
      method: "GET",
    }),
};
