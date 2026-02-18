# IELTS Mock Tests API — Frontend Integration Guide

> **Base URL:** `/api/ielts-mock-tests`  
> **Auth:** All endpoints require `Authorization: Bearer <JWT_TOKEN>`  
> **Roles:** ADMIN, TEACHER, STUDENT

---

## Table of Contents

1. [Overview](#1-overview)
2. [Data Model](#2-data-model)
3. [API Endpoints](#3-api-endpoints)
   - [Create (Assign) Mock Test](#31-create-assign-mock-test)
   - [Get All Mock Tests](#32-get-all-mock-tests)
   - [Get My Mock Tests](#33-get-my-mock-tests)
   - [Get Mock Tests by Group](#34-get-mock-tests-by-group)
   - [Get Mock Test by ID](#35-get-mock-test-by-id)
   - [Update Mock Test](#36-update-mock-test)
   - [Archive Mock Test](#37-archive-mock-test)
   - [Unarchive Mock Test](#38-unarchive-mock-test)
   - [Delete Mock Test](#39-delete-mock-test)
4. [Frontend API Wrapper](#4-frontend-api-wrapper)
5. [Usage Examples](#5-usage-examples)
6. [Error Handling](#6-error-handling)

---

## 1. Overview

The IELTS Mock Tests system allows **teachers/admins** to assign mock IELTS tests to students. Each mock test links a student to an IELTS test and tracks the confirmation & completion status per skill (listening, reading, writing). Teachers can also attach video review URLs via the `meta` field.

### Typical Flow

```
1. Teacher creates a mock test assignment (POST /)
2. Student views their assignments (GET /my)
3. Student completes skills → teacher updates confirmed/finished flags (PATCH /:id)
4. Teacher archives completed mock tests (PATCH /:id/archive)
```

---

## 2. Data Model

### Mock Test (`ielts_mock_tests`)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | UUID | auto | Primary key |
| `user_id` | UUID | — | Student user ID |
| `test_id` | UUID | — | IELTS test reference |
| `group_id` | UUID \| null | null | Group reference |
| `teacher_id` | UUID \| null | null | Assigning teacher ID |
| `title` | String | — | Display title |
| `listening_confirmed` | Boolean | `false` | Teacher confirmed listening results |
| `reading_confirmed` | Boolean | `false` | Teacher confirmed reading results |
| `writing_confirmed` | Boolean | `false` | Teacher confirmed writing results |
| `listening_finished` | Boolean | `false` | Student finished listening |
| `reading_finished` | Boolean | `false` | Student finished reading |
| `writing_finished` | Boolean | `false` | Student finished writing |
| `archived` | Boolean | `false` | Whether the mock test is archived |
| `meta` | JSON | `{}` | Video URLs and additional data |
| `createdAt` | Date | auto | Creation timestamp |
| `updatedAt` | Date | auto | Last update timestamp |

### Meta Object Structure

```json
{
  "listening_videoUrl": "",
  "reading_videoUrl": "",
  "writing_videoUrl": ""
}
```

---

## 3. API Endpoints

### 3.1 Create (Assign) Mock Test

Assign a mock test to a student.

```
POST /api/ielts-mock-tests
```

**Roles:** ADMIN, TEACHER

**Request Body:**

```json
{
  "user_id": "student-uuid",
  "test_id": "ielts-test-uuid",
  "title": "Mock Test #1 - Cambridge 18",
  "group_id": "group-uuid",        // optional
  "teacher_id": "teacher-uuid",    // optional
  "meta": {                         // optional
    "listening_videoUrl": "",
    "reading_videoUrl": "",
    "writing_videoUrl": ""
  }
}
```

**Response:** `201 Created`

```json
{
  "id": "generated-uuid",
  "user_id": "student-uuid",
  "test_id": "ielts-test-uuid",
  "group_id": "group-uuid",
  "teacher_id": "teacher-uuid",
  "title": "Mock Test #1 - Cambridge 18",
  "listening_confirmed": false,
  "reading_confirmed": false,
  "writing_confirmed": false,
  "listening_finished": false,
  "reading_finished": false,
  "writing_finished": false,
  "archived": false,
  "meta": {
    "listening_videoUrl": "",
    "reading_videoUrl": "",
    "writing_videoUrl": ""
  },
  "createdAt": "2026-02-18T10:00:00.000Z",
  "updatedAt": "2026-02-18T10:00:00.000Z"
}
```

---

### 3.2 Get All Mock Tests

Retrieve mock tests with optional filters and pagination.

```
GET /api/ielts-mock-tests
```

**Roles:** ADMIN, TEACHER, STUDENT

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | UUID | No | Filter by student |
| `test_id` | UUID | No | Filter by IELTS test |
| `group_id` | UUID | No | Filter by group |
| `teacher_id` | UUID | No | Filter by teacher |
| `page` | Number | No | Page number (default: 1) |
| `limit` | Number | No | Items per page (default: 10) |

**Example:**

```
GET /api/ielts-mock-tests?group_id=abc-123&page=1&limit=20
```

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "mock-test-uuid",
      "user_id": "student-uuid",
      "test_id": "test-uuid",
      "group_id": "group-uuid",
      "teacher_id": "teacher-uuid",
      "title": "Mock Test #1",
      "listening_confirmed": false,
      "reading_confirmed": false,
      "writing_confirmed": false,
      "listening_finished": true,
      "reading_finished": false,
      "writing_finished": false,
      "archived": false,
      "meta": { ... },
      "user": {
        "id": "student-uuid",
        "firstName": "John",
        "lastName": "Doe"
      },
      "test": {
        "id": "test-uuid",
        "title": "Cambridge 18 Test 1",
        "mode": "mock",
        "status": "published"
      },
      "group": {
        "id": "group-uuid",
        "name": "IELTS Advanced"
      }
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

---

### 3.3 Get My Mock Tests

Get mock tests assigned to the currently authenticated user.

```
GET /api/ielts-mock-tests/my
```

**Roles:** STUDENT, TEACHER, ADMIN

**Response:** `200 OK` — Array of mock tests with `test` and `group` included.

---

### 3.4 Get Mock Tests by Group

Get all mock tests assigned to students in a specific group.

```
GET /api/ielts-mock-tests/group/:groupId
```

**Roles:** ADMIN, TEACHER

**Example:**

```
GET /api/ielts-mock-tests/group/abc-123
```

**Response:** `200 OK` — Array of mock tests with `user` and `test` included.

---

### 3.5 Get Mock Test by ID

Get a single mock test with full details.

```
GET /api/ielts-mock-tests/:id
```

**Roles:** ADMIN, TEACHER, STUDENT

**Response:** `200 OK`

```json
{
  "id": "mock-test-uuid",
  "user_id": "student-uuid",
  "test_id": "test-uuid",
  "group_id": "group-uuid",
  "teacher_id": "teacher-uuid",
  "title": "Mock Test #1",
  "listening_confirmed": false,
  "reading_confirmed": true,
  "writing_confirmed": false,
  "listening_finished": true,
  "reading_finished": true,
  "writing_finished": false,
  "archived": false,
  "meta": {
    "listening_videoUrl": "https://example.com/listening-review.mp4",
    "reading_videoUrl": "https://example.com/reading-review.mp4",
    "writing_videoUrl": ""
  },
  "user": { "id": "...", "firstName": "John", "lastName": "Doe" },
  "test": { "id": "...", "title": "Cambridge 18 Test 1", "mode": "mock", "status": "published" },
  "group": { "id": "...", "name": "IELTS Advanced" }
}
```

**Error:** `404 Not Found` if ID doesn't exist.

---

### 3.6 Update Mock Test

Update any field on a mock test (confirmation status, finished flags, meta, etc.).

```
PATCH /api/ielts-mock-tests/:id
```

**Roles:** ADMIN, TEACHER

**Request Body** (all fields optional):

```json
{
  "title": "Updated Title",
  "user_id": "new-student-uuid",
  "test_id": "new-test-uuid",
  "group_id": "new-group-uuid",
  "teacher_id": "new-teacher-uuid",
  "listening_confirmed": true,
  "reading_confirmed": true,
  "writing_confirmed": false,
  "listening_finished": true,
  "reading_finished": true,
  "writing_finished": false,
  "archived": false,
  "meta": {
    "listening_videoUrl": "https://example.com/video.mp4",
    "reading_videoUrl": "",
    "writing_videoUrl": ""
  }
}
```

**Response:** `200 OK` — Updated mock test object.

#### Common Update Patterns

**Mark listening as finished:**
```json
{ "listening_finished": true }
```

**Teacher confirms reading results:**
```json
{ "reading_confirmed": true }
```

**Attach video review URL:**
```json
{
  "meta": {
    "listening_videoUrl": "https://example.com/listening-review.mp4",
    "reading_videoUrl": "",
    "writing_videoUrl": ""
  }
}
```

---

### 3.7 Archive Mock Test

Archive a completed mock test. Shortcut for setting `archived: true`.

```
PATCH /api/ielts-mock-tests/:id/archive
```

**Roles:** ADMIN, TEACHER

**Request Body:** None

**Response:** `200 OK` — Updated mock test with `archived: true`.

---

### 3.8 Unarchive Mock Test

Restore an archived mock test.

```
PATCH /api/ielts-mock-tests/:id/unarchive
```

**Roles:** ADMIN, TEACHER

**Request Body:** None

**Response:** `200 OK` — Updated mock test with `archived: false`.

---

### 3.9 Delete Mock Test

Soft-delete a mock test.

```
DELETE /api/ielts-mock-tests/:id
```

**Roles:** ADMIN, TEACHER

**Response:** `204 No Content`

---

## 4. Frontend API Wrapper

The `ieltsMockTestsAPI` wrapper is exported from `@/lib/ielts-api.js`. It provides a clean interface for all mock test operations.

```javascript
import { ieltsMockTestsAPI } from "@/lib/ielts-api";
```

### Available Methods

| Method | HTTP | Endpoint | Description |
|--------|------|----------|-------------|
| `getAll(params)` | GET | `/ielts-mock-tests` | List with filters & pagination |
| `getMy()` | GET | `/ielts-mock-tests/my` | Current user's mock tests |
| `getByGroup(groupId)` | GET | `/ielts-mock-tests/group/:groupId` | Mock tests by group |
| `getById(id)` | GET | `/ielts-mock-tests/:id` | Single mock test |
| `create(data)` | POST | `/ielts-mock-tests` | Assign a mock test |
| `update(id, data)` | PATCH | `/ielts-mock-tests/:id` | Update any fields |
| `archive(id)` | PATCH | `/ielts-mock-tests/:id/archive` | Archive a mock test |
| `unarchive(id)` | PATCH | `/ielts-mock-tests/:id/unarchive` | Unarchive a mock test |
| `delete(id)` | DELETE | `/ielts-mock-tests/:id` | Delete a mock test |

### `getAll(params)` Filter Options

```javascript
ieltsMockTestsAPI.getAll({
  user_id: "student-uuid",    // optional
  test_id: "test-uuid",       // optional
  group_id: "group-uuid",     // optional
  teacher_id: "teacher-uuid", // optional
  page: 1,                    // optional (default: 1)
  limit: 20,                  // optional (default: 10)
});
```

---

## 5. Usage Examples

### Assign a mock test to a student

```javascript
import { ieltsMockTestsAPI } from "@/lib/ielts-api";

const mockTest = await ieltsMockTestsAPI.create({
  user_id: "student-uuid",
  test_id: "ielts-test-uuid",
  title: "Mock Test #1 - Cambridge 18",
  group_id: "group-uuid",        // optional
  teacher_id: "teacher-uuid",    // optional
  meta: {                         // optional
    listening_videoUrl: "",
    reading_videoUrl: "",
    writing_videoUrl: ""
  }
});
```

### Get student's assigned mock tests

```javascript
const myTests = await ieltsMockTestsAPI.getMy();
```

### Get mock tests for a group (with pagination)

```javascript
const groupTests = await ieltsMockTestsAPI.getAll({
  group_id: "group-uuid",
  page: 1,
  limit: 20,
});
```

### Get mock tests by group ID

```javascript
const groupTests = await ieltsMockTestsAPI.getByGroup("group-uuid");
```

### Update skill status after completion

```javascript
// Mark listening as finished
await ieltsMockTestsAPI.update(mockTestId, {
  listening_finished: true,
});

// Teacher confirms and attaches review video
await ieltsMockTestsAPI.update(mockTestId, {
  listening_confirmed: true,
  meta: {
    listening_videoUrl: "https://example.com/review.mp4",
    reading_videoUrl: "",
    writing_videoUrl: "",
  },
});
```

### Archive / Unarchive a mock test

```javascript
await ieltsMockTestsAPI.archive(mockTestId);
await ieltsMockTestsAPI.unarchive(mockTestId);
```

### Delete a mock test

```javascript
await ieltsMockTestsAPI.delete(mockTestId);
```

---

## 6. Error Handling

| Status | Description |
|--------|-------------|
| `400 Bad Request` | Validation failed (missing required fields, invalid UUID, etc.) |
| `401 Unauthorized` | Missing or invalid JWT token |
| `403 Forbidden` | User role not allowed for this endpoint |
| `404 Not Found` | Mock test with given ID not found |

**Error response format:**

```json
{
  "statusCode": 404,
  "message": "Mock test with ID abc-123 not found",
  "error": "Not Found"
}
```
