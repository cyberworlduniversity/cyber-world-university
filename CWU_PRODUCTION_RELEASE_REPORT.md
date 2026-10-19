# CWU Production Release Report

## Decision

**NOT PRODUCTION READY**

This is a cumulative no-billing hardening report for the existing Firebase project
`studio-100351834-51432` and the current repository. The verified source/configuration
commit `c51a5692b51f4b0a1aa6e88a7ab654a1dc7a9a16` was deployed to Firebase Hosting
using `--only hosting`. Live route, browser, and header checks for Firebase Hosting
and Vercel are recorded below. The current Vercel deployment record/Ready state was
not available from its dashboard during this follow-up.
This does not imply deployed Firebase backend services or deployed Firestore rule parity.

No billing was enabled, no account was created, and no production data was written.
No Firebase backend service (Functions, Storage, Firestore rules, or indexes) was
deployed. Firebase Hosting received only static website files and Hosting routing/header
configuration. No new Vercel deployment was initiated through the inaccessible
dashboard; the public Vercel site was tested directly.

## Status summary

| Area | Status | Evidence and limitation |
| --- | --- | --- |
| Authentication UI | PASS | Local browser confirmed POST forms, Firebase handler initialization, and submit controls enabled only after initialization. No real credentials were used; only a reserved invalid address and dummy password were submitted for a negative test. |
| Live Firebase Auth negative test | PASS | A reserved `.invalid` address and dummy-only password received HTTP 400 `INVALID_LOGIN_CREDENTIALS`; no account was created. |
| Firebase Email/Password provider | PASS | Firebase Console → Authentication → Sign-in method shows Email/Password Enabled. This verifies provider configuration only, not successful account lifecycle. |
| Positive registration, verification, login, reset, logout | NOT VERIFIED | No real test inbox or account was supplied; no account was created. |
| Server authorization / RBAC | NOT CONFIGURED | Callable source checks Auth context, roles, ownership, and input, but no Cloud Functions are deployed. |
| Firestore rules | NOT VERIFIED | Source denies direct client access except restricted `users/{uid}` access. A live unauthenticated read returned 403; the `(default)` database exists, but authenticated isolation, deployed-rule parity, and index deployment were not verified. |
| Cloud Functions | NOT CONFIGURED | Source exports 27 Functions; a read-only Firebase Functions listing returned no deployed Functions. Callable source requires App Check. The project is on Spark; prior deployment preflight reported Blaze required. |
| App Check | NOT CONFIGURED | Firebase Console → App Check → Apps shows the CWU Web App as Not registered. The provider wizard requests a reCAPTCHA Enterprise site key; the configured site key is empty. No provider was registered and enforcement was not enabled. |
| Storage | NOT CONFIGURED | Firebase Console → Storage states that Storage requires a billing account (Blaze); the configured bucket endpoint returns HTTP 404. No bucket exists for live rule/upload testing. |
| Courses, enrollment, progress | NOT CONFIGURED | UI calls backend operations; no Functions are deployed and no production course records were seeded. Paid enrollment is disabled. |
| Quiz grading | NOT CONFIGURED | Practice scores are explicitly non-official. Backend grading source and unit tests exist but are not deployed or integration-tested. |
| Certificates | NOT CONFIGURED | The generator is a local preview. Issuance and verification UI use backend callables, which are unavailable; verification codes are not accepted from URLs. |
| Admin / teacher | NOT CONFIGURED | Demo admin records were removed. Page tools are shown only after backend access checks, but the backend is undeployed. |
| Payments | NOT CONFIGURED | No provider, checkout, webhook, or server-side transaction verification exists. Paid courses cannot be enrolled. `paypal` matches in the Functions lockfile are dependency-maintainer metadata only. |
| Security headers | PASS | Live Vercel root returns CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`. |
| Live callable CSP | PASS | The live CSP `connect-src` contains `https://*.cloudfunctions.net`; it does not contain `unsafe-eval` or a script-source `unsafe-inline`. |
| Firebase Hosting | PASS | Firebase CLI deployed only Hosting from commit `c51a569`. Root, eight short aliases, 18 canonical HTML pages, and the two compatibility page aliases returned HTTP 200. All six security headers are present; CSP includes the Cloud Functions origin and omits `unsafe-eval`. |
| Listed XSS sinks | PASS | Bounded source scan found none of `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`, string timers, or `javascript:`. Backend lesson links now accept only credential-free HTTPS URLs in the UI. |
| Secret exposure scan | PASS | Bounded working-tree scan found the expected public Firebase Web API key, but no private-key marker or common private/payment token pattern. Git history and deployed secret stores were not audited. |
| Local browser routes | PASS | Local smoke covered home, login, registration, courses, course details, dashboard, admin, quiz, certificates, and verification. No uncaught page errors were observed. |
| Live Vercel routes | PASS | After the `dce2686` source push, the homepage, all eight required short routes, and all 18 canonical `/pages/*.html` routes returned HTTP 200. |
| Vercel production deployment | NOT VERIFIED | Public Vercel route, browser, header, and code-marker checks passed. GitHub `main` source/config is current at `c51a569`, but the Vercel dashboard returned 403/Not authorized, so the deployed commit and current Ready state cannot be confirmed. The last accessible dashboard record was for earlier commit `6f1c2e3`. |
| Live CWU implementation | PASS | After the push, live JS assets contained the new unavailable-only certificate verification message and protected-record dashboard wording. The homepage and pages reference Firebase auth and LMS modules; no sample certificate success remains in the legacy module. |
| Live browser smoke | PASS | Desktop browser checked 29 Firebase Hosting URLs and 18 Vercel URLs, including both requested legacy page aliases; all returned HTTP 200 with nonempty pages. Mobile checked all nine principal routes on each host. Both hosts had zero browser console errors, page exceptions, or failed requests. |
| Mobile, accessibility, performance | NOT VERIFIED | No complete device, accessibility, or performance audit was run in this pass. |

