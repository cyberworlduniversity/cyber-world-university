# CWU Production Release Report

## Decision

**NOT PRODUCTION READY**

This is a cumulative no-billing hardening report for the existing Firebase project
`studio-100351834-51432` and the current repository. It does not imply production
deployment or deployed Firebase rule parity.

No billing was enabled, no account was created, and no production data was written.
No Firebase backend service (Functions, Storage, Firestore rules, or indexes) or Vercel
deployment was performed in this pass; no Git commit or push was made. This report does
not undo or reclassify any earlier Hosting-only release.

## Status summary

| Area | Status | Evidence and limitation |
| --- | --- | --- |
| Authentication UI | PASS | Local browser confirmed POST forms, Firebase handler initialization, and submit controls enabled only after initialization. No real credentials were used; only a reserved invalid address and dummy password were submitted for a negative test. |
| Live Firebase Auth negative test | PASS | A reserved `.invalid` address and dummy-only password received HTTP 400 `INVALID_LOGIN_CREDENTIALS`; no account was created. |
| Positive registration, verification, login, reset, logout | NOT VERIFIED | No real test inbox or account was supplied. |
| Server authorization / RBAC | NOT CONFIGURED | Callable source checks Auth context, roles, ownership, and input, but no Cloud Functions are deployed. |
| Firestore rules | NOT VERIFIED | Source is deny-by-default outside restricted `users/{uid}` access. One live unauthenticated read returned 403; authenticated isolation, update, delete, and deployed-rule parity were not tested. |
| Cloud Functions | NOT CONFIGURED | Source callables are wired into frontend pages but are undeployed. Firebase deployment preflight requires Blaze. |
| App Check | NOT CONFIGURED | Callable source enforces App Check, but no site key or Console enforcement is configured. The frontend fails closed before calling backend operations. |
| Storage | NOT CONFIGURED | The configured bucket is unavailable/not set up; uploads and Storage authorization were not tested. |
| Courses, enrollment, progress | NOT CONFIGURED | UI calls backend operations; no Functions are deployed and no production course records were seeded. Paid enrollment is disabled. |
| Quiz grading | NOT CONFIGURED | Practice scores are explicitly non-official. Backend grading source and unit tests exist but are not deployed or integration-tested. |
| Certificates | NOT CONFIGURED | The generator is a local preview. Issuance and verification UI use backend callables, which are unavailable; verification codes are not accepted from URLs. |
| Admin / teacher | NOT CONFIGURED | Demo admin records were removed. Page tools are shown only after backend access checks, but the backend is undeployed. |
| Payments | NOT CONFIGURED | No provider, checkout, webhook, or server-side transaction verification exists. Paid courses cannot be enrolled. `paypal` matches in the Functions lockfile are dependency-maintainer metadata only. |
| Security headers | PASS | Live Vercel root currently returns CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`. The deployed CSP's `connect-src` does not include Cloud Functions; local CSP changes are not deployed. |
| Live callable CSP | FAIL | The deployed Vercel `connect-src` is missing `https://*.cloudfunctions.net`, so it cannot support the source callable endpoint as configured. Local config includes the domain but is not deployed. |
| Listed XSS sinks | PASS | Bounded source scan found none of `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`, string timers, or `javascript:`. Backend lesson links now accept only credential-free HTTPS URLs in the UI. |
| Secret exposure scan | PASS | Bounded working-tree scan found the expected public Firebase Web API key, but no private-key marker or common private/payment token pattern. Git history and deployed secret stores were not audited. |
| Local browser routes | PASS | Local smoke covered home, login, registration, courses, course details, dashboard, admin, quiz, certificates, and verification. No uncaught page errors were observed. |
| Live Vercel short routes | FAIL | `/courses`, `/login`, `/register`, `/student-dashboard`, `/admin-panel`, `/certificates`, `/verify-certificate`, and `/course-details` returned HTTP 404. Local route aliases are not deployed. |
| Mobile, accessibility, performance | NOT VERIFIED | No complete device, accessibility, or performance audit was run in this pass. |

## Security work completed

- Replaced homepage sample course totals/cards with an explicit backend-unavailable state; category links no longer point at hard-coded sample course IDs.
- Removed the hidden in-memory sample admin panel. Admin/teacher UI is populated only after backend access checks.
- Renamed authentication form selectors to remove the misleading “demo auth” marker and refreshed the auth handler asset URL.
- Verified login and registration use `method="post"`; credentials are not placed in URLs. Forms remain disabled until real Firebase handlers initialize.
- Corrected certificate form initialization. One-time verification codes supplied in a URL are not accepted or copied into the form, and are removed from the visible URL.
- Validated lesson video/material links in the browser as HTTPS URLs without embedded credentials before rendering them as links.
- Kept Firestore rules deny-by-default for all non-profile paths; no rules were weakened or deployed.
- Kept payment, Storage, profile creation, role assignment, enrollment, progress, grading, and certificates explicitly unavailable unless backend operations confirm them.

## Tests performed

