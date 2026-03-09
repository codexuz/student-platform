# Group Chat Module - Frontend Usage Guide

This guide provides the necessary information for integrating the Group Chat module into a frontend application. It covers authentication, REST API endpoints, and WebSocket real-time communication.

## Authentication

All requests (REST and WebSocket) require a valid JWT token.

- **REST API**: Include the token in the `Authorization` header: `Authorization: Bearer <your_jwt_token>`
- **WebSocket**: Send the token in the `auth.token` field during connection or in the handshake headers.

---

## Media Handling (Images, Audio, Files, Videos)

Handling non-text content in the chat is a **two-step process**:

1.  **Upload the file**: Use the `Upload` API to upload the file and obtain a public URL.
2.  **Send the message**: Send a chat message with the obtained URL as the `content` and set the `message_type` accordingly.

### Step 1: Uploading a File
**Endpoint**: `POST /upload`  
**Content-Type**: `multipart/form-data`  
**Payload**: `file: <File Object>`

**Response Example**:
```json
{
  "id": "upload-uuid",
  "url": "https://s3.amazonaws.com/bucket/uploads/image.jpg",
  "mimeType": "image/jpeg"
}
```

*Note: For large videos, use `POST /upload/video` instead.*

### Step 2: Sending the Media Message
Once you have the URL, send it as the `content` in a regular message.

**REST Example**:
```http
POST /group-chat/:groupId/messages
{
  "content": "https://s3.amazonaws.com/bucket/uploads/image.jpg",
  "message_type": "image"
}
```

**WebSocket Example**:
```typescript
socket.emit("sendGroupMessage", {
  groupId: "group-uuid",
  content: "https://s3.amazonaws.com/bucket/uploads/recording.mp3",
  message_type: "audio"
});
```

---

## REST API Reference

### Group Chat Management

| Endpoint | Method | Description | Roles |
| :--- | :--- | :--- | :--- |
| `/group-chat` | `POST` | Create a new group chat | Student, Teacher, Admin |
| `/group-chat` | `GET` | Get all group chats for the user | Student, Teacher, Admin |
| `/group-chat/:id` | `GET` | Get details of a specific group chat | Member |
| `/group-chat/:id` | `PATCH` | Update group chat details | Admin, Teacher |
| `/group-chat/:id` | `DELETE` | Delete a group chat | Admin |

### Message Management

| Endpoint | Method | Description | Roles |
| :--- | :--- | :--- | :--- |
| `/group-chat/:groupId/messages` | `POST` | Send a message to a group | Member |
| `/group-chat/:groupId/messages` | `GET` | Get messages from a group (paginated) | Member |
| `/group-chat/messages/:messageId` | `PATCH` | Update a message | Message Owner |
| `/group-chat/messages/:messageId` | `DELETE` | Delete a message | Message Owner, Group Admin |

### Member Management

| Endpoint | Method | Description | Roles |
| :--- | :--- | :--- | :--- |
| `/group-chat/:groupId/members` | `POST` | Add a member to the group | Admin, Teacher |
| `/group-chat/:groupId/members` | `GET` | Get all members of a group | Member |
| `/group-chat/:groupId/members/:memberId/role` | `PATCH` | Update a member's role | Admin |
| `/group-chat/:groupId/members/:memberId` | `DELETE` | Remove a member or leave group | Admin (for others), Self |

---

## WebSocket API Reference

The WebSocket gateway is available at the `/chat` namespace on port `3000`.

### Connection
- **Namespace**: `/chat`
- **Authentication**: Pass JWT token in `auth` or `headers.authorization`.

### Client-to-Server Events (Emit)

| Event | Payload | Description |
| :--- | :--- | :--- |
| `joinGroupChat` | `{ "groupId": string }` | Join the real-time room for a group chat. |
| `leaveGroupChat` | `{ "groupId": string }` | Leave the real-time room for a group chat. |
| `sendGroupMessage` | `{ "groupId": string, "content": string, "message_type"?: string }` | Send a message to the group. |
| `groupTyping` | `{ "groupId": string, "isTyping": boolean }` | Signal that the user is typing/stopped typing. |
| `getGroupMembers` | `{ "groupId": string }` | Request the current list of group members with online status. |
| `deleteGroupMessage` | `{ "messageId": string, "groupId": string }` | Delete a message in real-time. |

### Server-to-Client Events (Listen)

| Event | Payload | Description |
| :--- | :--- | :--- |
| `groupMessage` | `GroupChatMessage` object | Received when a new message is sent to a group you've joined. |
| `group-user-typing` | `{ "user": object, "groupId": string, "isTyping": boolean }` | Received when a member starts/stops typing. |
| `member-online` | `{ "user": object, "groupId": string }` | Received when a member joins the group chat room. |
| `member-offline` | `{ "user": object, "groupId": string }` | Received when a member leaves the group chat room. |
| `group-members` | `{ "groupId": string, "members": array }` | Response to `getGroupMembers`. |
| `messageDeleted` | `{ "messageId": string, "groupId": string, "deletedBy": object }` | Received when a message is deleted. |
| `error` | `{ "message": string }` | Received when an error occurs. |

---

## Usage Example (TypeScript)

```typescript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000/chat", {
  auth: { token: "your_jwt_token" }
});

// Join a group
socket.emit("joinGroupChat", { groupId: "group-uuid" });

// Listen for messages
socket.on("groupMessage", (message) => {
  console.log("New message:", message.content);
});

// Send a message
socket.emit("sendGroupMessage", {
  groupId: "group-uuid",
  content: "Hello Group!",
  message_type: "text"
});

// Signal typing
socket.emit("groupTyping", { groupId: "group-uuid", isTyping: true });
```
