# Frontend Usage: Unified Leaderboard API

This document provides instructions for integrating the refactored unified leaderboard API into the frontend.

## Endpoint Details

- **Path**: `/api/ielts-answers/leaderboard`
- **Method**: `GET`
- **Auth**: Required (Bearer Token)

## Query Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `period` | `string` | `all_time` | Filter by time period: `daily`, `weekly`, `monthly`, `all_time`. |
| `limit` | `number` | `10` | Number of records to return (max 100). |
| `offset` | `number` | `0` | Pagination offset. |
| `group_id`| `string` | - | Optional: Filter leaderboard entries by a specific group. |

## Response Structure

The API returns a paginated object containing an array of user rankings.

### Example Response
```json
{
  "data": [
    {
      "user": {
        "user_id": "uuid",
        "username": "jdoe",
        "first_name": "John",
        "last_name": "Doe",
        "avatar_url": "https://..."
      },
      "reading": 8.5,
      "listening": 7.0,
      "writing": 6.5,
      "overall": 7.5,
      "attemptsCount": 12
    }
  ],
  "total": 53,
  "limit": 20,
  "offset": 0
}
```

## Integration Examples

### TypeScript Interface
```typescript
interface LeaderboardUser {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface LeaderboardEntry {
  user: LeaderboardUser;
  reading: number;
  listening: number;
  writing: number;
  overall: number;
  attemptsCount: number;
}

interface LeaderboardResponse {
  data: LeaderboardEntry[];
  total: number;
  limit: number;
  offset: number;
}
```

### Fetch Example (React)
```tsx
const fetchLeaderboard = async (period = 'all_time') => {
  const response = await axios.get<LeaderboardResponse>(
    `/api/ielts-answers/leaderboard?period=${period}`
  );
  return response.data;
};
```

### Display Suggestions
- **Sortable Columns**: Since all section scores are present, you can easily allow users to sort the table by Reading, Listening, Writing, or Overall on the frontend without re-fetching.
- **Empty States**: If a user hasn't completed a section, the score will be `0`. You might want to display `-` or `N/A` in such cases.
