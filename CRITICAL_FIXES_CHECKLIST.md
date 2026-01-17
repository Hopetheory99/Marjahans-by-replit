# QUICK REFERENCE: CRITICAL ISSUES REQUIRING IMMEDIATE ACTION

## 🚨 BLOCKING ISSUES (Must fix before production)

### 1. Dependency Vulnerabilities - qs DoS
**File**: `package.json`  
**Severity**: 🔴 CRITICAL  
**Action**:
```bash
npm audit fix
```

### 2. Invalid Stripe API Version  
**File**: `server/routes.ts:12`  
**Current**: `"2025-12-15.clover"`  
**Fix**: Change to `"2025-01-15"` (valid date format, valid version string)

### 3. Missing Database Indexes
**File**: `shared/schema.ts`  
**Affected Tables**: cartItems, orders, wishlistItems, orderItems  
**Missing Indexes**: `userId`, `productId` on all tables  
**Impact**: All user-specific queries are O(N) table scans

### 4. No Rate Limiting
**Impact**: DDoS attacks possible  
**Required Package**: `npm install express-rate-limit`  
**Apply to**: All endpoints, especially search and checkout

### 5. No Stripe Webhook Verification
**Missing Endpoint**: `POST /api/webhooks/stripe`  
**Risk**: Payment fraud - any attacker can confirm payments  
**Required**: Signature validation using `stripe.webhooks.constructEvent()`

### 6. Missing Security Headers
**Required Headers**:
- Content-Security-Policy
- Strict-Transport-Security  
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

### 7. No CSRF Protection
**Required Package**: `npm install csurf`  
**Apply to**: All state-changing endpoints (POST, PUT, DELETE)

### 8. No Input Validation on Search
**Issue**: Unbounded limit/offset can cause OOM  
**Fix**: Add MAX_LIMIT = 100; MAX_SEARCH_LENGTH = 50

---

## 📊 ISSUE SUMMARY TABLE

| Issue # | Title | Severity | Affected | Est. Time |
|---------|-------|----------|----------|-----------|
| 1 | Dependency Vulnerabilities | 🔴 CRITICAL | npm packages | 10 min |
| 2 | Invalid Stripe Version | 🔴 CRITICAL | Stripe SDK | 5 min |
| 3 | Missing DB Indexes | 🔴 CRITICAL | Performance | 30 min |
| 4 | No Rate Limiting | 🔴 CRITICAL | Security | 2 hrs |
| 5 | No Webhook Verification | 🔴 CRITICAL | Payment | 3 hrs |
| 6 | Missing Security Headers | 🔴 CRITICAL | Security | 1 hr |
| 7 | No CSRF Protection | 🔴 CRITICAL | Security | 2 hrs |
| 8 | No Input Validation | 🟠 HIGH | Security | 1 hr |
| 9 | Monolithic Routes (618 lines) | 🟠 HIGH | Architecture | 8 hrs |
| 10 | No Error Handling Middleware | 🟠 HIGH | Code Quality | 2 hrs |
| 11 | Session Not Invalidated on Logout | 🟠 HIGH | Security | 1 hr |
| 12 | No Integration Tests | 🟠 HIGH | Testing | 20+ hrs |
| 13 | No PCI-DSS Compliance | 🟠 HIGH | Legal | 40+ hrs |
| 14 | No Deployment Setup | 🟠 HIGH | DevOps | 15+ hrs |
| 15 | No Database Query Caching | 🟡 MEDIUM | Performance | 4 hrs |

**Total Critical Items**: 8  
**Estimated Time to Fix Tier 1**: **12-15 hours**  
**Estimated Time to Production Ready**: **4-6 weeks**

---

## 🔧 STEP-BY-STEP FIX CHECKLIST

### Day 1 (Quick Wins - 2 hours)
- [ ] Run `npm audit fix` (10 min)
- [ ] Fix Stripe API version in routes.ts:12 (5 min)
- [ ] Add security headers middleware (30 min)
- [ ] Add input validation on search queries (20 min)
- [ ] Add session invalidation on logout (15 min)

### Day 2-3 (Database Fixes - 3 hours)
- [ ] Add indexes to cartItems table (30 min)
- [ ] Add indexes to orders table (15 min)
- [ ] Add indexes to wishlistItems table (15 min)
- [ ] Add indexes to orderItems table (15 min)
- [ ] Test query performance (30 min)

### Week 1 (Security Hardening - 10 hours)
- [ ] Implement rate limiting on all endpoints
- [ ] Add Stripe webhook verification
- [ ] Add CSRF protection middleware
- [ ] Implement proper error handling
- [ ] Write security incident response playbook

### Week 2-3 (Architecture & Testing - 25 hours)
- [ ] Refactor monolithic routes.ts into modules
- [ ] Add comprehensive integration tests (50+)
- [ ] Implement health check endpoint
- [ ] Add structured logging
- [ ] Implement caching layer

### Week 4-5 (Deployment & Compliance - 30 hours)
- [ ] Create Docker image
- [ ] Set up CI/CD pipeline
- [ ] Implement database backup strategy
- [ ] Set up monitoring and alerts
- [ ] Complete PCI-DSS compliance audit

### Week 6 (Validation - 15 hours)
- [ ] Security penetration testing
- [ ] Load testing (1000 concurrent users)
- [ ] End-to-end payment flow testing
- [ ] Disaster recovery drill
- [ ] Go-live readiness checklist

---

## 💾 BEFORE MAKING CHANGES

1. **Commit current state**:
   ```bash
   git add -A
   git commit -m "Pre-audit cleanup - baseline for fixes"
   ```

2. **Create feature branch for Tier 1 fixes**:
   ```bash
   git checkout -b fix/critical-security-issues
   ```

3. **After each fix**:
   ```bash
   npm run check      # Type check
   npm run build      # Build
   npm test           # Run tests
   git commit -m "Fix: [specific issue]"
   ```

---

## 📞 ESCALATION PATH

**If found during code review:**
1. ❌ Do NOT merge code with these issues
2. ❌ Do NOT deploy to production
3. ⚠️ Flag as P0 (blocking)
4. 📞 Notify security team for issues 1-7
5. 📝 Create ticket for remediation

**Estimated Time to Resolution**: 4-6 weeks  
**Blocking Further Development**: YES  
**Production Deployment**: BLOCKED
