# Cyber World University

Cyber World University (CWU) is a cybersecurity education website built with semantic HTML, CSS, and vanilla JavaScript.

**Tagline:** Learn. Hack Ethically. Defend the Digital World.

## Production backend

CWU uses **Supabase** as its production backend.

- Supabase Auth — learner authentication and email verification
- PostgreSQL — LMS data
- Row Level Security (RLS) — database authorization
- Supabase RPC functions — enrollment, lesson completion, quiz attempts/grading, certificates, and role management
- Supabase Storage — reserved for future protected learner assets

Production Supabase project: `plmjrdokggqprmmylflu` in `ap-northeast-1`.

The browser uses only the Supabase publishable key. Never put a Supabase secret/service-role key in frontend code.

## LMS schema

The production database contains RLS-enabled CWU tables for profiles, courses, lessons, enrollments, lesson progress, quizzes, quiz questions, quiz attempts, quiz answers, and certificates.

The current database has **0 published courses**. The public catalog therefore shows a correct empty state until an authorized administrator publishes real course records.

## Authentication and authorization

1. Learners register with email/password.
2. Supabase handles email confirmation.
3. Protected frontend workflows require a verified Supabase user.
4. The `cwu_profiles` row is keyed by the authenticated user ID.
5. RLS and trusted PostgreSQL functions enforce access; browser state and user-editable metadata are never treated as authorization.

## LMS workflows

The frontend is wired to Supabase for:

- Published course catalog
- Free-course enrollment
- Enrolled lesson access
- Lesson completion
- Server-managed quiz attempts and grading
- Certificate eligibility and issuance
- Public certificate verification
- Student dashboard and profile data
- Admin/teacher course, lesson, quiz, role, and certificate views

Quiz answer keys remain server-side during official attempts. The browser receives only the question/options snapshot required for the attempt, and grading is performed by PostgreSQL.

## Project structure

```text
cyber-world-university/
├── index.html
├── pages/
├── css/
├── js/
│   ├── core/
│   ├── features/
│   ├── animations/
│   ├── supabase/
│   └── utils/
├── data/
├── assets/
└── docs/
```

There is no application runtime dependency on Firebase. The old `js/firebase/` compatibility directory has been removed.

## Security baseline

- CWU LMS tables have Row Level Security enabled.
- Anonymous users cannot enroll, complete lessons, start/submit quizzes, or issue certificates.
- Public certificate verification is intentionally available through its narrowly validated verification-code RPC.
- Sensitive RPCs use explicit authentication/role checks and an empty `search_path`.
- The frontend never contains a Supabase service-role/secret key.
- External learning URLs are restricted to HTTPS.
- Paid enrollment remains fail-closed until a real payment provider and server-side webhook verification are implemented.

Supabase security findings should be reviewed after every database change. SECURITY DEFINER warnings for protected RLS helper/transaction functions are intentional only where the function body contains its own authorization checks.

## Deployment

The GitHub `main` branch is connected to the Vercel production project `cyber-world-university-2026`. Recent production deployments are reported as **READY** and are sourced from the current `main` commits.

Because this is a static frontend, Vercel does not require a frontend build step. Use an HTTP server for local development; do not test Supabase Auth from `file://` URLs.

## Launch checklist

Before publicly accepting real learners, the owner should:

1. Publish the real CWU courses, lessons, and quizzes through the admin workflow.
2. Test one authorized student account through registration, email verification, enrollment, lesson completion, quiz submission, and certificate issuance.
3. Test one teacher and one admin account and verify role isolation.
4. Configure a real payment provider only if paid courses are offered, including server-side webhook/signature verification.
5. Re-run the Supabase security advisor and browser smoke tests after production data/configuration changes.

Security-learning content is intended for authorized labs, legal testing, and systems the learner owns or has explicit permission to assess.