- PASS — Cloud Functions tests with Node.js 22.23.3: 8/8 passed (4 callable guard tests and 4 quiz-grading tests).
- PASS — Cloud Functions lint (`npm run lint`) with Node.js 22.23.3.
- PASS — Node.js 22.23.3 parsed 41 repository JavaScript files as modules.
- PASS — JSON parsing for all 5 repository JSON files outside dependencies.
- PASS — `git diff --check` after the final source and documentation edits.
- PASS — Local browser smoke for 10 principal routes; no uncaught page errors.
- PASS — Login/register initialization: method is POST, real Firebase handler changed the form state to ready, and controls became enabled only after handler initialization.
- PASS — Local login UI submitted a reserved nonexistent `.invalid` identity and dummy-only password to Firebase; it displayed an incorrect-credentials message, did not report success, and left credentials out of the URL.
- PASS — Certificate verification: a dummy URL code was removed from the page URL, not placed into the input, and the form rejected an empty submission with an explicit message.
- PASS — Homepage no longer renders local sample course cards or sample course totals; admin sample records are absent.
- PASS — Live Firebase Auth request using a reserved nonexistent address returned HTTP 400 `INVALID_LOGIN_CREDENTIALS`.
- PASS — Live unauthenticated Firestore read returned HTTP 403 `PERMISSION_DENIED`. No live write was attempted.
- PASS — Live Vercel root returned HTTP 200. Existing `.html` routes returned HTTP 308 redirects; short aliases remain 404.
- FAIL — Live Vercel CSP omits `https://*.cloudfunctions.net` from `connect-src`; the local configuration includes it but has not been deployed.
- PASS — Bounded source scans for listed DOM/code sinks, secret patterns, payment providers, credential URLs, and misleading success claims.
- NOT VERIFIED — Firebase authenticated owner/cross-user read, update, and delete matrix; role-escalation attempts; email delivery; successful Auth lifecycle; deployed callable behavior; App Check enforcement; Storage; payment; deployment.

The first Functions test attempt used Node.js 20.12.2 and failed while loading a dependency whose engine requires a newer Node runtime. Re-running under the declared Node.js 22 runtime passed all tests. No dependency manifest was changed.

## Remaining blockers

1. Cloud Functions are not deployed. Firebase preflight reported a Blaze billing requirement. Billing must remain disabled unless the project owner explicitly authorizes it.
2. App Check requires Firebase Console configuration and a site key before callable operations can be exercised.
3. Storage setup/bucket availability is absent; do not invent a bucket or claim upload support.
4. Firestore owner isolation, safe profile mutation, role escalation, and deployed-rule parity require non-production authenticated tests or emulator tests.
5. Positive Auth lifecycle tests require an authorized real test inbox/account; none was provided or created.
6. No production course catalog is seeded. Enrollment, progress, grading, certificates, and role management remain unavailable until deployed backend verification.
7. No payment provider or server-side verification exists.
8. Vercel short-route aliases require an authorized deployment, then live route retesting. No deployment was performed.
9. The currently deployed Vercel CSP must be updated to permit the source Functions domain before Functions can be called from the site.
10. Active Vercel build provenance, full mobile behavior, accessibility, and performance remain unverified.
11. A previous Firebase Functions dry run logged attempts to enable Cloud Build/Artifact Registry APIs; whether those API states changed was not checked.

## Cumulative worktree inventory

The worktree is on branch `main` at HEAD `8bf9b938875790d199c374eee6f47d0809e47fef`.
The following 51 paths are modified or newly added; the changes are cumulative and are
not all attributable to this final follow-up:

- `CWU_PRODUCTION_RELEASE_REPORT.md`
- `QA/CWU_WEBSITE_QA_REPORT.md`
- `QA/FUNCTIONAL_TESTS.md`
- `QA/SECURITY_TESTS.md`
- `README.md`
- `css/style.css`
- `docs/DATABASE_STRUCTURE.md`
- `docs/FINAL_PRODUCTION_AUDIT.md`
- `docs/FINAL_PRODUCTION_SECURITY_AUDIT.md`
- `docs/FINAL_SECURITY_AUDIT.md`
- `docs/FIREBASE_SECURITY.md`
- `docs/FIREBASE_SETUP.md`
- `docs/PRODUCTION_CHECKLIST.md`
- `docs/PRODUCTION_DEPLOYMENT.md`
- `firebase.json`
- `firestore.indexes.json`
- `functions/index.js`
- `functions/lib/quiz-grading.js`
- `functions/package.json`
- `functions/test/callable-guards.test.js`
- `functions/test/quiz-grading.test.js`
- `index.html`
- `js/certificate-generator.js`
- `js/core/theme.js`
- `js/features/auth.js`
- `js/features/courses.js`
- `js/features/dashboard-profile.js`
- `js/features/firebase-auth.js`
- `js/features/home-auth.js`
- `js/features/quizzes.js`
- `js/features/lms-admin.js`
- `js/features/lms-certificates.js`
- `js/features/lms-courses.js`
- `js/features/lms-dashboard.js`
- `js/features/lms-quiz.js`
- `js/firebase/auth-client.js`
- `js/firebase/firebase-config.js`
- `js/firebase/lms-client.js`
- `js/firebase/profiles.js`
- `pages/admin-panel.html`
- `pages/certificate-generator.html`
- `pages/certificates.html`
- `pages/course-details.html`
- `pages/courses.html`
- `pages/login.html`
- `pages/privacy.html`
- `pages/quizzes.html`
- `pages/register.html`
- `pages/student-dashboard.html`
- `pages/verify-certificate.html`
- `vercel.json`

## Billing, deployment, and Git

- **Billing enabled:** No.
- **Billing required for Functions deployment:** Yes, per Firebase deployment preflight (Blaze).
- **Firebase or Storage deployment performed:** No.
- **Firebase Console configuration changed:** No. Local source configuration files were updated, but not deployed.
- **Vercel deployment performed:** No.
- **Commit created:** No.
- **Push to GitHub:** No.
- **Worktree:** Contains cumulative uncommitted changes; see `git status --short` in the final delivery summary.

## Final status

**NOT PRODUCTION READY**

This status must not change until critical authentication, authorization, backend, App Check,
certificate, payment, Storage, and deployment requirements are configured and independently
verified.
