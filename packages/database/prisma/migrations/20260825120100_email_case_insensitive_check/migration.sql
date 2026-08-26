-- Decided TASK-0034: a CHECK constraint instead of the citext extension —
-- doesn't depend on a Postgres extension a managed provider might not offer.
-- Not representable in schema.prisma (Prisma has no @check attribute), so
-- this is hand-written rather than `prisma migrate diff` output. Prisma
-- treats past migrations as an opaque, append-only history — future
-- `migrate diff` runs never touch this file or try to "sync it away".
--
-- Application code already normalizes to lowercase (normalizeEmail() in
-- packages/shared) before every write; this is the database-level backstop
-- for the day some other code path writes directly without going through it.

ALTER TABLE "User" ADD CONSTRAINT "User_email_lowercase" CHECK (email = lower(email));

ALTER TABLE "Subscriber" ADD CONSTRAINT "Subscriber_email_lowercase" CHECK (email = lower(email));
