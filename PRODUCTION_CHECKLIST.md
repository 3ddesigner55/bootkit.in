# BootKit Production Checklist

## Audit result: not production-ready

### P0 — block release

- [ ] **Frontend build is not deployable.** The supplied Vercel build log fails while type-checking `backend/src/app.ts` because the frontend deployment does not install backend dependency `cors`. Keep frontend and backend deployment/build contexts separate.
- [ ] **Frontend lint fails.** Current root lint reports 346 errors, including generated `backend/dist` JavaScript being linted and React source errors.
- [ ] **Frontend/backend integration is absent.** No frontend API client calls to the Express API were found. The frontend still uses Supabase and local browser state for authentication, products and orders, which conflicts with the approved MongoDB/JWT architecture.
- [ ] **Authentication is incomplete.** JWT utilities and middleware exist, but no login, registration, refresh-token or session-issuance API routes are registered. Production users cannot authenticate against the approved backend.
- [ ] **Admin data is not production-backed.** Several Admin modules are UI/local-state only. Cloudinary upload middleware exists, but no authorized upload API is registered.

### P1 — complete before launch

- [ ] Add automated backend unit/integration tests and frontend end-to-end checkout tests. No test configuration or test files were found.
- [ ] Configure the separate API deployment with HTTPS, health checks, automatic restart, minimum instances and log storage outside the app filesystem.
- [ ] Test MongoDB transactions on the production Atlas topology; placing/cancelling orders must be verified under concurrent requests.
- [ ] Implement production payment reconciliation: validate Razorpay order creation, client verification, signed webhook, duplicate delivery and failure handling.
- [ ] Verify notification delivery. The current service isolates email failures from business flows, but production monitoring must alert on failed/undelivered mail.
- [ ] Complete Swagger request/response schemas, error responses and authentication flow documentation. `/api/docs` is available, but documentation is largely endpoint-level.
- [ ] Enforce a CSP policy after validating all required Cloudinary, Razorpay and API origins. Helmet is enabled, but a release-specific CSP review is still required.
- [ ] Configure rate-limit storage suitable for multiple API instances. In-memory limits are not shared between instances.

### P2 — operational hardening

- [ ] Add application performance monitoring, uptime checks, error alerts and database/queue metrics.
- [ ] Add structured notification logs containing notification type, recipient, result and failure reason; avoid recording sensitive message content.
- [ ] Review all public API pagination limits and MongoDB query indexes using production-like data.
- [ ] Define data retention, account deletion and privacy-request procedures.

## Verified strengths

- Backend TypeScript build passes.
- Backend ESLint passes for `src/**/*.ts`.
- Backend Prettier check passes.
- MongoDB connection, environment validation, Helmet, CORS, HPP, Mongo sanitization, rate limiting, logging, JWT middleware, order transactions, Razorpay APIs and Swagger route are present.
- Orders store product-price snapshots and use a MongoDB transaction for order creation, stock decrement and cart clear.

## Audit limits

- No production credentials, Atlas cluster, Cloudinary account, Razorpay account, SMTP server, Vercel configuration or live deployment was accessed.
- The local Next.js build was blocked by the sandbox from starting a Turbopack child process; the supplied Vercel log independently confirms a deploy-time type-check blocker.
