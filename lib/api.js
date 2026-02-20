"use client";

// Base URL for API requests
const BASE_URL = "https://backend.impulselc.uz/api";

// Storage helper functions (using browser localStorage)
const storage = {
  getItem: async (key) => {
    try {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(key);
    } catch (error) {
      console.error("Storage getItem error:", error);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem(key, value);
    } catch (error) {
      console.error("Storage setItem error:", error);
    }
  },
  removeItem: async (key) => {
    try {
      if (typeof window === "undefined") return;
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Storage removeItem error:", error);
    }
  },
};

// User state management (will be replaced by your context)
let userStore = {
  getUserProfile: { user_id: null },
  setToken: (token) => {},
  setUser: (user) => {},
  clearUser: () => {},
};

export const setUserStore = (store) => {
  userStore = store;
};

// Helper function to make HTTP requests
const request = async (options) => {
  // Check if token needs refreshing before making request
  await checkAndRefreshToken();

  // Get the latest token (which might have just been refreshed)
  const token = await storage.getItem("userToken");
  const defaultHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const requestOptions = {
    method: options.method || "GET",
    headers: { ...defaultHeaders, ...options.headers },
  };

  if (options.content && requestOptions.method !== "GET") {
    requestOptions.body = JSON.stringify(options.content);
  }

  try {
    const response = await fetch(`${BASE_URL}${options.url}`, requestOptions);

    // Check if the response is successful (status 200-299)
    if (!response.ok) {
      if (response.status === 401) {
        // Try to refresh token and retry the request once
        try {
          await handleUnauthorized();

          // Update the Authorization header with the new token
          const newToken = await storage.getItem("userToken");
          if (newToken) {
            requestOptions.headers["Authorization"] = `Bearer ${newToken}`;

            // Retry the request
            const retryResponse = await fetch(
              `${BASE_URL}${options.url}`,
              requestOptions,
            );

            if (!retryResponse.ok) {
              throw new Error(
                `HTTP ${retryResponse.status}: ${retryResponse.statusText}`,
              );
            }

            if (retryResponse.status === 204) return null;
            return await retryResponse.json();
          }
        } catch (refreshError) {
          throw refreshError;
        }
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (response.status === 204) return null;
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Handle unauthorized requests
async function handleUnauthorized() {
  try {
    // Try to refresh the token first
    const newToken = await refreshToken();
    if (newToken) {
      return newToken;
    }

    // If refresh fails, the logout was already handled in refreshToken()
    throw new Error("Your session has expired. Please log in again.");
  } catch (error) {
    throw error;
  }
}

// Refresh token function
async function refreshToken() {
  try {
    const refreshToken = await storage.getItem("refreshToken");
    const sessionId = await storage.getItem("sessionId");

    if (!refreshToken || !sessionId) {
      await logout();
      throw new Error("No refresh token or session ID available");
    }

    // Check if refresh token is expired
    const refreshExpiry = await storage.getItem("refreshExpiry");
    if (refreshExpiry && new Date(refreshExpiry) < new Date()) {
      await logout();
      throw new Error("Refresh token expired");
    }

    // Make request to refresh endpoint
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        refreshToken,
        sessionId,
      }),
    });

    if (!response.ok) {
      await logout();
      throw new Error("Refresh token request failed");
    }

    const data = await response.json();
    const newAccessToken = data.access_token;
    const newRefreshToken = data.refresh_token;

    if (!newAccessToken || !newRefreshToken) {
      await logout();
      throw new Error("Invalid response from refresh token endpoint");
    }

    // Store new tokens
    await storage.setItem("userToken", newAccessToken);
    await storage.setItem("refreshToken", newRefreshToken);
    await storage.setItem("sessionId", data.sessionId);
    await storage.setItem("tokenExpiry", data.expiresAt);
    await storage.setItem("refreshExpiry", data.refreshExpiresAt);

    userStore.setToken(newAccessToken);

    return newAccessToken;
  } catch (error) {
    // If it's a network error, don't logout immediately
    if (error.message && error.message.includes("timeout")) {
      return null;
    }

    // For all other errors (expired, invalid, etc.), logout
    await logout();
    return null;
  }
}

