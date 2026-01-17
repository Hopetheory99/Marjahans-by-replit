# GitHub Issues Creation Plan - Marjahans E-Commerce Project

**Purpose:** Decompose 107 identified issues into actionable GitHub issues for parallel resolution by multiple AI platform coders

**Date Created:** January 17, 2026  
**Total Issues to Create:** 47 GitHub issues (consolidating related findings)  
**Estimated Timeline:** 4-6 weeks (240+ hours)  
**Production Readiness Target:** 70%+ (currently at 10%)

---

## 📋 Issues Organization Strategy

### Priority Tier Breakdown

| Tier | Category | Issues | Effort | Timeline | Deployment Blocker |
|------|----------|--------|--------|----------|------------------|
| **1** | 🔴 BLOCKING | 8 issues | 8 hrs | Day 1-2 | YES - MUST FIX FIRST |
| **2** | 🟠 HIGH | 12 issues | 12 hrs | Week 1 | YES - before staging |
| **3** | 🟡 MEDIUM | 15 issues | 25 hrs | Week 2-3 | NO - but recommended |
| **4** | 🔵 DEPLOY | 8 issues | 30 hrs | Week 3-4 | YES - infrastructure |
| **5** | 🟢 POLISH | 4 issues | 15+ hrs | Week 5-6 | NO - post-launch |

---

## 🚀 TIER 1: BLOCKING ISSUES (Day 1-2)

**These 8 issues must be resolved before ANY deployment. Work them first.**

### TIER-1-001: Fix npm qs Package DoS Vulnerability
- **Priority:** 🔴 CRITICAL
- **Effort:** 10 minutes
- **Acceptance Criteria:**
  - ✅ Run `npm audit fix` and commit changes
  - ✅ Verify `npm audit` shows 0 high-severity vulnerabilities
  - ✅ Verify `npm run build` still succeeds
  - ✅ Run test suite: `npm test` passes all 31 tests
- **Description:** The qs package (dependency via body-parser → express) has a known DoS vulnerability (CVE). This affects all POST endpoints that parse request bodies (cart, checkout, search).
- **Files Affected:** `package-lock.json`, `package.json`
- **Dependencies:** None (immediate fix)
- **Suggested Assigned To:** AI-Coder-1 (quick win)

### TIER-1-002: Add Security Headers Middleware
- **Priority:** 🔴 CRITICAL
- **Effort:** 30 minutes
- **Acceptance Criteria:**
  - ✅ Create `server/middleware/securityHeaders.ts` with middleware function
  - ✅ Add these headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
  - ✅ Register middleware in `server/routes.ts` before all routes
  - ✅ Verify headers present in response: `curl -i http://localhost:5000/`
  - ✅ All tests still pass
- **Description:** Missing security headers make app vulnerable to XSS, clickjacking, and MIME-sniffing attacks. Add standard security headers via Express middleware.
- **Files Affected:** `server/middleware/securityHeaders.ts` (new), `server/routes.ts`
- **Dependencies:** TIER-1-001
- **Suggested Assigned To:** AI-Coder-1 or AI-Coder-2

### TIER-1-003: Implement Rate Limiting Middleware
- **Priority:** 🔴 CRITICAL
- **Effort:** 2 hours
- **Acceptance Criteria:**
  - ✅ Create `server/middleware/rateLimit.ts` with express-rate-limit or custom implementation
  - ✅ Apply strict rate limiting to: `/api/cart/*`, `/api/checkout/*`, `/api/search`, `/api/login`
  - ✅ Configuration: 10 requests/minute per IP for checkout, 30 requests/minute for cart
  - ✅ Return 429 (Too Many Requests) when exceeded with clear message
  - ✅ Write unit tests for rate limit enforcement
  - ✅ Verify legitimate users can still access endpoints normally
- **Description:** No rate limiting allows brute force attacks on checkout, cart, login endpoints and scraping of product data. Implement IP-based rate limiting with sensible limits per endpoint.
- **Files Affected:** `server/middleware/rateLimit.ts` (new), `server/routes.ts`, `tests/unit/rateLimit.test.ts` (new)
- **Dependencies:** TIER-1-002
- **Suggested Assigned To:** AI-Coder-2 or AI-Coder-3