## Firebase Console verification (2026-10-18)

- Firebase Console identifies the project as `cyberworlduniversity`
  (`studio-100351834-51432`) on the **Spark** plan (No-cost, $0/month).
- Authentication → Sign-in method reports **Email/Password: Enabled**. This is
  configuration evidence only; no account was created and no positive lifecycle test
  was performed.
- App Check → Apps lists the configured Firebase Web App as **Not registered**. The
  provider registration form offers Fraud Defense (reCAPTCHA Enterprise) and requests
  a reCAPTCHA Enterprise site key. The inspection wizard was cancelled without saving.
- Storage displays: **“Storage requires a billing account (Blaze).”** No upgrade,
  bucket creation, or upload was attempted. This explains the configured bucket's 404:
  Storage has not been provisioned; the 404 alone did not establish a malformed bucket
  name.
- Read-only Firebase CLI checks confirm the project is ACTIVE, the `(default)`
  Firestore Native database exists, and the deployed Functions list is empty.
- Firestore is configured in `asia-south1` per the project setup documentation. The
  callable source defaults to `us-central1`, and the web client explicitly selects
  `us-central1`; these regions agree with each other but differ from Firestore's
  location. No Functions were deployed and no region change was made.

## Current backend source/configuration review

These findings distinguish source checks from deployed behavior. Firebase Functions use
the Admin SDK and therefore bypass Firestore client rules; the callable guards, rather
than the Firestore rules, are the authorization boundary for those operations.

| Capability / data | Source boundary reviewed | Current evidence |
| --- | --- | --- |
| Auth/profile | Email/Password is enabled in Console. Client handlers use Firebase Auth registration/login/logout, local or session persistence, verification and reset emails, and sign out unverified users. `createUserProfile` defaults to student unless a trusted custom claim already exists. Profile sync uses the authenticated UID; client profile creation/deletion is denied by rules. | Provider configuration verified; positive registration, verification, login, logout, persistence, and profile-trigger behavior NOT VERIFIED. Functions are undeployed. |
| Firestore `users/{uid}` | Owner/admin `get`; admin-only `list`; owner-only update restricted to `name`, `displayName`, `photoURL`, and server-time `updatedAt`; direct create/delete denied. Admin is derived from the signed Auth token claim. | Live anonymous read denied (HTTP 403); owner/cross-user and deployed-rule tests unavailable. |
| Firestore `courses/{courseId}` and `lessons` / `quizzes` | Direct client reads/writes denied. Published course and enrolled published lesson/quiz access is mediated by callables; admin/assigned teacher mutations are checked server-side. | Source reviewed; Functions undeployed and no production catalogue/records verified. |
| Firestore `enrollments` | Direct client access denied. Enrollment uses the caller UID, a transaction, and permits only free published courses; paid enrollment fails closed. Teacher/admin roster reads check role and course assignment. | Source reviewed; no callable is deployed. |
| Firestore `progress` | Direct client access denied. Progress writes use the caller UID and transactionally require active enrollment and a published lesson. | Source reviewed; no live authenticated test. |
| Firestore `quizAttempts` / `quizAttemptCounters` | Direct client access denied. Attempts are created and graded server-side, bound to caller UID, quiz version, and expiration; submitted scores/eligibility supplied by clients are rejected. | Source unit tests pass; callable and transaction behavior are not deployed/integration-tested. |
| Firestore `certificates`, `certificateLookup`, `certificateVerification` | Direct client access denied. Issuance checks enrollment and required passed quiz versions; IDs use random bytes, verification codes are hashed, and public verification returns limited fields. Admin revoke checks admin claim. | Source reviewed; issuance, revocation, and verification are unavailable until Functions deploy. |
| Firestore `auditLogs` | Direct client access denied; source writes audit records after privileged mutations. | Source reviewed; no deployed audit trail or read/retention verification. |
| Firestore indexes | `firestore.indexes.json` parses and declares indexes for quiz-attempt and progress queries. | No indexes were deployed or queried live. |
| App Check / Storage | Callables use `enforceAppCheck: true`; client call wrapper refuses calls when the site key is empty. Storage rules allow owner-only avatar files with image type and under-5-MiB checks; all other paths, including student-ID documents, are denied. | App Check web app is not registered and key is empty. Console says Storage requires Blaze; bucket endpoint returned 404. Neither service is usable/verified. |
| Payments | No payment provider or server-side payment verification is present; positive-price enrollment is rejected. | NOT CONFIGURED. |