// Logout helper function
async function logout() {
  try {
    // Clear all auth data
    await storage.removeItem("userToken");
    await storage.removeItem("refreshToken");
    await storage.removeItem("sessionId");
    await storage.removeItem("userData");
    await storage.removeItem("tokenExpiry");
    await storage.removeItem("refreshExpiry");
    await storage.removeItem("userRole");
    userStore.clearUser();

    // Navigate to login page using Next.js navigation
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
  } catch (logoutError) {
    console.error("Error during logout:", logoutError);
  }
}

// Check if token needs refreshing
async function checkAndRefreshToken() {
  try {
    const tokenExpiry = await storage.getItem("tokenExpiry");

    // If no expiry or not a valid date, skip
    if (!tokenExpiry) return;

    // If token expires in less than 5 minutes, refresh it proactively
    const expiryDate = new Date(tokenExpiry);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiryDate < fiveMinutesFromNow) {
      await refreshToken();
    }
  } catch (error) {
    // Continue with request even if check fails
    console.error("Token refresh check error:", error);
  }
}

// Auth API endpoints
export const authAPI = {
  login: async (username, password, role = "student") => {
    const loginUrls = {
      teacher: "/auth/teacher/login",
      student: "/auth/student/login",
    };
    const loginUrl = loginUrls[role] || "/auth/student/login";
    const response = await request({
      url: loginUrl,
      method: "POST",
      content: {
        username: username.trim(),
        password: password.trim(),
      },
    });

    // Store all auth information
    if (response && response.access_token) {
      await storage.setItem("userToken", response.access_token);
      await storage.setItem("refreshToken", response.refresh_token);
      await storage.setItem("sessionId", response.sessionId);
      await storage.setItem("userData", JSON.stringify(response.user));
      await storage.setItem("tokenExpiry", response.expiresAt);
      await storage.setItem("refreshExpiry", response.refreshExpiresAt);
      await storage.setItem("userRole", role);

      userStore.setToken(response.access_token);
      userStore.setUser(response.user);
    }

    return response;
  },

  logout: async () => {
    try {
      await request({
        url: "/auth/logout",
        method: "POST",
      });
    } finally {
      // Clear all auth data regardless of logout success
      await storage.removeItem("userToken");
      await storage.removeItem("refreshToken");
      await storage.removeItem("sessionId");
      await storage.removeItem("userData");
      await storage.removeItem("tokenExpiry");
      await storage.removeItem("refreshExpiry");
      await storage.removeItem("userRole");
      userStore.clearUser();
    }
  },

  forgotPassword: (phone) =>
    request({
      url: "/auth/forgot-password",
      method: "POST",
      content: { phone: phone.trim() },
    }),

  resetPassword: (token, newPassword) =>
    request({
      url: "/auth/reset-password",
      method: "POST",
      content: {
        token,
        password: newPassword,
      },
    }),

  checkAuthStatus: async () => {
    const token = await storage.getItem("userToken");
    if (!token) return false;
    try {
      await request({
        url: "/auth/profile",
        method: "GET",
      });
      return true;
    } catch {
      return false;
    }
  },
};

