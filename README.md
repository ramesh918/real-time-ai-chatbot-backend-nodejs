# Real-Time AI Chat Backend

A production-grade real-time chat backend built with Node.js, Express, WebSocket, PostgreSQL, and Redis. Users can authenticate, create conversations, send messages in real-time, and see responses from a mock AI assistant. Messages are persisted to PostgreSQL and broadcast to all connected clients via Redis pub/sub for horizontal scalability.

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (for full stack)
- PostgreSQL 16+ (or use docker-compose)
- Redis 7+ (or use docker-compose)

### Option 1: Full Stack with Docker Compose

```bash
# Start all services (API, PostgreSQL, Redis)
docker-compose up

# Migrations run automatically, API starts on http://localhost:3000
# WebSocket on ws://localhost:3001
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Create PostgreSQL database
createdb chatbot_db

# Run migrations
npm run migrate

# Start development server
npm run dev
```

## Architecture

```
src/
├── index.ts                 # Main entry point
├── config.ts                # Environment configuration
├── middleware/              # Express middleware (auth)
├── routes/                  # API endpoints (auth, conversations)
├── services/                # Business logic layer
├── repositories/            # Database access layer
├── models/                  # TypeScript types
├── websocket/               # WebSocket server & handlers
│   ├── server.ts           # WS server setup
│   ├── ConnectionManager.ts # Active connection tracking
│   ├── RedisManager.ts     # Redis pub/sub
│   └── WebSocketHandler.ts # Message handling logic
└── utils/                   # Utilities (db, jwt, password, logging)
```

## API Endpoints

### Authentication

- **POST** `/auth/signup` - Sign up with email/password
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
  Response: `{ accessToken, refreshToken, user }`

- **POST** `/auth/login` - Log in with email/password
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- **POST** `/auth/refresh` - Get new access token
  ```json
  {
    "refreshToken": "refresh-token-here"
  }
  ```

### Conversations (Requires `Authorization: Bearer <token>` header)

- **GET** `/conversations?limit=20&offset=0` - List user's conversations
- **POST** `/conversations` - Create conversation
  ```json
  { "name": "My Conversation" }
  ```

- **GET** `/conversations/:id/messages?limit=50&offset=0` - Fetch message history
- **PATCH** `/conversations/:id` - Rename conversation
  ```json
  { "name": "New Name" }
  ```

- **DELETE** `/conversations/:id` - Delete conversation

### WebSocket Real-Time Messaging

**Connect:**
```
ws://localhost:3001?token=<ACCESS_TOKEN>&conversation_id=<CONVERSATION_ID>
```

**Message Protocol:**

Incoming (client → server):
```json
{
  "type": "user_message",
  "content": "Hello, AI!"
}
```

Outgoing (server → client):
```json
{
  "type": "user_message",
  "id": "msg-uuid",
  "conversation_id": "conv-uuid",
  "sender_id": "user-uuid",
  "role": "user",
  "content": "Hello, AI!",
  "timestamp": "2026-06-27T10:00:00Z"
}
```

Heartbeat:
```json
{
  "type": "heartbeat",
  "timestamp": "2026-06-27T10:00:00Z"
}
```

History (on connection):
```json
{
  "type": "history",
  "messages": [...]
}
```

## Testing

### Run Tests

```bash
# Install test framework
npm install --save-dev jest @types/jest ts-jest

# Run unit tests
npm test

# Run with coverage
npm test -- --coverage
```

### Test Scenarios

#### Scenario 1: Sign Up → Create Conversation → Send Message

```bash
# 1. Sign up
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Response:
# {
#   "accessToken": "eyJ...",
#   "refreshToken": "eyJ...",
#   "user": { "id": "uuid", "email": "test@example.com" }
# }

# 2. Create conversation (use accessToken from above)
curl -X POST http://localhost:3000/conversations \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Chat"}'

# Response: { "id": "conv-uuid", "user_id": "...", "name": "My Chat", ... }

# 3. Connect WebSocket and send message
# ws://localhost:3001?token=<accessToken>&conversation_id=<conv-uuid>
# Send: { "type": "user_message", "content": "Hello!" }
# Receive: user message + assistant echo back
```

#### Scenario 2: Cross-Instance Message Broadcast

```bash
# 1. Connect to instance A with token & conversation_id
# 2. Connect to instance B with same token & conversation_id (in separate connection)
# 3. Send message on instance A
# Result: Message appears on both instances via Redis pub/sub
```

#### Scenario 3: Reconnect & Retrieve History

```bash
# 1. Send message, then disconnect
# 2. Reconnect with same token & conversation_id
# 3. Receive history on reconnection (proves persistence)
```

## Configuration

Environment variables (`.env`):

```env
# Server
NODE_ENV=development
API_HOST=0.0.0.0
API_PORT=3000
WS_PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=chatbot_user
DB_PASSWORD=changeme
DB_NAME=chatbot_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# JWT (CHANGE IN PRODUCTION)
JWT_ACCESS_SECRET=dev-secret-change-me
JWT_REFRESH_SECRET=dev-refresh-secret-change-me
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Logging
LOG_LEVEL=info
```

## Database Migrations

Migrations are run automatically on startup. To create a new migration:

```bash
npm run migrate:create -- <migration-name>
```

Migrations use db-migrate + PostgreSQL. See `migrations/` directory.

## Error Handling

All errors return consistent JSON format:
```json
{ "error": "Error description" }
```

No stack traces are sent to clients. All errors are logged server-side with context.

## Security

- ✅ Passwords hashed with Argon2
- ✅ JWT tokens (access + refresh)
- ✅ WebSocket token validation on every connection
- ✅ Environment secrets (never committed)
- ✅ SQL injection prevention (parameterized queries)
- ✅ No sensitive data in logs
- ✅ CORS headers can be configured

## Performance & Scalability

- **Async/await throughout** - no blocking calls in event loop
- **Connection pooling** - PostgreSQL pg library
- **Redis pub/sub** - scales to multiple app instances
- **Heartbeat mechanism** - detects and removes dead connections
- **Structured logging** - request correlation for debugging

## Troubleshooting

### "Cannot connect to database"
- Ensure PostgreSQL is running: `docker-compose up postgres`
- Check `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` in `.env`
- Run migrations: `npm run migrate`

### "Redis connection failed"
- Ensure Redis is running: `docker-compose up redis`
- Check `REDIS_HOST`, `REDIS_PORT` in `.env`

### "WebSocket connection refused"
- Ensure server is running on correct port (default 3001)
- Check token is valid and not expired
- Verify `conversation_id` exists and user owns it

### "Messages not persisting"
- Check database connection and migrations ran
- Verify `messages` table exists: `\d messages` in psql
- Check server logs for errors

## Development

```bash
# Watch and rebuild on changes
npm run dev

# Type checking
npx tsc --noEmit

# Linting
npx eslint src/

# Format code
npx prettier --write src/
```

## Deployment

### Docker Compose
```bash
docker-compose up -d
# Services run in background
# Logs: docker-compose logs -f api
```

### Single Command Testing
```bash
# Pull latest, rebuild, run
docker-compose down && docker-compose up --build
```

## Next Steps

See `NOTES.md` for architecture decisions, what was cut, and future improvements.