All exported callable handlers were reviewed for trusted Auth UID use, role or ownership
checks, request shape validation, and client-controlled privilege/result fields. Admin
operations check the token role; teacher content operations also check course assignment.
No exploitable authorization bypass was established by source review, but source review
does not prove live authorization. Account role provisioning still requires a trusted
administrator, and all backend behavior remains unverified until deployed and tested.

## Security work completed

- Replaced homepage sample course totals/cards with an explicit backend-unavailable state; category links no longer point at hard-coded sample course IDs.
- Removed the hidden in-memory sample admin panel. Admin/teacher UI is populated only after backend access checks.
- Removed the unused `data/demo-users.js` fixture so fake student/teacher/admin identities are not distributed with the static site.
- Removed a legacy local certificate lookup that treated a hard-coded sample ID as verified. If that legacy module is used, certificate verification now reports unavailable instead of returning a sample success.
- Corrected dashboard backend-failure copy so it no longer says protected learning records remain sample data.
- Renamed authentication form selectors to remove the misleading “demo auth” marker and refreshed the auth handler asset URL.
- Verified login and registration use `method="post"`; credentials are not placed in URLs. Forms remain disabled until real Firebase handlers initialize.
- Corrected certificate form initialization. One-time verification codes supplied in a URL are not accepted or copied into the form, and are removed from the visible URL.
- Validated lesson video/material links in the browser as HTTPS URLs without embedded credentials before rendering them as links.
- Kept Firestore rules deny-by-default for all non-profile paths; no rules were weakened or deployed.
- Kept payment, Storage, profile creation, role assignment, enrollment, progress, grading, and certificates explicitly unavailable unless backend operations confirm them.
- Added Firebase Hosting route parity and compatibility aliases without changing backend security rules or behavior.
- Historical deployment recovery: connected the existing Vercel production project to the exact GitHub repository and deployed the selected verified `main` commit as Production. This changed deployment integration only; no application source changes were made to mask the earlier deployment issue.

## Spark-safe audit follow-up

- No Firebase billing, provider, Firestore rules, indexes, App Check enforcement, Storage, or Functions settings were changed. Firebase Hosting alone was deployed, explicitly with `firebase deploy --only hosting`.
- Added Firebase Hosting aliases for the core routes and the two requested legacy page URLs, matching Vercel. Firebase Hosting now serves `.html` directly (`cleanUrls: false`), preserves extensionless canonical page URLs through rewrites, and maps `/pages/dashboard.html` and `/pages/certificate-verification.html` to the current pages.
- Vercel and Firebase Hosting browser smoke directly checked the homepage, main aliases, core pages, and legacy page aliases on desktop and mobile. Both hosts had no JavaScript console errors, uncaught exceptions, or failed requests on tested routes.
- A same-origin link crawl checked 26 distinct internal links, including course-detail query links; all returned HTTP 200. Those IDs are editorial/sample links only: the course detail page still renders unavailable until backend data is returned and does not create enrollment.
- Source scans found no client-side role in local/session storage. The only localStorage helper has no call sites. The orphaned demo-user role fixture was removed.
- The CSP-blocked script messages seen during earlier probes of intentionally unconfigured short URLs were associated with Vercel's 404 response; current browser tests of valid URLs on both hosts showed no CSP violations.
- The source uses only constant, same-origin `window.location.href` assignments; no user-controlled redirect target was found in those matches.
- A separate human action checklist is maintained in `CWU_MANUAL_ACTION_REQUIRED.md`.

