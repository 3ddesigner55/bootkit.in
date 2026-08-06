# BootKit Deployment Guide

## Current release decision

**Do not release to production yet.** Resolve the P0 blockers in `PRODUCTION_CHECKLIST.md` first.

## Target topology

- Frontend: Next.js on Vercel.
- API: Node.js/Express deployed as a separate service.
- Database: MongoDB Atlas, Mumbai region.
- Images: Cloudinary.
- Payments: Razorpay.
- Email: SMTP provider.

The Vercel project must deploy only the frontend. The Express API must have its own deployment, build command (`npm run build` in `backend/`), start command (`npm start` in `backend/`), domain, health check and environment variables.

## Deployment sequence

1. Provision MongoDB Atlas production cluster in Mumbai, dedicated database user and IP/network access.
2. Provision Cloudinary, Razorpay production keys and transactional SMTP credentials.
3. Configure a separately deployed API service with all variables in `ENVIRONMENT_VARIABLES.md`.
4. Verify API health at `GET /api/health` and documentation at `GET /api/docs`.
5. Configure the frontend with the production API base URL only after frontend API integration is complete.
6. Configure `FRONTEND_URL` on the API to the exact HTTPS Vercel URL.
7. Configure Razorpay webhook URL as `https://<api-domain>/api/webhooks/razorpay` and validate its signing secret.
8. Run smoke tests for login, catalog, cart, address, COD order, Razorpay success/failure, cancellation, admin access and email delivery.
9. Enable Atlas backups and log retention monitoring before public traffic.

## Required release gates

- Frontend production build and lint pass.
- Backend build, lint and formatting pass.
- No production secrets committed to Git.
- Backend authentication APIs are implemented and frontend is switched from Supabase/local state to the approved JWT API.
- Cloudinary upload endpoints and authorization are implemented before admin image upload is enabled.
- Backup restore drill has passed.
- Razorpay webhook signing and payment reconciliation test have passed.

## Rollback

1. Keep the prior frontend and API deployment available.
2. If a release fails, roll back frontend and API independently to their immediately previous healthy versions.
3. Do not roll back MongoDB data by default. Use a point-in-time restore only after incident approval and a written impact assessment.
4. Reconcile payment and order records after any rollback involving checkout or payment code.
