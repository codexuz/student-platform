"use client";

import { request, storage } from "@/lib/api";

// ─── Teacher-specific API endpoints ──────────────────────────────────────────

// Lessons API
export const lessonsAPI = {
  getAll: () => request({ url: "/lessons", method: "GET" }),

  getByUnit: (unitId) =>
    request({ url: `/lessons/unit/${unitId}`, method: "GET" }),

  getById: (id) => request({ url: `/lessons/${id}`, method: "GET" }),

  create: (lessonData) =>
    request({ url: "/lessons", method: "POST", content: lessonData }),

  update: (id, lessonData) =>
    request({ url: `/lessons/${id}`, method: "PATCH", content: lessonData }),

  delete: (id) => request({ url: `/lessons/${id}`, method: "DELETE" }),
};

// Course API
export const courseAPI = {
  getAll: () => request({ url: "/courses", method: "GET" }),

  getById: (id) => request({ url: `/courses/${id}`, method: "GET" }),

  create: (courseData) =>
    request({ url: "/courses", method: "POST", content: courseData }),

  update: (id, courseData) =>
    request({ url: `/courses/${id}`, method: "PATCH", content: courseData }),

  delete: (id) => request({ url: `/courses/${id}`, method: "DELETE" }),
};

// Units API
export const unitsAPI = {
  getAll: () => request({ url: "/units", method: "GET" }),

  getByCourseId: (courseId) =>
    request({ url: `/units/course/${courseId}`, method: "GET" }),

  getById: (id) => request({ url: `/units/${id}`, method: "GET" }),

  create: (unitData) =>
    request({ url: "/units", method: "POST", content: unitData }),

  update: (id, unitData) =>
    request({ url: `/units/${id}`, method: "PATCH", content: unitData }),

  delete: (id) => request({ url: `/units/${id}`, method: "DELETE" }),
};

// Exercises API
export const exercisesAPI = {
  getAll: () => request({ url: "/exercise", method: "GET" }),

  getByLesson: (lessonId) =>
    request({ url: `/exercise/lesson/${lessonId}`, method: "GET" }),

  getById: (id) => request({ url: `/exercise/${id}`, method: "GET" }),

  create: (exerciseData) =>
    request({ url: "/exercise/only", method: "POST", content: exerciseData }),

  update: (id, exerciseData) =>
    request({
      url: `/exercise/${id}/with-questions`,
      method: "PUT",
      content: exerciseData,
    }),

  delete: (id) => request({ url: `/exercise/${id}`, method: "DELETE" }),

  deleteQuestion: (exerciseId, questionId) =>
    request({
      url: `/exercise/${exerciseId}/questions/${questionId}`,
      method: "DELETE",
    }),
};

// Speaking API
export const speakingAPI = {
  getAll: () => request({ url: "/speaking", method: "GET" }),

  getByLesson: (lessonId) =>
    request({ url: `/speaking/lesson/${lessonId}`, method: "GET" }),

  getById: (id) => request({ url: `/speaking/${id}`, method: "GET" }),

  create: (speakingData) =>
    request({ url: "/speaking", method: "POST", content: speakingData }),

  update: (id, speakingData) =>
    request({ url: `/speaking/${id}`, method: "PATCH", content: speakingData }),

  delete: (id) => request({ url: `/speaking/${id}`, method: "DELETE" }),
};

// Pronunciation Exercise API
export const pronunciationAPI = {
  getAll: () => request({ url: "/pronunciation-exercise", method: "GET" }),

  getBySpeakingId: (speakingId) =>
    request({
      url: `/pronunciation-exercise/speaking/${speakingId}`,
      method: "GET",
    }),

  getById: (id) =>
    request({ url: `/pronunciation-exercise/${id}`, method: "GET" }),

  create: (pronunciationData) =>
    request({
      url: "/pronunciation-exercise",
      method: "POST",
      content: pronunciationData,
    }),

  update: (id, pronunciationData) =>
    request({
      url: `/pronunciation-exercise/${id}`,
      method: "PATCH",
      content: pronunciationData,
    }),

  delete: (id) =>
    request({ url: `/pronunciation-exercise/${id}`, method: "DELETE" }),
};

