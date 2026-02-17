# IELTS Answers API — Frontend Integration Guide

> **Base URL:** `/api/ielts-answers`  
> **Auth:** All endpoints require `Authorization: Bearer <JWT_TOKEN>`  
> **Roles:** ADMIN, TEACHER, STUDENT

---

## Table of Contents

1. [Overview & Flow](#1-overview--flow)
2. [Data Models](#2-data-models)
3. [Enums](#3-enums)
4. [API Endpoints](#4-api-endpoints)
   - [Attempts](#41-attempts)
   - [Statistics](#42-statistics)
   - [Unfinished Tests](#43-unfinished-tests)
   - [Reading Answers](#44-reading-answers)
   - [Listening Answers](#45-listening-answers)
   - [Writing Answers](#46-writing-answers)
   - [Grade Writing](#47-grade-writing)
    - [Teacher Tools](#48-teacher-tools)
5. [Complete Usage Flow](#5-complete-usage-flow)
6. [Error Handling](#6-error-handling)

---

## 1. Overview & Flow

The IELTS Answers system follows a **3-step workflow**:

```
1. Create an Attempt  →  2. Save Answers (Reading / Listening / Writing)  →  3. Submit the Attempt
```

An **attempt** is a wrapper that groups all answers for a specific test-taking session. The user must create an attempt first, then save answers against it, and finally submit (or abandon) the attempt.

### Scope Hierarchy

An attempt can target different levels of the test hierarchy:

| Scope | Description | Required Field |
|-------|-------------|----------------|
| `TEST` | Full IELTS test | `test_id` |
| `MODULE` | Single module (Reading/Listening/Writing) | `module_id` |
| `PART` | Single part within a module | `part_id` |
| `TASK` | Single writing task | `task_id` |

---

## 2. Data Models

### Attempt (`ielts_answer_attempts`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Auto-generated primary key |
| `user_id` | UUID | The user who created the attempt (set from JWT) |
| `scope` | Enum | `TEST`, `MODULE`, `PART`, or `TASK` |
| `test_id` | UUID \| null | Test reference (when scope = TEST) |
| `module_id` | UUID \| null | Module reference (when scope = MODULE) |
| `part_id` | UUID \| null | Part reference (when scope = PART) |
| `task_id` | UUID \| null | Task reference (when scope = TASK) |
| `started_at` | Date | When the attempt was created |
| `finished_at` | Date \| null | When the attempt was submitted/abandoned |
| `status` | Enum | `IN_PROGRESS`, `SUBMITTED`, or `ABANDONED` |
| `createdAt` | Date | Record creation timestamp |
| `updatedAt` | Date | Record update timestamp |

### Reading Answer (`ielts_reading_answers`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Auto-generated primary key |
| `attempt_id` | UUID | Reference to the attempt |
| `user_id` | UUID | The user (set from JWT) |
| `part_id` | UUID | Reading part ID |
| `question_id` | UUID | Question ID |
| `question_number` | String \| null | Display number (e.g., "1", "2") |
| `answer` | String | The user's answer (e.g., "TRUE", "B", "example text") |
| `is_correct` | Boolean \| null | Set after grading |
| `correct_answer` | String \| null | Set after grading |
| `createdAt` | Date | Record creation timestamp |
| `updatedAt` | Date | Record update timestamp |

### Listening Answer (`ielts_listening_answers`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Auto-generated primary key |
| `attempt_id` | UUID | Reference to the attempt |
| `user_id` | UUID | The user (set from JWT) |
| `part_id` | UUID | Listening part ID |
| `question_id` | UUID | Question ID |
| `question_number` | String \| null | Display number (e.g., "1", "2") |
| `answer` | String | The user's answer |
| `is_correct` | Boolean \| null | Set after grading |
| `correct_answer` | String \| null | Set after grading |
| `createdAt` | Date | Record creation timestamp |
| `updatedAt` | Date | Record update timestamp |

### Writing Answer (`ielts_writing_answers`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Auto-generated primary key |
| `attempt_id` | UUID | Reference to the attempt |
| `user_id` | UUID | The user (set from JWT) |
| `task_id` | UUID | Writing task ID |
| `answer_text` | String | The user's essay/response |
| `word_count` | Number \| null | Word count |
| `score` | JSON \| null | Grading scores breakdown (see Writing Score below) |
| `feedback` | String \| null | Set after grading |
| `createdAt` | Date | Record creation timestamp |
| `updatedAt` | Date | Record update timestamp |

### Writing Score (JSON structure)

| Field | Type | Description |
|-------|------|-------------|
| `task_response` | Number \| null | Task Response / Task Achievement score (0–9) |
| `lexical_resources` | Number \| null | Lexical Resources score (0–9) |
| `grammar_range_and_accuracy` | Number \| null | Grammatical Range and Accuracy score (0–9) |
| `coherence_and_cohesion` | Number \| null | Coherence and Cohesion score (0–9) |
| `overall` | Number \| null | Overall band score (auto-calculated if omitted, rounded to nearest 0.5) |

---

## 3. Enums

### AttemptScope

```typescript
enum AttemptScope {
  TEST = "TEST",
  MODULE = "MODULE",
  PART = "PART",
  TASK = "TASK",
}
```

### AttemptStatus

```typescript
enum AttemptStatus {
  IN_PROGRESS = "IN_PROGRESS",
  SUBMITTED = "SUBMITTED",
  ABANDONED = "ABANDONED",
}
```

---

## 4. API Endpoints

### 4.1 Attempts

#### Create an Attempt

```
POST /api/ielts-answers/attempts
```

**Request Body:**

```json
{
  "scope": "TEST",
  "test_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scope` | String | Yes | `TEST`, `MODULE`, `PART`, or `TASK` |
| `test_id` | UUID | When scope = `TEST` | The test ID |
| `module_id` | UUID | When scope = `MODULE` | The module ID (reading/listening/writing ID) |
| `part_id` | UUID | When scope = `PART` | The part ID |
| `task_id` | UUID | When scope = `TASK` | The writing task ID |

**Response (201):**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user_id": "user-uuid",
  "scope": "TEST",
  "test_id": "123e4567-e89b-12d3-a456-426614174000",
  "module_id": null,
  "part_id": null,
  "task_id": null,
  "started_at": "2026-02-16T10:00:00.000Z",
  "finished_at": null,
  "status": "IN_PROGRESS",
  "createdAt": "2026-02-16T10:00:00.000Z",
  "updatedAt": "2026-02-16T10:00:00.000Z"
}
```

---

#### Get All Attempts

```
GET /api/ielts-answers/attempts
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | Number | 1 | Page number |
| `limit` | Number | 10 | Results per page |
| `test_id` | UUID | — | Filter by test |
| `scope` | String | — | Filter by scope (`TEST`, `MODULE`, `PART`, `TASK`) |
| `status` | String | — | Filter by status (`IN_PROGRESS`, `SUBMITTED`, `ABANDONED`) |

**Example:**

```
GET /api/ielts-answers/attempts?page=1&limit=10&status=IN_PROGRESS
```

**Response (200):**

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "user_id": "user-uuid",
      "scope": "TEST",
      "test_id": "123e4567-e89b-12d3-a456-426614174000",
      "status": "IN_PROGRESS",
      "started_at": "2026-02-16T10:00:00.000Z",
      "finished_at": null,
      "test": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "title": "IELTS Academic Test 1"
      }
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

#### Get Attempt by ID

```
GET /api/ielts-answers/attempts/:id
```

Returns the attempt with all its associated reading, listening, and writing answers.

**Response (200):**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user_id": "user-uuid",
  "scope": "TEST",
  "test_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "IN_PROGRESS",
  "started_at": "2026-02-16T10:00:00.000Z",
  "finished_at": null,
  "test": { "id": "...", "title": "IELTS Academic Test 1" },
  "readingAnswers": [
    {
      "id": "...",
      "part_id": "...",
      "question_id": "...",
      "question_number": "1",
      "answer": "TRUE",
      "is_correct": null,
      "correct_answer": null
    }
  ],
  "listeningAnswers": [],
  "writingAnswers": []
}
```

---

#### Submit Attempt

```
PATCH /api/ielts-answers/attempts/:id/submit
```

Marks the attempt as `SUBMITTED` and sets `finished_at`. Only works when status is `IN_PROGRESS`.

**Response (200):**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "SUBMITTED",
  "finished_at": "2026-02-16T11:00:00.000Z"
}
```

---

#### Abandon Attempt

```
PATCH /api/ielts-answers/attempts/:id/abandon
```

Marks the attempt as `ABANDONED` and sets `finished_at`. Only works when status is `IN_PROGRESS`.

**Response (200):**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "ABANDONED",
  "finished_at": "2026-02-16T11:00:00.000Z"
}
```

---

### 4.2 Statistics

#### Get User Statistics

```
GET /api/ielts-answers/statistics
```

**Roles:** ADMIN, TEACHER, STUDENT

Returns comprehensive statistics for the current user's IELTS test activity.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `scope` | String | — | Filter by scope (`TEST`, `MODULE`, `PART`, `TASK`) |
| `test_id` | UUID | — | Filter by specific test |
| `from` | String (ISO 8601) | — | Start date filter |
| `to` | String (ISO 8601) | — | End date filter |

**Example:**

```
GET /api/ielts-answers/statistics?from=2025-01-01T00:00:00.000Z&to=2026-12-31T23:59:59.999Z
```

**Response (200):**

```json
{
  "overview": {
    "totalSubmitted": 12,
    "totalInProgress": 2,
    "totalAbandoned": 1,
    "totalAttempts": 15
  },
  "scores": {
    "averageBandScore": 6.5,
    "bestBandScore": 7.5
  },
  "reading": {
    "totalQuestions": 120,
    "correctAnswers": 89,
    "accuracy": 74.17
  },
  "listening": {
    "totalQuestions": 80,
    "correctAnswers": 62,
    "accuracy": 77.5
  },
  "writing": {
    "totalAnswers": 24,
    "averageWordCount": 267,
    "averageScores": {
      "task_response": 6.5,
      "lexical_resources": 6.0,
      "grammar_range_and_accuracy": 5.5,
      "coherence_and_cohesion": 6.0,
      "overall": 6.0
    },
    "scoredCount": 18
  },
  "time": {
    "averageTimeSpentMinutes": 45.32,
    "totalTimeSpentMinutes": 543.84
  },
  "recentScores": [7.0, 6.5, 7.5, 6.0, 6.5, 7.0, 5.5, 6.5, 6.0, 7.0]
}
```

> **Note:** `writing.averageScores` is `null` if no writing answers have been graded yet.

---

### 4.3 Unfinished Tests

#### Get Unfinished Tests

```
GET /api/ielts-answers/unfinished
```

**Roles:** ADMIN, TEACHER, STUDENT

Returns the current user's in-progress (and optionally abandoned) attempts with answer progress information.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | Number | 1 | Page number |
| `limit` | Number | 10 | Results per page |
| `scope` | String | — | Filter by scope (`TEST`, `MODULE`, `PART`, `TASK`) |
| `include_abandoned` | Boolean | `false` | Include abandoned attempts |

**Example:**

```
GET /api/ielts-answers/unfinished?page=1&limit=10&include_abandoned=true
```

**Response (200):**

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "user_id": "user-uuid",
      "scope": "TEST",
      "test_id": "123e4567-e89b-12d3-a456-426614174000",
      "status": "IN_PROGRESS",
      "started_at": "2026-02-16T10:00:00.000Z",
      "finished_at": null,
      "test": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "title": "IELTS Academic Test 1"
      },
      "progress": {
        "readingAnswers": 13,
        "listeningAnswers": 20,
        "writingAnswers": 1,
        "totalAnswers": 34
      },
      "elapsedMinutes": 32.45
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

### 4.4 Reading Answers

#### Save Reading Answers

```
POST /api/ielts-answers/reading
```

Saves (or replaces) reading answers for a given attempt. If answers already exist for the same attempt + part, they are **replaced** (upsert behavior).

**Request Body:**

```json
{
  "attempt_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "answers": [
    {
      "part_id": "part-uuid-1",
      "question_id": "question-uuid-1",
      "question_number": "1",
      "answer": "TRUE"
    },
    {
      "part_id": "part-uuid-1",
      "question_id": "question-uuid-2",
      "question_number": "2",
      "answer": "FALSE"
    },
    {
      "part_id": "part-uuid-1",
      "question_id": "question-uuid-3",
      "question_number": "3",
      "answer": "NOT GIVEN"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `attempt_id` | UUID | Yes | The attempt ID |
| `answers` | Array | Yes | Array of answer objects |
| `answers[].part_id` | UUID | Yes | Reading part ID |
| `answers[].question_id` | UUID | Yes | Question ID |
| `answers[].question_number` | String | No | Display question number |
| `answers[].answer` | String | Yes | The user's answer |

**Response (201):**

```json
{
  "message": "Reading answers saved successfully",
  "count": 3
}
```

---

#### Get Reading Answers

```
GET /api/ielts-answers/reading/:attemptId
```

Returns all reading answers for a specific attempt, ordered by `question_number`.

**Response (200):**

```json
[
  {
    "id": "answer-uuid-1",
    "attempt_id": "attempt-uuid",
    "user_id": "user-uuid",
    "part_id": "part-uuid-1",
    "question_id": "question-uuid-1",
    "question_number": "1",
    "answer": "TRUE",
    "is_correct": null,
    "correct_answer": null,
    "readingPart": {
      "id": "part-uuid-1",
      "title": "Reading Passage 1"
    },
    "question": {
      "id": "question-uuid-1",
      "question_text": "The writer suggests that..."
    }
  }
]
```

---

### 4.5 Listening Answers

#### Save Listening Answers

```
POST /api/ielts-answers/listening
```

Saves (or replaces) listening answers for a given attempt. Same upsert behavior as reading.

**Request Body:**

```json
{
  "attempt_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "answers": [
    {
      "part_id": "listening-part-uuid-1",
      "question_id": "question-uuid-10",
      "question_number": "1",
      "answer": "hospital"
    },
    {
      "part_id": "listening-part-uuid-1",
      "question_id": "question-uuid-11",
      "question_number": "2",
      "answer": "B"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `attempt_id` | UUID | Yes | The attempt ID |
| `answers` | Array | Yes | Array of answer objects |
| `answers[].part_id` | UUID | Yes | Listening part ID |
| `answers[].question_id` | UUID | Yes | Question ID |
| `answers[].question_number` | String | No | Display question number |
| `answers[].answer` | String | Yes | The user's answer |

**Response (201):**

```json
{
  "message": "Listening answers saved successfully",
  "count": 2
}
```

---

#### Get Listening Answers

```
GET /api/ielts-answers/listening/:attemptId
```

Returns all listening answers for a specific attempt, ordered by `question_number`.

**Response (200):**

```json
[
  {
    "id": "answer-uuid-1",
    "attempt_id": "attempt-uuid",
    "user_id": "user-uuid",
    "part_id": "listening-part-uuid-1",
    "question_id": "question-uuid-10",
    "question_number": "1",
    "answer": "hospital",
    "is_correct": null,
    "correct_answer": null,
    "listeningPart": {
      "id": "listening-part-uuid-1",
      "title": "Part 1"
    },
    "question": {
      "id": "question-uuid-10",
      "question_text": "What is the name of the..."
    }
  }
]
```

---

### 4.6 Writing Answers

#### Save Writing Answers

```
POST /api/ielts-answers/writing
```

Saves (or replaces) writing answers for a given attempt. Same upsert behavior.

**Request Body:**

```json
{
  "attempt_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "answers": [
    {
      "task_id": "writing-task-uuid-1",
      "answer_text": "The bar chart illustrates the percentage of households that owned various types of technology...",
      "word_count": 187,
      "score": {
        "task_response": 6.5,
        "lexical_resources": 6.0,
        "grammar_range_and_accuracy": 5.5,
        "coherence_and_cohesion": 6.0
      }
    },
    {
      "task_id": "writing-task-uuid-2",
      "answer_text": "In recent years, the issue of environmental protection has become increasingly important...",
      "word_count": 312
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `attempt_id` | UUID | Yes | The attempt ID |
| `answers` | Array | Yes | Array of answer objects |
| `answers[].task_id` | UUID | Yes | Writing task ID |
| `answers[].answer_text` | String | Yes | The user's essay/response |
| `answers[].word_count` | Number | No | Word count (can be calculated on frontend) |
| `answers[].score` | Object | No | Writing score breakdown (see below) |
| `answers[].score.task_response` | Number | No | Task Response score (0–9) |
| `answers[].score.lexical_resources` | Number | No | Lexical Resources score (0–9) |
| `answers[].score.grammar_range_and_accuracy` | Number | No | Grammatical Range and Accuracy score (0–9) |
| `answers[].score.coherence_and_cohesion` | Number | No | Coherence and Cohesion score (0–9) |
| `answers[].score.overall` | Number | No | Overall score (auto-calculated if omitted) |

**Response (201):**

```json
{
  "message": "Writing answers saved successfully",
  "count": 2
}
```

---

#### Get Writing Answers

```
GET /api/ielts-answers/writing/:attemptId
```

Returns all writing answers for a specific attempt.

**Response (200):**

```json
[
  {
    "id": "answer-uuid-1",
    "attempt_id": "attempt-uuid",
    "user_id": "user-uuid",
    "task_id": "writing-task-uuid-1",
    "answer_text": "The bar chart illustrates...",
    "word_count": 187,
    "score": {
      "task_response": 6.5,
      "lexical_resources": 6.0,
      "grammar_range_and_accuracy": 5.5,
      "coherence_and_cohesion": 6.0,
      "overall": 6.0
    },
    "feedback": "Good structure but needs wider vocabulary range.",
    "task": {
      "id": "writing-task-uuid-1",
      "task_number": 1,
      "task_type": "REPORT"
    }
  }
]
```

---

### 4.7 Grade Writing

#### Grade a Writing Answer

```
PATCH /api/ielts-answers/writing/:answerId/grade
```

**Roles:** ADMIN, TEACHER only

Grades a specific writing answer with IELTS criteria scores and optional feedback.

**URL Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `answerId` | UUID | The writing answer ID |

**Request Body:**

```json
{
  "score": {
    "task_response": 7.0,
    "lexical_resources": 6.5,
    "grammar_range_and_accuracy": 6.0,
    "coherence_and_cohesion": 6.5
  },
  "feedback": "Your essay demonstrates a clear position throughout. However, the range of vocabulary could be improved. Grammar is generally accurate with some minor errors."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `score` | Object | Yes | Writing score breakdown |
| `score.task_response` | Number | No | Task Response / Task Achievement (0–9) |
| `score.lexical_resources` | Number | No | Lexical Resources (0–9) |
| `score.grammar_range_and_accuracy` | Number | No | Grammatical Range and Accuracy (0–9) |
| `score.coherence_and_cohesion` | Number | No | Coherence and Cohesion (0–9) |
| `score.overall` | Number | No | Overall band score (auto-calculated if omitted, rounded to nearest 0.5) |
| `feedback` | String | No | Detailed feedback text from the grader |

> **Note:** If `overall` is not provided, it is auto-calculated as the average of the four criteria, rounded to the nearest 0.5 (following IELTS convention).

**Response (200):**

```json
{
  "message": "Writing answer graded successfully",
  "data": {
    "id": "answer-uuid-1",
    "attempt_id": "attempt-uuid",
    "user_id": "user-uuid",
    "task_id": "writing-task-uuid-1",
    "answer_text": "The bar chart illustrates...",
    "word_count": 187,
    "score": {
      "task_response": 7.0,
      "lexical_resources": 6.5,
      "grammar_range_and_accuracy": 6.0,
      "coherence_and_cohesion": 6.5,
      "overall": 6.5
    },
    "feedback": "Your essay demonstrates a clear position throughout..."
  }
}
```

---

### 4.8 Teacher Tools

#### Get My Students

```
GET /api/ielts-answers/my-students
```

**Roles:** TEACHER only

Returns all active students across the current teacher's groups.

**Response (200):**

```json
[
  {
    "id": "group-student-uuid",
    "group_id": "group-uuid",
    "student_id": "student-uuid",
    "status": "active",
    "student": {
      "user_id": "student-uuid",
      "username": "student_1",
      "first_name": "Ali",
      "last_name": "Karimov",
      "avatar_url": "https://...",
      "phone": "+998901234567"
    },
    "group": {
      "id": "group-uuid",
      "name": "IELTS Upper Intermediate",
      "level_id": "level-uuid",
      "teacher": {
        "user_id": "teacher-uuid",
        "username": "teacher_1",
        "first_name": "Sara",
        "last_name": "Smith",
        "avatar_url": "https://..."
      }
    }
  }
]
```

---

#### Get My Students' Ungraded Writing Tasks

```
GET /api/ielts-answers/my-students-attempts-results
```

**Roles:** TEACHER only

Returns only writing answers that still need grading for the teacher's students.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | Number | 1 | Page number for ungraded writing items |
| `limit` | Number | 10 | Page size for ungraded writing items |
| `student_id` | UUID | — | Filter by one student in teacher's groups |
| `test_id` | UUID | — | Filter attempts by IELTS test |
| `from` | String (ISO 8601) | — | Filter attempts by `finished_at` >= from |
| `to` | String (ISO 8601) | — | Filter attempts by `finished_at` <= to |
| `only_ungraded` | Boolean | `true` | Kept for backward compatibility (endpoint already returns only ungraded writing responses) |

**Example:**

```
GET /api/ielts-answers/my-students-attempts-results?page=1&limit=10&test_id=123e4567-e89b-12d3-a456-426614174000&from=2026-01-01T00:00:00.000Z&to=2026-12-31T23:59:59.999Z&only_ungraded=true
```

**Response (200):**

```json
{
  "writingTasksToGrade": [
    {
      "student": {
        "user_id": "student-uuid",
        "username": "student_1",
        "first_name": "Ali",
        "last_name": "Karimov"
      },
      "writingTasks": [
        {
          "writingAnswerId": "writing-answer-uuid",
          "attemptId": "attempt-uuid",
          "submittedAt": "2026-02-10T10:00:00.000Z",
          "test": {
            "id": "test-uuid",
            "title": "IELTS Academic Test 1"
          },
          "task": {
            "id": "task-uuid",
            "task": "TASK_1",
            "prompt": "Summarize the chart..."
          },
          "answerText": "The chart illustrates...",
          "wordCount": 187,
          "feedback": null
        }
      ]
    }
  ],
  "totals": {
    "students": 8,
    "writingTasksToGrade": 5
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "writingTasksToGradeTotalPages": 1
  }
}
```

> **Notes:**
> - The response is nested by student: `writingTasksToGrade[] -> { student, writingTasks[] }`.
> - Pagination is applied to `writingTasksToGrade` using `page` and `limit`.

---

#### Get All Attempts of a Specific Student

```
GET /api/ielts-answers/my-students/:studentId/attempts
```

**Roles:** TEACHER only

Returns all attempts for the specified student.

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `studentId` | UUID | The student's `user_id` |

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | Number | 1 | Page number |
| `limit` | Number | 10 | Results per page |
| `test_id` | UUID | — | Filter by test |
| `scope` | String | — | Filter by scope (`TEST`, `MODULE`, `PART`, `TASK`) |
| `status` | String | — | Filter by status (`IN_PROGRESS`, `SUBMITTED`, `ABANDONED`) |

**Example:**

```
GET /api/ielts-answers/my-students/7a25a73c-a62f-4655-8556-df2165a64fbf/attempts?page=1&limit=10&status=SUBMITTED
```

**Response (200):**

Same response shape as `GET /api/ielts-answers/attempts`.

---

#### Get One Attempt Result of a Specific Student

```
GET /api/ielts-answers/my-students/:studentId/attempts/:id
```

**Roles:** TEACHER only

Returns one attempt result for the specified student.

**Path Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `studentId` | UUID | The student's `user_id` |
| `id` | UUID | The attempt ID |

**Example:**

```
GET /api/ielts-answers/my-students/7a25a73c-a62f-4655-8556-df2165a64fbf/attempts/cd7aadec-fc44-4ebd-89a8-3628338448e8
```

**Response (200):**

Same response shape as `GET /api/ielts-answers/attempts/:id`.

---

## 5. Complete Usage Flow

### Full Test Flow (Frontend Example)

```typescript
// Step 1: Create an attempt when user starts the test
const attempt = await api.post('/ielts-answers/attempts', {
  scope: 'TEST',
  test_id: 'test-uuid-here'
});

const attemptId = attempt.data.id;

// Step 2a: User completes Reading section — save answers
await api.post('/ielts-answers/reading', {
  attempt_id: attemptId,
  answers: [
    { part_id: 'part-1-uuid', question_id: 'q1-uuid', question_number: '1', answer: 'TRUE' },
    { part_id: 'part-1-uuid', question_id: 'q2-uuid', question_number: '2', answer: 'FALSE' },
    { part_id: 'part-1-uuid', question_id: 'q3-uuid', question_number: '3', answer: 'NOT GIVEN' },
    // ... more answers
  ]
});

// Step 2b: User completes Listening section — save answers
await api.post('/ielts-answers/listening', {
  attempt_id: attemptId,
  answers: [
    { part_id: 'lp-1-uuid', question_id: 'q10-uuid', question_number: '1', answer: 'hospital' },
    { part_id: 'lp-1-uuid', question_id: 'q11-uuid', question_number: '2', answer: 'B' },
    // ... more answers
  ]
});

// Step 2c: User completes Writing section — save answers
await api.post('/ielts-answers/writing', {
  attempt_id: attemptId,
  answers: [
    { task_id: 'task-1-uuid', answer_text: 'The chart shows...', word_count: 187 },
    { task_id: 'task-2-uuid', answer_text: 'Many people believe...', word_count: 312 },
  ]
});

// Step 3: User finishes — submit the attempt
await api.patch(`/ielts-answers/attempts/${attemptId}/submit`);
```

### Grading Flow (Teacher/Admin)

```typescript
// Teacher grades a student's writing answer
await api.patch(`/ielts-answers/writing/${writingAnswerId}/grade`, {
  score: {
    task_response: 7.0,
    lexical_resources: 6.5,
    grammar_range_and_accuracy: 6.0,
    coherence_and_cohesion: 6.5
    // overall is auto-calculated: 6.5
  },
  feedback: 'Good structure but vocabulary range could be improved.'
});
```

### Dashboard Data Flow

```typescript
// Get user's statistics for the dashboard
const stats = await api.get('/ielts-answers/statistics');
// stats.data includes: overview, scores, reading, listening, writing, time, recentScores

// Get unfinished tests to show "Continue" buttons
const unfinished = await api.get('/ielts-answers/unfinished');
// unfinished.data includes attempts with progress info

// Teacher dashboard: load students' pending writing grades
const teacherReview = await api.get('/ielts-answers/my-students-attempts-results', {
  params: {
    page: 1,
    limit: 10,
    only_ungraded: true
  }
});
// teacherReview.data includes: writingTasksToGrade (nested by student), totals, pagination

// Teacher: list one student's attempts
const studentAttempts = await api.get(
  '/ielts-answers/my-students/7a25a73c-a62f-4655-8556-df2165a64fbf/attempts',
  {
    params: { page: 1, limit: 10, status: 'SUBMITTED' }
  }
);

// Teacher: get one specific attempt result of that student
const studentAttempt = await api.get(
  '/ielts-answers/my-students/7a25a73c-a62f-4655-8556-df2165a64fbf/attempts/cd7aadec-fc44-4ebd-89a8-3628338448e8'
);
```

### Auto-Save Pattern (Recommended)

Save answers periodically so user progress is not lost:

```typescript
// Save reading answers every time user moves to next part
const saveProgress = async (attemptId: string, answers: ReadingAnswer[]) => {
  await api.post('/ielts-answers/reading', {
    attempt_id: attemptId,
    answers
  });
};

// Answers for same attempt+part are replaced (upserted), so calling
// this multiple times is safe and won't create duplicates
```

### Abandon Flow

If user wants to quit without submitting:

```typescript
await api.patch(`/ielts-answers/attempts/${attemptId}/abandon`);
```

### Retrieve Results

```typescript
// Get full attempt with all answers
const result = await api.get(`/ielts-answers/attempts/${attemptId}`);
// result.data includes: readingAnswers, listeningAnswers, writingAnswers

// Or get answers by section
const readingAnswers = await api.get(`/ielts-answers/reading/${attemptId}`);
const listeningAnswers = await api.get(`/ielts-answers/listening/${attemptId}`);
const writingAnswers = await api.get(`/ielts-answers/writing/${attemptId}`);
```

---

## 6. Error Handling

### Common Errors

| Status | Error | Cause |
|--------|-------|-------|
| `400` | `"No file provided"` | Missing required field |
| `400` | `"Cannot modify answers for an attempt that is submitted"` | Attempt is already submitted |
| `400` | `"Cannot modify answers for an attempt that is abandoned"` | Attempt is already abandoned |
| `400` | `"Attempt is already submitted"` | Trying to submit/abandon a non-IN_PROGRESS attempt |
| `401` | Unauthorized | Missing or invalid JWT token |
| `403` | Forbidden | User doesn't have required role |
| `404` | `"Attempt not found"` | Invalid attempt ID or attempt belongs to another user |
| `404` | `"Writing answer with ID ... not found"` | Invalid writing answer ID (grading) |

### Validation Errors (422)

If request body validation fails, you'll get a response like:

```json
{
  "statusCode": 400,
  "message": [
    "scope must be one of the following values: TEST, MODULE, PART, TASK",
    "attempt_id must be a UUID"
  ],
  "error": "Bad Request"
}
```

### Important Notes

- **User isolation:** Users can only access their own attempts and answers. The `user_id` is always extracted from the JWT — it cannot be set manually.
- **Upsert behavior:** Saving answers for the same `attempt_id` + `part_id` (reading/listening) or `attempt_id` + `task_id` (writing) will **replace** existing answers.
- **Immutable after submit:** Once an attempt is submitted or abandoned, no further answer modifications are allowed.
- **Scope validation:** Provide the correct ID field matching the scope (e.g., `test_id` for scope `TEST`).
- **Writing grading:** Only ADMIN and TEACHER roles can grade writing answers. The `overall` score is auto-calculated from the four criteria if not provided.
- **Score structure:** Writing scores are stored as JSON with individual IELTS criteria (task_response, lexical_resources, grammar_range_and_accuracy, coherence_and_cohesion, overall).
