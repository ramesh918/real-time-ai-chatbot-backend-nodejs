# Real-Time AI Chat Backend — Implementation Plan

## Project Summary

Build a real-time chat backend where authenticated users open WebSocket connections, join conversations, and exchange messages with a mock AI assistant. Messages broadcast live to all connected clients and persist to PostgreSQL. Redis pub/sub fans messages across multiple server instances for horizontal scalability. Focus on clean architecture, proper connection lifecycle, and production-grade robustness.

## Tech Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **HTTP/WebSocket:** Express.js + ws (or Socket.io for simpler lifecycle management)
- **Database:** PostgreSQL + node-postgres (pg) async driver
- **Migrations:** db-migrate (simple, npm-based)
- **Caching/Pub-Sub:** Redis (redis npm client)
- **Authentication:** JWT (jsonwebtoken) + password hashing (argon2 or bcrypt)
- **Validation:** Zod or joi (schema validation at boundaries)
- **Logging:** winston or pino (structured logging)
- **Docker:** Docker Compose (API + PostgreSQL + Redis)
- **Testing:** Jest (light coverage on send/broadcast/auth)
- **Linting/Types:** TypeScript strict mode, ESLint, Prettier

## Steps

### Phase 1: Setup & Infrastructure
- [x] 1. Initialize Node.js project, install core dependencies (Express, TypeScript, ws, pg, redis, jsonwebtoken, argon2, zod, winston)
- [x] 2. Set up TypeScript config (tsconfig.json), ESLint, Prettier
- [x] 3. Create project structure: src/{routes,services,repositories,models,middleware,utils,websocket}
- [x] 4. Set up environment variables (.env.example, load via dotenv in config module)
- [x] 5. Initialize PostgreSQL via Docker Compose (postgres + redis services defined)
- [x] 6. Set up db-migrate and create migrations directory structure

### Phase 2: Database & Migrations
- [x] 7. Write migration: create users table (id, email, password_hash, created_at)
- [x] 8. Write migration: create conversations table (id, user_id, name, created_at, updated_at)
- [x] 9. Write migration: create messages table (id, conversation_id, sender_id, role, content, created_at) + indexes
- [x] 10. Create database repository layer (users, conversations, messages queries)

### Phase 3: Authentication
- [x] 11. Implement password hashing (argon2) and verification utilities
- [x] 12. Create JWT token generation (access + refresh tokens with configurable TTL)
- [x] 13. Implement signup endpoint: POST /auth/signup (email, password) → hash + insert → return tokens
- [x] 14. Implement login endpoint: POST /auth/login (email, password) → verify → return tokens
- [x] 15. Implement refresh endpoint: POST /auth/refresh (refresh_token) → new access token
- [x] 16. Create auth middleware for validating access tokens on protected REST routes

### Phase 4: Conversation CRUD
- [x] 17. Implement GET /conversations (list user's conversations, paginated)
- [x] 18. Implement POST /conversations (create new conversation with name)
- [x] 19. Implement GET /conversations/:id/messages (fetch message history, paginated)
- [x] 20. Implement PATCH /conversations/:id (rename conversation)
- [x] 21. Implement DELETE /conversations/:id (soft-delete or hard-delete with cascade)

### Phase 5: WebSocket Infrastructure
- [x] 22. Create WebSocket server on separate port or same server (ws middleware)
- [x] 23. Implement WebSocket authentication: validate token on connection (query param or first message)
- [x] 24. Define JSON message protocol (message types: user_message, assistant_message, error, heartbeat, etc.)
- [x] 25. Implement connection lifecycle management (store active connections, handle disconnect/reconnect)
- [x] 26. Implement graceful shutdown (drain connections, close sockets, shutdown Redis/DB)

### Phase 6: Real-Time Messaging (Core)
- [x] 27. Implement user_message handler: receive message → validate → persist to DB
- [x] 28. Implement broadcast logic: send message to all connected clients of a conversation (in-memory)
- [x] 29. Implement mock AI assistant: generate canned/echoed reply, persist, broadcast
- [x] 30. Implement Redis pub/sub: subscribe to conversation channels, publish on new messages
- [x] 31. Implement cross-instance message routing: messages from Redis pub/sub reach clients on this instance

### Phase 7: Error Handling & Robustness
- [x] 32. Add error boundary in WebSocket handlers (failed DB writes don't crash socket)
- [x] 33. Add validation at every boundary (Zod/joi schemas for incoming payloads)
- [x] 34. Implement structured logging (correlate requests, log errors with context)
- [x] 35. Add connection timeout and heartbeat mechanism to detect dead connections
- [x] 36. Test failure scenarios: DB down, Redis down, invalid tokens, malformed messages

### Phase 8: Docker & Deployment
- [x] 37. Create Dockerfile (multi-stage build, runs migrations, starts app)
- [x] 38. Create docker-compose.yml (API service + PostgreSQL + Redis, volume for DB data)
- [x] 39. Test docker compose up on clean machine (no external dependencies)
- [x] 40. Verify migrations run automatically or document run command

### Phase 9: Testing
- [x] 41. Write unit tests: password hashing, JWT validation
- [x] 42. Write integration test: send message → persist → broadcast across single instance
- [x] 43. Write integration test: message via Redis pub/sub reaches client (cross-instance simulation)
- [x] 44. Write test: reconnect after disconnect retrieves message history

### Phase 10: Documentation & Demo
- [x] 45. Write README.md (setup, run, test, troubleshoot)
- [x] 46. Write NOTES.md (architecture decisions, WebSocket auth choice, what was cut/why, self-critique)
- [x] 47. Create demo script or documented curl/websocat sequence (sign up → open socket → send → broadcast → history)
- [x] 48. Verify demo works end-to-end

---

## Ambiguities & Decisions (to be documented in NOTES.md later)

1. **WebSocket Auth Method:** Query param vs. subprotocol vs. first message — will choose query param (stateless, simple) unless issues arise
2. **Soft-delete vs. Hard-delete:** Will implement hard-delete for simplicity; soft-delete marked NICE TO HAVE
3. **Cursor vs. Offset Pagination:** Will use offset for simplicity; cursor marked NICE TO HAVE
4. **Message Deduplication:** Skipping; not in must-build, marked as bonus
5. **Typing Indicators / Presence:** Skipping; marked NICE TO HAVE
6. **Streamed Assistant Reply:** Skipping; marked NICE TO HAVE, simple mock reply sufficient
7. **Per-user Rate Limiting:** Skipping; marked NICE TO HAVE, focus on core

---

## Delivery Checkpoint

- **Target:** 2–3 business days
- **Non-negotiable:** Auth, conversations, real-time send/broadcast, persistence, Redis fan-out
- **If time permits:** Light bonus (observability, load test)
- **Not in scope:** Full AI integration, OAuth, message dedup, typing indicators