### TIER-1-004: Implement Stripe Webhook Verification
- **Priority:** 🔴 CRITICAL
- **Effort:** 3 hours
- **Acceptance Criteria:**
  - ✅ Create `server/webhooks/stripe.ts` with webhook handler
  - ✅ Verify webhook signature using `stripe.webhooks.constructEvent()` with webhook secret
  - ✅ Handle events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.dispute.created`
  - ✅ Update order status in database when payment succeeds
  - ✅ Log all webhook events to database/logging system
  - ✅ Return 200 immediately, process async
  - ✅ Write integration tests for webhook handler
  - ✅ Document webhook setup in README
- **Description:** Without webhook verification, fraudsters can claim payments succeeded without actually paying. Verify Stripe webhooks to prevent payment fraud, status mismatches, and disputes.
- **Files Affected:** `server/webhooks/stripe.ts` (new), `server/routes.ts`, `shared/schema.ts`, `tests/integration/webhooks.test.ts` (new)
- **Dependencies:** TIER-1-002
- **Suggested Assigned To:** AI-Coder-3 or AI-Coder-4

### TIER-1-005: Add CSRF Protection Middleware
- **Priority:** 🔴 CRITICAL
- **Effort:** 2 hours
- **Acceptance Criteria:**
  - ✅ Install `csurf` package: `npm install csurf`
  - ✅ Create `server/middleware/csrf.ts` with CSRF token generation and validation
  - ✅ Generate CSRF token on GET `/api/csrf-token` endpoint
  - ✅ Validate CSRF token on all POST/PUT/DELETE requests
  - ✅ Return 403 (Forbidden) if token invalid or missing
  - ✅ Update client to: GET token on app load, include in all mutation requests
  - ✅ Modify `client/src/lib/queryClient.ts` to include CSRF token in headers
  - ✅ Write unit tests for CSRF protection
- **Description:** Without CSRF protection, attackers can trick users into performing unwanted actions (add items to cart, checkout, etc.) from malicious websites. Implement CSRF token validation.
- **Files Affected:** `server/middleware/csrf.ts` (new), `server/routes.ts`, `client/src/lib/queryClient.ts`, `tests/unit/csrf.test.ts` (new)
- **Dependencies:** TIER-1-002
- **Suggested Assigned To:** AI-Coder-4 or AI-Coder-1

### TIER-1-006: Fix Stripe API Version Validation
- **Priority:** 🔴 CRITICAL
- **Effort:** 15 minutes
- **Acceptance Criteria:**
  - ✅ In `server/routes.ts`, verify Stripe API version is a valid date format (YYYY-MM-DD)
  - ✅ Current version must be: `"2025-12-15.clover"` or later valid version
  - ✅ Document why this version is chosen in code comments
  - ✅ Verify `npm run build` succeeds without warnings
  - ✅ All Stripe API calls work correctly in testing
- **Description:** The Stripe API version format is invalid, which can cause API calls to fail. Ensure version is in proper format and uses a valid Stripe API version.
- **Files Affected:** `server/routes.ts`
- **Dependencies:** None (can work in parallel)
- **Suggested Assigned To:** AI-Coder-1

### TIER-1-007: Fix Error Handling - Don't Leak Stack Traces
- **Priority:** 🔴 CRITICAL
- **Effort:** 1.5 hours
- **Acceptance Criteria:**
  - ✅ Review all catch blocks in `server/routes.ts` and `server/storage.ts`
  - ✅ Create `server/utils/errorHandler.ts` with formatErrorResponse function
  - ✅ Never send `error.stack` to clients - only safe error messages
  - ✅ Log stack traces server-side only (to console or logging service)
  - ✅ Return structured JSON: `{ error: "User-friendly message", code: "ERROR_CODE" }`
  - ✅ Write tests to verify stack traces never leak to client
  - ✅ Test with: `curl -X POST http://localhost:5000/api/checkout -d '{"invalid":"data"}'`
- **Description:** Current error handling leaks stack traces to clients, exposing internal code structure and database details. Implement proper error handling that logs server-side but returns safe messages to clients.
- **Files Affected:** `server/utils/errorHandler.ts` (new), `server/routes.ts`, `server/storage.ts`, `tests/unit/errorHandling.test.ts` (new)
- **Dependencies:** TIER-1-002
- **Suggested Assigned To:** AI-Coder-2

### TIER-1-008: Strong Input Validation - Add Bounds Checking
- **Priority:** 🔴 CRITICAL
- **Effort:** 1.5 hours
- **Acceptance Criteria:**
  - ✅ Add validation bounds to all endpoints:
    - Search query: max 200 chars, min 1 char, alphanumeric + spaces only
    - Pagination limit: max 100, min 1, default 20
    - Pagination offset: max 10000, min 0
    - Cart quantity: max 999, min 1
    - Product ID: UUID format validation
  - ✅ Return 400 (Bad Request) with clear validation error messages
  - ✅ Update Zod schemas in `shared/schema.ts` with `.min()` and `.max()` validators
  - ✅ Create `server/utils/validation.ts` helper functions
  - ✅ Write unit tests for all validation bounds
- **Description:** Missing input validation allows attackers to send malformed data that can crash server or cause database errors. Add strict input validation with reasonable bounds on all endpoints.
- **Files Affected:** `shared/schema.ts`, `server/utils/validation.ts` (new), `server/routes.ts`, `tests/unit/validation.test.ts` (new)
- **Dependencies:** TIER-1-002
- **Suggested Assigned To:** AI-Coder-3

---

## 🔧 TIER 2: HIGH PRIORITY ISSUES (Week 1)

**Complete Tier 1 first. These are essential for stability and security but not deployment blockers.**

