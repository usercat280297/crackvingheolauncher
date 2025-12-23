#!/bin/bash
# Backend test script - test all endpoints after build is complete

echo "⏳ Waiting for popular games cache to be built..."
sleep 5

echo ""
echo "🧪 Testing Backend Endpoints"
echo "================================"

BASE_URL="http://localhost:3000"

# Start server
echo "🚀 Starting server..."
node server.js &
SERVER_PID=$!
sleep 3

echo ""
echo "1️⃣ Testing /api/search/stats endpoint"
echo "---"
curl -s "$BASE_URL/api/search/stats" | jq '.'

echo ""
echo "2️⃣ Testing /api/search/search?q=resident&limit=5"
echo "---"
curl -s "$BASE_URL/api/search/search?q=resident&limit=5" | jq '.results[] | {name, matchType, score}'

echo ""
echo "3️⃣ Testing /api/search/search?q=cyberpunk&limit=5"
echo "---"
curl -s "$BASE_URL/api/search/search?q=cyberpunk&limit=5" | jq '.results[] | {name, matchType, score}'

echo ""
echo "4️⃣ Testing /api/search/suggestions?q=half&limit=3"
echo "---"
curl -s "$BASE_URL/api/search/suggestions?q=half&limit=3" | jq '.suggestions[] | {name, matchType}'

echo ""
echo "✅ Backend tests complete!"

# Cleanup
kill $SERVER_PID 2>/dev/null