// IELTS Part 1 Question API
export const ieltsPart1API = {
  getAll: () => request({ url: "/ieltspart1-question", method: "GET" }),

  getBySpeakingId: (speakingId) =>
    request({
      url: `/ieltspart1-question/speaking/${speakingId}`,
      method: "GET",
    }),

  getById: (id) =>
    request({ url: `/ieltspart1-question/${id}`, method: "GET" }),

  create: (questionData) =>
    request({
      url: "/ieltspart1-question",
      method: "POST",
      content: questionData,
    }),

  update: (id, questionData) =>
    request({
      url: `/ieltspart1-question/${id}`,
      method: "PATCH",
      content: questionData,
    }),

  delete: (id) =>
    request({ url: `/ieltspart1-question/${id}`, method: "DELETE" }),
};

// IELTS Part 2 Question API
export const ieltsPart2API = {
  getAll: () => request({ url: "/ieltspart2-question", method: "GET" }),

  getBySpeakingId: (speakingId) =>
    request({
      url: `/ieltspart2-question/speaking/${speakingId}`,
      method: "GET",
    }),

  getById: (id) =>
    request({ url: `/ieltspart2-question/${id}`, method: "GET" }),

  create: (questionData) =>
    request({
      url: "/ieltspart2-question",
      method: "POST",
      content: questionData,
    }),

  update: (id, questionData) =>
    request({
      url: `/ieltspart2-question/${id}`,
      method: "PATCH",
      content: questionData,
    }),

  delete: (id) =>
    request({ url: `/ieltspart2-question/${id}`, method: "DELETE" }),
};

// IELTS Part 3 Question API
export const ieltsPart3API = {
  getAll: () => request({ url: "/ieltspart3-question", method: "GET" }),

  getBySpeakingId: (speakingId) =>
    request({
      url: `/ieltspart3-question/speaking/${speakingId}`,
      method: "GET",
    }),

  getById: (id) =>
    request({ url: `/ieltspart3-question/${id}`, method: "GET" }),

  create: (questionData) =>
    request({
      url: "/ieltspart3-question",
      method: "POST",
      content: questionData,
    }),

  update: (id, questionData) =>
    request({
      url: `/ieltspart3-question/${id}`,
      method: "PATCH",
      content: questionData,
    }),

  delete: (id) =>
    request({ url: `/ieltspart3-question/${id}`, method: "DELETE" }),
};

// Lesson Content API
export const lessonContentAPI = {
  getAll: () => request({ url: "/lesson-content", method: "GET" }),

  getByLesson: (lessonId) =>
    request({ url: `/lesson-content/lesson/${lessonId}`, method: "GET" }),

  getById: (id) => request({ url: `/lesson-content/${id}`, method: "GET" }),

  create: (contentData) =>
    request({ url: "/lesson-content", method: "POST", content: contentData }),

  update: (id, contentData) =>
    request({
      url: `/lesson-content/${id}`,
      method: "PATCH",
      content: contentData,
    }),

  delete: (id) => request({ url: `/lesson-content/${id}`, method: "DELETE" }),
};

// Vocabulary API
export const vocabularyAPI = {
  getAll: () => request({ url: "/vocabulary-sets", method: "GET" }),

  getById: (id) => request({ url: `/vocabulary-sets/${id}`, method: "GET" }),

  create: (setData) =>
    request({ url: "/vocabulary-sets", method: "POST", content: setData }),

  update: (id, setData) =>
    request({
      url: `/vocabulary-sets/${id}`,
      method: "PATCH",
      content: setData,
    }),

  delete: (id) => request({ url: `/vocabulary-sets/${id}`, method: "DELETE" }),
};

// Vocabulary Items API
export const vocabularyItemsAPI = {
  getAll: () => request({ url: "/vocabulary-items", method: "GET" }),

  getBySetId: (setId) =>
    request({ url: `/vocabulary-items/set/${setId}`, method: "GET" }),

  getById: (id) => request({ url: `/vocabulary-items/${id}`, method: "GET" }),

  create: (itemData) =>
    request({ url: "/vocabulary-items", method: "POST", content: itemData }),

  update: (id, itemData) =>
    request({
      url: `/vocabulary-items/${id}`,
      method: "PATCH",
      content: itemData,
    }),

  delete: (id) => request({ url: `/vocabulary-items/${id}`, method: "DELETE" }),

  bulkImport: (setId, items) =>
    request({
      url: "/vocabulary-items/bulk",
      method: "POST",
      content: { setId, items },
    }),
};

