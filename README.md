# Cyber World University

Cyber World University (CWU) is a cybersecurity education website built with semantic HTML, CSS, and vanilla JavaScript.

**Tagline:** Learn. Hack Ethically. Defend the Digital World.

## Backend

CWU now uses **Supabase** instead of Firebase.

- Supabase Auth — learner authentication and email verification
- PostgreSQL — LMS data
- Row Level Security (RLS) — database authorization
- Supabase RPC functions — trusted enrollment, lesson, quiz, and certificate operations
- Supabase Storage — planned for protected learner assets
- Supabase Edge Functions — available for future server-only integrations

Production Supabase project: `plmjrdokggqprmmylflu` in `ap-northeast-1`.

The browser uses only the Supabase publishable key. Never put a Supabase secret/service-role key in frontend code.

## LMS schema

The existing Supabase database contains RLS-enabled CWU tables for:

- `cwu_profiles`
- `cwu_courses`
- `cwu_lessons`
- `cwu_enrollments`
- `cwu_lesson_progress`
- `cwu_quizzes`
- `cwu_quiz_questions`
- `cwu_quiz_attempts`
- `cwu_quiz_answers`
- `cwu_certificates`

The database currently contains no published courses, so the public catalog correctly shows an empty state until an authorized administrator publishes real course records.

## Authentication flow

1. Learner registers with email/password.
2. Supabase sends the verification email when email confirmation is enabled.
3. The learner signs in after verification.
4. The `cwu_profiles` record is synchronized with the authenticated user's ID.
5. Protected LMS operations use the authenticated Supabase session and database RLS/RPC authorization.

CWU never treats a browser-stored role or user-editable metadata as trusted authorization data.

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

`js/supabase/` contains the browser Supabase client, profile service, and LMS adapter.

## Security

- RLS is enabled on the CWU public LMS tables.
- Frontend authorization is not treated as a security boundary.
- Supabase publishable keys are safe to expose in browser code; privileged keys are not.
- Course enrollment, lesson completion, quiz grading, certificate issuance, and certificate verification are handled through database policies/RPC functions rather than trusted browser-only state.
- HTTPS URLs are validated before external learning links are opened.

Run the Supabase security advisor after database changes and resolve any finding that does not match the intended public/private access model.

## Local development

This is a static frontend. Serve the repository with any local HTTP server and open the local URL. Do not rely on `file://` for authentication testing.

No Firebase CLI, Firebase Hosting configuration, Firestore rules, Firebase Storage rules, or Firebase Cloud Functions are required by the current CWU application.

## Important status

The Supabase migration is active in the source tree. Authentication, profile synchronization, course catalog access, free enrollment, lesson completion, quiz RPC integration, certificate RPC integration, and learner dashboard data access are wired to Supabase.

Some legacy feature modules still require follow-up migration from their old adapter imports before every admin/teacher workflow is considered complete. They must not be described as production-ready until those workflows are verified against the Supabase project.

Payments are not configured. Paid enrollment must remain unavailable until a real payment provider and server-side payment verification flow are implemented.

Security-learning content is intended for authorized labs, legal testing, and systems the learner owns or has explicit permission to assess.
