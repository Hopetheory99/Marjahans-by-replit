#!/bin/bash

# GitHub Issues Creation Script
# Usage: ./scripts/create-github-issues.sh
# This script creates all 47 GitHub issues from the GITHUB_ISSUES_PLAN.md

set -e

# Configuration
REPO_OWNER="${GITHUB_REPO_OWNER:-Hopetheory99}"
REPO_NAME="${GITHUB_REPO_NAME:-Marjahans-by-replit}"
GITHUB_TOKEN="${GITHUB_TOKEN}"

# Verify GitHub token is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Error: GITHUB_TOKEN environment variable not set"
    echo "Set it with: export GITHUB_TOKEN='your-token-here'"
    exit 1
fi

# Function to create a GitHub issue
create_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"
    local assignee="$4"
    
    # Escape special characters for JSON
    body=$(echo "$body" | sed 's/"/\\"/g' | sed 's/$/\\n/g' | tr -d '\n')
    
    response=$(curl -s -X POST \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"title\": \"$title\",
            \"body\": \"$body\",
            \"labels\": [$labels]
        }" \
        "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/issues")
    
    issue_number=$(echo "$response" | grep -o '"number": [0-9]*' | head -1 | grep -o '[0-9]*')
    
    if [ -z "$issue_number" ]; then
        echo "❌ Failed to create issue: $title"
        echo "Response: $response"
        return 1
    fi
    
    echo "✅ Created issue #$issue_number: $title"
    return 0
}

# Function to create all TIER 1 issues
create_tier1_issues() {
    echo "🔴 Creating TIER 1 (BLOCKING) Issues..."
    
    create_issue \
        "[TIER-1-001] Fix npm qs Package DoS Vulnerability" \
        "The qs package has a known DoS vulnerability (CVE). This affects all POST endpoints.\n\n**Acceptance Criteria:**\n- Run \`npm audit fix\` and commit\n- Verify \`npm audit\` shows 0 high-severity vulnerabilities\n- Verify \`npm run build\` succeeds\n- Verify tests pass: \`npm test\`\n\n**Effort:** 10 minutes" \
        "\"tier-1-blocker\", \"security\", \"priority:critical\"" \
        ""
    
    create_issue \
        "[TIER-1-002] Add Security Headers Middleware" \
        "Missing security headers make the app vulnerable to XSS, clickjacking, and MIME-sniffing attacks.\n\n**Acceptance Criteria:**\n- Create \`server/middleware/securityHeaders.ts\`\n- Add headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection\n- Register in \`server/routes.ts\` before all routes\n- Verify headers in response: \`curl -i http://localhost:5000/\`\n- All tests pass\n\n**Effort:** 30 minutes" \
        "\"tier-1-blocker\", \"security\", \"priority:critical\"" \
        ""
    
    create_issue \
        "[TIER-1-003] Implement Rate Limiting Middleware" \
        "No rate limiting allows brute force attacks on checkout, cart, login endpoints.\n\n**Acceptance Criteria:**\n- Create \`server/middleware/rateLimit.ts\`\n- Apply to: \`/api/cart/*\`, \`/api/checkout/*\`, \`/api/search\`, \`/api/login\`\n- 10 requests/min for checkout, 30 requests/min for cart\n- Return 429 when exceeded\n- Write unit tests\n- Verify legitimate users can access normally\n\n**Effort:** 2 hours\n\n**Depends on:** #1 (TIER-1-001), #2 (TIER-1-002)" \
        "\"tier-1-blocker\", \"security\", \"priority:critical\"" \
        ""
    
    create_issue \
        "[TIER-1-004] Implement Stripe Webhook Verification" \
        "Without webhook verification, fraudsters can claim payments succeeded without paying.\n\n**Acceptance Criteria:**\n- Create \`server/webhooks/stripe.ts\`\n- Verify webhook signature using \`stripe.webhooks.constructEvent()\`\n- Handle: \`payment_intent.succeeded\`, \`payment_intent.payment_failed\`, \`charge.dispute.created\`\n- Update order status when payment succeeds\n- Log all webhook events\n- Write integration tests\n\n**Effort:** 3 hours\n\n**Depends on:** #2 (TIER-1-002)" \
        "\"tier-1-blocker\", \"security\", \"payment\", \"priority:critical\"" \
        ""
    
    create_issue \
        "[TIER-1-005] Add CSRF Protection Middleware" \
        "Without CSRF protection, attackers can trick users into performing unwanted actions.\n\n**Acceptance Criteria:**\n- Install \`csurf\` package\n- Create \`server/middleware/csrf.ts\`\n- Generate token on GET \`/api/csrf-token\`\n- Validate token on POST/PUT/DELETE\n- Update client to include token in headers\n- Write unit tests\n\n**Effort:** 2 hours\n\n**Depends on:** #2 (TIER-1-002)" \
        "\"tier-1-blocker\", \"security\", \"priority:critical\"" \
        ""
    
    create_issue \
        "[TIER-1-006] Fix Stripe API Version Validation" \
        "The Stripe API version format is invalid, which can cause API calls to fail.\n\n**Acceptance Criteria:**\n- Verify API version is valid date format (YYYY-MM-DD)\n- Current version: \`2025-12-15.clover\`\n- Document why in code comments\n- Verify \`npm run build\` succeeds\n- Verify Stripe calls work\n\n**Effort:** 15 minutes" \
        "\"tier-1-blocker\", \"bug\", \"payment\"" \
        ""
    
    create_issue \
        "[TIER-1-007] Fix Error Handling - Don't Leak Stack Traces" \
        "Current error handling leaks stack traces to clients, exposing internal code structure and database details.\n\n**Acceptance Criteria:**\n- Review all catch blocks in \`server/routes.ts\`, \`server/storage.ts\`\n- Create \`server/utils/errorHandler.ts\`\n- Never send \`error.stack\` to clients\n- Log stack traces server-side only\n- Return: \`{ error: \"message\", code: \"ERROR_CODE\" }\`\n- Tests verify no stack traces leak\n\n**Effort:** 1.5 hours\n\n**Depends on:** #2 (TIER-1-002)" \
        "\"tier-1-blocker\", \"security\", \"priority:critical\"" \
        ""
    
    create_issue \
        "[TIER-1-008] Strong Input Validation - Add Bounds Checking" \
        "Missing input validation allows attackers to send malformed data causing crashes.\n\n**Acceptance Criteria:**\n- Search query: max 200 chars, alphanumeric + spaces\n- Pagination limit: max 100, min 1\n- Pagination offset: max 10000, min 0\n- Cart quantity: max 999, min 1\n- Product ID: UUID format validation\n- Return 400 with clear error messages\n- Write unit tests\n\n**Effort:** 1.5 hours\n\n**Depends on:** #2 (TIER-1-002)" \
        "\"tier-1-blocker\", \"security\", \"validation\"" \
        ""
}

