# CWU Production Readiness Report

Updated: 2026-10-19

## Decision

**NOT PRODUCTION READY**

This report separates source/static evidence from live service verification. No Firebase billing was enabled. No fake/test users, enrollments, quiz results, certificates, or payments were created. Cloud Functions and Storage remain unavailable; no Firebase rules or Functions deployment was performed in this pass.

## Scorecard

| Component | Status | Evidence | Fix / external action required |
| --- | --- | --- | --- |
| GitHub repository | PASS | GitHub web session identifies the repository owner as `cyberworlduniversity`; the repository page states “You own” the repository. Push to `main` succeeded. Current `main` tip at the post-push check was `ab7578a6951d8bc13d5e1f6bdc78fa55d9f0b845`. | None for repository access. |
| GitHub Actions | NOT APPLICABLE | GitHub Actions API reports zero workflows and zero workflow runs for `main`; no tracked `.github/workflows` exist. | Add CI only if the owner wants it. |
| Vercel public frontend | PASS | Post-push smoke returned HTTP 200 for all nine core routes. All six headers and the Functions-origin CSP were present. Desktop Home/Login and mobile Register browser checks had no CWU-page console errors or failed requests. | Continue live checks after any frontend change. |
| Vercel deployment provenance | PASS | Authenticated deployment list shows project `cyber-world-university-2026`, connected repository `cyberworlduniversity/cyber-world-university`, production branch `main`, production domain `cyber-world-university-2026.vercel.app`, status **Ready**, and source SHA `ab7578a6951d8bc13d5e1f6bdc78fa55d9f0b845`. GitHub API confirms the same SHA is the `main` tip. | None for the inspected deployment. |
| Vercel environment configuration | PASS | Project Settings → Environment Variables reports “No Environment Variables Added.” The site is static and its Firebase Web config is public client configuration in source; no server-side secret was expected or exposed. | Add variables only if a future server-side feature requires them; keep secrets out of browser code. |
| Firebase Hosting | PASS | After commit `ba80120`, Hosting-only deployment completed. All nine core routes returned HTTP 200; all six headers and Functions-origin CSP were present; homepage HTML included the Firebase config and home-auth script markers. Desktop Home/Login/Register and mobile Register browser checks had no console errors or failed requests. | None for static Hosting in this pass; backend remains unavailable. |
| Firebase project access | PASS | Authenticated Firebase CLI and Firebase Console show the expected active project `studio-100351834-51432` / `cyberworlduniversity`; the project is on Spark. The expected Hosting site and active Web app are listed, and `.firebaserc` selects this project. | None for project access. |
| Firestore database | PASS | Authenticated Firebase CLI reports the default Native Firestore database active in `asia-south1` (Standard edition, free tier). | Authenticated isolation and feature behavior remain separate unverified gates. |
| Firebase Email/Password provider | PASS | Firebase Console → Authentication → Sign-in method shows **Email/Password: Enabled** for the expected project. | None for provider configuration. |
| Firebase Authentication lifecycle | NOT VERIFIED | Positive registration, email verification, login/logout/persistence, profile trigger, and profile creation have not been tested with an authorized account. Invalid-account rejection from prior checks is negative evidence only. | Supply authorized, monitored test inboxes/accounts for full lifecycle and isolation tests. |
| Firestore rules | NOT VERIFIED | Live anonymous REST read of a probe `users/{uid}` path returned HTTP 403 `PERMISSION_DENIED`. Source is deny-by-default except restricted owner access; admin access now requires claim and matching profile role. No authenticated rules emulator tests or deployed-rule parity. | Run Emulator Suite tests with Java 21+ and compare live rules; deploy only after review and approval. |
| Firestore indexes | NOT VERIFIED | Authenticated CLI reports no deployed composite indexes, while the repository defines three composite indexes for quiz attempts and progress. | Deploy indexes only after verifying intended project/config and an authorized deployment decision; test the affected queries. |
| RBAC | NOT VERIFIED | Source uses Auth UID, verified email guards, teacher-course assignment checks, and role checks against current Auth custom claim + server-managed profile; stale claim hardening was added. Functions/rules are not deployed/live-tested. | Deploy only after Firebase prerequisites; run authorized student/teacher/admin denial tests, including role revocation. |
| Cloud Functions | BLOCKED BY BILLING | Authenticated Firebase CLI reports zero deployed Functions. Source has 27 exports (2 Auth triggers + 25 callables), all callable exports use App Check enforcement. Prior Firebase deployment preflight reported Blaze required; no deployment was attempted in this pass. | Keep billing disabled. Deploy only after explicit billing authorization; then test the deployed callable boundary. |
| Storage | BLOCKED BY BILLING | Firebase Console explicitly says Storage requires a billing account (Blaze); project remains Spark and configured bucket endpoint returns HTTP 404. No upload/read was attempted. Source rules restrict owner-only avatar files and deny other paths. | Keep billing disabled; do not initialize/provision Storage unless the owner separately authorizes Blaze. |
| App Check | NOT CONFIGURED | Firebase Console → App Check → Apps shows the Web app as **Not registered**. Client `appCheckSiteKey` is empty and callable client fails closed without a token. | Register the production Web app/provider with a real key, observe valid requests, then separately approve any enforcement rollout. |
| Courses | NOT VERIFIED | UI uses backend-published course callables and does not mark local sample data as authoritative. No live Functions or production course catalog verified. | Deploy/seed only owner-approved real records and validate public/course access. |
| Enrollment | NOT VERIFIED | Source derives UID from Auth, uses transactional free enrollment, and rejects paid enrollment. No callable deployed or live enrollment tested. | Deploy backend after billing decision; test with authorized test account and real course data. |
| Lessons | NOT VERIFIED | Enrolled reads are filtered to published content; progress acknowledgements require active enrollment and are self-reported. | Live backend and ownership testing required; acknowledgements are not proof of engagement. |
| Quizzes | NOT VERIFIED | Server source stores private grading snapshot, enforces attempt limit/expiry/version/ownership, and computes score; local quiz is clearly non-official practice. Unit tests pass. | Deploy Functions only if billing authorized; perform integration/concurrency tests in emulator. |
| Certificates | NOT VERIFIED | Source uses cryptographically random IDs/codes and hashed verification codes; issues only after all published lessons are acknowledged and current required quiz versions are passed. This eligibility update is unit-tested, not deployed. | Backend deployment and authorized eligibility/verification/revocation tests required. |
| Payments | NOT CONFIGURED | No provider, secrets, checkout, webhook, or server verification. Paid enrollment remains fail-closed. | Owner selects/authorizes a real provider; no fake payment success. |
| Security headers | PASS | Prior live Vercel and Firebase Hosting checks found all six required headers. CSP contains `https://*.cloudfunctions.net` and omits `unsafe-eval`. | Recheck when production configuration changes. |
| Secrets | PASS | Bounded tracked-file scan found no high-confidence private-key/service-account/token patterns. The Firebase Web API key is public client config; this does not audit Git history or deployed secret stores. | Maintain provider key restrictions and separate secret-store/history review. |
| Dependencies | PASS | Functions `npm audit --json`: 0 vulnerabilities across 245 dependency entries. No frontend dependency manifest exists. | Re-run on dependency changes. |
| Performance | NOT VERIFIED | Static architecture has no build bundle, polling service, or frontend dependency runtime. No full low-end-device/performance audit was run. | Run a measured performance audit if required before launch. |
| Tests | PASS | Node.js 22.23.3 `npm test`: 10/10 passed after adding role freshness and lesson eligibility tests; this is source-level evidence only. | Emulator/live integration remains outstanding. |
| Lint | PASS | Functions `npm run lint` under Node.js 22.23.3 passed. | None. |
| Production build | NOT APPLICABLE | Static HTML/CSS/JS project has no root package manifest or frontend build script. | No build step currently exists. |

