# IELTS Test Creation — Full API Documentation

> **Base URL:** `/api` (all endpoints require JWT Bearer Token)  
> **Auth:** All routes require `JwtAuthGuard`. Creation/update/delete requires **ADMIN** or **TEACHER** role.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Model & Relationships](#2-data-model--relationships)
3. [Step-by-Step Test Creation Flow](#3-step-by-step-test-creation-flow)
4. [API Reference](#4-api-reference)
   - [Tests](#41-tests)
   - [Reading](#42-reading)
   - [Reading Parts](#43-reading-parts)
   - [Listening](#44-listening)
   - [Listening Parts](#45-listening-parts)
   - [Writing](#46-writing)
   - [Writing Tasks](#47-writing-tasks)
   - [Questions](#48-questions)
   - [Question Options (Choices)](#49-question-options-choices)
   - [Sub Questions](#410-sub-questions)
   - [Audio](#411-audio)
   - [Answers & Attempts](#412-answers--attempts)
5. [Enums & Constants](#5-enums--constants)
6. [Question Creation by Type — Comprehensive Guide](#6-question-creation-by-type--comprehensive-guide)
7. [Full JSON Examples](#7-full-json-examples)

---

## 1. Architecture Overview

The IELTS Tests module is a **NestJS** module (`IeltsTestsModule`) using **Sequelize** ORM with a hierarchical data structure:

```
IeltsTest (top-level container)
├── IeltsReading (reading module)
│   └── IeltsReadingPart (Part 1/2/3)
│       └── IeltsQuestion (question group)
│           ├── IeltsSubQuestion (individual sub-questions)
│           └── IeltsQuestionOption (choices: A/B/C/D)
├── IeltsListening (listening module)
│   └── IeltsListeningPart (Part 1/2/3/4)
│       ├── IeltsAudio (audio file)
│       └── IeltsQuestion (question group)
│           ├── IeltsSubQuestion (individual sub-questions)
│           └── IeltsQuestionOption (choices: A/B/C/D)
└── IeltsWriting (writing module)
    └── IeltsWritingTask (Task 1/Task 2)
```

### Controllers

| Controller                    | Route Prefix             | Tag                   |
|-------------------------------|--------------------------|-----------------------|
| `IeltsTestsController`       | `/ielts-tests`           | IELTS Tests           |
| `IeltsReadingController`     | `/ielts-reading`         | IELTS Reading         |
| `IeltsReadingPartsController` | `/ielts-reading-parts`  | IELTS Reading Parts   |
| `IeltsListeningController`   | `/ielts-listening`       | IELTS Listening       |
| `IeltsListeningPartsController` | `/ielts-listening-parts` | IELTS Listening Parts |
| `IeltsWritingController`     | `/ielts-writing`         | IELTS Writing         |
| `IeltsQuestionsController`   | `/ielts-questions`       | IELTS Questions       |
| `IeltsQuestionChoicesController` | `/ielts-question-choices` | IELTS Question Choices |
| `IeltsSubQuestionsController` | `/ielts-sub-questions`  | IELTS Sub Questions   |
| `IeltsAnswersController`     | `/ielts-answers`         | IELTS Answers         |

---

## 2. Data Model & Relationships

### `ielts_tests`

| Column       | Type                                        | Required | Default    | Notes                                |
|-------------|---------------------------------------------|----------|------------|--------------------------------------|
| `id`        | UUID                                        | auto     | UUIDv4     | Primary key                          |
| `title`     | STRING                                      | **yes**  |            |                                      |
| `mode`      | ENUM(`practice`, `mock`)                    | **yes**  |            |                                      |
| `status`    | ENUM(`draft`, `published`)                  | no       | `draft`    |                                      |
| `category`  | ENUM(`authentic`, `pre-test`, `cambridge books`) | no  | null       |                                      |
| `created_by`| UUID (FK → users)                           | **yes**  |            | Auto-filled from JWT                 |
| `createdAt` | DATE                                        | auto     |            |                                      |
| `updatedAt` | DATE                                        | auto     |            |                                      |
| `deletedAt` | DATE                                        | auto     |            | Soft delete (paranoid)               |

### `ielts_reading`

| Column     | Type   | Required | Notes                    |
|-----------|--------|----------|--------------------------|
| `id`      | UUID   | auto     | Primary key              |
| `title`   | STRING | **yes**  |                          |
| `test_id` | UUID   | **yes**  | FK → `ielts_tests`      |

### `ielts_reading_parts`

| Column            | Type                                  | Required | Notes                      |
|-------------------|---------------------------------------|----------|----------------------------|
| `id`              | UUID                                  | auto     | Primary key                |
| `reading_id`      | UUID                                  | **yes**  | FK → `ielts_reading`      |
| `part`            | ENUM(`PART_1`, `PART_2`, `PART_3`)   | **yes**  |                            |
| `mode`            | ENUM(`practice`, `mock`)             | **yes**  |                            |
| `title`           | STRING                                | no       |                            |
| `content`         | TEXT (long)                           | no       | The reading passage        |
| `timeLimitMinutes`| INTEGER                               | no       |                            |
| `difficulty`      | ENUM(`EASY`, `MEDIUM`, `HARD`)       | no       |                            |
| `isActive`        | BOOLEAN                               | no       | Default: `true`            |
| `totalQuestions`  | INTEGER                               | no       |                            |

### `ielts_listening`

| Column          | Type         | Required | Notes                    |
|----------------|--------------|----------|--------------------------|
| `id`           | UUID         | auto     | Primary key              |
| `title`        | STRING(200)  | **yes**  |                          |
| `description`  | TEXT         | no       |                          |
| `test_id`      | UUID         | no       | FK → `ielts_tests`      |
| `full_audio_url`| STRING(500) | no       | URL to full audio        |
| `is_active`    | BOOLEAN      | no       | Default: `true`          |

### `ielts_listening_parts`

| Column            | Type                                            | Required | Notes                        |
|-------------------|-------------------------------------------------|----------|------------------------------|
| `id`              | UUID                                            | auto     | Primary key                  |
| `listening_id`    | UUID                                            | **yes**  | FK → `ielts_listening`      |
| `part`            | ENUM(`PART_1`, `PART_2`, `PART_3`, `PART_4`)  | **yes**  |                              |
| `mode`            | ENUM(`practice`, `mock`)                        | **yes**  |                              |
| `title`           | STRING                                          | no       |                              |
| `audio_id`        | UUID                                            | no       | FK → `ielts_audio`          |
| `timeLimitMinutes`| INTEGER                                         | no       |                              |
| `difficulty`      | ENUM(`EASY`, `MEDIUM`, `HARD`)                 | no       |                              |
| `isActive`        | BOOLEAN                                         | no       | Default: `true`              |
| `totalQuestions`  | INTEGER                                         | no       |                              |

### `ielts_writing`

| Column       | Type         | Required | Notes                    |
|-------------|--------------|----------|--------------------------|
| `id`        | UUID         | auto     | Primary key              |
| `title`     | STRING(200)  | no       |                          |
| `description`| TEXT        | no       |                          |
| `test_id`   | UUID         | no       | FK → `ielts_tests`      |
| `is_active` | BOOLEAN      | no       | Default: `true`          |

### `ielts_writing_tasks`

| Column          | Type                           | Required | Notes                      |
|----------------|--------------------------------|----------|----------------------------|
| `id`           | UUID                           | auto     | Primary key                |
| `writing_id`   | UUID                           | **yes**  | FK → `ielts_writing`      |
| `task`         | ENUM(`TASK_1`, `TASK_2`)      | **yes**  |                            |
| `mode`         | ENUM(`practice`, `mock`)      | **yes**  |                            |
| `prompt`       | TEXT (long)                    | no       | The writing prompt         |
| `image_url`    | STRING                         | no       | Chart/graph image          |
| `min_words`    | INTEGER                        | no       | e.g., 150 or 250           |
| `suggested_time`| INTEGER                       | no       | Minutes                    |

### `ielts_questions`

| Column            | Type           | Required | Notes                                     |
|-------------------|----------------|----------|-------------------------------------------|
| `id`              | UUID           | auto     | Primary key                               |
| `reading_part_id` | UUID           | no       | FK → `ielts_reading_parts`               |
| `listening_part_id`| UUID          | no       | FK → `ielts_listening_parts`             |
| `questionNumber`  | INTEGER        | no       | Display number                            |
| `type`            | ENUM (16 types)| no       | See [Question Types](#question-types)     |
| `questionText`    | TEXT (long)    | no       | HTML content supported                    |
| `instruction`     | TEXT (long)    | no       | e.g., "Write ONE WORD ONLY"              |
| `context`         | TEXT           | no       |                                           |
| `headingOptions`  | JSON           | no       | For MATCHING_HEADINGS type               |
| `tableData`       | JSON           | no       | For TABLE_COMPLETION type                |
| `points`          | INTEGER        | no       |                                           |
| `isActive`        | BOOLEAN        | no       | Default: `true`                           |
| `explanation`     | TEXT (long)    | no       |                                           |
| `fromPassage`     | TEXT           | no       | Passage reference                         |

### `ielts_question_options`

| Column        | Type      | Required | Notes                         |
|--------------|-----------|----------|-------------------------------|
| `id`         | UUID      | auto     | Primary key                   |
| `question_id`| UUID     | **yes**  | FK → `ielts_questions`       |
| `optionKey`  | STRING    | no       | e.g., "A", "B", "C"         |
| `optionText` | TEXT      | no       |                               |
| `isCorrect`  | BOOLEAN   | no       | Default: `false`             |
| `orderIndex` | INTEGER   | no       |                               |
| `explanation`| TEXT(long)| no       |                               |
| `fromPassage`| TEXT      | no       |                               |

### `ielts_sub_questions` (Sub Questions)

| Column         | Type          | Required | Notes                       |
|---------------|---------------|----------|-----------------------------|
| `id`          | UUID          | auto     | Primary key                 |
| `question_id` | UUID          | **yes**  | FK → `ielts_questions`     |
| `questionNumber`| INTEGER     | no       |                             |
| `questionText`| TEXT          | no       |                             |
| `points`      | DECIMAL(6,2)  | no       | Default: 1                  |
| `correctAnswer`| STRING       | no       | The correct answer text     |
| `explanation` | TEXT (long)   | no       |                             |
| `fromPassage` | TEXT          | no       |                             |
| `order`       | INTEGER       | no       | Display order               |

### `ielts_audio`

| Column      | Type         | Required | Notes                    |
|------------|--------------|----------|--------------------------|
| `id`       | UUID         | auto     | Primary key              |
| `url`      | STRING(500)  | **yes**  | Audio file URL           |
| `file_name`| STRING(255)  | no       |                          |
| `duration` | INTEGER      | no       | Duration in seconds      |

---

## 3. Step-by-Step Test Creation Flow

Creating a complete IELTS test requires building the hierarchy from top to bottom. Here is the recommended order:

### Phase 1: Create the Test Shell

```
Step 1: POST /ielts-tests → Creates an IeltsTest (returns test_id)
```

### Phase 2: Create Modules (Reading / Listening / Writing)

```
Step 2a: POST /ielts-reading      → Creates IeltsReading      (needs test_id, returns reading_id)
Step 2b: POST /ielts-listening     → Creates IeltsListening     (needs test_id, returns listening_id)
Step 2c: POST /ielts-writing       → Creates IeltsWriting       (needs test_id, returns writing_id)
```

### Phase 3: Create Parts / Tasks

```
Step 3a: POST /ielts-reading-parts   → Creates IeltsReadingPart   (needs reading_id, up to 3 parts)
         ⤷ Can include nested questions (with sub-questions & options) in a single request!
         
Step 3b: POST /ielts-listening-parts  → Creates IeltsListeningPart  (needs listening_id, up to 4 parts)
         ⤷ Can include nested audio + questions in a single request!
         
Step 3c: POST /ielts-writing/task     → Creates IeltsWritingTask    (needs writing_id, Task 1 & Task 2)
```

### Phase 4: Create Questions (if not nested in Phase 3)

```
Step 4a: POST /ielts-questions          → Creates IeltsQuestion     (needs reading_part_id OR listening_part_id)
Step 4b: POST /ielts-question-choices   → Creates IeltsQuestionOption (needs question_id)
Step 4c: POST /ielts-sub-questions      → Creates IeltsSubQuestion   (needs question_id)
```

### Phase 5: Publish the Test

```
Step 5: PATCH /ielts-tests/:id → Update status from "draft" to "published"
```

### Visual Flow

```
┌─────────────────────────────────────────────────────────┐
│                    CREATE TEST                          │
│              POST /ielts-tests                          │
│         { title, mode, category? }                      │
│                  ↓ returns test_id                       │
├─────────┬──────────────┬────────────────────────────────┤
│ READING │  LISTENING   │     WRITING                    │
├─────────┼──────────────┼────────────────────────────────┤
│ POST    │ POST         │ POST                           │
│ /ielts- │ /ielts-      │ /ielts-writing                 │
│ reading │ listening    │ { title?, test_id }            │
│ {title, │ {title,      │     ↓ writing_id               │
│ test_id}│ test_id}     │                                │
│  ↓      │  ↓           │ POST /ielts-writing/task       │
│         │              │ {writing_id, task, prompt,     │
│         │              │  image_url?, min_words?}       │
├─────────┼──────────────┼────────────────────────────────┤
│ 3 Parts │ 4 Parts      │ 2 Tasks (TASK_1, TASK_2)      │
│ POST    │ POST         │                                │
│ /ielts- │ /ielts-      │                                │
│ reading-│ listening-   │                                │
│ parts   │ parts        │                                │
│ (with   │ (with audio  │                                │
│  nested │  + nested    │                                │
│  Qs)    │  Qs)         │                                │
├─────────┴──────────────┴────────────────────────────────┤
│              PUBLISH TEST                               │
│        PATCH /ielts-tests/:id                           │
│         { status: "published" }                         │
└─────────────────────────────────────────────────────────┘
```

---

## 4. API Reference

All endpoints require the `Authorization: Bearer <token>` header.

---

### 4.1 Tests

#### Create a Test
```
POST /ielts-tests
Roles: ADMIN, TEACHER
```

**Request Body:**
```json
{
  "title": "Cambridge IELTS 18 Academic Test 1",
  "mode": "mock",
  "status": "draft",
  "category": "cambridge books"
}
```

| Field      | Type   | Required | Values                                       |
|-----------|--------|----------|----------------------------------------------|
| `title`   | string | **yes**  |                                              |
| `mode`    | string | **yes**  | `practice`, `mock`                           |
| `status`  | string | no       | `draft` (default), `published`               |
| `category`| string | no       | `authentic`, `pre-test`, `cambridge books`   |

> `created_by` is automatically set from the JWT token.

#### Get All Tests
```
GET /ielts-tests
Roles: ADMIN, TEACHER, STUDENT
```

**Query Parameters:**

| Param      | Type   | Default | Description                          |
|-----------|--------|---------|--------------------------------------|
| `page`    | number | 1       | Page number (min: 1)                 |
| `limit`   | number | 10      | Items per page (1–100)               |
| `search`  | string |         | Search by title                      |
| `mode`    | string |         | Filter: `practice` or `mock`        |
| `status`  | string |         | Filter: `draft` or `published`      |
| `category`| string |         | Filter by category                   |

**Response:**
```json
{
  "data": [ { /* IeltsTest with creator */ } ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

#### Get Test by ID
```
GET /ielts-tests/:id
Roles: ADMIN, TEACHER, STUDENT
```

Returns the test with its `creator` relation.

#### Update a Test
```
PATCH /ielts-tests/:id
Roles: ADMIN, TEACHER
```

**Request Body** (all fields optional):
```json
{
  "title": "Updated Title",
  "mode": "mock",
  "status": "published",
  "category": "authentic"
}
```

#### Delete a Test
```
DELETE /ielts-tests/:id
Roles: ADMIN, TEACHER
Status: 204 No Content
```

Performs a **soft delete** (paranoid mode).

---

### 4.2 Reading

#### Create a Reading Section
```
POST /ielts-reading
Roles: ADMIN, TEACHER
```

```json
{
  "title": "Academic Reading",
  "test_id": "uuid-of-test"
}
```

| Field     | Type   | Required |
|----------|--------|----------|
| `title`  | string | **yes**  |
| `test_id`| UUID   | **yes**  |

#### Get All Readings
```
GET /ielts-reading
Roles: ADMIN, TEACHER, STUDENT
```

| Param    | Type   | Description                     |
|---------|--------|---------------------------------|
| `page`  | number | Page number                     |
| `limit` | number | Items per page                  |
| `search`| string | Search by title                 |
| `testId`| string | Filter by test ID               |
| `mode`  | string | Filter by test mode             |
| `part`  | string | Filter by part (PART_1/2/3)     |

#### Get Reading by ID
```
GET /ielts-reading/:id
Roles: ADMIN, TEACHER, STUDENT
```

Returns reading with full nested structure:
- `test` — parent test
- `parts[]` → `questions[]` → `questions[]` (sub-questions) + `options[]`

#### Update a Reading
```
PATCH /ielts-reading/:id
Roles: ADMIN, TEACHER
```

#### Delete a Reading
```
DELETE /ielts-reading/:id
Roles: ADMIN
Status: 204 No Content
```

---

### 4.3 Reading Parts

#### Create a Reading Part (with nested questions)
```
POST /ielts-reading-parts
Roles: ADMIN, TEACHER
```

This is the most powerful endpoint — it supports **deeply nested creation** of the reading part along with all its questions, sub-questions, and options in a **single request**.

```json
{
  "reading_id": "uuid-of-reading",
  "part": "PART_1",
  "mode": "mock",
  "title": "Georgia O'Keeffe",
  "content": "<p>For seven decades, Georgia O'Keeffe (1887-1986) was a major figure...</p>",
  "timeLimitMinutes": 20,
  "difficulty": "MEDIUM",
  "isActive": true,
  "totalQuestions": 13,
  "questions": [
    {
      "questionNumber": 1,
      "type": "TRUE_FALSE_NOT_GIVEN",
      "questionText": "",
      "instruction": "Do the following statements agree with the information given in the text?",
      "points": 7,
      "questions": [
        {
          "questionNumber": 1,
          "questionText": "Georgia O'Keeffe's style was greatly influenced by the changing fashions in art.",
          "correctAnswer": "FALSE",
          "points": 1,
          "explanation": "The passage states she developed her own unique style...",
          "fromPassage": "Paragraph 1",
          "order": 1
        },
        {
          "questionNumber": 2,
          "questionText": "O'Keeffe first, studied art in Chicago.",
          "correctAnswer": "TRUE",
          "points": 1,
          "order": 2
        }
      ]
    },
    {
      "questionNumber": 8,
      "type": "MATCHING_HEADINGS",
      "instruction": "Choose the correct heading for each paragraph.",
      "headingOptions": {
        "A": "The influence of nature",
        "B": "Financial success",
        "C": "Early career struggles"
      },
      "points": 5,
      "options": [
        { "optionKey": "A", "optionText": "The influence of nature", "isCorrect": false, "orderIndex": 0 },
        { "optionKey": "B", "optionText": "Financial success", "isCorrect": true, "orderIndex": 1 }
      ]
    },
    {
      "questionNumber": 12,
      "type": "MULTIPLE_CHOICE",
      "questionText": "What does the writer say about O'Keeffe's paintings?",
      "instruction": "Choose the correct letter, A, B, C or D.",
      "points": 1,
      "options": [
        { "optionKey": "A", "optionText": "They were popular from the start.", "isCorrect": false, "orderIndex": 0 },
        { "optionKey": "B", "optionText": "They reflected her love of city life.", "isCorrect": false, "orderIndex": 1 },
        { "optionKey": "C", "optionText": "They were inspired by the American landscape.", "isCorrect": true, "orderIndex": 2 },
        { "optionKey": "D", "optionText": "They were controversial among critics.", "isCorrect": false, "orderIndex": 3 }
      ]
    }
  ]
}
```

| Field              | Type     | Required | Description                            |
|-------------------|----------|----------|----------------------------------------|
| `reading_id`      | UUID     | **yes**  | FK to the reading section              |
| `part`            | string   | **yes**  | `PART_1`, `PART_2`, `PART_3`          |
| `mode`            | string   | **yes**  | `practice` or `mock`                   |
| `title`           | string   | no       | Part title/passage name               |
| `content`         | string   | no       | Full reading passage (HTML supported)  |
| `timeLimitMinutes`| integer  | no       | Time limit in minutes                  |
| `difficulty`      | string   | no       | `EASY`, `MEDIUM`, `HARD`              |
| `isActive`        | boolean  | no       | Default: `true`                        |
| `totalQuestions`  | integer  | no       | Total question count                   |
| `questions[]`     | array    | no       | Nested question groups (see below)     |

**Nested Question Object:**

| Field            | Type    | Description                                  |
|-----------------|---------|----------------------------------------------|
| `questionNumber`| integer | Question/group number                        |
| `type`          | string  | One of 16 question types (see enums)         |
| `questionText`  | string  | HTML content for the question                |
| `instruction`   | string  | Instructions for the student                 |
| `context`       | string  | Additional context                           |
| `headingOptions`| object  | JSON for matching headings                   |
| `tableData`     | object  | JSON for table completion                    |
| `points`        | integer | Total points for this group                  |
| `isActive`      | boolean | Default: `true`                              |
| `explanation`   | string  | Explanation                                  |
| `fromPassage`   | string  | Passage reference                            |
| `questions[]`   | array   | Nested sub-questions (see below)             |
| `options[]`     | array   | Nested options/choices (see below)           |

**Nested Sub-Question:**

| Field           | Type    | Description               |
|----------------|---------|---------------------------|
| `questionNumber`| integer| Sub-question number       |
| `questionText` | string  | Question text             |
| `points`       | number  | Points (default: 1)      |
| `correctAnswer`| string  | The correct answer        |
| `explanation`  | string  | Explanation               |
| `fromPassage`  | string  | Passage reference         |
| `order`        | integer | Display order             |

**Nested Option:**

| Field        | Type    | Description                 |
|-------------|---------|------------------------------|
| `optionKey` | string  | e.g., "A", "B", "C", "D"   |
| `optionText`| string  | Option text                  |
| `isCorrect` | boolean | Whether it's the right answer|
| `orderIndex`| integer | Display order                |
| `explanation`| string | Explanation                  |
| `fromPassage`| string | Passage reference            |

#### Get All Reading Parts
```
GET /ielts-reading-parts
```

| Param       | Type   | Description                  |
|------------|--------|------------------------------|
| `readingId`| string | Filter by reading ID         |
| `part`     | string | Filter by part number        |
| `mode`     | string | Filter by mode (`practice`, `mock`) |

#### Get / Update / Delete Reading Part
```
GET    /ielts-reading-parts/:id
PATCH  /ielts-reading-parts/:id   (ADMIN, TEACHER)
DELETE /ielts-reading-parts/:id   (ADMIN, TEACHER) → 204
```

---

### 4.4 Listening

#### Create a Listening Section
```
POST /ielts-listening
Roles: ADMIN, TEACHER
```

```json
{
  "title": "Academic Listening Test 1",
  "description": "Cambridge IELTS 18 Listening",
  "test_id": "uuid-of-test",
  "full_audio_url": "https://cdn.example.com/audio/full-listening.mp3",
  "is_active": true
}
```

| Field           | Type    | Required | Description                |
|----------------|---------|----------|----------------------------|
| `title`        | string  | **yes**  |                            |
| `description`  | string  | no       |                            |
| `test_id`      | UUID    | no       | FK to the test             |
| `full_audio_url`| string | no       | URL to full audio          |
| `is_active`    | boolean | no       | Default: `true`            |

#### Get All Listenings
```
GET /ielts-listening
```

| Param     | Type    | Description              |
|----------|---------|--------------------------|
| `testId` | string  | Filter by test ID        |
| `isActive`| boolean| Filter by active status  |
| `mode`   | string  | Filter by test mode      |

#### Get Listening by ID
```
GET /ielts-listening/:id
```

Returns listening with full nested structure:
- `test` → parent test
- `parts[]` → `audio` + `questions[]` → `questions[]` (sub-questions) + `options[]`

#### Delete a Listening Section
```
DELETE /ielts-listening/:id
Roles: ADMIN
Status: 204 No Content
```

---

### 4.5 Listening Parts

#### Create a Listening Part (with nested audio & questions)
```
POST /ielts-listening-parts
Roles: ADMIN, TEACHER
```

Supports nested creation of audio + questions in a single request:

```json
{
  "listening_id": "uuid-of-listening",
  "part": "PART_1",
  "mode": "mock",
  "title": "A conversation about booking a hotel room",
  "audio": {
    "url": "https://cdn.example.com/audio/part1.mp3",
    "file_name": "part1.mp3",
    "duration": 300
  },
  "timeLimitMinutes": 10,
  "difficulty": "EASY",
  "isActive": true,
  "totalQuestions": 10,
  "questions": [
    {
      "questionNumber": 1,
      "type": "NOTE_COMPLETION",
      "instruction": "Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER.",
      "questionText": "<h3>Hotel Booking</h3><p>Name: ____</p>",
      "points": 5,
      "questions": [
        {
          "questionNumber": 1,
          "questionText": "Name: ____",
          "correctAnswer": "Karelson",
          "points": 1,
          "order": 1
        },
        {
          "questionNumber": 2,
          "questionText": "Room type: ____",
          "correctAnswer": "double",
          "points": 1,
          "order": 2
        }
      ]
    },
    {
      "questionNumber": 6,
      "type": "MULTIPLE_CHOICE",
      "instruction": "Choose the correct letter, A, B or C.",
      "questionText": "What time does the hotel restaurant close?",
      "points": 1,
      "options": [
        { "optionKey": "A", "optionText": "9 PM", "isCorrect": false, "orderIndex": 0 },
        { "optionKey": "B", "optionText": "10 PM", "isCorrect": true, "orderIndex": 1 },
        { "optionKey": "C", "optionText": "11 PM", "isCorrect": false, "orderIndex": 2 }
      ]
    }
  ]
}
```

| Field              | Type    | Required | Description                                    |
|-------------------|---------|----------|------------------------------------------------|
| `listening_id`    | UUID    | **yes**  | FK to the listening section                    |
| `part`            | string  | **yes**  | `PART_1`, `PART_2`, `PART_3`, `PART_4`       |
| `mode`            | string  | **yes**  | `practice` or `mock`                           |
| `title`           | string  | no       |                                                |
| `audio_id`        | UUID    | no       | Existing audio ID (alternative to `audio`)     |
| `audio`           | object  | no       | Create new audio inline (`url`, `file_name`, `duration`) |
| `timeLimitMinutes`| integer | no       |                                                |
| `difficulty`      | string  | no       | `EASY`, `MEDIUM`, `HARD`                      |
| `isActive`        | boolean | no       | Default: `true`                                |
| `totalQuestions`  | integer | no       |                                                |
| `questions[]`     | array   | no       | Same nested structure as reading parts         |

#### Get All / Get by ID / Update / Delete Listening Parts
```
GET    /ielts-listening-parts             (query: listeningId, part, mode)
GET    /ielts-listening-parts/:id
PATCH  /ielts-listening-parts/:id         (ADMIN, TEACHER)
DELETE /ielts-listening-parts/:id         (ADMIN, TEACHER) → 204
```

---

### 4.6 Writing

#### Create a Writing Section
```
POST /ielts-writing
Roles: ADMIN, TEACHER
```

```json
{
  "title": "IELTS Academic Writing",
  "description": "Writing module for Test 1",
  "test_id": "uuid-of-test",
  "is_active": true
}
```

#### Get All / Get by ID
```
GET /ielts-writing                  (query: testId, isActive, mode)
GET /ielts-writing/:id              → returns writing + tasks[]
```

#### Update a Writing Section
```
PATCH /ielts-writing/:id
Roles: ADMIN, TEACHER
```

**Request Body** (all fields optional):
```json
{
  "title": "Updated Writing Title",
  "description": "Updated description",
  "is_active": false
}
```

#### Delete a Writing Section
```
DELETE /ielts-writing/:id
Roles: ADMIN
Status: 204 No Content
```

---

### 4.7 Writing Tasks

#### Create a Writing Task
```
POST /ielts-writing/task
Roles: ADMIN, TEACHER
```

```json
{
  "writing_id": "uuid-of-writing",
  "task": "TASK_1",
  "mode": "mock",
  "prompt": "The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
  "image_url": "https://cdn.example.com/images/chart-task1.png",
  "min_words": 150,
  "suggested_time": 20
}
```

| Field           | Type    | Required | Description                              |
|----------------|---------|----------|------------------------------------------|
| `writing_id`   | UUID    | **yes**  | FK to the writing section                |
| `task`         | string  | **yes**  | `TASK_1` or `TASK_2`                    |
| `mode`         | string  | **yes**  | `practice` or `mock`                     |
| `prompt`       | string  | no       | The writing prompt (HTML supported)      |
| `image_url`    | string  | no       | URL to chart/graph/diagram image         |
| `min_words`    | integer | no       | Minimum word count (150 for T1, 250 T2)  |
| `suggested_time`| integer| no       | Suggested time in minutes (20 for T1, 40 T2) |

#### Get Writing Task by ID
```
GET /ielts-writing/task/:id
```

#### Get All Writing Tasks
```
GET /ielts-writing/tasks
Roles: ADMIN, TEACHER, STUDENT
```

| Param       | Type   | Description                     |
|------------|--------|---------------------------------|
| `page`     | number | Page number                     |
| `limit`    | number | Items per page                  |
| `search`   | string | Search by prompt text           |
| `writingId`| string | Filter by writing ID            |
| `task`     | string | Filter by task type (`TASK_1`, `TASK_2`) |
| `mode`     | string | Filter by mode (`practice`, `mock`) |

#### Update a Writing Task
```
PATCH /ielts-writing/task/:id
Roles: ADMIN, TEACHER
```

**Request Body** (all fields optional):
```json
{
  "prompt": "Updated prompt text...",
  "image_url": "https://cdn.example.com/images/updated-chart.png",
  "min_words": 250,
  "suggested_time": 40
}
```

#### Delete a Writing Task
```
DELETE /ielts-writing/task/:id
Roles: ADMIN
Status: 204 No Content
```

---

### 4.8 Questions

Standalone question CRUD (use when not nesting in reading/listening parts).

#### Create a Question
```
POST /ielts-questions          (or POST /ielts-tests/question)
Roles: ADMIN, TEACHER
```

```json
{
  "reading_part_id": "uuid-of-reading-part",
  "questionNumber": 1,
  "type": "TRUE_FALSE_NOT_GIVEN",
  "questionText": "",
  "instruction": "Do the following statements agree with the information given in the text?",
  "points": 7,
  "isActive": true
}
```

#### Get All Questions
```
GET /ielts-questions
```

| Param            | Type   | Description              |
|-----------------|--------|--------------------------|
| `readingPartId` | string | Filter by reading part   |
| `listeningPartId`| string| Filter by listening part |

#### Get / Update / Delete
```
GET    /ielts-questions/:id
PATCH  /ielts-questions/:id     (ADMIN, TEACHER)
DELETE /ielts-questions/:id     (ADMIN, TEACHER) → 204
```

---

### 4.9 Question Options (Choices)

#### Create a Question Option
```
POST /ielts-question-choices
Roles: ADMIN, TEACHER
```

```json
{
  "question_id": "uuid-of-question",
  "optionKey": "A",
  "optionText": "The library",
  "isCorrect": false,
  "orderIndex": 0,
  "explanation": "This is not mentioned in the text.",
  "fromPassage": "Paragraph 3"
}
```

#### Get All / Get / Update / Delete
```
GET    /ielts-question-choices           (query: questionId)
GET    /ielts-question-choices/:id
PATCH  /ielts-question-choices/:id       (ADMIN, TEACHER)
DELETE /ielts-question-choices/:id       (ADMIN, TEACHER) → 204
```

---

### 4.10 Sub Questions

#### Create a Sub Question
```
POST /ielts-sub-questions       (or POST /ielts-tests/sub-question)
Roles: ADMIN, TEACHER
```

```json
{
  "question_id": "uuid-of-parent-question",
  "questionNumber": 1,
  "questionText": "Georgia O'Keeffe's style was greatly influenced by the changing fashions in art.",
  "points": 1,
  "correctAnswer": "FALSE",
  "explanation": "The passage states she developed her own unique style...",
  "fromPassage": "Paragraph 1, lines 3-5",
  "order": 1
}
```

#### Get All / Get / Update / Delete
```
GET    /ielts-sub-questions              (query: questionId)
GET    /ielts-sub-questions/:id
PATCH  /ielts-sub-questions/:id          (ADMIN, TEACHER)
DELETE /ielts-sub-questions/:id          (ADMIN, TEACHER) → 204
```

---

### 4.11 Audio

#### Create Audio
```
POST /ielts-tests/audio
Roles: ADMIN, TEACHER
```

```json
{
  "url": "https://cdn.example.com/audio/listening-part1.mp3",
  "file_name": "listening-part1.mp3",
  "duration": 300
}
```

#### Get All / Get by ID
```
GET /ielts-tests/audio
GET /ielts-tests/audio/:id
```

---

### 4.12 Answers & Attempts

#### Create an Attempt
```
POST /ielts-answers/attempts
Roles: ADMIN, TEACHER, STUDENT
```

```json
{
  "scope": "TEST",
  "test_id": "uuid-of-test"
}
```

| Field      | Type   | Required | Description                                |
|-----------|--------|----------|--------------------------------------------|
| `scope`   | string | **yes**  | `TEST`, `MODULE`, `PART`, `TASK`          |
| `test_id` | UUID   | no       | Required when scope is `TEST`              |
| `module_id`| UUID  | no       | Required when scope is `MODULE`            |
| `part_id` | UUID   | no       | Required when scope is `PART`              |
| `task_id` | UUID   | no       | Required when scope is `TASK`              |

#### Get All Attempts
```
GET /ielts-answers/attempts     (query: page, limit, test_id, scope, status)
```

#### Get Attempt by ID
```
GET /ielts-answers/attempts/:id
```

Returns attempt with related `readingAnswers`, `listeningAnswers`, `writingAnswers`.

#### Submit / Abandon Attempt
```
PATCH /ielts-answers/attempts/:id/submit
PATCH /ielts-answers/attempts/:id/abandon
```

#### Save Reading Answers
```
POST /ielts-answers/reading
```

```json
{
  "attempt_id": "uuid-of-attempt",
  "answers": [
    {
      "part_id": "uuid-of-reading-part",
      "question_id": "uuid-of-question",
      "question_number": "1",
      "answer": "TRUE"
    },
    {
      "part_id": "uuid-of-reading-part",
      "question_id": "uuid-of-question",
      "question_number": "2",
      "answer": "FALSE"
    }
  ]
}
```

#### Save Listening Answers
```
POST /ielts-answers/listening
```

Same structure as reading answers (with listening `part_id`).

#### Save Writing Answers
```
POST /ielts-answers/writing
```

```json
{
  "attempt_id": "uuid-of-attempt",
  "answers": [
    {
      "task_id": "uuid-of-writing-task",
      "answer_text": "The bar chart illustrates the percentage of...",
      "word_count": 187
    }
  ]
}
```

#### Get Answers
```
GET /ielts-answers/reading/:attemptId
GET /ielts-answers/listening/:attemptId
GET /ielts-answers/writing/:attemptId
```

---

## 5. Enums & Constants

### Test Mode
| Value      | Description                |
|-----------|----------------------------|
| `practice`| Practice mode              |
| `mock`    | Full mock exam             |

### Test Status
| Value       | Description              |
|------------|--------------------------|
| `draft`    | Not visible to students  |
| `published`| Visible and accessible   |

### Test Category
| Value             | Description              |
|------------------|--------------------------|
| `authentic`      | Official-style tests     |
| `pre-test`       | Pre-assessment tests     |
| `cambridge books`| Cambridge book tests     |

### Reading Parts
`PART_1`, `PART_2`, `PART_3`

### Listening Parts
`PART_1`, `PART_2`, `PART_3`, `PART_4`

### Writing Tasks
`TASK_1`, `TASK_2`

### Difficulty Level
`EASY`, `MEDIUM`, `HARD`

### Question Types
| Type                          | Description                                    |
|-------------------------------|------------------------------------------------|
| `NOTE_COMPLETION`             | Complete notes with words from text            |
| `TRUE_FALSE_NOT_GIVEN`        | Statements: True / False / Not Given           |
| `YES_NO_NOT_GIVEN`            | Statements: Yes / No / Not Given               |
| `MATCHING_INFORMATION`        | Match information to paragraphs                |
| `MATCHING_HEADINGS`           | Match headings to paragraphs                   |
| `SUMMARY_COMPLETION`          | Complete a summary (text input)                |
| `SUMMARY_COMPLETION_DRAG_DROP`| Complete a summary (drag & drop)               |
| `MULTIPLE_CHOICE`             | Choose from A/B/C/D options                    |
| `SENTENCE_COMPLETION`         | Complete sentences                             |
| `SHORT_ANSWER`                | Write a short answer                           |
| `TABLE_COMPLETION`            | Complete a table                               |
| `FLOW_CHART_COMPLETION`       | Complete a flow chart                          |
| `DIAGRAM_LABELLING`           | Label a diagram                                |
| `MATCHING_FEATURES`           | Match features to categories                   |
| `MATCHING_SENTENCE_ENDINGS`   | Match sentence beginnings to endings           |
| `PLAN_MAP_LABELLING`          | Label a plan or map                            |
| `MULTIPLE_ANSWER`             | Choose multiple correct answers from a list    |

### Attempt Scope
| Value    | Description              |
|---------|--------------------------|
| `TEST`  | Full test attempt        |
| `MODULE`| Single module attempt    |
| `PART`  | Single part attempt      |
| `TASK`  | Single task attempt      |

### Attempt Status
| Value         | Description              |
|--------------|--------------------------|
| `IN_PROGRESS`| Currently answering      |
| `SUBMITTED`  | Answers submitted        |
| `ABANDONED`  | Attempt was abandoned    |

---

## 6. Question Creation by Type — Comprehensive Guide

This section provides **complete, copy-paste-ready JSON** for every question type. Each example shows:
- Which fields are **required** vs optional
- Whether the type uses **sub-questions** (`questions[]`), **options** (`options[]`), or **both**
- The correct `instruction` text per IELTS standards
- How the UI should render each type

### Quick Reference: Type → Data Structure

| Type | Sub-Questions | Options | Special Fields | Correct Answer Location |
|------|:---:|:---:|---|---|
| `TRUE_FALSE_NOT_GIVEN` | ✅ | ❌ | — | `sub.correctAnswer` = `TRUE` / `FALSE` / `NOT GIVEN` |
| `YES_NO_NOT_GIVEN` | ✅ | ❌ | — | `sub.correctAnswer` = `YES` / `NO` / `NOT GIVEN` |
| `MULTIPLE_CHOICE` | ❌ | ✅ | — | `option.isCorrect = true` |
| `NOTE_COMPLETION` | ✅ | ❌ | — | `sub.correctAnswer` = text |
| `SENTENCE_COMPLETION` | ✅ | ❌ | — | `sub.correctAnswer` = text |
| `SUMMARY_COMPLETION` | ✅ | ❌ | — | `sub.correctAnswer` = text |
| `SUMMARY_COMPLETION_DRAG_DROP` | ✅ | ✅ | — | `sub.correctAnswer` = option key |
| `SHORT_ANSWER` | ✅ | ❌ | — | `sub.correctAnswer` = text |
| `TABLE_COMPLETION` | ✅ | ❌ | `tableData` (JSON) | `sub.correctAnswer` = text |
| `FLOW_CHART_COMPLETION` | ✅ | ❌ | — | `sub.correctAnswer` = text |
| `MATCHING_HEADINGS` | ✅ | ❌ | `headingOptions` (JSON) | `sub.correctAnswer` = heading key |
| `MATCHING_INFORMATION` | ✅ | ❌ | — | `sub.correctAnswer` = paragraph letter |
| `MATCHING_FEATURES` | ✅ | ✅ | — | `sub.correctAnswer` = option key |
| `MATCHING_SENTENCE_ENDINGS` | ✅ | ✅ | — | `sub.correctAnswer` = option key |
| `DIAGRAM_LABELLING` | ✅ | ❌ | — | `sub.correctAnswer` = text |
| `PLAN_MAP_LABELLING` | ✅ | ✅ | — | `sub.correctAnswer` = option key |
| `MULTIPLE_ANSWER` | ✅ | ✅ | — | `option.isCorrect = true` (multiple) |

> **UI Rule:** If a type has `options[]`, render selectable choices. If it has only `questions[]` (sub-questions), render text input fields. If it has both, render a drag-drop or select-from-list interface.

---

### 6.1 TRUE_FALSE_NOT_GIVEN

**Uses:** Sub-questions only  
**Correct answers:** `TRUE`, `FALSE`, or `NOT GIVEN`  
**UI:** Show statement + 3 radio buttons (True / False / Not Given)

```json
{
  "reading_part_id": "uuid-of-reading-part",
  "questionNumber": 1,
  "type": "TRUE_FALSE_NOT_GIVEN",
  "instruction": "Do the following statements agree with the information given in the passage? Write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, NOT GIVEN if there is no information on this.",
  "points": 5,
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "The research was conducted over a five-year period.",
      "correctAnswer": "TRUE",
      "points": 1,
      "explanation": "Paragraph 2 states 'the study spanned five years'.",
      "fromPassage": "Paragraph 2",
      "order": 1
    },
    {
      "questionNumber": 2,
      "questionText": "All participants were university students.",
      "correctAnswer": "FALSE",
      "points": 1,
      "explanation": "The passage mentions participants from various backgrounds.",
      "fromPassage": "Paragraph 3",
      "order": 2
    },
    {
      "questionNumber": 3,
      "questionText": "The results were published in a medical journal.",
      "correctAnswer": "NOT GIVEN",
      "points": 1,
      "order": 3
    }
  ]
}
```

**Required fields for UI form:**
| Field | Required | Notes |
|---|---|---|
| `type` | ✅ | `TRUE_FALSE_NOT_GIVEN` |
| `instruction` | ✅ | Standard IELTS instruction |
| `points` | ✅ | Total points for the group |
| `questions[].questionText` | ✅ | The statement to evaluate |
| `questions[].correctAnswer` | ✅ | Must be `TRUE`, `FALSE`, or `NOT GIVEN` |
| `questions[].order` | ✅ | Display order |

---

### 6.2 YES_NO_NOT_GIVEN

**Uses:** Sub-questions only  
**Correct answers:** `YES`, `NO`, or `NOT GIVEN`  
**UI:** Show statement + 3 radio buttons (Yes / No / Not Given)

```json
{
  "reading_part_id": "uuid-of-reading-part",
  "questionNumber": 1,
  "type": "YES_NO_NOT_GIVEN",
  "instruction": "Do the following statements agree with the views of the writer? Write YES if the statement agrees with the views of the writer, NO if the statement contradicts the views of the writer, NOT GIVEN if it is impossible to say what the writer thinks about this.",
  "points": 4,
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "The author believes social media has improved communication.",
      "correctAnswer": "NO",
      "points": 1,
      "order": 1
    },
    {
      "questionNumber": 2,
      "questionText": "Technology should be regulated more strictly.",
      "correctAnswer": "YES",
      "points": 1,
      "order": 2
    }
  ]
}
```

> **UI Note:** Identical interface to TRUE_FALSE_NOT_GIVEN but the labels change to Yes / No / Not Given.

---

### 6.3 MULTIPLE_CHOICE

**Uses:** Options only (no sub-questions)  
**Correct answer:** One option with `isCorrect: true`  
**UI:** Show question text + radio buttons for A/B/C/D

```json
{
  "reading_part_id": "uuid-of-reading-part",
  "questionNumber": 10,
  "type": "MULTIPLE_CHOICE",
  "instruction": "Choose the correct letter, A, B, C or D.",
  "questionText": "What is the writer's main argument in the passage?",
  "points": 1,
  "options": [
    {
      "optionKey": "A",
      "optionText": "Economic growth should be prioritized over environmental protection.",
      "isCorrect": false,
      "orderIndex": 0
    },
    {
      "optionKey": "B",
      "optionText": "Sustainable development requires a balanced approach.",
      "isCorrect": true,
      "orderIndex": 1,
      "explanation": "This is supported by the conclusion in Paragraph 6.",
      "fromPassage": "Paragraph 6"
    },
    {
      "optionKey": "C",
      "optionText": "Environmental policies are too restrictive for businesses.",
      "isCorrect": false,
      "orderIndex": 2
    },
    {
      "optionKey": "D",
      "optionText": "Government intervention is unnecessary.",
      "isCorrect": false,
      "orderIndex": 3
    }
  ]
}
```

**Required fields for UI form:**
| Field | Required | Notes |
|---|---|---|
| `type` | ✅ | `MULTIPLE_CHOICE` |
| `questionText` | ✅ | The actual question |
| `instruction` | ✅ | "Choose the correct letter..." |
| `options[].optionKey` | ✅ | `A`, `B`, `C`, `D` |
| `options[].optionText` | ✅ | The choice text |
| `options[].isCorrect` | ✅ | Exactly one must be `true` |
| `options[].orderIndex` | ✅ | Display order (0-based) |

---

### 6.4 NOTE_COMPLETION

**Uses:** Sub-questions only  
**Correct answers:** Text from the passage  
**UI:** Show formatted notes with blank input fields

```json
{
  "listening_part_id": "uuid-of-listening-part",
  "questionNumber": 1,
  "type": "NOTE_COMPLETION",
  "instruction": "Complete the notes below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
  "questionText": "<h4>Volunteer Programme</h4><ul><li>Location: ____ (1)</li><li>Duration: ____ weeks (2)</li><li>Main activity: teaching ____ (3)</li></ul>",
  "points": 3,
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "Location: ____",
      "correctAnswer": "rural areas",
      "points": 1,
      "order": 1
    },
    {
      "questionNumber": 2,
      "questionText": "Duration: ____ weeks",
      "correctAnswer": "6",
      "points": 1,
      "order": 2
    },
    {
      "questionNumber": 3,
      "questionText": "Main activity: teaching ____",
      "correctAnswer": "English",
      "points": 1,
      "order": 3
    }
  ]
}
```

**UI Note:** Render `questionText` as HTML. Each `____` is an input field linked to the corresponding sub-question by `questionNumber`.

---

### 6.5 SENTENCE_COMPLETION

**Uses:** Sub-questions only  
**Correct answers:** Text from the passage  
**UI:** Show incomplete sentences with text input fields

```json
{
  "reading_part_id": "uuid-of-reading-part",
  "questionNumber": 8,
  "type": "SENTENCE_COMPLETION",
  "instruction": "Complete the sentences below. Write NO MORE THAN TWO WORDS from the passage for each answer.",
  "points": 3,
  "questions": [
    {
      "questionNumber": 8,
      "questionText": "The experiment was designed to test the effect of ____.",
      "correctAnswer": "light exposure",
      "points": 1,
      "order": 1
    },
    {
      "questionNumber": 9,
      "questionText": "Participants were divided into groups based on their ____.",
      "correctAnswer": "age range",
      "points": 1,
      "order": 2
    },
    {
      "questionNumber": 10,
      "questionText": "The findings were consistent with the theory of ____.",
      "correctAnswer": "circadian rhythm",
      "points": 1,
      "order": 3
    }
  ]
}
```

---

### 6.6 SUMMARY_COMPLETION

**Uses:** Sub-questions only (free text input)  
**Correct answers:** Words from the passage  
**UI:** Show a paragraph summary with blanks

```json
{
  "reading_part_id": "uuid-of-reading-part",
  "questionNumber": 5,
  "type": "SUMMARY_COMPLETION",
  "instruction": "Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
  "questionText": "<p>The study examined how ____ (5) affects children's learning. Researchers found that those with access to ____ (6) performed significantly better in ____ (7) tasks.</p>",
  "points": 3,
  "questions": [
    {
      "questionNumber": 5,
      "questionText": "The study examined how ____ affects children's learning.",
      "correctAnswer": "outdoor play",
      "points": 1,
      "order": 1
    },
    {
      "questionNumber": 6,
      "questionText": "those with access to ____",
      "correctAnswer": "green spaces",
      "points": 1,
      "order": 2
    },
    {
      "questionNumber": 7,
      "questionText": "performed significantly better in ____ tasks",
      "correctAnswer": "cognitive",
      "points": 1,
      "order": 3
    }
  ]
}
```

---

### 6.7 SUMMARY_COMPLETION_DRAG_DROP

**Uses:** Sub-questions + Options (word bank)  
**Correct answers:** Sub-question `correctAnswer` matches an option key  
**UI:** Show summary with blanks + a draggable word bank; users drag words into blanks

```json
{
  "reading_part_id": "uuid-of-reading-part",
  "questionNumber": 5,
  "type": "SUMMARY_COMPLETION_DRAG_DROP",
  "instruction": "Complete the summary using the list of words A–H below.",
  "questionText": "<p>The ancient civilization developed a system of ____ (5) that allowed them to ____ (6) water across long distances. This innovation led to increased ____ (7) production.</p>",
  "points": 3,
  "options": [
    { "optionKey": "A", "optionText": "aqueducts", "isCorrect": false, "orderIndex": 0 },
    { "optionKey": "B", "optionText": "transport", "isCorrect": false, "orderIndex": 1 },
    { "optionKey": "C", "optionText": "agricultural", "isCorrect": false, "orderIndex": 2 },
    { "optionKey": "D", "optionText": "canals", "isCorrect": false, "orderIndex": 3 },
    { "optionKey": "E", "optionText": "distribute", "isCorrect": false, "orderIndex": 4 },
    { "optionKey": "F", "optionText": "industrial", "isCorrect": false, "orderIndex": 5 },
    { "optionKey": "G", "optionText": "channels", "isCorrect": false, "orderIndex": 6 },
    { "optionKey": "H", "optionText": "store", "isCorrect": false, "orderIndex": 7 }
  ],
  "questions": [
    {
      "questionNumber": 5,
      "questionText": "developed a system of ____",
      "correctAnswer": "A",
      "points": 1,
      "order": 1
    },
    {
      "questionNumber": 6,
      "questionText": "allowed them to ____ water",
      "correctAnswer": "E",
      "points": 1,
      "order": 2
    },
    {
      "questionNumber": 7,
      "questionText": "increased ____ production",
      "correctAnswer": "C",
      "points": 1,
      "order": 3
    }
  ]
}
```

> **UI Note:** `options[]` is the word bank. `correctAnswer` in sub-questions refers to `optionKey`. Set `isCorrect: false` for all options (correctness is determined by matching sub-question answers). The word bank should appear as draggable chips.

---

### 6.8 SHORT_ANSWER

**Uses:** Sub-questions only  
**Correct answers:** Free text  
**UI:** Show question + text input field

```json
{
  "reading_part_id": "uuid-of-reading-part",
  "questionNumber": 11,
  "type": "SHORT_ANSWER",
  "instruction": "Answer the questions below. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.",
  "points": 3,
  "questions": [
    {
      "questionNumber": 11,
      "questionText": "What year was the organization founded?",
      "correctAnswer": "1987",
      "points": 1,
      "order": 1
    },
    {
      "questionNumber": 12,
      "questionText": "Who funded the initial research?",
      "correctAnswer": "British government",
      "points": 1,
      "order": 2
    },
    {
      "questionNumber": 13,
      "questionText": "Where was the first trial conducted?",
      "correctAnswer": "northern England",
      "points": 1,
      "order": 3
    }
  ]
}
```

---

### 6.9 TABLE_COMPLETION

**Uses:** Sub-questions + `tableData` (JSON)  
**Correct answers:** Text from the passage  
**UI:** Render an HTML table with blank cells as input fields

```json
{
  "listening_part_id": "uuid-of-listening-part",
  "questionNumber": 6,
  "type": "TABLE_COMPLETION",
  "instruction": "Complete the table below. Write NO MORE THAN ONE WORD AND/OR A NUMBER for each answer.",
  "questionText": "",
  "tableData": {
    "headers": ["Country", "Population (millions)", "Main Export"],
    "rows": [
      ["Brazil", "214", "coffee"],
      ["Argentina", "____", "beef"],
      ["Chile", "19", "____"]
    ]
  },
  "points": 2,
  "questions": [
    {
      "questionNumber": 6,
      "questionText": "Argentina – Population (millions)",
      "correctAnswer": "46",
      "points": 1,
      "order": 1
    },
    {
      "questionNumber": 7,
      "questionText": "Chile – Main Export",
      "correctAnswer": "copper",
      "points": 1,
      "order": 2
    }
  ]
}
```

**`tableData` structure:**
| Field | Type | Description |
|---|---|---|
| `headers` | `string[]` | Column header labels |
| `rows` | `string[][]` | Table rows. Use `"____"` for blanks |

> **UI Note:** Parse `tableData` into an HTML `<table>`. Replace each `"____"` cell with an `<input>` linked to the sub-question by order.

---

### 6.10 FLOW_CHART_COMPLETION

**Uses:** Sub-questions only  
**Correct answers:** Text from the passage  
**UI:** Render steps/flowchart with blanks as input fields

```json
{
  "reading_part_id": "uuid-of-reading-part",
  "questionNumber": 8,
  "type": "FLOW_CHART_COMPLETION",
  "instruction": "Complete the flow chart below. Write NO MORE THAN TWO WORDS for each answer.",
  "questionText": "<div class='flowchart'><div class='step'>Step 1: Collect ____ (8) from the field</div><div class='arrow'>↓</div><div class='step'>Step 2: Transport to the ____ (9)</div><div class='arrow'>↓</div><div class='step'>Step 3: Process using ____ (10) method</div></div>",
  "points": 3,
  "questions": [
    {
      "questionNumber": 8,
      "questionText": "Step 1: Collect ____ from the field",
      "correctAnswer": "soil samples",
      "points": 1,
      "order": 1
    },
    {
      "questionNumber": 9,
      "questionText": "Step 2: Transport to the ____",
      "correctAnswer": "laboratory",
      "points": 1,
      "order": 2
    },
    {
      "questionNumber": 10,
      "questionText": "Step 3: Process using ____ method",
      "correctAnswer": "filtration",
      "points": 1,
      "order": 3
    }
  ]
}
```

---

### 6.11 MATCHING_HEADINGS

**Uses:** Sub-questions + `headingOptions` (JSON)  
**Correct answers:** Sub-question `correctAnswer` = heading key (e.g. `"iii"`)  
**UI:** Show list of headings (i–x) + paragraphs; user selects a heading for each paragraph

```json
{
  "reading_part_id": "uuid-of-reading-part",
  "questionNumber": 1,
  "type": "MATCHING_HEADINGS",
  "instruction": "Choose the correct heading for paragraphs A–D from the list of headings below.",
  "headingOptions": {
    "i": "The decline of traditional farming",
    "ii": "Modern irrigation techniques",
    "iii": "Government subsidies for agriculture",
    "iv": "The impact of climate change",
    "v": "Organic farming movements",
    "vi": "Historical crop patterns"
  },
  "points": 4,
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "Paragraph A",
      "correctAnswer": "iv",
      "points": 1,
      "order": 1
    },
    {
      "questionNumber": 2,
      "questionText": "Paragraph B",
      "correctAnswer": "i",
      "points": 1,
      "order": 2
    },
    {
      "questionNumber": 3,
      "questionText": "Paragraph C",
      "correctAnswer": "ii",
      "points": 1,
      "order": 3
    },
    {
      "questionNumber": 4,
      "questionText": "Paragraph D",
      "correctAnswer": "v",
      "points": 1,
      "order": 4
    }
  ]
}
```

**`headingOptions` structure:**
| Field | Type | Description |
|---|---|---|
| key (e.g. `"i"`) | `string` | Roman numeral or letter |
| value | `string` | The heading text |

> **UI Note:** Show the heading list as a panel. For each paragraph, show a dropdown/select populated from `headingOptions`. Each heading can only be used once (excess headings are distractors).

---

### 6.12 MATCHING_INFORMATION

**Uses:** Sub-questions only  
**Correct answers:** Paragraph letter (e.g. `"A"`, `"B"`, `"C"`)  
**UI:** Show statements; user selects which paragraph contains the information

```json
{
  "reading_part_id": "uuid-of-reading-part",
  "questionNumber": 5,
  "type": "MATCHING_INFORMATION",
  "instruction": "Which paragraph contains the following information? Write the correct letter, A–F.",
  "points": 4,
  "questions": [
    {
      "questionNumber": 5,
      "questionText": "a reference to financial__(constraints faced by the researchers",
      "correctAnswer": "C",
      "points": 1,
      "order": 1
    },
    {
      "questionNumber": 6,
      "questionText": "a comparison between two methods of data collection",
      "correctAnswer": "E",
      "points": 1,
      "order": 2
    },
    {
      "questionNumber": 7,
      "questionText": "an explanation of why the project was


 delayed",
      "correctAnswer": "A",
      "points": 1,
      "order": 3
    },
    {
      "questionNumber": 8,
      "questionText": "details of the


 


 


 


final results",
      "correctAnswer": "F",
      "points": 1,
      "order": 4
    }
  ]
}
```

> **UI Note:** Show a dropdown per statement with paragraph letters (A, B, C, D, E, F). Note: the same paragraph can be used more than once.

---

### 6.13 MATCHING_FEATURES

**Uses:** Sub-questions + Options (the features/categories to match to)  
**Correct answers:** Sub-question `correctAnswer` = option key  
**UI:** Show statements + a list of features; user matches each statement to a feature

```json
{
  "reading_part_id": "uuid-of-reading-part",
  "questionNumber": 7,
  "type": "MATCHING_FEATURES",
  "instruction": "Match each statement with the correct researcher, A, B or C.",
  "points": 4,
  "options": [
    { "optionKey": "A", "optionText": "Dr. Sarah Mitchell", "isCorrect": false, "orderIndex": 0 },
    { "optionKey": "B", "optionText": "Professor James Lee", "isCorrect": false, "orderIndex": 1 },
    { "optionKey": "C", "optionText": "Dr. Elena Rodriguez", "isCorrect": false, "orderIndex": 2 }
  ],
  "questions": [
    {
      "questionNumber": 7,
      "questionText": "conducted experiments on plant growth in low-light conditions",
      "correctAnswer": "A",
      "points": 1,
      "order": 1
    },
    {
      "questionNumber": 8,
      "questionText": "questioned the validity of previous studies",
      "correctAnswer": "C",
      "points": 1,
      "order": 2
    },
    {
      "questionNumber": 9,
      "questionText": "proposed a new theoretical framework",
      "correctAnswer": "B",
      "points": 1,
      "order": 3
    },
    {
      "questionNumber": 10,
      "questionText": "replicated the original experiment with different subjects",
      "correctAnswer": "A",
      "points": 1,
      "order": 4
    }
  ]
}
```

> **UI Note:** Options are the features/people/categories. Show a dropdown per statement with the option keys (A, B, C). The same option can be selected multiple times.

---

### 6.14 MATCHING_SENTENCE_ENDINGS

**Uses:** Sub-questions + Options (the sentence endings)  
**Correct answers:** Sub-question `correctAnswer` = option key  
**UI:** Show sentence beginnings on the left, endings on the right; user matches them

```json
{
  "reading_part_id": "uuid-of-reading-part",
  "questionNumber": 11,
  "type": "MATCHING_SENTENCE_ENDINGS",
  "instruction": "Complete each sentence with the correct ending, A–F, below.",
  "points": 3,
  "options": [
    { "optionKey": "A", "optionText": "was


 


 


widely criticized by the scientific community.", "isCorrect": false, "orderIndex": 0 },
    { "optionKey": "B", "optionText": "led to the


 


 


development of a new vaccine.", "isCorrect": false, "orderIndex": 1 },
    { "optionKey": "C", "optionText": "demonstrated the


 


 


link between diet and health.", "isCorrect": false, "orderIndex": 2 },
    { "optionKey": "D", "optionText": "was


 


 


funded by a private foundation.", "isCorrect": false, "orderIndex": 3 },
    { "optionKey": "E", "optionText": "had


 


 


no significant impact on policy.", "isCorrect": false, "orderIndex": 4 },
    { "optionKey": "F", "optionText": "inspired


 


 


further research in the field.", "isCorrect": false, "orderIndex": 5 }
  ],
  "questions": [
    {
      "questionNumber": 11,
      "questionText": "The first study conducted in 1995",
      "correctAnswer": "D",
      "points": 1,
      "order": 1
    },
    {
      "questionNumber": 12,
      "questionText": "The breakthrough discovery in 2003",
      "correctAnswer": "B",
      "points": 1,
      "order": 2
    },
    {
      "questionNumber": 13,
      "questionText": "The controversial report published in 2010",
      "correctAnswer": "A",
      "points": 1,
      "order": 3
    }
  ]
}
```

> **UI Note:** Each ending can only be used once. Show endings as a list and let users select/drag one ending per sentence beginning.

---

### 6.15 DIAGRAM_LABELLING

**Uses:** Sub-questions only  
**Correct answers:** Text from the passage  
**UI:** Show a diagram image + numbered labels; user types answers

```json
{
  "reading_part_id": "uuid-of-reading-part",
  "questionNumber": 9,
  "type": "DIAGRAM_LABELLING",
  "instruction": "Label the diagram below. Write NO MORE THAN TWO WORDS from the passage for each answer.",
  "questionText": "<img src='https://cdn.example.com/images/water-cycle.png' alt='Water Cycle Diagram' />",
  "points": 4,
  "questions": [
    {
      "questionNumber": 9,
      "questionText": "Label 1 (top of diagram)",
      "correctAnswer": "evaporation",
      "points": 1,
      "order": 1
    },
    {
      "questionNumber": 10,
      "questionText": "Label 2 (cloud formation)",
      "correctAnswer": "condensation",
      "points": 1,
      "order": 2
    },
    {
      "questionNumber": 11,
      "questionText": "Label 3 (falling water)",
      "correctAnswer": "precipitation",
      "points": 1,
      "order": 3
    },
    {
      "questionNumber": 12,
      "questionText": "Label 4 (underground flow)",
      "correctAnswer": "groundwater",
      "points": 1,
      "order": 4
    }
  ]
}
```

> **UI Note:** Display the image from `questionText`. Place input fields near numbered arrows/labels on the diagram. If the image cannot be interactive, show numbered inputs below.

---

### 6.16 PLAN_MAP_LABELLING

**Uses:** Sub-questions + Options  
**Correct answers:** Sub-question `correctAnswer` = option key  
**UI:** Show a plan/map image + lettered locations; user matches labels to options

```json
{
  "listening_part_id": "uuid-of-listening-part",
  "questionNumber": 6,
  "type": "PLAN_MAP_LABELLING",
  "instruction": "Label the map below. Choose FIVE answers from the box and write the correct letter, A–H, next to Questions 6–10.",
  "questionText": "<img src='https://cdn.example.com/images/campus-map.png' alt='Campus Map' />",
  "points": 5,
  "options": [
    { "optionKey": "A", "optionText": "Library", "isCorrect": false, "orderIndex": 0 },
    { "optionKey": "B", "optionText": "Sports Centre", "isCorrect": false, "orderIndex": 1 },
    { "optionKey": "C", "optionText": "Student Union", "isCorrect": false, "orderIndex": 2 },
    { "optionKey": "D", "optionText": "Car Park", "isCorrect": false, "orderIndex": 3 },
    { "optionKey": "E", "optionText": "Cafeteria", "isCorrect": false, "orderIndex": 4 },
    { "optionKey": "F", "optionText": "Lecture Hall", "isCorrect": false, "orderIndex": 5 },
    { "optionKey": "G", "optionText": "Science Lab", "isCorrect": false, "orderIndex": 6 },
    { "optionKey": "H", "optionText": "Administration", "isCorrect": false, "orderIndex": 7 }
  ],
  "questions": [
    {
      "questionNumber": 6,
      "questionText": "Building 1 (north entrance)",
      "correctAnswer": "C",
      "points": 1,
      "order": 1
    },
    {
      "questionNumber": 7,
      "questionText": "Building 2 (east side)",
      "correctAnswer": "A",
      "points": 1,
      "order": 2
    },
    {
      "questionNumber": 8,
      "questionText": "Building 3 (south wing)",
      "correctAnswer": "F",
      "points": 1,
      "order": 3
    },
    {
      "questionNumber": 9,
      "questionText": "Area 4 (western corner)",
      "correctAnswer": "D",
      "points": 1,
      "order": 4
    },
    {
      "questionNumber": 10,
      "questionText": "Building 5 (central)",
      "correctAnswer": "E",
      "points": 1,
      "order": 5
    }
  ]
}
```

> **UI Note:** Display the map from `questionText`. Show options as a reference panel. For each numbered position on the map, show a dropdown populated from `options[]`.

---

### 6.17 MULTIPLE_ANSWER

**Uses:** Sub-questions + Options  
**Correct answers:** Multiple options with `isCorrect: true`  
**UI:** Show question text + checkboxes for A/B/C/D/E/F/G; user selects the required number of correct answers

```json
{
  "listening_part_id": "uuid-of-listening-part",
  "questionNumber": 18,
  "type": "MULTIPLE_ANSWER",
  "instruction": "Choose THREE correct answers.",
  "questionText": "<p>Which <strong>THREE</strong> ways did the new well improve Helen's life?</p>",
  "points": 3,
  "options": [
    { "optionKey": "A", "optionText": "her children enjoyed better health", "isCorrect": true, "orderIndex": 0 },
    { "optionKey": "B", "optionText": "it increased her household income", "isCorrect": false, "orderIndex": 1 },
    { "optionKey": "C", "optionText": "it gave her more free time", "isCorrect": true, "orderIndex": 2 },
    { "optionKey": "D", "optionText": "she got a leadership position", "isCorrect": false, "orderIndex": 3 },
    { "optionKey": "E", "optionText": "she had more choices and options", "isCorrect": true, "orderIndex": 4 },
    { "optionKey": "F", "optionText": "she made new friends in her village", "isCorrect": false, "orderIndex": 5 },
    { "optionKey": "G", "optionText": "it allowed her to go to school", "isCorrect": false, "orderIndex": 6 }
  ],
  "questions": [
    {
      "questionNumber": 18,
      "questionText": "----",
      "correctAnswer": "A",
      "points": 1,
      "order": 1
    },
    {
      "questionNumber": 19,
      "questionText": "----",
      "correctAnswer": "C",
      "points": 1,
      "order": 2
    },
    {
      "questionNumber": 20,
      "questionText": "----",
      "correctAnswer": "E",
      "points": 1,
      "order": 3
    }
  ]
}
```

**Required fields for UI form:**
| Field | Required | Notes |
|---|---|---|
| `type` | ✅ | `MULTIPLE_ANSWER` |
| `questionText` | ✅ | The question (e.g. "Which THREE ways...") |
| `instruction` | ✅ | "Choose THREE correct answers." |
| `points` | ✅ | Total points (typically = number of correct answers) |
| `options[].optionKey` | ✅ | `A`, `B`, `C`, ... |
| `options[].optionText` | ✅ | The choice text |
| `options[].isCorrect` | ✅ | Multiple can be `true` |
| `options[].orderIndex` | ✅ | Display order (0-based) |
| `questions[]` | ✅ | One sub-question per expected answer slot |
| `questions[].correctAnswer` | ✅ | The option key of the correct choice |

> **Key Difference from MULTIPLE_CHOICE:** In `MULTIPLE_CHOICE`, exactly **one** option is correct and the UI uses radio buttons. In `MULTIPLE_ANSWER`, **multiple** options are correct and the UI uses checkboxes. Sub-questions represent answer slots — the number of sub-questions equals the number of correct answers expected.

---

### UI Implementation Summary

| Category | Types | Input Component |
|---|---|---|
| **Radio (3 choices)** | `TRUE_FALSE_NOT_GIVEN`, `YES_NO_NOT_GIVEN` | 3 radio buttons per sub-question |
| **Radio (4 choices)** | `MULTIPLE_CHOICE` | A/B/C/D radio buttons from `options[]` |
| **Checkboxes (multi-select)** | `MULTIPLE_ANSWER` | Checkboxes from `options[]`, select N correct |
| **Text Input** | `NOTE_COMPLETION`, `SENTENCE_COMPLETION`, `SUMMARY_COMPLETION`, `SHORT_ANSWER`, `TABLE_COMPLETION`, `FLOW_CHART_COMPLETION`, `DIAGRAM_LABELLING` | Text `<input>` per sub-question |
| **Select / Dropdown** | `MATCHING_HEADINGS`, `MATCHING_INFORMATION`, `MATCHING_FEATURES`, `PLAN_MAP_LABELLING` | `<select>` from `headingOptions` or `options[]` |
| **Drag & Drop** | `SUMMARY_COMPLETION_DRAG_DROP`, `MATCHING_SENTENCE_ENDINGS` | Draggable chips / selectable list |

### Common Field Validation Rules

| Field | Validation | Notes |
|---|---|---|
| `questionNumber` | `integer >= 1` | Unique within the part |
| `type` | Must be one of 17 enum values | See Quick Reference table |
| `points` | `integer >= 0` | Total for the question group |
| `questions[].correctAnswer` | Required for auto-grading | Format depends on type |
| `questions[].order` | `integer >= 0` | Sequential within the group |
| `options[].optionKey` | Usually single uppercase letter | `A`, `B`, `C`, ... |
| `options[].orderIndex` | `integer >= 0` | 0-based display order |
| `headingOptions` | JSON object `{ key: text }` | Only for `MATCHING_HEADINGS` |
| `tableData` | JSON `{ headers, rows }` | Only for `TABLE_COMPLETION` |

---

## 7. Full JSON Examples

### Complete Test Creation (End-to-End)

#### Step 1: Create Test
```http
POST /ielts-tests
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Cambridge IELTS 18 Academic Test 1",
  "mode": "mock",
  "category": "cambridge books"
}
```
**Response:** `{ "id": "test-uuid-001", "title": "...", "mode": "mock", "status": "draft", ... }`

---

#### Step 2a: Create Reading Module
```http
POST /ielts-reading
Authorization: Bearer <token>

{
  "title": "Academic Reading",
  "test_id": "test-uuid-001"
}
```
**Response:** `{ "id": "reading-uuid-001", ... }`

---

#### Step 2b: Create Listening Module
```http
POST /ielts-listening
Authorization: Bearer <token>

{
  "title": "Academic Listening",
  "test_id": "test-uuid-001",
  "full_audio_url": "https://cdn.example.com/audio/full.mp3"
}
```
**Response:** `{ "id": "listening-uuid-001", ... }`

---

#### Step 2c: Create Writing Module
```http
POST /ielts-writing
Authorization: Bearer <token>

{
  "title": "Academic Writing",
  "test_id": "test-uuid-001"
}
```
**Response:** `{ "id": "writing-uuid-001", ... }`

---

#### Step 3a: Create Reading Part 1 (with nested questions)
```http
POST /ielts-reading-parts
Authorization: Bearer <token>

{
  "reading_id": "reading-uuid-001",
  "part": "PART_1",
  "title": "Urban Planning in Singapore",
  "content": "<h2>Urban Planning in Singapore</h2><p>Singapore, a small island city-state...</p>",
  "timeLimitMinutes": 20,
  "difficulty": "EASY",
  "totalQuestions": 13,
  "questions": [
    {
      "questionNumber": 1,
      "type": "TRUE_FALSE_NOT_GIVEN",
      "instruction": "Do the following statements agree with the information given in Reading Passage 1? Write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, NOT GIVEN if there is no information on this.",
      "points": 6,
      "questions": [
        {
          "questionNumber": 1,
          "questionText": "Singapore's urban


 planning began in the 1960s.",
          "correctAnswer": "TRUE",
          "points": 1,
          "order": 1
        },
        {
          "questionNumber": 2,
          "questionText": "The government demolished all old buildings.",
          "correctAnswer": "FALSE",
          "points": 1,
          "order": 2
        },
        {
          "questionNumber": 3,
          "questionText": "Public housing was inspired by Hong Kong's model.",
          "correctAnswer": "NOT GIVEN",
          "points": 1,
          "order": 3
        }
      ]
    },
    {
      "questionNumber": 7,
      "type": "NOTE_COMPLETION",
      "instruction": "Complete the notes below. Write NO MORE THAN TWO WORDS from the passage for each answer.",
      "questionText": "<h4>Singapore's Green Plan</h4><ul><li>Target: become a ____ (7)</li><li>Parks connected via ____ (8)</li></ul>",
      "points": 4,
      "questions": [
        {
          "questionNumber": 7,
          "questionText": "Target: become a ____",
          "correctAnswer": "garden city",
          "points": 1,
          "order": 1
        },
        {
          "questionNumber": 8,
          "questionText": "Parks connected via ____",
          "correctAnswer": "park connectors",
          "points": 1,
          "order": 2
        }
      ]
    },
    {
      "questionNumber": 11,
      "type": "MULTIPLE_CHOICE",
      "instruction": "Choose the correct letter, A, B, C or D.",
      "questionText": "What is the main purpose of the passage?",
      "points": 1,
      "options": [
        { "optionKey": "A", "optionText": "To criticize Singapore's housing policies", "isCorrect": false, "orderIndex": 0 },
        { "optionKey": "B", "optionText": "To describe Singapore's urban development", "isCorrect": true, "orderIndex": 1 },
        { "optionKey": "C", "optionText": "To compare Singapore with other cities", "isCorrect": false, "orderIndex": 2 },
        { "optionKey": "D", "optionText": "To argue for more green spaces", "isCorrect": false, "orderIndex": 3 }
      ]
    }
  ]
}
```

---

#### Step 3b: Create Listening Part 1 (with audio + questions)
```http
POST /ielts-listening-parts
Authorization: Bearer <token>

{
  "listening_id": "listening-uuid-001",
  "part": "PART_1",
  "title": "Hotel Reservation Enquiry",
  "audio": {
    "url": "https://cdn.example.com/audio/section1.mp3",
    "file_name": "section1.mp3",
    "duration": 240
  },
  "timeLimitMinutes": 7,
  "difficulty": "EASY",
  "totalQuestions": 10,
  "questions": [
    {
      "questionNumber": 1,
      "type": "NOTE_COMPLETION",
      "instruction": "Complete the form below. Write ONE WORD AND/OR A NUMBER for each answer.",
      "questionText": "<h4>Hotel Booking Form</h4>",
      "points": 5,
      "questions": [
        { "questionNumber": 1, "questionText": "Name: ____", "correctAnswer": "Peterson", "points": 1, "order": 1 },
        { "questionNumber": 2, "questionText": "Phone: ____", "correctAnswer": "0741825963", "points": 1, "order": 2 },
        { "questionNumber": 3, "questionText": "Room type: ____", "correctAnswer": "double", "points": 1, "order": 3 },
        { "questionNumber": 4, "questionText": "Number of nights: ____", "correctAnswer": "3", "points": 1, "order": 4 },
        { "questionNumber": 5, "questionText": "Special request: ____", "correctAnswer": "parking", "points": 1, "order": 5 }
      ]
    }
  ]
}
```

---

#### Step 3c: Create Writing Tasks
```http
POST /ielts-writing/task
Authorization: Bearer <token>

{
  "writing_id": "writing-uuid-001",
  "task": "TASK_1",
  "prompt": "The pie charts below show the online sales for retail sectors in New Zealand in 2003 and 2013. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
  "image_url": "https://cdn.example.com/images/pie-chart.png",
  "min_words": 150,
  "suggested_time": 20
}
```

```http
POST /ielts-writing/task
Authorization: Bearer <token>

{
  "writing_id": "writing-uuid-001",
  "task": "TASK_2",
  "prompt": "Some people think that the best way to reduce crime is to give longer prison sentences. Others, however, believe there are better alternative ways of reducing crime. Discuss both views and give your own opinion. Write at least 250 words.",
  "min_words": 250,
  "suggested_time": 40
}
```

---

#### Step 4: Publish the Test
```http
PATCH /ielts-tests/test-uuid-001
Authorization: Bearer <token>

{
  "status": "published"
}
```

---

### Complete Answer Submission Flow

#### 1. Start an Attempt
```http
POST /ielts-answers/attempts

{ "scope": "TEST", "test_id": "test-uuid-001" }
```
**Response:** `{ "id": "attempt-uuid-001", "status": "IN_PROGRESS", ... }`

#### 2. Save Reading Answers
```http
POST /ielts-answers/reading

{
  "attempt_id": "attempt-uuid-001",
  "answers": [
    { "part_id": "rp-uuid-1", "question_id": "q-uuid-1", "question_number": "1", "answer": "TRUE" },
    { "part_id": "rp-uuid-1", "question_id": "q-uuid-1", "question_number": "2", "answer": "FALSE" },
    { "part_id": "rp-uuid-1", "question_id": "q-uuid-2", "question_number": "7", "answer": "garden city" }
  ]
}
```

#### 3. Save Listening Answers
```http
POST /ielts-answers/listening

{
  "attempt_id": "attempt-uuid-001",
  "answers": [
    { "part_id": "lp-uuid-1", "question_id": "lq-uuid-1", "question_number": "1", "answer": "Peterson" },
    { "part_id": "lp-uuid-1", "question_id": "lq-uuid-1", "question_number": "2", "answer": "0741825963" }
  ]
}
```

#### 4. Save Writing Answers
```http
POST /ielts-answers/writing

{
  "attempt_id": "attempt-uuid-001",
  "answers": [
    {
      "task_id": "wt-uuid-1",
      "answer_text": "The pie charts compare the proportion of online retail sales...",
      "word_count": 178
    },
    {
      "task_id": "wt-uuid-2",
      "answer_text": "It is often argued that the most effective approach to reducing crime...",
      "word_count": 276
    }
  ]
}
```

#### 5. Submit the Attempt
```http
PATCH /ielts-answers/attempts/attempt-uuid-001/submit
```

**Response:** `{ "id": "attempt-uuid-001", "status": "SUBMITTED", "finished_at": "2026-02-14T..." }`