## Tests performed

- PASS — `npm test` under Node.js 22.23.3: 8/8 passed (callable guard and quiz-grading tests). The environment defaulted to Node 20.12.2; the declared Functions runtime was used.
- PASS — `npm run lint` under Node.js 22.23.3.
- PASS — Node syntax validation: all 40 repository JavaScript files. JSON validation: all 5 `.json` files plus `.firebaserc`.
- PASS — Functions module load exposed 27 exports. Read-only `firebase functions:list` returned an empty list after Hosting deployment.
- PASS — Firebase Hosting deploy of commit `c51a569` completed with `--only hosting`. No Functions, Storage, Firestore rules, or indexes were deployed.
- PASS — Firebase Hosting HTTP verification: 49/49 tested routes returned HTTP 200, including all direct `.html` pages, requested legacy aliases, short routes, and preserved extensionless canonical-page paths.
- PASS — Vercel HTTP verification: required short routes, direct canonical pages, and both legacy aliases returned HTTP 200.
- PASS — Playwright smoke: Firebase Hosting had 29/29 desktop and 9/9 mobile primary/direct-page routes return HTTP 200; Vercel had 18/18 desktop and 9/9 mobile routes return HTTP 200. No console errors, uncaught page exceptions, or failed requests occurred.
- PASS — Live root responses from both hosts contain all six required security headers. Both CSPs include `https://*.cloudfunctions.net` and omit `unsafe-eval`.
- PASS — Live assets include the updated unavailable-only certificate lookup and protected-record dashboard messaging. Login/register browser pages initialize Firebase UI without reporting profile or role provisioning success.
- PASS — Source-level Functions review covers 27 exports, authentication context, trusted UID/role checks, teacher assignment checks, input allowlists, free-only enrollment, server-side grading, and certificate issuance/verification logic. Certificate codes use cryptographic randomness and are stored as hashes. This is SOURCE VERIFIED, not live authorization evidence.
- PASS — Source scans found no unsafe HTML/code-evaluation sinks listed in the audit prompt, no user-controlled redirects, no browser-storage role authorization, and no likely private key/payment credential. The Firebase browser API key is public client configuration.
- PASS — No real test accounts or credentials were used. Prior negative tests rejected an invalid Firebase Auth identity and denied an unauthenticated Firestore read.
- NOT VERIFIED — Authenticated registration/login/verification/logout lifecycle, profile trigger creation, owner/cross-user isolation, role escalation, and authenticated write/delete denial require authorized inboxes/accounts.
- NOT VERIFIED — Firestore deployed-rule parity and index deployment. Emulator rule compilation was unavailable because installed Java was below the Firebase CLI requirement of Java 21+.
- NOT VERIFIED — Functions callable behavior, certificate issuance/revocation/verification transactions, App Check token enforcement, and Storage access; no Functions or Storage service is deployed/available.
- NOT VERIFIED — Current Vercel deployment commit and explicit Ready state. The dashboard returned 403/Not authorized; the public route/header/browser checks succeeded.
- NOT VERIFIED — Full accessibility and performance audits.
- PASS — `git diff --check` for the final source/configuration changes; the report-only change is checked before its commit.

The first Functions test attempt used the environment's Node.js 20.12.2 and failed
loading a dependency with an incompatible module format. Re-running with the declared
Node.js 22 runtime passed all eight tests. No dependency manifest changed.

## Remaining blockers

1. Cloud Functions are not deployed. Firebase preflight reported a Blaze billing requirement. Billing must remain disabled unless the project owner explicitly authorizes it.
2. App Check requires Firebase Console configuration and a site key before callable operations can be exercised.
3. Storage setup/bucket availability is absent; do not invent a bucket or claim upload support.
4. Firestore owner isolation, safe profile mutation, role escalation, and deployed-rule parity require non-production authenticated tests or emulator tests.
5. Positive Auth lifecycle tests require an authorized real test inbox/account; none was provided or created.
6. No production course catalog is seeded. Enrollment, progress, grading, certificates, and role management remain unavailable until deployed backend verification.
7. No payment provider or server-side verification exists.
8. Full accessibility and performance audits remain unverified.
9. A previous Firebase Functions dry run logged attempts to enable Cloud Build/Artifact Registry APIs; whether those API states changed was not checked.
10. The current Firebase Console explicitly requires Blaze to initialize Storage. Do not initialize Storage unless billing is separately authorized.
11. The Firebase Console requires a reCAPTCHA Enterprise site key to register App Check. Generate/configure a real key and update the web app configuration before testing App Check; do not enable enforcement until valid production traffic is observed.
12. Functions currently target `us-central1`, while Firestore is in `asia-south1`. Confirm the intended Functions region before any future deployment; changing it requires matching source and client configuration.
13. Vercel public behavior is verified, but the current deployment commit and Ready status require authorized dashboard access. See `CWU_MANUAL_ACTION_REQUIRED.md`.