## Source issues found and corrected

1. **Stale role claims:** privileged callables trusted only the role in the presented ID token. Since role changes do not immediately rewrite an already-issued token, an old admin/teacher claim could be used until token refresh/expiry. Callables now require the token role to match both the current Firebase Auth custom claim and server-maintained profile role. Firestore admin reads require both claim and profile role. The role-management callable updates the profile role before the Auth custom claim so a partial update fails closed. Regression tests cover stale claim and mismatched profile cases. This is not live verification.
2. **Certificate lesson requirement:** documented eligibility required all published lessons to be recorded, but the issuance callable checked enrollment and quizzes only. It now transactionally reads published lessons and caller-scoped progress, and rejects issuance unless every published lesson has a learner acknowledgement. The acknowledgement is explicitly self-reported and does not prove engagement. Unit tests cover complete, missing, unacknowledged, and empty-course cases.
3. **Registration account enumeration copy:** duplicate-email UI text explicitly confirmed the email already had an account. The displayed text is now generic. Firebase Auth project-level enumeration protection configuration remains unverified.

## Tests and checks performed

- `functions/npm test` under Node.js 22.23.3: **10/10 pass** (existing auth guard and quiz tests preserved; added role freshness and certificate eligibility tests).
- `functions/npm run lint` under Node.js 22.23.3: **pass** (`node --check index.js`).
- `functions/npm audit --json`: **0 vulnerabilities**.
- `git diff --check`: run after final edits before commit.
- Functions exports/source reviewed: Auth creation/deletion, user profile sync/access, published catalog, student dashboard, teacher scope/rosters/content, enrollment/progress, quiz lifecycle, certificate lifecycle, admin user/certificate/course/role operations.
- Firestore rules, Storage rules, indexes, Firebase/Vercel configs, Auth UI/client, course/dashboard/admin/quiz/certificate feature modules, deployment docs and test files reviewed.
- Full JavaScript syntax validation used module-aware validation and parsed 43 tracked/current JavaScript files; Node parsed six JSON configuration/lock files.
- Emulator tests were not run: available Java is 17; Firebase CLI emulator requires Java 21+ in the current setup.
- No positive Auth or authenticated Firestore live test was attempted because no authorized test accounts/inboxes were supplied.
- No Functions or Storage deployment, Firebase billing action, live database mutation, or manual Vercel deployment was performed. Firebase Hosting-only deployment did occur after the source commit.
- `firebase deploy --only hosting --project studio-100351834-51432` succeeded; it deployed static Hosting files only.
- Live Firebase Hosting and post-push Vercel route/header checks passed for the nine core routes. Desktop and mobile Auth UI browser checks reported no console errors or failed requests.
- Home page live HTML contains Firebase Web config and `home-auth.js` markers; course listings are explicitly unavailable pending backend and App Check configuration.
- The Functions test suite passed 10/10 under Node.js 22.23.3; lint passed; dependency audit reported 0 vulnerabilities; `git diff --check` passed before commit.

