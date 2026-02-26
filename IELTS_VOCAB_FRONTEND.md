# IELTS Vocabulary Module — Frontend Integration Guide

This document describes the HTTP API exposed by the backend `IeltsVocabulary` module and provides TypeScript interfaces and example frontend calls (fetch/axios) for use in a React/TypeScript client.

Base path: `/ielts-vocabulary` (append to your API root, e.g. `https://.../ielts-vocabulary`).

Resources
- Vocabulary (top-level collections of decks)
- Decks (group of words, belong to a Vocabulary)
- Words (deck items)

Common paginated response shape
```
{
  data: T[],
  total: number,
  page: number,
  limit: number,
  totalPages: number,
}
```

TypeScript interfaces (frontend)
```
export interface IeltsDeckWord {
  id: string;
  deck_id: string;
  word: string;
  partOfSpeech?: string | null;
  uzbek?: string | null;
  rus?: string | null;
  example?: string | null;
  definition?: string | null;
  image_url?: string | null;
  audio_url?: string | null;
}

export interface IeltsVocabularyDeck {
  id: string;
  ielts_vocabulary_id: string;
  title: string;
  words?: IeltsDeckWord[];
}

export interface IeltsVocabulary {
  id: string;
  title: string;
  description?: string | null;
  decks?: IeltsVocabularyDeck[];
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

Endpoints

1) Create Vocabulary
- POST `/ielts-vocabulary`
- Body: `{ title: string; description?: string }`
- Response: created `IeltsVocabulary` object

Example (axios)
```ts
await axios.post('/ielts-vocabulary', { title: 'Cambridge Words', description: '...' });
```

2) List Vocabularies (paginated)
- GET `/ielts-vocabulary?page=1&limit=10`
- Response: `Paginated<IeltsVocabulary>`; each vocabulary includes `decks` and each deck includes `words` (based on service include)

3) Get Vocabulary
- GET `/ielts-vocabulary/:id`
- Response: `IeltsVocabulary` with `decks` and nested `words`

4) Update Vocabulary
- PATCH `/ielts-vocabulary/:id`
- Body: partial `{ title?: string; description?: string }`
- Response: updated `IeltsVocabulary`

5) Delete Vocabulary
- DELETE `/ielts-vocabulary/:id`
- Response: 200/204

6) Create Deck
- POST `/ielts-vocabulary/decks`
- Body: `{ ielts_vocabulary_id: string; title: string }`
- Response: created `IeltsVocabularyDeck`

7) List Decks (paginated)
- GET `/ielts-vocabulary/decks/all?vocabularyId=<id>&page=1&limit=10`
- Query `vocabularyId` optional — filters decks by parent vocabulary
- Response: `Paginated<IeltsVocabularyDeck>`; each deck includes `words`

8) Get Deck
- GET `/ielts-vocabulary/decks/:id`
- Response: `IeltsVocabularyDeck` with `words`

9) Update Deck
- PATCH `/ielts-vocabulary/decks/:id`
- Body: partial `{ ielts_vocabulary_id?: string; title?: string }`

10) Delete Deck
- DELETE `/ielts-vocabulary/decks/:id`

11) Create Word
- POST `/ielts-vocabulary/words`
- Body: {
    deck_id: string,
    word: string,
    partOfSpeech?: string,
    uzbek?: string,
    rus?: string,
    example?: string,
    definition?: string,
    image_url?: string,
    audio_url?: string,
  }
- Response: created `IeltsDeckWord`

12) List Words (paginated)
- GET `/ielts-vocabulary/words/all?deckId=<id>&page=1&limit=20`
- `deckId` optional — returns words optionally filtered by deck
- Response: `Paginated<IeltsDeckWord>`

13) Get Word
- GET `/ielts-vocabulary/words/:id`
- Response: `IeltsDeckWord`

14) Update Word
- PATCH `/ielts-vocabulary/words/:id`
- Body: partial of CreateIeltsDeckWordDto

15) Delete Word
- DELETE `/ielts-vocabulary/words/:id`

Frontend usage patterns & snippets

A. Fetch paginated decks (axios)
```ts
import axios from 'axios';

export async function fetchDecks(vocabularyId?: string, page = 1, limit = 10) {
  const params: any = { page, limit };
  if (vocabularyId) params.vocabularyId = vocabularyId;
  const res = await axios.get<Paginated<IeltsVocabularyDeck>>('/ielts-vocabulary/decks/all', { params });
  return res.data;
}
```

B. Create a new word
```ts
export async function createWord(payload: Partial<IeltsDeckWord>) {
  const res = await axios.post<IeltsDeckWord>('/ielts-vocabulary/words', payload);
  return res.data;
}
```

C. Minimal fetch wrapper (fetch API)
```ts
async function apiFetch(path: string, opts: RequestInit = {}) {
  const base = process.env.API_BASE || '';
  const res = await fetch(`${base}${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Usage
const page = await apiFetch('/ielts-vocabulary?page=1&limit=5');
```

Notes & considerations
- The service includes nested `decks` and `words` for vocabulary endpoints. When listing vocabularies the decks and words are included via Sequelize `include`.
- Validation is applied on the backend via DTOs; ensure required fields (e.g. `title`, `deck_id`, `word`) are provided.
- IDs are UUIDs.
- Page and limit default in the controller/service to `page=1`, `limit=10` for most endpoints.

Files of interest in the backend
- [src/ielts-vocabulary/ielts-vocabulary.controller.ts](src/ielts-vocabulary/ielts-vocabulary.controller.ts)
- [src/ielts-vocabulary/ielts-vocabulary.service.ts](src/ielts-vocabulary/ielts-vocabulary.service.ts)
- [src/ielts-vocabulary/dto](src/ielts-vocabulary/dto)
- [src/ielts-vocabulary/entities](src/ielts-vocabulary/entities)

If you want, I can:
- Add a small TypeScript API client file (e.g., `client/ieltsVocabulary.ts`) to `client/src/services` for immediate reuse.
- Generate typed hooks (React Query) for common operations.