// File upload API endpoint
export const fileUploadAPI = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const token = await storage.getItem("userToken");
    const headers = {
      Accept: "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const token = await storage.getItem("userToken");
    const headers = {
      Accept: "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${BASE_URL}/users/${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }/upload-avatar`,
      {
        method: "POST",
        headers,
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();
  },
};

// User API endpoints
export const userAPI = {
  getProfile: () =>
    request({
      url: `/users/${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }`,
      method: "GET",
    }),

  updateProfile: (userData) =>
    request({
      url: `/users/${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }`,
      method: "PATCH",
      content: userData,
    }),

  changePassword: (currentPassword, newPassword) =>
    request({
      url: `/users/${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }/update-password`,
      method: "PATCH",
      content: {
        currentPassword,
        newPassword,
      },
    }),

  deleteAccount: (id) =>
    request({
      url: `/users/${id}`,
      method: "DELETE",
    }),
};

// Chat API endpoints
export const chatAPI = {
  getChatHistory: () =>
    request({
      url: "/ai-chat-bot",
      method: "GET",
    }),

  sendMessage: (data) =>
    request({
      url: "/ai-chat-bot",
      method: "POST",
      content: typeof data === "string" ? { message: data } : data,
    }),

  clearHistory: () =>
    request({
      url: "/ai-chat-bot",
      method: "DELETE",
    }),
};

// Unit API endpoints
export const unitAPI = {
  getRoadMap: (userId) =>
    request({
      url: `/units/roadmap/${
        userId ||
        userStore.getUserProfile.user_id ||
        userStore.getUserProfile.id
      }`,
      method: "GET",
    }),
};

// Vocabulary API endpoints
export const vocabularyAPI = {
  getAllVocabularySets: () =>
    request({
      url: `/vocabulary-sets`,
      method: "GET",
    }),

  getLessonVocabulary: (lessonId) =>
    request({
      url: `/lesson-vocabulary-sets/lesson/${lessonId}`,
      method: "GET",
    }),

  getVocabularyItemsBySet: (setId, page = 1, limit = 20) =>
    request({
      url: `/vocabulary-items/set/${setId}/paginated?page=${page}&limit=${limit}`,
      method: "GET",
    }),

  createVocabularyProgress: (vocabularyId, status) =>
    request({
      url: `/student-vocabulary-progress`,
      method: "POST",
      content: {
        student_id:
          userStore.getUserProfile.user_id || userStore.getUserProfile.id,
        vocabulary_item_id: vocabularyId,
        status: status,
      },
    }),

  updateVocabularyStatus: (vocabularyId) =>
    request({
      url: `/student-vocabulary-progress/student/${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }/vocabulary/${vocabularyId}/progress`,
      method: "POST",
    }),

  getStats: () =>
    request({
      url: `/student-vocabulary-progress/stats/student/${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }`,
      method: "GET",
    }),

  getStudentWordsProgress: () =>
    request({
      url: `/vocabulary-sets/progress/${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }`,
      method: "GET",
    }),

  checkVocabularyProgress: (vocabularyId) =>
    request({
      url: `/student-vocabulary-progress/student/${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }/vocabulary/${vocabularyId}/status`,
      method: "GET",
    }),
};

// Homework API endpoints
export const homeworkAPI = {
  getHomeWork: () =>
    request({
      url: `/group-homeworks/active/${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }`,
      method: "GET",
    }),

  submitHomework: (
    homework_id,
    lesson_id,
    exercise_id,
    percentage,
    section,
    answers,
  ) =>
    request({
      url: `/homework-submissions/section`,
      method: "POST",
      content: {
        homework_id,
        student_id:
          userStore.getUserProfile.user_id || userStore.getUserProfile.id,
        lesson_id,
        exercise_id,
        percentage,
        section,
        answers: answers || {},
        feedback: null,
      },
    }),
};

// Video API endpoints
export const videoAPI = {
  getAllVideos: () =>
    request({
      url: `/videos`,
      method: "GET",
    }),

  getVideoById: (id) =>
    request({
      url: `/videos/${id}/youtube`,
      method: "GET",
    }),

  incrementVideo: (id) =>
    request({
      url: `/videos/${id}/view`,
      method: "POST",
    }),
};

// Movies API endpoints
export const moviesAPI = {
  getMovies: () =>
    request({
      url: `/movies`,
      method: "GET",
    }),

  getMovieById: (id) =>
    request({
      url: `/movies/${id}`,
      method: "GET",
    }),

  incrementView: (id) =>
    request({
      url: `/movies/${id}/view`,
      method: "PATCH",
    }),
};

// Articles API endpoints
export const articlesAPI = {
  getArticles: (limit) =>
    request({
      url: `/articles?limit=${limit}`,
      method: "GET",
    }),

  getArticleById: (id) =>
    request({
      url: `/articles/${id}`,
      method: "GET",
    }),

  incrementView: (id) =>
    request({
      url: `/articles/${id}/view`,
      method: "PATCH",
    }),
};

// Books API endpoints
export const booksAPI = {
  getAllBooks: () =>
    request({
      url: `/books`,
      method: "GET",
    }),

  getBookById: (id) =>
    request({
      url: `/books/${id}`,
      method: "GET",
    }),

  getStudentsBook: () =>
    request({
      url: `/student-books/student/${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }`,
      method: "GET",
    }),

  getStudentsBookById: (id) =>
    request({
      url: `/student-books/${id}`,
      method: "GET",
    }),

  incrementView: (id) =>
    request({
      url: `/books/${id}/view`,
      method: "PATCH",
    }),
};

// Stories API endpoints
export const storiesAPI = {
  getStories: () =>
    request({
      url: `/stories`,
      method: "GET",
    }),

  getStoryById: (id) =>
    request({
      url: `/stories/${id}`,
      method: "GET",
    }),

  incrementView: (id) =>
    request({
      url: `/stories/${id}/view`,
      method: "POST",
    }),
};

// Exams API endpoints
export const examsAPI = {
  getExams: () =>
    request({
      url: `/exams/user/${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }`,
      method: "GET",
    }),

  getExamResults: (examId) =>
    request({
      url: `/exam-results/exam/${examId}/student/${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }`,
      method: "GET",
    }),

  getIeltsExams: () =>
    request({
      url: `/cd-ielts/tests/active`,
      method: "GET",
    }),

  getIeltsExamsById: (id) =>
    request({
      url: `/cd-ielts/tests/${id}`,
      method: "GET",
    }),

  registerIeltsExams: (testId) =>
    request({
      url: `/cd-ielts/registrations`,
      method: "POST",
      content: {
        student_id:
          userStore.getUserProfile.user_id || userStore.getUserProfile.id,
        cd_test_id: testId,
        status: "pending",
      },
    }),

  cancelRegistration: (registrationId) =>
    request({
      url: `/cd-ielts/registrations/${registrationId}`,
      method: "DELETE",
    }),

  getMyRegistrations: () =>
    request({
      url: `/cd-ielts/registrations/student/${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }`,
      method: "GET",
    }),
};

// Progress API endpoints
export const progressAPI = {
  getCourseProgress: (userId) =>
    request({
      url: `/courses/progress/${userId || userStore.getUserProfile.user_id}`,
      method: "GET",
    }),

  getAllAwards: (userId) =>
    request({
      url: `/student-profiles/user/${
        userId || userStore.getUserProfile.user_id
      }`,
      method: "GET",
    }),

  updatePoints: (amount) =>
    request({
      url: `/student-profiles/${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }/points/add/${amount}`,
      method: "PATCH",
    }),

  updateCoins: (amount) =>
    request({
      url: `/student-profiles/${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }/coins/add/${amount}`,
      method: "PATCH",
    }),

  incrementStreak: () =>
    request({
      url: `/student-profiles/${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }/streak/increment`,
      method: "PATCH",
    }),

  getLeaderboard: () =>
    request({
      url: `/student-profiles/leaderboard/points?limit=100`,
      method: "GET",
    }),

  getLevelLeaderboard: () =>
    request({
      url: `/student-profiles/leaderboard/level?userId=${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }&limit=100`,
      method: "GET",
    }),

  getCurrentUserRank: (userId) =>
    request({
      url: `/student-profiles/ranking/points/${
        userId || userStore.getUserProfile.user_id
      }`,
      method: "GET",
    }),

  getAttendanceStats: () =>
    request({
      url: `/attendance/student/${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }/current-month`,
      method: "GET",
    }),

  getOverallSectionsProgress: () =>
    request({
      url: `/homework-submissions/student/${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }/stats`,
      method: "GET",
    }),
};

// Notifications API endpoints
export const notificationsAPI = {
  getAllNotificationsWithUnseenCount: () =>
    request({
      url: `/notifications/user/${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }`,
    }),

  markAsSeen: (notificationId) =>
    request({
      url: `/notifications/seen/${notificationId}/user/${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }`,
      method: "PATCH",
    }),

  saveToken: (token, userId) =>
    request({
      url: `/notifications/tokens`,
      method: "POST",
      content: { token, user_id: userId },
    }),
};

// Payments API endpoints
export const paymentsAPI = {
  getPaymentStatus: () =>
    request({
      url: `/student-payments/student/${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }/status`,
      method: "GET",
    }),

  getAllPayments: () =>
    request({
      url: `/student-payments/student/${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }`,
      method: "GET",
    }),
};

// Speaking API endpoints
export const speakingAPI = {
  getSpeakingByLessonId: (lessonId, type) =>
    request({
      url: `/speaking/lesson/${lessonId}/type/${type}`,
      method: "GET",
    }),

  getPronunciationBySpeakingId: (speakingId) =>
    request({
      url: `/pronunciation-exercise/speaking/${speakingId}`,
      method: "GET",
    }),

  getPartOneBySpeakingId: (speakingId) =>
    request({
      url: `/ieltspart1-question/speaking/${speakingId}`,
      method: "GET",
    }),

  savePronunciationResponse: (speakingId, type, score) => {
    console.log("savePronunciationResponse called with:", {
      speakingId,
      type,
      score,
    });
    return request({
      url: `/speaking-responses`,
      method: "POST",
      content: {
        speaking_id: speakingId,
        student_id:
          userStore.getUserProfile.user_id || userStore.getUserProfile.id,
        response_type: type,
        audio_url: [],
        feedback: null,
        pronunciation_score: score,
        result: null,
        transcription: null,
      },
    });
  },

  saveSpeakingResponse: (speakingId, type, audioUrl, transcription) =>
    request({
      url: `/speaking-responses`,
      method: "POST",
      content: {
        speaking_id: speakingId,
        student_id:
          userStore.getUserProfile.user_id || userStore.getUserProfile.id,
        response_type: type,
        audio_url: audioUrl || null,
        feedback: null,
        pronunciation_score: null,
        result: {},
        transcription: transcription || null,
      },
    }),

  checkSpeakingSubmission: (speakingId) =>
    request({
      url: `/speaking-responses/check-submission?lessonId=${speakingId}&studentId=${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }`,
      method: "GET",
    }),
};

// Exercises API endpoints
export const exercisesAPI = {
  getExerciseById: (exerciseId) =>
    request({
      url: `/exercise/${exerciseId}`,
      method: "GET",
    }),

  getExercisesByLessonId: (lessonId) =>
    request({
      url: `/exercise/lesson/${lessonId}`,
      method: "GET",
    }),

  getSpeakingByLessonId: (lessonId, type) =>
    request({
      url: `/speaking/lesson/${lessonId}/type/${type}`,
      method: "GET",
    }),

  getExerciseByType: (type, lessonId) =>
    request({
      url: `/exercise/type/${type}/lesson/${lessonId}`,
      method: "GET",
    }),

  checkExerciseSubmission: (homeworkId, section) =>
    request({
      url: `/homework-submissions/student/${
        userStore.getUserProfile.user_id || userStore.getUserProfile.id
      }/homework/${homeworkId}/exercises?section=${section}`,
      method: "GET",
    }),
};

// LessonContent API endpoints
export const lessonContentAPI = {
  getLessonExercises: (lessonId) =>
    request({
      url: `/group-homeworks/lesson/${lessonId}`,
      method: "GET",
    }),

  getLessonContent: (lessonId) =>
    request({
      url: `/lesson-content/lesson/${lessonId}`,
      method: "GET",
    }),
};

// TTS API endpoints
export const ttsAPI = {
  getTTSUrl: async (text, voice = "elisa") => {
    try {
      const response = await request({
        url: `/voice-chat-bot/text-to-voice-url?voice=${encodeURIComponent(
          voice,
        )}&text=${encodeURIComponent(text)}`,
        method: "GET",
      });

      console.log("TTS API Response:", response);

      if (!response?.success || !response?.url) {
        console.error("Invalid TTS response:", response);
        throw new Error("Invalid TTS response");
      }

      console.log("TTS Audio URL:", response.url);
      return response.url;
    } catch (error) {
      console.error("TTS API Error:", error);
      throw error;
    }
  },
};

// Certificates API endpoints
export const certificatesAPI = {
  getStudentCertificates: (studentId) =>
    request({
      url: `/certificates/student/${
        studentId ||
        userStore.getUserProfile.user_id ||
        userStore.getUserProfile.id
      }`,
      method: "GET",
    }),
};

// Feed Audios API endpoints
export const feedAudiosAPI = {
  getAllTasks: (limit, page, difficulty) => {
    let url = `/audio/tasks?limit=${limit}&page=${page}`;
    if (difficulty) {
      url += `&difficulty=${difficulty}`;
    }
    return request({
      url,
      method: "GET",
    });
  },

  checkTaskDone: (taskId) =>
    request({
      url: `/audio/tasks/${taskId}/check-done`,
      method: "GET",
    }),

  getTrendingAudios: (page, limit) =>
    request({
      url: `/audio/trending?page=${page}&limit=${limit}`,
      method: "GET",
    }),

  uploadAudio: async (
    file,
    caption,
    taskId,
    durationSeconds,
    progressCallback,
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("caption", caption);
    formData.append("taskId", taskId);
    formData.append("durationSeconds", durationSeconds);

    const token = await storage.getItem("userToken");
    const headers = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && progressCallback) {
          const progress = (event.loaded / event.total) * 100;
          progressCallback(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error("Invalid response format"));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed: Network error"));
      });

      xhr.open("POST", `${BASE_URL}/audio/upload`);

      // Set authorization header
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  },

  getMyAudios: (page, limit) =>
    request({
      url: `/audio/my-audios?page=${page}&limit=${limit}`,
      method: "GET",
    }),

  getAudioById: (id) =>
    request({
      url: `/audio/${id}`,
      method: "GET",
    }),

  deleteAudio: (id) =>
    request({
      url: `/audio/${id}`,
      method: "DELETE",
    }),

  incrementView: (id) =>
    request({
      url: `/audio/${id}/view`,
      method: "POST",
    }),

  likeAudio: (id) =>
    request({
      url: `/audio/${id}/like`,
      method: "POST",
    }),

  addComment: (audioId, comment) =>
    request({
      url: `/audio/comments`,
      method: "POST",
      content: {
        audioId,
        comment,
      },
    }),

  getComments: (id) =>
    request({
      url: `/audio/${id}/comments`,
      method: "GET",
    }),

  deleteComment: (commentId) =>
    request({
      url: `/audio/comments/${commentId}`,
      method: "DELETE",
    }),

  submitJudge: (audioId, rating) =>
    request({
      url: `/audio/judge`,
      method: "POST",
      content: {
        audioId,
        rating,
      },
    }),

  getJudges: (id) =>
    request({
      url: `/audio/${id}/judges`,
      method: "GET",
    }),
};