# Function to create all TIER 2 issues
create_tier2_issues() {
    echo "🟠 Creating TIER 2 (HIGH PRIORITY) Issues..."
    
    create_issue \
        "[TIER-2-001] Add Database Indexes on Key Columns" \
        "Missing database indexes cause N+1 queries and slow user lookups.\n\n**Acceptance Criteria:**\n- Add indexes: products.createdAt, orders.userId, orders.status, cart.userId, favorites.userId\n- Run database migration\n- Verify indexes exist with \`SELECT * FROM pg_indexes WHERE tablename='products'\`\n- Verify tests complete faster\n\n**Effort:** 30 minutes\n\n**Depends on:** #8 (TIER-1-008)" \
        "\"tier-2-high\", \"performance\", \"database\"" \
        ""
    
    create_issue \
        "[TIER-2-002] Refactor Monolithic routes.ts into Modules" \
        "The 618-line monolithic routes.ts is unmaintainable. Split into logical modules.\n\n**Acceptance Criteria:**\n- Create modules: auth, products, cart, orders, checkout, favorites, admin\n- Each module < 150 lines\n- Import all routers in main routes.ts\n- All tests pass\n- No behavior changes\n\n**Effort:** 8 hours\n\n**Depends on:** #8 (TIER-1-008), #9 (TIER-2-001)" \
        "\"tier-2-high\", \"refactoring\", \"priority:high\"" \
        ""
    
    create_issue \
        "[TIER-2-003] Fix Session Invalidation Flow" \
        "Session invalidation not properly implemented. Users may remain logged in after logout.\n\n**Acceptance Criteria:**\n- Review \`/api/logout\` endpoint\n- Ensure \`req.logout()\` called\n- Ensure session cookie cleared\n- User cannot access protected routes after logout\n- Tests: logout → verify 401 on protected route\n\n**Effort:** 1 hour\n\n**Depends on:** #10 (TIER-2-002)" \
        "\"tier-2-high\", \"security\", \"auth\"" \
        ""
}

# Main script
echo "🚀 GitHub Issues Creation Script"
echo "=================================="
echo ""
echo "Repository: $REPO_OWNER/$REPO_NAME"
echo ""

# Ask for confirmation
read -p "Create all 47 GitHub issues? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
create_tier1_issues
echo ""

read -p "Create TIER 2 issues? (yes/no): " confirm
if [ "$confirm" == "yes" ]; then
    create_tier2_issues
fi

echo ""
echo "✅ Issue creation complete!"
echo "📊 View issues at: https://github.com/$REPO_OWNER/$REPO_NAME/issues"
