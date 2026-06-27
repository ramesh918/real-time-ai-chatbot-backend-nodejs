#!/bin/bash

# Real-Time AI Chat Backend — Demo Script
# This script demonstrates the full flow: sign up → create conversation → send message → receive
#
# Prerequisites:
# - Server running: docker-compose up (or npm run dev)
# - Tools: curl, websocat (install: cargo install websocat, or brew install websocat)
#
# Usage: bash DEMO.sh

set -e

BASE_URL="http://localhost:3000"
WS_URL="ws://localhost:3001"

echo "=== Real-Time AI Chat Backend Demo ==="
echo ""

# Step 1: Sign up
echo "Step 1: Sign up new user..."
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo_'$(date +%s)'@example.com",
    "password": "password123"
  }')

echo "Response: $SIGNUP_RESPONSE"
echo ""

# Extract tokens
ACCESS_TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
REFRESH_TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)
USER_ID=$(echo "$SIGNUP_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 | head -1)

echo "Access Token: ${ACCESS_TOKEN:0:20}..."
echo "User ID: $USER_ID"
echo ""

# Step 2: Create conversation
echo "Step 2: Create a new conversation..."
CONV_RESPONSE=$(curl -s -X POST "$BASE_URL/conversations" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo Conversation"
  }')

echo "Response: $CONV_RESPONSE"
echo ""

# Extract conversation ID
CONV_ID=$(echo "$CONV_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Conversation ID: $CONV_ID"
echo ""

# Step 3: Get message history (should be empty)
echo "Step 3: Fetch initial message history (should be empty)..."
HISTORY=$(curl -s -X GET "$BASE_URL/conversations/$CONV_ID/messages" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response: $HISTORY"
echo ""

# Step 4: Connect via WebSocket and send message
echo "Step 4: Connect via WebSocket and send a message..."
echo "Note: This requires 'websocat' tool. Install: cargo install websocat"
echo ""
echo "WebSocket URL: $WS_URL?token=$ACCESS_TOKEN&conversation_id=$CONV_ID"
echo ""

# Check if websocat is available
if command -v websocat &> /dev/null; then
  echo "Connecting to WebSocket and sending message..."

  # Send message and capture response
  RESPONSE=$(echo '{
    "type": "user_message",
    "content": "Hello, AI! How are you doing today?"
  }' | timeout 5 websocat "$WS_URL?token=$ACCESS_TOKEN&conversation_id=$CONV_ID" || true)

  echo "WebSocket Response:"
  echo "$RESPONSE" | head -20
  echo ""
else
  echo "websocat not found. Install it to test WebSocket:"
  echo "  cargo install websocat"
  echo ""
  echo "Or use Python to test:"
  echo ""
  cat << 'EOF'
python3 << 'PYTHON'
import asyncio
import websockets
import json

async def test():
    uri = "ws://localhost:3001?token=TOKEN&conversation_id=CONV_ID"
    async with websockets.connect(uri) as ws:
        # Receive history
        history = await asyncio.wait_for(ws.recv(), timeout=2)
        print("History:", history[:100])

        # Send message
        await ws.send(json.dumps({
            "type": "user_message",
            "content": "Hello!"
        }))

        # Receive responses (user message + assistant reply)
        for i in range(2):
            msg = await asyncio.wait_for(ws.recv(), timeout=2)
            print(f"Message {i+1}: {msg[:100]}")

asyncio.run(test())
PYTHON
EOF
fi

echo ""
echo "=== Step 5: Verify message persistence ==="
echo "Fetching conversation messages again (should now contain sent message)..."
MESSAGES=$(curl -s -X GET "$BASE_URL/conversations/$CONV_ID/messages" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response:"
echo "$MESSAGES" | head -50
echo ""

echo "=== Demo Complete ==="
echo ""
echo "Summary:"
echo "- Created user: $USER_ID"
echo "- Created conversation: $CONV_ID"
echo "- Message should be visible in history above"
echo ""
echo "Try these additional scenarios:"
echo ""
echo "1. Test JWT refresh:"
echo "  curl -X POST $BASE_URL/auth/refresh \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"refreshToken\":\"$REFRESH_TOKEN\"}'"
echo ""
echo "2. Update conversation name:"
echo "  curl -X PATCH $BASE_URL/conversations/$CONV_ID \\"
echo "    -H 'Authorization: Bearer $ACCESS_TOKEN' \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"name\":\"New Name\"}'"
echo ""
echo "3. List all conversations:"
echo "  curl $BASE_URL/conversations \\"
echo "    -H 'Authorization: Bearer $ACCESS_TOKEN'"
echo ""
echo "4. Connect two WebSocket clients to the same conversation:"
echo "   In terminal 1:"
echo "   websocat '$WS_URL?token=$ACCESS_TOKEN&conversation_id=$CONV_ID'"
echo "   In terminal 2:"
echo "   websocat '$WS_URL?token=$ACCESS_TOKEN&conversation_id=$CONV_ID'"
echo "   Send message in one, see it broadcast to both"
