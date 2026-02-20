#!/bin/bash

echo "================================================"
echo "Firebase Phone Auth Testing Script"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if Firebase is configured
echo -e "${YELLOW}Test 1: Checking Firebase configuration...${NC}"
response=$(curl -s http://localhost:5001/api/phone-auth/status)
echo "Response: $response"
if echo "$response" | grep -q "configured.*true"; then
    echo -e "${GREEN}✅ Firebase is configured${NC}"
else
    echo -e "${RED}❌ Firebase is not configured${NC}"
fi
echo ""

# Test 2: Check backend health
echo -e "${YELLOW}Test 2: Checking backend health...${NC}"
response=$(curl -s http://localhost:5001/health)
echo "Response: $response"
if echo "$response" | grep -q "ok"; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend is not responding${NC}"
fi
echo ""

# Test 3: Check frontend
echo -e "${YELLOW}Test 3: Checking frontend...${NC}"
response=$(curl -s http://localhost:3000/ | head -1)
if echo "$response" | grep -q "DOCTYPE"; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${RED}❌ Frontend is not responding${NC}"
fi
echo ""

echo "================================================"
echo "Manual Testing Instructions:"
echo "================================================"
echo ""
echo "1. Open browser: http://localhost:3000/test-phone-auth"
echo ""
echo "2. Test Phone Numbers:"
echo "   - Phone: +91 9999999999"
echo "   - OTP Code: 123456"
echo ""
echo "   - Phone: +1 650-555-1234"
echo "   - OTP Code: 123456"
echo ""
echo "3. Expected Flow:"
echo "   a) Enter phone number"
echo "   b) Click 'Send OTP'"
echo "   c) Enter OTP code: 123456"
echo "   d) Click 'Verify OTP'"
echo "   e) See user authenticated!"
echo ""
echo "================================================"
echo "API Endpoints Available:"
echo "================================================"
echo ""
echo "POST /api/phone-auth/verify"
echo "  Body: { firebaseIdToken, phoneNumber }"
echo "  Returns: { user, accessToken, refreshToken }"
echo ""
echo "POST /api/phone-auth/link"
echo "  Body: { firebaseIdToken, phoneNumber }"
echo "  Headers: { Authorization: Bearer <token> }"
echo "  Returns: { user }"
echo ""
echo "GET /api/phone-auth/status"
echo "  Returns: { configured: true/false }"
echo ""
echo "================================================"
