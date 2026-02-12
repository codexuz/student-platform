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