// Error handler helper
export const handleApiError = (error) => {
  if (error.message?.includes("HTTP")) {
    // Parse HTTP error
    const statusMatch = error.message.match(/HTTP (\d+)/);
    const status = statusMatch ? parseInt(statusMatch[1]) : 500;
    const message = error.message;

    switch (status) {
      case 400:
        return { type: "VALIDATION_ERROR", message };
      case 401:
        return { type: "UNAUTHORIZED", message };
      case 403:
        return { type: "FORBIDDEN", message };
      case 404:
        return { type: "NOT_FOUND", message };
      case 429:
        return { type: "RATE_LIMIT", message };
      case 500:
        return { type: "SERVER_ERROR", message };
      default:
        return { type: "UNKNOWN_ERROR", message };
    }
  } else if (error.message) {
    // Network or other error
    return {
      type: "NETWORK_ERROR",
      message: error.message,
    };
  } else {
    // Unknown error
    return {
      type: "UNKNOWN_ERROR",
      message: "An unexpected error occurred.",
    };
  }
};

export { storage, request };

// IELTS API endpoints
export const ieltsAPI = {
  getSkills: ({
    page = 1,
    limit = 10,
    search = "",
    type = "",
    category = "",
    mode = "",
  } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append("search", search);
    if (type) params.append("type", type);
    if (category) params.append("category", category);
    if (mode) params.append("mode", mode);
    return request({
      url: `/ielts-tests/skills?${params.toString()}`,
      method: "GET",
    });
  },

  getTests: ({ page = 1, limit = 10, mode = "", category = "" } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (mode) params.append("mode", mode);
    if (category) params.append("category", category);
    return request({
      url: `/ielts-tests?${params.toString()}`,
      method: "GET",
    });
  },

  getTestById: (id) =>
    request({
      url: `/ielts-tests/${id}`,
      method: "GET",
    }),

  getReadingTests: ({ page = 1, limit = 10, mode, part } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (mode) params.append("mode", mode);
    if (part) params.append("part", part);
    return request({
      url: `/ielts-reading?${params.toString()}`,
      method: "GET",
    });
  },

  getReadingTestById: (id) =>
    request({
      url: `/ielts-reading/${id}`,
      method: "GET",
    }),

  getReadingParts: ({ page = 1, limit = 10, part = "", mode = "" } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (part) params.append("part", part);
    if (mode) params.append("mode", mode);
    return request({
      url: `/ielts-reading-parts?${params.toString()}`,
      method: "GET",
    });
  },

  getReadingPartById: (id) =>
    request({
      url: `/ielts-reading-parts/${id}`,
      method: "GET",
    }),

  getListeningTests: ({ page = 1, limit = 10, mode } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (mode) params.append("mode", mode);
    return request({
      url: `/ielts-listening?${params.toString()}`,
      method: "GET",
    });
  },

  getListeningParts: ({ page = 1, limit = 10, part = "", mode = "" } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (part) params.append("part", part);
    if (mode) params.append("mode", mode);
    return request({
      url: `/ielts-listening-parts?${params.toString()}`,
      method: "GET",
    });
  },

  getListeningPartById: (id) =>
    request({
      url: `/ielts-listening-parts/${id}`,
      method: "GET",
    }),

  getListeningTestById: (id) =>
    request({
      url: `/ielts-listening/${id}`,
      method: "GET",
    }),

  getWritingTests: ({ page = 1, limit = 10, mode } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (mode) params.append("mode", mode);
    return request({
      url: `/ielts-writing?${params.toString()}`,
      method: "GET",
    });
  },

  getWritingTasks: ({ page = 1, limit = 10, task = "", mode = "" } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (task) params.append("task", task);
    if (mode) params.append("mode", mode);
    return request({
      url: `/ielts-writing/tasks?${params.toString()}`,
      method: "GET",
    });
  },

  getWritingTaskById: (id) =>
    request({
      url: `/ielts-writing/task/${id}`,
      method: "GET",
    }),

  getWritingTestById: (id) =>
    request({
      url: `/ielts-writing/${id}`,
      method: "GET",
    }),
};