## Deployment, Git, and final blockers

- Firebase project remains `studio-100351834-51432`; no project switch or billing change occurred.
- Cloud Functions and Storage remain unavailable/blocked by the previously reported Blaze prerequisite.
- App Check is not configured; no real key was invented.
- Firestore rules source changes are not deployed. Authenticated rule behavior and remote rule parity remain unverified.
- Vercel public response behavior is verified after push, but deployment identity/Ready state is not.
- No authorized inboxes or authenticated student/teacher/admin accounts are available for testing.
- No payment service is configured.
- Firebase CLI confirmed the expected project is active, the Firestore database exists in `asia-south1`, there are zero deployed Functions and zero deployed composite indexes; the Storage endpoint returned 404.
- Authenticated project access was available through Firebase CLI, but the Firebase Console browser required Google sign-in. Vercel dashboard likewise required sign-in; its exact production deployment record is unavailable.
- GitHub API confirmed the `main` tip and Git push succeeded; GitHub Actions reports zero workflows/runs. The account identity used for Git access could not be independently queried from this environment.

See [CWU_CODEBASE_ANALYSIS.md](./CWU_CODEBASE_ANALYSIS.md) for the architecture and source review, [CWU_PRODUCTION_RELEASE_REPORT.md](./CWU_PRODUCTION_RELEASE_REPORT.md) for cumulative live evidence, and [CWU_MANUAL_ACTION_REQUIRED.md](./CWU_MANUAL_ACTION_REQUIRED.md) for required owner actions.

## Final verdict

**NOT PRODUCTION READY**

Critical Auth lifecycle, Firestore authorization, Vercel deployment provenance, App Check, deployed Functions, and payment gates are unresolved. The source fixes improve the intended server boundary but cannot substitute for deployment and authenticated tests.
