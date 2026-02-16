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
   - [Reading Answers](#42-reading-answers)
   - [Listening Answers](#43-listening-answers)
   - [Writing Answers](#44-writing-answers)
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
| `score` | Float \| null | Set after grading |
| `feedback` | String \| null | Set after grading |
| `createdAt` | Date | Record creation timestamp |
| `updatedAt` | Date | Record update timestamp |

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

### 4.2 Reading Answers

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

### 4.3 Listening Answers

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

### 4.4 Writing Answers

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
      "word_count": 187
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
    "score": null,
    "feedback": null,
    "task": {
      "id": "writing-task-uuid-1",
      "task_number": 1,
      "task_type": "REPORT"
    }
  }
]
```

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
