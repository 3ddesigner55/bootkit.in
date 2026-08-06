# BootKit Environment Variables

Never commit real values. Configure secrets separately for the frontend deployment and the API deployment.

## Backend (`backend/.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Yes | `development`, `test` or `production`. |
| `PORT` | Yes | API listening port. |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string; keep credentials and options in the secret. |
| `DB_NAME` | Yes | Production database name. |
| `JWT_ACCESS_SECRET` | Yes | Long, random access-token signing secret. |
| `JWT_REFRESH_SECRET` | Yes | Different long, random refresh-token signing secret. |
| `JWT_ACCESS_EXPIRES_IN` | Yes | Access-token expiry, e.g. `15m`. |
| `JWT_REFRESH_EXPIRES_IN` | Yes | Refresh-token expiry, e.g. `30d`. |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret. |
| `RAZORPAY_KEY_ID` | Yes | Razorpay production key ID. |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay production key secret. |
| `RAZORPAY_WEBHOOK_SECRET` | Yes | Razorpay webhook signing secret. |
| `FRONTEND_URL` | Yes | Exact public frontend HTTPS origin for CORS. |
| `SMTP_HOST` | Required for email | SMTP host. |
| `SMTP_PORT` | Required for email | SMTP port. |
| `SMTP_SECURE` | Required for email | `true` only when the provider requires implicit TLS. |
| `SMTP_USER` | Required for email | SMTP username. |
| `SMTP_PASS` | Required for email | SMTP password or provider token. |
| `SMTP_FROM` | Required for email | Verified sender address. |

## Frontend (Vercel)

| Variable | Status | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Required before production launch | Public HTTPS URL of the separately deployed Express API; frontend integration is still required. |

## Legacy variables to remove only during an approved migration

The current frontend contains Supabase references and `.env.example` includes `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. They conflict with the approved MongoDB/JWT architecture. Do not use them for the production BootKit release; remove or migrate them only in a separately approved frontend migration task.

## Secret handling rules

- Use different secrets for development, staging and production.
- Generate at least 32-byte random JWT secrets.
- Never expose MongoDB, Cloudinary, Razorpay secret, SMTP or JWT values through `NEXT_PUBLIC_*` variables.
- Rotate credentials after any suspected exposure and update the deployment secret store before redeployment.
- Restrict Atlas database credentials and Cloudinary/Razorpay keys to least privilege where provider controls allow it.