// Lesson Vocabulary Sets API
export const lessonVocabularyAPI = {
  getAll: () => request({ url: "/lesson-vocabulary-sets", method: "GET" }),

  getByLessonId: (lessonId) =>
    request({
      url: `/lesson-vocabulary-sets/lesson/${lessonId}`,
      method: "GET",
    }),

  getByVocabularyItemId: (itemId) =>
    request({
      url: `/lesson-vocabulary-sets/vocabulary/${itemId}`,
      method: "GET",
    }),

  create: (assignmentData) =>
    request({
      url: "/lesson-vocabulary-sets",
      method: "POST",
      content: assignmentData,
    }),

  bulkCreate: (assignments) =>
    request({
      url: "/lesson-vocabulary-sets/bulk",
      method: "POST",
      content: { assignments },
    }),

  delete: (id) =>
    request({ url: `/lesson-vocabulary-sets/${id}`, method: "DELETE" }),

  deleteByLessonAndItem: (lessonId, vocabularyItemId) =>
    request({
      url: `/lesson-vocabulary-sets/lesson/${lessonId}/vocabulary-item/${vocabularyItemId}`,
      method: "DELETE",
    }),
};

// Groups API
export const groupsAPI = {
  getAll: () => request({ url: "/groups", method: "GET" }),

  getByTeacherId: (teacherId) =>
    request({
      url: `/groups/teacher/${teacherId}?isIELTS=true`,
      method: "GET",
    }),

  getById: (id) => request({ url: `/groups/${id}`, method: "GET" }),

  create: (groupData) =>
    request({ url: "/groups", method: "POST", content: groupData }),

  update: (id, groupData) =>
    request({ url: `/groups/${id}`, method: "PATCH", content: groupData }),

  delete: (id) => request({ url: `/groups/${id}`, method: "DELETE" }),

  getStudents: (groupId) =>
    request({ url: `/groups/${groupId}/students`, method: "GET" }),

  addStudent: (groupId, studentData) =>
    request({
      url: `/groups/${groupId}/students`,
      method: "POST",
      content: studentData,
    }),

  removeStudent: (groupId, studentId) =>
    request({
      url: `/groups/${groupId}/students/${studentId}`,
      method: "DELETE",
    }),

  assignUnits: (assignmentData) =>
    request({
      url: "/group-assigned-units",
      method: "POST",
      content: assignmentData,
    }),

  getAssignedUnits: (groupId) =>
    request({ url: `/group-assigned-units/group/${groupId}`, method: "GET" }),

  removeContentAssignment: (groupId, assignmentId) =>
    request({
      url: `/groups/${groupId}/assignments/${assignmentId}`,
      method: "DELETE",
    }),

  getStats: (groupId) =>
    request({ url: `/groups/${groupId}/stats`, method: "GET" }),
};

// Group Homeworks API
export const groupHomeworksAPI = {
  getByGroupId: (groupId) =>
    request({ url: `/group-homeworks/group/${groupId}`, method: "GET" }),

  getByTeacherId: (teacherId) =>
    request({ url: `/group-homeworks/teacher/${teacherId}`, method: "GET" }),

  getById: (id) => request({ url: `/group-homeworks/${id}`, method: "GET" }),

  create: (homeworkData) =>
    request({ url: "/group-homeworks", method: "POST", content: homeworkData }),

  update: (id, homeworkData) =>
    request({
      url: `/group-homeworks/${id}`,
      method: "PATCH",
      content: homeworkData,
    }),

  delete: (id) => request({ url: `/group-homeworks/${id}`, method: "DELETE" }),
};

