# BootKit Backup Strategy

## Scope

The source of truth for transactional data is MongoDB Atlas. Cloudinary assets, deployment configuration and operational logs require their own recovery plans.

## MongoDB Atlas

1. Enable Atlas continuous cloud backups and point-in-time recovery for production before launch.
2. Retain daily restore points for at least 35 days, monthly restore points for at least 12 months, and longer records only if required by finance or law.
3. Use a separate Atlas project/credentials for backup administration.
4. Run a quarterly restore drill into an isolated staging database. Verify users, products, stock, carts, orders, payments and addresses.
5. Record each drill: source timestamp, restore target, duration, validation result and approver.

## Cloudinary

1. Keep Cloudinary media in dedicated BootKit folders with environment separation.
2. Export or mirror original assets and metadata regularly to a protected secondary storage location.
3. Test restoration of category, product, banner, brand and store image URLs in staging.
4. Do not delete originals until the backup and restore process has been validated.

## Code and configuration

1. Protect the Git repository with branch protection, pull-request review and required checks.
2. Keep environment secrets only in deployment secret stores; they are not backed up in Git.
3. Maintain an encrypted, access-controlled emergency secret recovery process owned by authorized administrators.

## Logs and audit evidence

1. Export API access/error logs to durable managed storage; local container files are not a backup strategy.
2. Retain payment/webhook and order-change audit evidence according to the business retention policy.
3. Redact passwords, tokens, signatures and full payment details from logs.

## Incident recovery order

1. Stop unsafe writes and preserve incident evidence.
2. Assess the latest known-good point and affected collections/assets.
3. Restore to an isolated environment first and validate data integrity.
4. Obtain owner approval before restoring production.
5. Reconcile Razorpay payments, order status, stock and emails after restore.
6. Document the incident, recovery point, data gap and preventive action.
