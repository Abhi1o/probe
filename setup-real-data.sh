#!/bin/bash

# ============================================
# PROBE PLATFORM - REAL DATA SETUP SCRIPT
# ============================================
# This script helps you set up real Solana data monitoring
# ============================================

set -e

echo "🚀 Probe Platform - Real Data Setup"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backend is running
echo "📡 Checking if backend is running..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is not running${NC}"
    echo ""
    echo "Please start the backend first:"
    echo "  cd backend && npm run start:dev"
    echo ""
    exit 1
fi

echo ""
echo "🔐 Logging in..."

# Login and get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@probe.dev","password":"admin123"}' \
  | jq -r '.accessToken')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Login failed${NC}"
    echo "Please check if backend is running and credentials are correct"
    exit 1
fi

echo -e "${GREEN}✅ Logged in successfully${NC}"
echo ""

# Check existing programs
echo "📊 Checking existing programs..."
PROGRAM_COUNT=$(curl -s http://localhost:3000/api/v1/programs \
  -H "Authorization: Bearer $TOKEN" \
  | jq '. | length')

echo "Found $PROGRAM_COUNT programs in database"
echo ""

# Show existing programs
echo "📋 Current programs:"
curl -s http://localhost:3000/api/v1/programs \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.[] | "  - \(.name) (\(.programId)) - Network: \(.network)"'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Ask if user wants to add a new program
echo "Would you like to add a new program to monitor? (y/n)"
read -r ADD_PROGRAM

if [ "$ADD_PROGRAM" == "y" ] || [ "$ADD_PROGRAM" == "Y" ]; then
    echo ""
    echo "🎯 Popular Solana Programs:"
    echo ""
    echo "1. Jupiter Aggregator (Very Active)"
    echo "   ID: JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB"
    echo ""
    echo "2. Orca Whirlpool"
    echo "   ID: whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc"
    echo ""
    echo "3. Marinade Finance"
    echo "   ID: MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD"
    echo ""
    echo "4. Metaplex"
    echo "   ID: metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    echo ""
    echo "5. Custom (Enter your own)"
    echo ""
    echo "Select an option (1-5):"
    read -r OPTION

    case $OPTION in
        1)
            PROGRAM_NAME="Jupiter Aggregator"
            PROGRAM_ID="JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB"
            PROGRAM_DESC="Jupiter swap aggregator - very active DeFi program"
            ;;
        2)
            PROGRAM_NAME="Orca Whirlpool"
            PROGRAM_ID="whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc"
            PROGRAM_DESC="Orca concentrated liquidity AMM"
            ;;
        3)
            PROGRAM_NAME="Marinade Finance"
            PROGRAM_ID="MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD"
            PROGRAM_DESC="Marinade liquid staking protocol"
            ;;
        4)
            PROGRAM_NAME="Metaplex"
            PROGRAM_ID="metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
            PROGRAM_DESC="Metaplex NFT standard"
            ;;
        5)
            echo ""
            echo "Enter program name:"
            read -r PROGRAM_NAME
            echo "Enter program ID:"
            read -r PROGRAM_ID
            echo "Enter description (optional):"
            read -r PROGRAM_DESC
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            exit 1
            ;;
    esac

    echo ""
    echo "📝 Adding program: $PROGRAM_NAME"
    echo "   ID: $PROGRAM_ID"
    echo ""

    # Add program
    RESULT=$(curl -s -X POST http://localhost:3000/api/v1/programs \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"$PROGRAM_NAME\",
        \"programId\": \"$PROGRAM_ID\",
        \"network\": \"mainnet-beta\",
        \"description\": \"$PROGRAM_DESC\"
      }")

    if echo "$RESULT" | jq -e '.id' > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Program added successfully!${NC}"
        NEW_PROGRAM_ID=$(echo "$RESULT" | jq -r '.id')
        echo "   Database ID: $NEW_PROGRAM_ID"
    else
        echo -e "${RED}❌ Failed to add program${NC}"
        echo "$RESULT" | jq '.'
        exit 1
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⏳ Waiting for indexer to fetch transactions..."
echo "   (The indexer runs every 10 seconds)"
echo ""

# Wait for indexer
for i in {1..3}; do
    echo "   Waiting... $((i*10)) seconds"
    sleep 10
done

echo ""
echo "📊 Checking transaction counts..."
echo ""

# Show transaction counts
curl -s http://localhost:3000/api/v1/programs \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.[] | "  \(.name): \(._count.transactions) transactions"'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Open the frontend:"
echo "   http://localhost:3001"
echo ""
echo "2. Login with:"
echo "   Email: admin@probe.dev"
echo "   Password: admin123"
echo ""
echo "3. View your programs and real transactions!"
echo ""
echo "4. The indexer will continue fetching new transactions every 10 seconds"
echo ""
echo "📚 For more information, see:"
echo "   - REAL-DATA-SETUP-GUIDE.md"
echo "   - QUICK-REFERENCE.md"
echo ""