// Homework Submissions API
export const homeworkSubmissionsAPI = {
  getByHomeworkId: (homeworkId) =>
    request({
      url: `/homework-submissions/homework/${homeworkId}`,
      method: "GET",
    }),

  getById: (id) =>
    request({ url: `/homework-submissions/${id}`, method: "GET" }),

  getByStudentId: (studentId) =>
    request({
      url: `/homework-submissions/student/${studentId}`,
      method: "GET",
    }),

  create: (submissionData) =>
    request({
      url: "/homework-submissions",
      method: "POST",
      content: submissionData,
    }),

  update: (id, submissionData) =>
    request({
      url: `/homework-submissions/sections/${id}`,
      method: "PATCH",
      content: submissionData,
    }),

  grade: (id, gradeData) =>
    request({
      url: `/homework-submissions/${id}`,
      method: "PATCH",
      content: gradeData,
    }),

  delete: (id) =>
    request({ url: `/homework-submissions/${id}`, method: "DELETE" }),
};

// Group Assigned Units API
export const groupAssignedUnitsAPI = {
  getByGroupId: (groupId) =>
    request({ url: `/group-assigned-units/group/${groupId}`, method: "GET" }),

  create: (assignmentData) =>
    request({
      url: "/group-assigned-units",
      method: "POST",
      content: assignmentData,
    }),

  update: (id, assignmentData) =>
    request({
      url: `/group-assigned-units/${id}`,
      method: "PUT",
      content: assignmentData,
    }),

  delete: (id) =>
    request({ url: `/group-assigned-units/${id}`, method: "DELETE" }),
};

// Group Assigned Lessons API
export const groupAssignedLessonsAPI = {
  getByGroupId: (groupId) =>
    request({ url: `/group-assigned-lessons/group/${groupId}`, method: "GET" }),

  create: (assignmentData) =>
    request({
      url: "/group-assigned-lessons",
      method: "POST",
      content: assignmentData,
    }),

  update: (id, assignmentData) =>
    request({
      url: `/group-assigned-lessons/${id}`,
      method: "PATCH",
      content: assignmentData,
    }),

  delete: (id) =>
    request({ url: `/group-assigned-lessons/${id}`, method: "DELETE" }),
};

// Trial Lessons API
export const trialLessonsAPI = {
  getByTeacherId: (teacherId) =>
    request({
      url: `/lead-trial-lessons/by-teacher/${teacherId}`,
      method: "GET",
    }),

  getAll: () => request({ url: "/lead-trial-lessons", method: "GET" }),

  getById: (id) => request({ url: `/lead-trial-lessons/${id}`, method: "GET" }),

  create: (lessonData) =>
    request({
      url: "/lead-trial-lessons",
      method: "POST",
      content: lessonData,
    }),

  update: (id, lessonData) =>
    request({
      url: `/lead-trial-lessons/${id}`,
      method: "PATCH",
      content: lessonData,
    }),

  delete: (id) =>
    request({ url: `/lead-trial-lessons/${id}`, method: "DELETE" }),
};

// File Upload API
export const uploadAPI = {
  uploadFile: async (file, options = {}) => {
    const token = await storage.getItem("userToken");
    const formData = new FormData();
    formData.append("file", file);

    const BASE_URL = "https://backend.impulselc.uz/api";

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (options && options.onUploadProgress) {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            options.onUploadProgress(event);
          }
        });
      }

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } catch {
            resolve(xhr.responseText);
          }
        } else {
          let errorMessage;
          try {
            const errorJson = JSON.parse(xhr.responseText);
            errorMessage =
              errorJson.message || `Upload failed with status: ${xhr.status}`;
          } catch {
            errorMessage =
              xhr.responseText || `Upload failed with status: ${xhr.status}`;
          }
          const error = new Error(errorMessage);
          error.status = xhr.status;
          reject(error);
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload aborted"));
      });

      xhr.open("POST", `${BASE_URL}/upload`);
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  },

  uploadMultiple: async (files, type = "general", options = {}) => {
    const token = await storage.getItem("userToken");
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("type", type);

    if (options.metadata) {
      Object.keys(options.metadata).forEach((key) => {
        formData.append(key, options.metadata[key]);
      });
    }

    const BASE_URL = "https://backend.impulselc.uz/api";
    const headers = { Accept: "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/upload/multiple`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage =
          errorJson.message ||
          `Multiple upload failed with status: ${response.status}`;
      } catch {
        errorMessage =
          errorText || `Multiple upload failed with status: ${response.status}`;
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  },

  deleteFile: (fileId) =>
    request({ url: `/upload/${fileId}`, method: "DELETE" }),

  getFileInfo: (fileId) => request({ url: `/upload/${fileId}`, method: "GET" }),

  getFilesByType: (type) =>
    request({ url: `/upload?type=${type}`, method: "GET" }),
};