### TIER-2-001: Add Database Indexes on Key Columns
- **Priority:** 🟠 HIGH
- **Effort:** 30 minutes
- **Acceptance Criteria:**
  - ✅ Add indexes to `drizzle.config.ts` or migration:
    - `products.createdAt` (for sorting)
    - `orders.userId` (for user queries)
    - `orders.status` (for filtering)
    - `cart.userId` (for user's cart lookup)
    - `favorites.userId` (for user's favorites)
  - ✅ Run database migration
  - ✅ Verify indexes exist: `SELECT * FROM pg_indexes WHERE tablename='products'`
  - ✅ Run performance test: `npm test` completes faster
- **Description:** Missing database indexes cause N+1 queries and slow user lookups. Add indexes on frequently queried columns (userId, productId, status).
- **Files Affected:** `drizzle.config.ts`, database migration
- **Dependencies:** TIER-1-008
- **Suggested Assigned To:** AI-Coder-1

### TIER-2-002: Refactor Monolithic routes.ts into Modules
- **Priority:** 🟠 HIGH
- **Effort:** 8 hours
- **Acceptance Criteria:**
  - ✅ Create module structure:
    - `server/routes/auth.ts` - login, logout, register
    - `server/routes/products.ts` - getProducts, getProduct, search
    - `server/routes/cart.ts` - getCart, addToCart, removeFromCart, clearCart
    - `server/routes/orders.ts` - createOrder, getOrders, getOrder
    - `server/routes/checkout.ts` - POST /checkout, POST /checkout/success
    - `server/routes/favorites.ts` - getFavorites, addFavorite, removeFavorite
    - `server/routes/admin.ts` - admin endpoints
  - ✅ Import all routers in main `server/routes.ts`
  - ✅ Each module < 150 lines
  - ✅ All tests still pass
  - ✅ No behavior changes, just code organization
- **Description:** The 618-line monolithic routes.ts is unmaintainable. Split into logical modules by feature for better code organization, maintainability, and parallel development.
- **Files Affected:** `server/routes.ts` (refactored), `server/routes/*` (new modules)
- **Dependencies:** TIER-1-008, TIER-2-001
- **Suggested Assigned To:** AI-Coder-2 or AI-Coder-3

### TIER-2-003: Fix Session Invalidation Flow
- **Priority:** 🟠 HIGH
- **Effort:** 1 hour
- **Acceptance Criteria:**
  - ✅ Review `/api/logout` endpoint in `server/routes.ts`
  - ✅ Ensure session is properly destroyed: `req.logout()` called
  - ✅ Ensure session cookie is cleared
  - ✅ Ensure user cannot access protected routes after logout
  - ✅ Write tests: logout → verify 401 on protected route
  - ✅ Test in browser: logout → refresh → verify redirect to login
- **Description:** Session invalidation not properly implemented. Users may remain logged in after logout or session may persist. Fix logout flow to properly destroy session.
- **Files Affected:** `server/routes.ts` (logout endpoint), `tests/unit/auth.test.ts`
- **Dependencies:** TIER-1-008, TIER-2-002
- **Suggested Assigned To:** AI-Coder-1

### TIER-2-004: Implement Caching Layer for Featured Products
- **Priority:** 🟠 HIGH
- **Effort:** 2 hours
- **Acceptance Criteria:**
  - ✅ Add Redis or in-memory cache for featured products
  - ✅ Cache featured products for 1 hour
  - ✅ Invalidate cache when admin updates featured products
  - ✅ Add cache key: `featured:products:v1`
  - ✅ Measure performance: GET /api/products/featured should be <100ms
  - ✅ Write tests for cache hit/miss behavior
- **Description:** Featured products are queried frequently. Add caching to reduce database load and improve response time for popular endpoints.
- **Files Affected:** `server/utils/cache.ts` (new), `server/routes/products.ts`, `tests/integration/cache.test.ts` (new)
- **Dependencies:** TIER-2-002
- **Suggested Assigned To:** AI-Coder-4

### TIER-2-005: Add Input Validation on Search Endpoint
- **Priority:** 🟠 HIGH
- **Effort:** 1 hour
- **Acceptance Criteria:**
  - ✅ Validate search query: not empty, max 200 chars, alphanumeric + spaces
  - ✅ Validate limit: 1-100, default 20
  - ✅ Validate offset: 0-10000, default 0
  - ✅ Return 400 if invalid with error message
  - ✅ Prevent SQL injection (already using parameterized queries)
  - ✅ Write fuzz tests to verify robustness
- **Description:** Search endpoint accepts unbounded input which can cause DoS or SQL injection. Add strict input validation.
- **Files Affected:** `server/routes/products.ts`, `shared/schema.ts`, `tests/unit/search.test.ts`
- **Dependencies:** TIER-2-002
- **Suggested Assigned To:** AI-Coder-1

### TIER-2-006: Add Health Check Endpoint
- **Priority:** 🟠 HIGH
- **Effort:** 1 hour
- **Acceptance Criteria:**
  - ✅ Create `GET /api/health` endpoint
  - ✅ Return JSON: `{ status: "ok", timestamp: "...", uptime: "...", database: "connected" }`
  - ✅ Check database connectivity
  - ✅ Check external services (Stripe API availability)
  - ✅ Return 200 if healthy, 503 if problems
  - ✅ Use for monitoring and deployment health checks
- **Description:** No health check endpoint makes it difficult to monitor app status and configure load balancers. Add simple health check for production monitoring.
- **Files Affected:** `server/routes.ts`, `tests/unit/health.test.ts`
- **Dependencies:** TIER-2-002
- **Suggested Assigned To:** AI-Coder-1

### TIER-2-007: Implement Proper Logging System
- **Priority:** 🟠 HIGH
- **Effort:** 2 hours
- **Acceptance Criteria:**
  - ✅ Add structured logging library (winston, pino, or similar)
  - ✅ Log levels: ERROR, WARN, INFO, DEBUG
  - ✅ Log all API requests with method, path, duration, status code
  - ✅ Log all database queries (in debug mode)
  - ✅ Log all errors with context but not sensitive data
  - ✅ Logs go to: console (dev) and file (production)
  - ✅ Write tests to verify logging behavior
- **Description:** Poor logging practices make it hard to debug issues in production. Implement structured logging with appropriate levels and sensitive data redaction.
- **Files Affected:** `server/utils/logger.ts` (new), `server/routes.ts`, `server/middleware/*`
- **Dependencies:** TIER-2-002
- **Suggested Assigned To:** AI-Coder-3

### TIER-2-008: Add Type Safety Improvements
- **Priority:** 🟠 HIGH
- **Effort:** 3 hours
- **Acceptance Criteria:**
  - ✅ Ensure all API responses are typed with Zod schemas
  - ✅ Create `server/types/api.ts` with API response types
  - ✅ Use strict TypeScript: `noImplicitAny: true`, `strictNullChecks: true`
  - ✅ Fix all remaining `any` types in codebase
  - ✅ Run `npm run check` with no errors
  - ✅ Write type tests to verify schema correctness
- **Description:** Weak type safety allows runtime errors. Improve TypeScript configuration and eliminate `any` types for better type safety.
- **Files Affected:** `tsconfig.json`, `server/types/api.ts` (new), entire codebase
- **Dependencies:** None (can work in parallel, but after TIER-2-002 for cleaner refactoring)
- **Suggested Assigned To:** AI-Coder-2

### TIER-2-009: Add Product Image Validation
- **Priority:** 🟠 HIGH
- **Effort:** 1.5 hours
- **Acceptance Criteria:**
  - ✅ Validate image URLs: must start with `http://` or `https://`
  - ✅ Validate file extensions: only `.jpg`, `.jpeg`, `.png`, `.webp`
  - ✅ Validate image size: max 5MB
  - ✅ Implement image optimization/resizing on upload
  - ✅ Return 400 if invalid with helpful error message
  - ✅ Write tests for image validation
- **Description:** Product images can be oversized or malicious. Add validation on image uploads to prevent DoS and security issues.
- **Files Affected:** `server/routes/products.ts`, `server/utils/imageValidator.ts` (new), `tests/unit/images.test.ts`
- **Dependencies:** TIER-2-002
- **Suggested Assigned To:** AI-Coder-4

### TIER-2-010: Implement Proper Database Error Handling
- **Priority:** 🟠 HIGH
- **Effort:** 1.5 hours
- **Acceptance Criteria:**
  - ✅ Catch database constraint violations (unique, foreign key)
  - ✅ Return 409 (Conflict) for duplicate entries with clear message
  - ✅ Return 400 (Bad Request) for invalid foreign keys
  - ✅ Log database errors server-side but don't expose to client
  - ✅ Test: try to create duplicate user → get 409, not 500
  - ✅ Write tests for common database error scenarios
- **Description:** Database errors currently crash the app or leak internal details. Implement proper database error handling that returns safe error messages.
- **Files Affected:** `server/utils/errorHandler.ts`, `server/storage.ts`, `server/routes.ts`, `tests/unit/dbErrors.test.ts`
- **Dependencies:** TIER-1-007, TIER-2-002
- **Suggested Assigned To:** AI-Coder-3

### TIER-2-011: Add Pagination Validation and Limits
- **Priority:** 🟠 HIGH
- **Effort:** 1.5 hours
- **Acceptance Criteria:**
  - ✅ All list endpoints implement pagination: `limit`, `offset`, `total`, `hasMore`
  - ✅ Default limit: 20, max limit: 100
  - ✅ Validate: limit 1-100, offset ≥ 0
  - ✅ Endpoints: GET /api/products, GET /api/orders, GET /api/favorites, GET /api/search
  - ✅ Return total count in response
  - ✅ Write tests for pagination boundaries
- **Description:** Unbounded list queries can cause performance issues and DoS attacks. Add consistent pagination with sensible limits across all endpoints.
- **Files Affected:** `shared/schema.ts`, `server/routes/*.ts`, `server/storage.ts`, `tests/unit/pagination.test.ts`
- **Dependencies:** TIER-2-002
- **Suggested Assigned To:** AI-Coder-1

### TIER-2-012: Add Data Validation for Money Amounts
- **Priority:** 🟠 HIGH
- **Effort:** 1 hour
- **Acceptance Criteria:**
  - ✅ All price fields: must be number > 0, max 2 decimal places
  - ✅ All price fields: must be positive, ≤ 999,999.99
  - ✅ Quantities: integer, 1-999
  - ✅ Shipping cost: number > 0, max 2 decimals
  - ✅ Discount amounts: 0-99.99%
  - ✅ Write tests for edge cases (negative prices, 3 decimals, etc.)
- **Description:** Money amounts need strict validation to prevent pricing errors and financial fraud. Add proper decimal and range validation.
- **Files Affected:** `shared/schema.ts`, `server/utils/validation.ts`, `tests/unit/money.test.ts`
- **Dependencies:** TIER-2-011
- **Suggested Assigned To:** AI-Coder-4

---

## 📦 TIER 3: MEDIUM PRIORITY ISSUES (Week 2-3)

**These improve the codebase but aren't strict deployment blockers. Start after Tier 2.**

### TIER-3-001: Create Comprehensive Integration Tests
- **Priority:** 🟡 MEDIUM
- **Effort:** 20 hours
- **Acceptance Criteria:**
  - ✅ Create 50+ integration tests covering:
    - Cart workflow: add → update → remove → clear
    - Checkout flow: create order → verify payment → get order status
    - Search and filtering: query → sort → paginate
    - User authentication: login → protected routes → logout
    - Favorites: add → list → remove
    - Admin functions: create product → update → delete
  - ✅ Tests should verify database state changes
  - ✅ Tests should verify API responses match schema
  - ✅ Test coverage ≥ 60% for critical paths
  - ✅ All tests pass consistently
- **Description:** Only 3% test coverage exists. Create comprehensive integration tests for critical workflows to prevent regressions and build confidence in deployments.
- **Files Affected:** `tests/integration/**` (new)
- **Dependencies:** TIER-2-002
- **Suggested Assigned To:** AI-Coder-3 & AI-Coder-4 (can split workflows)

### TIER-3-002: Implement Database Connection Pooling Configuration
- **Priority:** 🟡 MEDIUM
- **Effort:** 1 hour
- **Acceptance Criteria:**
  - ✅ Review `drizzle.config.ts` and database connection setup
  - ✅ Configure connection pool: min 5, max 20 connections
  - ✅ Add connection timeout: 30 seconds
  - ✅ Add idle timeout: 900 seconds
  - ✅ Document configuration in README with rationale
  - ✅ Test under load: verify connections reused
- **Description:** Unknown connection pooling configuration can cause connection exhaustion. Verify and document proper connection pool settings for production.
- **Files Affected:** `drizzle.config.ts`, `server/storage.ts`, README.md
- **Dependencies:** TIER-2-002
- **Suggested Assigned To:** AI-Coder-1

### TIER-3-003: Add Environment Configuration Validation
- **Priority:** 🟡 MEDIUM
- **Effort:** 1.5 hours
- **Acceptance Criteria:**
  - ✅ Create `server/config.ts` with validated environment variables
  - ✅ On startup, verify all required env vars are set:
    - DATABASE_URL
    - STRIPE_SECRET_KEY
    - STRIPE_PUBLIC_KEY
    - SESSION_SECRET
    - REPLIT_* (if applicable)
  - ✅ Provide helpful error messages if env vars missing
  - ✅ Exit process with non-zero code if validation fails
  - ✅ Log loaded config (without secrets) on startup
- **Description:** Missing environment variables cause vague runtime errors. Add startup validation to catch configuration issues immediately.
- **Files Affected:** `server/config.ts` (new), `.env.example` (new), `server/routes.ts`
- **Dependencies:** TIER-2-002
- **Suggested Assigned To:** AI-Coder-1

### TIER-3-004: Implement Database Backup Strategy Documentation
- **Priority:** 🟡 MEDIUM
- **Effort:** 2 hours
- **Acceptance Criteria:**
  - ✅ Document backup strategy in README:
    - Daily automated backups (WAL archiving)
    - Point-in-time recovery setup
    - Backup retention: 30 days
    - Test restore procedure (monthly)
  - ✅ Create backup verification script: `scripts/verify-backup.sh`
  - ✅ Create restore procedure document: `docs/RESTORE.md`
  - ✅ Alert configuration if backups fail
  - ✅ Test: perform full backup and verify integrity
- **Description:** No backup documentation or verification. Create comprehensive backup strategy to enable data recovery and disaster recovery planning.
- **Files Affected:** README.md, `docs/RESTORE.md` (new), `scripts/verify-backup.sh` (new)
- **Dependencies:** TIER-2-002
- **Suggested Assigned To:** AI-Coder-2

### TIER-3-005: Add GDPR/Privacy Feature - Data Export
- **Priority:** 🟡 MEDIUM
- **Effort:** 3 hours
- **Acceptance Criteria:**
  - ✅ Create `GET /api/user/data-export` endpoint
  - ✅ Returns user's data: profile, orders, cart, favorites as JSON
  - ✅ Require authentication and user confirmation
  - ✅ Send via email or provide download link
  - ✅ Log export for audit trail
  - ✅ Write tests for data completeness and security
- **Description:** GDPR requires users to access their personal data. Implement data export feature for compliance.
- **Files Affected:** `server/routes/gdpr.ts` (new), `tests/integration/gdpr.test.ts` (new)
- **Dependencies:** TIER-2-002
- **Suggested Assigned To:** AI-Coder-4

### TIER-3-006: Add GDPR/Privacy Feature - Account Deletion
- **Priority:** 🟡 MEDIUM
- **Effort:** 2 hours
- **Acceptance Criteria:**
  - ✅ Create `DELETE /api/user/account` endpoint
  - ✅ Require password confirmation for security
  - ✅ Delete or anonymize user's personal data (GDPR compliant)
  - ✅ Keep order history but remove PII from orders
  - ✅ Log deletion for audit trail
  - ✅ Test deletion prevents re-login with same email
  - ✅ Write tests for data anonymization
- **Description:** GDPR requires right to deletion. Implement account deletion with proper data anonymization while maintaining order history for business records.
- **Files Affected:** `server/routes/gdpr.ts`, `server/storage.ts`, `tests/integration/gdpr.test.ts`
- **Dependencies:** TIER-3-005
- **Suggested Assigned To:** AI-Coder-4

### TIER-3-007: Create Architecture Decision Records (ADRs)
- **Priority:** 🟡 MEDIUM
- **Effort:** 3 hours
- **Acceptance Criteria:**
  - ✅ Create `docs/adr/` directory with ADRs for:
    - ADR-001: Why Replit OpenID instead of JWT
    - ADR-002: Why Drizzle ORM instead of Sequelize
    - ADR-003: Why Vite instead of Webpack
    - ADR-004: Database schema design decisions
    - ADR-005: API versioning strategy
  - ✅ Each ADR: Status, Context, Decision, Consequences, Alternatives Considered
  - ✅ Link ADRs from README
- **Description:** No architectural decisions documented. Create ADRs to communicate design choices and help future developers understand why things were built this way.
- **Files Affected:** `docs/adr/*.md` (new), README.md
- **Dependencies:** None
- **Suggested Assigned To:** AI-Coder-2

### TIER-3-008: Implement Error Monitoring Integration
- **Priority:** 🟡 MEDIUM
- **Effort:** 2 hours
- **Acceptance Criteria:**
  - ✅ Set up error monitoring (Sentry, Rollbar, or similar)
  - ✅ Initialize in `server/routes.ts` on startup
  - ✅ Capture all uncaught exceptions
  - ✅ Capture all 5xx errors
  - ✅ Tag errors with environment, user ID, request ID
  - ✅ Redact sensitive data (passwords, tokens, keys)
  - ✅ Test: trigger error and verify it appears in dashboard
- **Description:** No error monitoring makes it hard to detect production issues. Implement error tracking to catch issues in production before customers report them.
- **Files Affected:** `server/monitoring/errorTracking.ts` (new), `server/routes.ts`
- **Dependencies:** TIER-2-007
- **Suggested Assigned To:** AI-Coder-3

### TIER-3-009: Add Request ID Tracking Middleware
- **Priority:** 🟡 MEDIUM
- **Effort:** 1 hour
- **Acceptance Criteria:**
  - ✅ Create middleware that generates unique request ID for each request
  - ✅ Add to request context: `req.id`
  - ✅ Include in all logs: `[req-id] message`
  - ✅ Include in error responses: `{ error: "...", requestId: "..." }`
  - ✅ Include in response headers: `X-Request-ID`
  - ✅ Test: trace single request through logs
- **Description:** Hard to correlate logs and errors across requests. Add request ID tracking for better observability and debugging.
- **Files Affected:** `server/middleware/requestId.ts` (new), `server/routes.ts`, `server/utils/logger.ts`
- **Dependencies:** TIER-2-007
- **Suggested Assigned To:** AI-Coder-1

### TIER-3-010: Add Performance Monitoring
- **Priority:** 🟡 MEDIUM
- **Effort:** 2 hours
- **Acceptance Criteria:**
  - ✅ Create middleware to measure request duration
  - ✅ Log slow requests (>500ms)
  - ✅ Track metrics: p50, p95, p99 response times
  - ✅ Identify slow endpoints
  - ✅ Test: verify slow requests logged and metrics tracked
- **Description:** No performance monitoring makes it hard to identify bottlenecks. Add performance tracking to catch slow endpoints before they impact users.
- **Files Affected:** `server/middleware/performance.ts` (new), `server/routes.ts`
- **Dependencies:** TIER-2-007, TIER-3-009
- **Suggested Assigned To:** AI-Coder-3

### TIER-3-011: Add Comprehensive API Documentation
- **Priority:** 🟡 MEDIUM
- **Effort:** 4 hours
- **Acceptance Criteria:**
  - ✅ Create OpenAPI/Swagger spec for all endpoints
  - ✅ Document: method, path, parameters, request body, response, status codes
  - ✅ Add examples for each endpoint
  - ✅ Set up Swagger UI at `/api/docs`
  - ✅ Generate client SDK (optional but useful)
- **Description:** No API documentation makes it hard for frontend developers and API consumers. Create comprehensive API documentation.
- **Files Affected:** `docs/api.yaml` (new), `server/routes.ts`
- **Dependencies:** TIER-2-002
- **Suggested Assigned To:** AI-Coder-2

### TIER-3-012: Add Client-Side Error Boundary Component
- **Priority:** 🟡 MEDIUM
- **Effort:** 1.5 hours
- **Acceptance Criteria:**
  - ✅ Create React Error Boundary component
  - ✅ Catches JavaScript errors and displays fallback UI
  - ✅ Logs error details to error monitoring service
  - ✅ Provides user-friendly error message and recover option
  - ✅ Test: verify error boundary catches errors
- **Description:** Unhandled JavaScript errors crash the entire app. Add error boundary to gracefully handle client-side errors.
- **Files Affected:** `client/src/components/ErrorBoundary.tsx` (new), `client/src/App.tsx`
- **Dependencies:** TIER-3-008
- **Suggested Assigned To:** AI-Coder-4

### TIER-3-013: Add Client-Side Request Retry Logic
- **Priority:** 🟡 MEDIUM
- **Effort:** 1 hour
- **Acceptance Criteria:**
  - ✅ Implement exponential backoff retry on failed requests
  - ✅ Retry on: 5xx errors, network timeouts
  - ✅ Don't retry on: 4xx errors (except 429)
  - ✅ Max 3 retries with exponential backoff (100ms, 200ms, 400ms)
  - ✅ Show retry message to user
  - ✅ Test: simulate network failure and verify retry
- **Description:** Network hiccups cause request failures. Add retry logic to improve reliability for end users.
- **Files Affected:** `client/src/lib/queryClient.ts`, `client/src/lib/retry.ts` (new)
- **Dependencies:** None
- **Suggested Assigned To:** AI-Coder-1

### TIER-3-014: Implement Client-Side Loading States and Skeletons
- **Priority:** 🟡 MEDIUM
- **Effort:** 2 hours
- **Acceptance Criteria:**
  - ✅ Add loading skeleton components for: products list, product detail, cart, checkout
  - ✅ Show skeleton while data loads
  - ✅ Replace with actual content when loaded
  - ✅ Test: verify skeleton shows during loading
  - ✅ Improve perceived performance
- **Description:** Poor loading states create bad UX. Add skeleton screens to improve perceived performance while data loads.
- **Files Affected:** `client/src/components/Skeleton*.tsx` (new), product/cart/checkout pages
- **Dependencies:** None
- **Suggested Assigned To:** AI-Coder-4

### TIER-3-015: Add Form Validation on Client Side
- **Priority:** 🟡 MEDIUM
- **Effort:** 2 hours
- **Acceptance Criteria:**
  - ✅ Add client-side validation for forms: login, register, checkout
  - ✅ Show validation errors inline (required, email format, password strength)
  - ✅ Disable submit button until form valid
  - ✅ Still validate server-side (don't trust client)
  - ✅ Improve UX by catching errors before server request
  - ✅ Test: verify validation triggers correctly
- **Description:** No client-side validation creates bad UX with round-trip server errors. Add client-side validation for immediate feedback.
- **Files Affected:** `client/src/components/Forms*.tsx`, `client/src/lib/validation.ts` (new)
- **Dependencies:** None
- **Suggested Assigned To:** AI-Coder-1

---

## 🚀 TIER 4: DEPLOYMENT & INFRASTRUCTURE (Week 3-4)

**Must complete before production deployment.**

### TIER-4-001: Dockerfile and Docker Compose Setup
- **Priority:** 🔵 DEPLOYMENT
- **Effort:** 3 hours
- **Acceptance Criteria:**
  - ✅ Create `Dockerfile` with multi-stage build (client + server)
  - ✅ Create `docker-compose.yml` with: app, postgres, redis (optional)
  - ✅ Dockerfile uses node:20-alpine (small image)
  - ✅ Copy only necessary files (use .dockerignore)
  - ✅ Run `docker build .` successfully
  - ✅ Run `docker-compose up` and app works end-to-end
- **Files Affected:** `Dockerfile` (new), `docker-compose.yml` (new), `.dockerignore` (new)
- **Dependencies:** TIER-2-002
- **Suggested Assigned To:** AI-Coder-2

### TIER-4-002: Environment-Specific Configuration
- **Priority:** 🔵 DEPLOYMENT
- **Effort:** 2 hours
- **Acceptance Criteria:**
  - ✅ Create config for: development, staging, production
  - ✅ Use different Stripe keys, database URLs, logging levels
  - ✅ Load via `NODE_ENV` environment variable
  - ✅ Never commit production secrets
  - ✅ Create `.env.example` with all required variables
  - ✅ Document in README how to set up each environment
- **Files Affected:** `server/config.ts`, `.env.example` (new), README.md
- **Dependencies:** TIER-3-003
- **Suggested Assigned To:** AI-Coder-1

### TIER-4-003: GitHub Actions CI/CD Pipeline
- **Priority:** 🔵 DEPLOYMENT
- **Effort:** 4 hours
- **Acceptance Criteria:**
  - ✅ Create `.github/workflows/ci.yml` with:
    - Run on: push to main, PR
    - Steps: Install deps, lint, build, test, type check
    - Fail if any step fails
    - Upload coverage reports
  - ✅ Create `.github/workflows/deploy.yml` with:
    - Run on: push to main (after ci.yml passes)
    - Build Docker image
    - Push to Docker registry
    - Deploy to staging
    - Run smoke tests on staging
  - ✅ Test: push to branch, verify CI runs
- **Files Affected:** `.github/workflows/*.yml` (new)
- **Dependencies:** TIER-4-001
- **Suggested Assigned To:** AI-Coder-3

### TIER-4-004: Production Deployment Documentation
- **Priority:** 🔵 DEPLOYMENT
- **Effort:** 2 hours
- **Acceptance Criteria:**
  - ✅ Create `docs/DEPLOYMENT.md` with:
    - Deployment checklist (run before every deploy)
    - Scaling recommendations
    - Monitoring setup
    - Rollback procedures
    - Post-deployment verification
  - ✅ Create deployment runbook: step-by-step deploy instructions
  - ✅ Document: staging test process, production release process
- **Files Affected:** `docs/DEPLOYMENT.md` (new), README.md
- **Dependencies:** TIER-4-001, TIER-4-002
- **Suggested Assigned To:** AI-Coder-2

### TIER-4-005: Database Migration Strategy
- **Priority:** 🔵 DEPLOYMENT
- **Effort:** 1.5 hours
- **Acceptance Criteria:**
  - ✅ Document database migration process
  - ✅ Create `db:migrate` script in `package.json`
  - ✅ Run migrations automatically on deploy
  - ✅ Create rollback procedure if migration fails
  - ✅ Test: verify schema changes apply correctly
- **Files Affected:** `scripts/migrate.sh` (new), `package.json`, README.md
- **Dependencies:** TIER-2-001
- **Suggested Assigned To:** AI-Coder-1

### TIER-4-006: Load Balancer and Reverse Proxy Configuration
- **Priority:** 🔵 DEPLOYMENT
- **Effort:** 2 hours
- **Acceptance Criteria:**
  - ✅ Create nginx or similar reverse proxy configuration
  - ✅ Configure: SSL/TLS, compression, caching headers
  - ✅ Load balance requests to multiple app instances
  - ✅ Implement health checks: use `/api/health` endpoint
  - ✅ Test: verify requests distributed across instances
- **Files Affected:** `nginx.conf` (new), `docker-compose.yml`
- **Dependencies:** TIER-4-001
- **Suggested Assigned To:** AI-Coder-3

### TIER-4-007: SSL/TLS Certificate Setup
- **Priority:** 🔵 DEPLOYMENT
- **Effort:** 1 hour
- **Acceptance Criteria:**
  - ✅ Set up Let's Encrypt certificates (if deploying to own server)
  - ✅ Or use managed certs (if deploying to cloud provider)
  - ✅ Configure automatic renewal
  - ✅ Test: verify HTTPS works and certificate valid
  - ✅ Document certificate renewal process
- **Files Affected:** nginx config, deployment docs
- **Dependencies:** TIER-4-001
- **Suggested Assigned To:** AI-Coder-2

### TIER-4-008: Database Production Configuration
- **Priority:** 🔵 DEPLOYMENT
- **Effort:** 2 hours
- **Acceptance Criteria:**
  - ✅ Configure PostgreSQL for production:
    - Enable WAL archiving
    - Set appropriate max_connections based on load
    - Enable query logging for slow queries
    - Configure maintenance_work_mem appropriately
  - ✅ Set up automated backups (daily)
  - ✅ Test: verify backups complete successfully
- **Files Affected:** PostgreSQL configuration, documentation
- **Dependencies:** TIER-3-004
- **Suggested Assigned To:** AI-Coder-1

---

## ✅ TIER 5: VALIDATION & POLISH (Week 5-6)

**Post-deployment validation and polish.**

### TIER-5-001: Penetration Testing and Security Audit
- **Priority:** 🟢 POLISH
- **Effort:** 8 hours
- **Acceptance Criteria:**
  - ✅ Run OWASP ZAP or similar penetration testing tool
  - ✅ Test for: OWASP Top 10, injection, broken auth, etc.
  - ✅ Fix any medium/high severity issues found
  - ✅ Document findings and fixes
- **Description:** Security testing to verify protections are effective.
- **Dependencies:** All TIER 1-2 fixes
- **Suggested Assigned To:** Security specialist or AI-Coder-4

### TIER-5-002: Load Testing and Performance Optimization
- **Priority:** 🟢 POLISH
- **Effort:** 4 hours
- **Acceptance Criteria:**
  - ✅ Run load test: simulate 100+ concurrent users
  - ✅ Identify bottlenecks
  - ✅ Optimize slow endpoints
  - ✅ Target: p99 response time <2 seconds under load
  - ✅ Document results and optimizations
- **Description:** Ensure app performs well under production load.
- **Dependencies:** All TIER 1-2 fixes
- **Suggested Assigned To:** AI-Coder-3

### TIER-5-003: Disaster Recovery Drill
- **Priority:** 🟢 POLISH
- **Effort:** 2 hours
- **Acceptance Criteria:**
  - ✅ Run full disaster recovery test
  - ✅ Restore from backup to clean environment
  - ✅ Verify all data restored correctly
  - ✅ Document time to recovery (RTO)
  - ✅ Verify recovery objective (RPO)
- **Description:** Ensure we can recover from disaster.
- **Dependencies:** TIER-3-004, TIER-4-008
- **Suggested Assigned To:** AI-Coder-2

### TIER-5-004: Documentation Polish and README Update
- **Priority:** 🟢 POLISH
- **Effort:** 2 hours
- **Acceptance Criteria:**
  - ✅ Update README with: architecture diagram, setup instructions, deployment info
  - ✅ Add troubleshooting guide
  - ✅ Add FAQ section
  - ✅ Review all documentation for clarity
- **Description:** Final documentation polish for production.
- **Dependencies:** All other tiers
- **Suggested Assigned To:** AI-Coder-1

---

## 📊 Distribution Strategy Across AI Coders

### **Recommended Team Structure**

| AI Coder | Specialization | Tier 1 Issues | Tier 2 Issues | Tier 3 Issues | Tier 4-5 Issues |
|----------|---------------|--------------|---|---|---|
| **AI-Coder-1** | Security & Core | 001, 006, 008 | 001, 003, 005, 006, 011 | 003, 009, 013 | 002, 005, 004 |
| **AI-Coder-2** | Architecture & Refactoring | 002 | 002, 007, 008 | 004, 007, 011 | 001, 004, 007, 003 |
| **AI-Coder-3** | Testing & Monitoring | 003, 004 | 002, 007, 010 | 001, 008, 010 | 003, 006 |
| **AI-Coder-4** | Frontend & Polish | 005 | 004, 009, 012 | 005, 006, 012, 014, 015 | - |

### **Parallel Work Matrix**

```
Day 1-2 (TIER 1):
  - AI-Coder-1: TIER-1-001 (npm fix) → TIER-1-006 (Stripe version) → TIER-1-008 (validation)
  - AI-Coder-2: TIER-1-002 (security headers) → TIER-1-007 (error handling)
  - AI-Coder-3: TIER-1-003 (rate limit) → TIER-1-004 (webhooks)
  - AI-Coder-4: TIER-1-005 (CSRF)

Week 1 (TIER 2):
  - AI-Coder-1: TIER-2-001 (indexes), TIER-2-003, TIER-2-005, TIER-2-006, TIER-2-011
  - AI-Coder-2: TIER-2-002 (refactor routes), TIER-2-007, TIER-2-008
  - AI-Coder-3: TIER-2-002 (assist), TIER-2-007, TIER-2-010
  - AI-Coder-4: TIER-2-004 (caching), TIER-2-009, TIER-2-012

Week 2-3 (TIER 3):
  - AI-Coder-1: TIER-3-001, TIER-3-002, TIER-3-003, TIER-3-009, TIER-3-013
  - AI-Coder-2: TIER-3-001, TIER-3-007, TIER-3-011
  - AI-Coder-3: TIER-3-001, TIER-3-008, TIER-3-010
  - AI-Coder-4: TIER-3-001, TIER-3-005, TIER-3-006, TIER-3-012, TIER-3-014, TIER-3-015

Week 3-4 (TIER 4):
  - AI-Coder-1: TIER-4-002, TIER-4-005, TIER-4-008
  - AI-Coder-2: TIER-4-001, TIER-4-004, TIER-4-007
  - AI-Coder-3: TIER-4-003, TIER-4-006
```

---

## 🎯 Getting Started: Creating Issues in GitHub

### **Step 1: Set Up GitHub Automation**

```bash
# Create labels in GitHub
# Priority labels: tier-1-blocker, tier-2-high, tier-3-medium, tier-4-deployment, tier-5-polish
# Type labels: bug, feature, security, performance, testing, documentation
# Status labels: ready, in-progress, review, blocked
```

### **Step 2: Use Issue Template**

Each issue should follow this template:

```markdown
## Title
[TIER-X-YYY] Short description

## Priority
- [ ] Tier 1 (Blocker)
- [ ] Tier 2 (High)
- [ ] Tier 3 (Medium)
- [ ] Tier 4 (Deployment)
- [ ] Tier 5 (Polish)

## Effort Estimate
X hours

## Description
Detailed description of the issue

## Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2
- [ ] Criteria 3

## Blocked By
- Links to dependencies

## Files Affected
- server/file.ts
- client/src/file.tsx

## Suggested Implementation
Brief notes on how to implement
```

### **Step 3: Use GitHub Projects**

1. Create a project board with columns: Backlog, Ready, In Progress, Review, Done
2. Add all 47 issues to the Backlog
3. Prioritize by tier and move to Ready as dependencies complete
4. Assign to AI coders as they become available

### **Step 4: Automate with GitHub Actions**

Create a workflow to automatically create issues from this plan:

```yaml
name: Create GitHub Issues
on:
  workflow_dispatch:
jobs:
  create-issues:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: octocat/create-issue-action@v1
        with:
          issues-file: issues-plan.json
```

---

## 📈 Success Metrics & Milestones

### **Week 1 Milestone (TIER 1)**
- [ ] npm audit shows 0 high-severity vulnerabilities
- [ ] All security headers implemented
- [ ] Rate limiting working on checkout endpoints
- [ ] Stripe webhooks verifying payments
- [ ] CSRF protection preventing attacks
- [ ] Input validation bounds enforced
- [ ] Error handling doesn't leak stack traces
- [ ] All tests still passing

### **Week 2 Milestone (TIER 2)**
- [ ] Database indexes improve query performance by 50%+
- [ ] routes.ts refactored into 6 modules (<150 lines each)
- [ ] Session invalidation working correctly
- [ ] Caching layer reduces featured products queries by 80%
- [ ] 50+ integration tests passing
- [ ] Health check endpoint responsive
- [ ] Logging captures all requests and errors
- [ ] Type safety improved: 0 `any` types

### **Week 3 Milestone (TIER 3)**
- [ ] 60%+ test coverage for critical paths
- [ ] GDPR data export feature working
- [ ] GDPR account deletion working
- [ ] Performance monitoring showing p99 latency
- [ ] API documentation complete with examples
- [ ] Error boundary handling client-side errors

### **Week 4-5 Milestone (TIER 4)**
- [ ] Docker image builds successfully
- [ ] Docker Compose brings up full stack
- [ ] CI/CD pipeline passing all checks
- [ ] Deployment to staging works end-to-end
- [ ] SSL/TLS certificates configured
- [ ] Database backups configured and verified
- [ ] Production configuration documented

### **Week 6 Milestone (TIER 5)**
- [ ] Penetration testing passed or all medium/high issues fixed
- [ ] Load testing: p99 <2 seconds under 100 concurrent users
- [ ] Disaster recovery drill successful
- [ ] Documentation complete and polished
- [ ] **PRODUCTION READY: 70%+ audit score**

---

## 🔗 How to Use This Plan

1. **For GitHub Issues:** Copy each issue title/description into GitHub Issues, assign to AI coders
2. **For AI Coders:** Each AI coder gets assigned 3-5 issues per week based on their specialization
3. **For Tracking:** Use GitHub Projects board to track progress and dependencies
4. **For Coordination:** Weekly sync to handle blockers and adjust assignments

---

**Total Estimated Effort:** 240+ hours (4-6 weeks full-time)  
**Current Production Readiness:** 10%  
**Target Production Readiness:** 70%+  

**Next Step:** Create these 47 issues in GitHub and start assigning to AI coders!