// IELTS Course API endpoints
export const ieltsCourseAPI = {
  getCourses: ({ page = 1, limit = 10 } = {}) =>
    request({
      url: `/ielts-courses?limit=${limit}&page=${page}&status=published`,
      method: "GET",
    }),

  getCourseById: (id) =>
    request({
      url: `/ielts-courses/${id}`,
      method: "GET",
    }),

  getSections: (courseId, { limit = 100 } = {}) =>
    request({
      url: `/ielts-course-sections?courseId=${courseId}&limit=${limit}`,
      method: "GET",
    }),

  getLessons: (sectionId, { limit = 100 } = {}) =>
    request({
      url: `/ielts-lessons?sectionId=${sectionId}&limit=${limit}`,
      method: "GET",
    }),

  getLessonById: (id) =>
    request({
      url: `/ielts-lessons/${id}`,
      method: "GET",
    }),

  getQuizzesByLessonId: (lessonId) =>
    request({
      url: `/ielts-quizzes/lesson/${lessonId}`,
      method: "GET",
    }),

  getQuizQuestions: (quizId, { limit = 100 } = {}) =>
    request({
      url: `/ielts-quiz-questions?quizId=${quizId}&limit=${limit}`,
      method: "GET",
    }),

  // Quiz Attempts
  startQuizAttempt: (userId, quizId) =>
    request({
      url: "/ielts-quiz-attempts",
      method: "POST",
      content: { user_id: userId, quiz_id: quizId },
    }),

  submitQuizAnswer: (payload) =>
    request({
      url: "/ielts-quiz-attempts/answer",
      method: "POST",
      content: payload,
    }),

  finalizeQuizAttempt: (attemptId) =>
    request({
      url: `/ielts-quiz-attempts/${attemptId}/submit`,
      method: "PATCH",
    }),

  getQuizAttempt: (attemptId) =>
    request({
      url: `/ielts-quiz-attempts/${attemptId}`,
      method: "GET",
    }),
};