// Students API
export const studentsAPI = {
  getAll: () => request({ url: "/users/students", method: "GET" }),

  getById: (id) => request({ url: `/users/${id}`, method: "GET" }),

  create: (studentData) =>
    request({ url: "/auth/register", method: "POST", content: studentData }),

  update: (id, studentData) =>
    request({ url: `/users/${id}`, method: "PUT", content: studentData }),

  delete: (id) => request({ url: `/users/${id}`, method: "DELETE" }),
};

// Group Students API
export const groupStudentsAPI = {
  getByGroupId: (groupId) =>
    request({ url: `/group-students/group/${groupId}`, method: "GET" }),

  getTeacherStudentCount: (teacherId) =>
    request({
      url: `/group-students/teacher/${teacherId}/count`,
      method: "GET",
    }),

  addToGroup: (groupStudentData) =>
    request({
      url: "/group-students",
      method: "POST",
      content: groupStudentData,
    }),

  removeFromGroup: (groupStudentId) =>
    request({ url: `/group-students/${groupStudentId}`, method: "DELETE" }),
};

// Teacher API
export const teacherAPI = {
  getBalance: (teacherId) =>
    request({ url: `/teacher-wallet/teacher/${teacherId}`, method: "GET" }),

  getTransactionHistory: (teacherId) =>
    request({
      url: `/teacher-transaction/teacher/${teacherId}/transactions`,
      method: "GET",
    }),

  getById: (id) => request({ url: `/users/teachers/${id}`, method: "GET" }),
};

// Attendance API
export const attendanceAPI = {
  getByGroupIdAndDateRange: (groupId, startDate, endDate) =>
    request({
      url: `/attendance/group/${groupId}/daterange?startDate=${startDate}&endDate=${endDate}`,
      method: "GET",
    }),

  create: (attendanceData) =>
    request({ url: "/attendance", method: "POST", content: attendanceData }),

  createBulk: (attendanceData) =>
    request({
      url: "/attendance/bulk",
      method: "POST",
      content: attendanceData,
    }),

  update: (id, attendanceData) =>
    request({
      url: `/attendance/${id}`,
      method: "PATCH",
      content: { status: attendanceData },
    }),
};

// Speaking Responses API
export const speakingResponsesAPI = {
  getBySpeakingId: (speakingId) =>
    request({
      url: `/speaking-responses/speaking/${speakingId}`,
      method: "GET",
    }),

  getById: (id) => request({ url: `/speaking-responses/${id}`, method: "GET" }),

  update: (id, responseData) =>
    request({
      url: `/speaking-responses/${id}`,
      method: "PATCH",
      content: responseData,
    }),

  delete: (id) =>
    request({ url: `/speaking-responses/${id}`, method: "DELETE" }),
};

// Exams API
export const examsAPI = {
  getByTeacherId: (teacherId) =>
    request({ url: `/exams/teacher/${teacherId}`, method: "GET" }),

  getById: (id) => request({ url: `/exams/${id}`, method: "GET" }),

  create: (examData) =>
    request({ url: "/exams", method: "POST", content: examData }),

  update: (id, examData) =>
    request({ url: `/exams/${id}`, method: "PATCH", content: examData }),

  delete: (id) => request({ url: `/exams/${id}`, method: "DELETE" }),
};

// Exam Results API
export const examResultsAPI = {
  getByExamId: (examId) =>
    request({ url: `/exam-results/exam/${examId}`, method: "GET" }),

  getById: (id) => request({ url: `/exam-results/${id}`, method: "GET" }),

  getByStudentId: (studentId) =>
    request({ url: `/exam-results/student/${studentId}`, method: "GET" }),

  create: (resultData) =>
    request({ url: "/exam-results", method: "POST", content: resultData }),

  update: (id, resultData) =>
    request({
      url: `/exam-results/${id}`,
      method: "PATCH",
      content: resultData,
    }),

  delete: (id) => request({ url: `/exam-results/${id}`, method: "DELETE" }),
};