## Manual Firebase Console checklist

1. **Authentication → Sign-in method**
   - Email/Password already shows Enabled; no change is required.
   - Billing: not required; Spark-safe.
   - Verify the provider still shows Enabled.
   - Positive flow testing requires two user-authorized test inboxes (Student A and Student B); do not send passwords. No account was created.
2. **App Check → Apps → CWU Web App → Register**
   - The app currently shows Not registered. Register with Fraud Defense/reCAPTCHA Enterprise using a real site key created and domain-restricted in Google Cloud reCAPTCHA Enterprise. Then place that site key in the web app configuration and deploy the frontend.
   - Do not invent a key or enable enforcement at registration. Observe valid production requests first; only then consider staged enforcement.
   - Billing: no upgrade was made. Stop if provider/API setup prompts for billing or paid activation. Verify app registration, successful token acquisition, and valid-request metrics before enforcement.
3. **Storage**
   - The Storage page explicitly requires Blaze. Do not select Upgrade project, create a bucket, or deploy Storage rules under the current no-billing authorization.
   - Billing: Blaze required per current Console state; not Spark-safe.
   - If later authorized, initialize in the intended region, verify bucket name against `storageBucket`, deploy owner-only rules, and test owner/non-owner read/write. Do not upload personal documents for initial tests.
4. **Firestore → `(default)` → Rules / Indexes**
   - Inspect deployed rules and indexes against repository source. Do not publish a looser ruleset.
   - The Console rules page was not successfully read during this pass; deployed parity is still NOT VERIFIED.
   - Rules/index inspection is read-only and Spark-safe. Verify parity, then use two authorized test users to check owner, cross-user, forged-role, and denied-write cases before any production rule deployment.
5. **Cloud Functions**
   - Do not deploy while the project remains on Spark and deployment preflight reports Blaze required.
   - Verify no functions appear under Functions; the read-only CLI currently returns an empty list.
   - A future deployment requires separate billing authorization, App Check setup, region decision (`us-central1` source/client versus Firestore `asia-south1`), emulator tests, and an approved release window.

## Cumulative worktree inventory

The implementation is committed on branch `main` in commits `a0fcf34`, `c4eefda`,
and `a1371e3`.
The following paths were changed across the cumulative hardening work and are not
all attributable to this final follow-up:

- `CWU_PRODUCTION_RELEASE_REPORT.md`
- `CWU_MANUAL_ACTION_REQUIRED.md`
- `QA/CWU_WEBSITE_QA_REPORT.md`
- `QA/FUNCTIONAL_TESTS.md`
- `QA/SECURITY_TESTS.md`
- `README.md`
- `data/demo-users.js` (removed)
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
- **Firebase Hosting deployment performed:** Yes. `firebase deploy --only hosting --project studio-100351834-51432` completed from commit `c51a569`.
- **Functions, Storage, Firestore rules/indexes deployment performed:** No.
- **Firebase Console configuration changed:** No.
- **Vercel deployment performed:** No manual Vercel deployment was performed. Public Vercel responses for the required routes, aliases, headers, browser behavior, and current source markers were verified. The dashboard was inaccessible (403/Not authorized), so the current Vercel deployment commit and Ready status remain NOT VERIFIED.
- **Application/configuration commits:** `a0fcf34`, `c4eefda`, `a1371e3`, `dce2686`, `1090974`, `4fda266`, `96c6771`, and `c51a569`.
- **Push to GitHub:** Yes. Each implementation/configuration commit was pushed to `origin/main`; the remote branch matched the local branch at final verification.
- **Billing/data safety:** No billing, real accounts, credentials, or production records were created.

## Final status

**NOT PRODUCTION READY**

This status must not change until critical authentication, authorization, backend, App Check,
certificate, payment, Storage, and deployment requirements are configured and independently
verified.