// Articles API
export const articlesAPI = {
  getAll: () => request({ url: "/articles", method: "GET" }),

  getById: (id) => request({ url: `/articles/${id}`, method: "GET" }),

  create: (articleData) =>
    request({ url: "/articles", method: "POST", content: articleData }),

  update: (id, articleData) =>
    request({ url: `/articles/${id}`, method: "PATCH", content: articleData }),

  delete: (id) => request({ url: `/articles/${id}`, method: "DELETE" }),
};

// ─── IELTS Course Builder APIs ──────────────────────────────────────────────

// IELTS Courses API (teacher CRUD - no status filter)
export const ieltsCourseBuilderAPI = {
  getAll: ({ page = 1, limit = 100 } = {}) =>
    request({
      url: `/ielts-courses?limit=${limit}&page=${page}`,
      method: "GET",
    }),

  getById: (id) => request({ url: `/ielts-courses/${id}`, method: "GET" }),

  create: (data) =>
    request({ url: "/ielts-courses", method: "POST", content: data }),

  update: (id, data) =>
    request({ url: `/ielts-courses/${id}`, method: "PATCH", content: data }),

  delete: (id) => request({ url: `/ielts-courses/${id}`, method: "DELETE" }),
};

// IELTS Course Sections API
export const ieltsCourseSectionsAPI = {
  getAll: (courseId, { limit = 100 } = {}) =>
    request({
      url: `/ielts-course-sections?courseId=${courseId}&limit=${limit}`,
      method: "GET",
    }),

  getById: (id) =>
    request({ url: `/ielts-course-sections/${id}`, method: "GET" }),

  create: (data) =>
    request({
      url: "/ielts-course-sections",
      method: "POST",
      content: data,
    }),

  update: (id, data) =>
    request({
      url: `/ielts-course-sections/${id}`,
      method: "PATCH",
      content: data,
    }),

  delete: (id) =>
    request({ url: `/ielts-course-sections/${id}`, method: "DELETE" }),
};

// IELTS Lessons API
export const ieltsLessonsAPI = {
  getAll: (sectionId, { limit = 100 } = {}) =>
    request({
      url: `/ielts-lessons?sectionId=${sectionId}&limit=${limit}`,
      method: "GET",
    }),

  getById: (id) => request({ url: `/ielts-lessons/${id}`, method: "GET" }),

  create: (data) =>
    request({ url: "/ielts-lessons", method: "POST", content: data }),

  update: (id, data) =>
    request({ url: `/ielts-lessons/${id}`, method: "PATCH", content: data }),

  delete: (id) => request({ url: `/ielts-lessons/${id}`, method: "DELETE" }),
};

// IELTS Quizzes API
export const ieltsQuizzesAPI = {
  getAll: (courseId, { limit = 100 } = {}) =>
    request({
      url: `/ielts-quizzes?courseId=${courseId}&limit=${limit}`,
      method: "GET",
    }),

  getById: (id) => request({ url: `/ielts-quizzes/${id}`, method: "GET" }),

  create: (data) =>
    request({ url: "/ielts-quizzes", method: "POST", content: data }),

  update: (id, data) =>
    request({ url: `/ielts-quizzes/${id}`, method: "PATCH", content: data }),

  delete: (id) => request({ url: `/ielts-quizzes/${id}`, method: "DELETE" }),
};

// IELTS Quiz Questions API
export const ieltsQuizQuestionsAPI = {
  getAll: (quizId, { limit = 100 } = {}) =>
    request({
      url: `/ielts-quiz-questions?quizId=${quizId}&limit=${limit}`,
      method: "GET",
    }),

  getById: (id) =>
    request({ url: `/ielts-quiz-questions/${id}`, method: "GET" }),

  create: (data) =>
    request({
      url: "/ielts-quiz-questions",
      method: "POST",
      content: data,
    }),

  update: (id, data) =>
    request({
      url: `/ielts-quiz-questions/${id}`,
      method: "PATCH",
      content: data,
    }),

  delete: (id) =>
    request({ url: `/ielts-quiz-questions/${id}`, method: "DELETE" }),
};
