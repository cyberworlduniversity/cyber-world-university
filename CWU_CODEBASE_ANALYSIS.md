# CWU Codebase Analysis

Updated: 2026-10-19

## Scope and evidence boundary

This map covers tracked project files on `main` at `df03794311b0329b2e4e86f38dd3c4495f04a9c9` and the local hardening changes documented in [CWU_PRODUCTION_READINESS_REPORT.md](./CWU_PRODUCTION_READINESS_REPORT.md). It is source/configuration analysis, not evidence that undeployed backend code or rules are live. Firebase Hosting and Vercel public-site evidence is carried forward from the latest live checks; authenticated behavior and Vercel deployment provenance remain unverified.

## Frontend

### Entry points and routing

- `index.html` is the static landing page. It loads shared utility/core scripts, Firebase Web configuration, and the homepage auth-state adapter.
- `pages/` contains 18 independent static pages: `about.html`, `admin-panel.html`, `blog.html`, `certificate-generator.html`, `certificates.html`, `contact.html`, `course-details.html`, `courses.html`, `faq.html`, `login.html`, `privacy.html`, `quizzes.html`, `register.html`, `roadmap.html`, `student-dashboard.html`, `study-materials.html`, `terms.html`, and `verify-certificate.html`.
- There is no client-side router or frontend framework. Native links navigate between static HTML documents. Firebase Hosting rewrites short and extensionless URLs; Vercel has matching compatibility rewrites and uses filesystem routing.
- `js/core/app.js` provides the shared page bootstrap; `events.js`, `navigation.js`, and `theme.js` provide shared event, mobile-navigation, and theme behavior.

### UI areas and feature modules

| Area | Main files | Behavior |
| --- | --- | --- |
| Authentication | `js/features/auth.js`, `js/features/firebase-auth.js`, `js/features/home-auth.js`, `js/firebase/auth-client.js` | Firebase Email/Password registration, verification email, login, reset, local/session persistence selection, auth-state handling, and sign-out. Registration creates an Auth account only; the UI does not claim profile or role provisioning. |
| Courses | `js/features/courses.js`, `js/features/lms-courses.js`, `data/courses.js`, `pages/courses.html`, `pages/course-details.html` | Legacy data supports explicitly labeled preview material. The current catalog/details request backend-published courses; enrollment and course data do not become successful until a callable returns success. |
| Student | `js/features/dashboard.js`, `js/features/dashboard-profile.js`, `js/features/lms-dashboard.js`, `js/firebase/profiles.js`, `pages/student-dashboard.html` | Legacy/dashboard presentation and authenticated backend profile/enrollment/progress/attempt/certificate reads. Client role text is informational, not an authorization decision. |
| Admin / teacher | `js/features/admin.js`, `js/features/lms-admin.js`, `pages/admin-panel.html` | Legacy/demo views are not authoritative. LMS UI requests backend role/course access before rendering tools; server-side checks remain the actual boundary. |
| Quizzes | `js/features/quizzes.js`, `js/features/lms-quiz.js`, `data/questions.js`, `functions/lib/quiz-grading.js` | Local quiz is explicitly a practice preview with client-only non-official results. Enrolled LMS attempts are started and graded by callables. |
| Certificates | `js/features/certificates.js`, `js/features/lms-certificates.js`, `js/certificate-generator.js` | Local generator/artwork is a preview only. Trusted lookup and issuance use the backend; unavailable backend states do not claim verification or issuance. |
| Other pages | `js/features/contact.js`, `roadmap.js`, `study-materials.js`, `js/animations/*` | Static content, navigation, and progressive visual behavior. |

DOM rendering in the reviewed dynamic surfaces uses `textContent`, element creation, and `replaceChildren`; the reviewed source scan found no `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, or `new Function` sinks. Remote lesson/material URLs are checked for credential-free HTTPS before being linked.

## Authentication and profile lifecycle

1. `js/firebase/firebase-config.js` publishes the public Firebase Web config and an empty App Check site key. It contains no service-account credential.
2. `js/firebase/auth-client.js` initializes Firebase App, Auth, Firestore, Functions in `us-central1`, and Storage. App Check initializes only when a real site key is configured. `js/firebase/lms-client.js` rejects backend calls if App Check is absent.
3. `js/features/firebase-auth.js` registers via `createUserWithEmailAndPassword`, attempts to set the display name, sends verification email, then signs out. Failures after account creation are explicitly reported; they are not converted into a successful profile/role state.
4. Login chooses Firebase local or session persistence, calls Firebase Auth, and signs out users whose email is not verified. Password-reset responses use a generic “if an account exists” message. Registration's duplicate-email text was made generic in this pass; Firebase project-level email-enumeration configuration was not inspected.
5. `onAuthStateChanged` clears the client profile event when signed out and forces an unverified session to sign out. Dashboard rendering additionally checks the current Auth UID and uses a generation counter to discard stale asynchronous results.
6. `js/firebase/profiles.js` gets UID from `auth.currentUser`, asks the callable to synchronize that user, reads only `users/{currentUid}`, and updates only allowlisted display-name/photo fields. Firestore rules deny client create/delete and privilege-field changes.
7. Source-only `createUserProfile` uses the Auth creation event UID, preserves only an existing trusted custom role from Auth (otherwise `student`), sets the role claim, and creates the profile. It is not deployed; a new user currently has no verified production profile/role lifecycle.
8. Protected callable authorization uses Firebase Auth context, email verification where required, and the trusted UID. Privileged operations now compare the token role with the current Auth custom claim and server-maintained profile role. Direct Firestore admin reads require both the signed admin claim and current profile role. This defense is source-only until deployed and tested.

No frontend authorization relies on local/session storage role values. Firebase Auth remains identity authority. Profile role fields are not accepted as client writes and are not sufficient by themselves to grant access.

## Backend and data model

### Firebase services and state

- Project alias: `.firebaserc` maps `default` to `studio-100351834-51432`.
- Firestore database exists, but source rules/index deployment parity is not verified.
- Cloud Functions are source-only and not deployed. Firebase deployment preflight previously required Blaze; billing is unchanged.
- App Check SDK integration is conditional, but the production site key is empty and the web app was previously reported as unregistered. All callable endpoints enforce App Check.
- Storage rules are source-only; the configured bucket is unavailable and Firebase Console previously reported Blaze required.
- The Firebase browser API key is public client configuration, not an Admin credential. No private service-account file or private key is part of the tracked project.

### Firestore documents and access model

| Path | Read / write boundary in source |
| --- | --- |
| `users/{uid}` | Owner may `get`; update is limited to `name`, matching `displayName`, `photoURL`, and server-time `updatedAt`; client create/delete denied. Admin get/list requires signed admin claim plus profile `role == admin`. |
| `courses/{courseId}` | Client rules deny direct access. Published metadata is returned by callable; admin and assigned-teacher changes use callables. |
| `courses/{courseId}/lessons/{lessonId}` | Client rules deny direct access. Enrolled students receive published lessons; assigned teacher/admin manages via callables. |
| `courses/{courseId}/quizzes/{quizId}` | Client rules deny direct access. Quiz answer keys stay server-side; enrolled attempt start returns question/options without correctness data. |
| `enrollments/{uid_courseId}` | Client rules deny direct access. Callable uses Auth UID and transaction; paid enrollment is rejected. Teacher/admin roster reads are role/course-scoped. |
| `progress/{uid_courseId_lessonId}` | Client rules deny direct access. Callable derives student UID, verifies enrollment and published lesson, and records a self-acknowledgement; it is not proof of engagement. |
| `quizAttempts/{attemptId}` | Client rules deny direct access. Server-created attempt is UID-bound, expiring, versioned, and graded server-side. |
| `quizAttemptCounters/{counterId}` | Client rules deny direct access. Transactional attempt-limit counter keyed from the UID/course/quiz tuple. |
| `certificates/{uid_courseId}` | Client rules deny direct access. Server issuance requires active enrollment, learner acknowledgement of each published lesson, current-version passed required quizzes, and a transaction. Acknowledgements are self-reported. |
| `certificateLookup/{certificateId}` | Client rules deny direct access; callable lookup maps random certificate ID to the private record. |
| `certificateVerification/{sha256Code}` | Client rules deny direct access; stores only a hash of the one-time verification code. |
| `auditLogs/{logId}` | Client rules deny direct access; backend records privileged actions. |
| Other paths | Catch-all Firestore rule denies read/write, including currently unimplemented reviews, articles, announcements, notifications, contact messages, financial data, and roles collections. |

`firestore.indexes.json` declares two composite indexes for `quizAttempts` and one for `progress`; no live index deployment was verified. The source rule has owner read and restricted update but no owner list permission; a user cannot list other profiles through it. Authenticated rules tests and deployed parity remain unverified.

### Callable inventory and source review

Every callable is created through a wrapper with `enforceAppCheck: true`. `requireAuth` checks Auth context and, by default, verified email. Admin SDK writes bypass Firestore client rules, so the server-side guards below are essential. Current Auth/profile role comparison was added for privileged operations.

| Function | Auth / authorization | Input, ownership, data handling, and safety notes |
| --- | --- | --- |
| `createUserProfile` (Auth trigger) | Trusted Auth create event | Uses event UID and Auth user fields; defaults role to student; transaction creates profile only if absent. Not deployed. |
| `deleteUserProfile` (Auth trigger) | Trusted Auth delete event | Deletes `users/{event.uid}` only. Does not cascade-delete learning records; retention/deletion policy needs owner decision. Not deployed. |
| `syncCurrentUserProfile` | Auth context; email verification not required | Ignores client identity/role; reads Auth user by context UID, repairs unknown role to student, synchronizes profile in transaction. Request data is unused. |
| `getCurrentUserAccess` | Verified Auth context | Returns context UID and role claim only for UI gating; it is not a substitute for privileged-operation checks. |
| `listPublishedCourses` | Public callable + App Check | Queries only published courses; optional enrollment status query is filtered by verified caller UID; output is an explicit course allowlist. |
| `getStudentDashboard` | Verified Auth context | Derives UID from token and queries only that UID's enrollments, progress, attempts, and certificates; output is field-allowlisted. |
| `listTeacherCourses` | Current teacher/admin role | Teacher query is restricted to `teacherIds` containing caller UID; admin can list all; course output is allowlisted. |
| `listCourseEnrollmentsForTeacher` | Current teacher/admin role and assigned course unless admin | Validates course ID; returns student UID, status, and dates only; not email or profile data. |
| `teacherGetCourseContent` | Current teacher/admin role and assigned course unless admin | Validates course ID; manager content is scoped to course; admin-only settings are separately allowlisted. |
| `getEnrolledCourseContent` | Verified Auth context | Uses caller UID and active/completed enrollment; returns published lessons only and safe HTTPS URLs. |
| `listEnrolledCourseQuizzes` | Verified Auth context + active/completed enrollment | Returns quiz ID/title/attempt limit only; no answer key. |
| `enrollInCourse` | Verified Auth context | Rejects extra fields and derives UID; transaction verifies published course and price; paid price fails closed; idempotent active/completed enrollment. |
| `updateLessonProgress` | Verified Auth context | Rejects client completion/identity fields; transaction checks caller enrollment, published course/lesson; sets acknowledgement server-side. |
| `startQuizAttempt` | Verified Auth context + enrollment | Transaction checks published quiz/course, counts prior attempts, enforces max attempts, stores private grading snapshot and expiry, returns question/options only. |
| `submitQuizAttempt` | Verified Auth context and attempt ownership | Allowlist is attempt ID + answer indexes; rejects score/pass fields; transaction checks state, expiry, enrollment, course/quiz publication and quiz version; server calculates score. |
| `expireQuizAttempt` | Verified Auth context and attempt ownership | Validates ID and server time; only closes an owned started attempt after expiry. |
| `issueCourseCertificate` | Verified Auth context; caller-owned active/completed enrollment | Transaction checks published course, all published lessons acknowledged by caller, published required quizzes, current quiz versions and server-passed attempts; random ID/code; code stored hashed. |
| `verifyCourseCertificate` | Public callable + App Check | Accepts exactly one certificate ID or one-time code; returns invalid/revoked or limited public fields only. |
| `adminListUsers` | Current admin role | Validates page token; returns a limited Auth user allowlist, 100 at a time. |
| `adminListCertificates` | Current admin role | Limits to 100 and returns certificate ID/name/course/status/date allowlist. |
| `adminRevokeCertificate` | Current admin role | Validates random-format ID; transaction marks revoked; records audit event. |
| `adminUpsertCourse` | Current admin role | Strict key allowlist, field/type/URL/price/currency/teacher/quiz ID checks; paid price does not create payment authorization; audit record. |
| `adminArchiveCourse` | Current admin role | Validates ID and archives course; audit record. |
| `teacherUpsertLesson` | Current teacher/admin role, assigned course unless admin | Strict fields, bounded text/order, HTTPS URLs and valid state; audit record. |
| `teacherArchiveLesson` | Current teacher/admin role, assigned course unless admin | Validates course/lesson and assignment; archives and audits. |
| `teacherUpsertQuiz` | Current teacher/admin role, assigned course unless admin | Strict keys, bounded question/options, integer threshold/attempt/time checks; only trusted writer controls answer keys; audit record. |
| `adminSetUserRole` | Current admin role | Validates target UID and role allowlist; updates profile role before Auth custom claims so a failed claim update fails closed under rules/callable checks; audit record. |

Transactions are used for enrollment state, lesson acknowledgements, quiz attempt creation/submission/expiry, certificate issuance, and revocation. Course/lesson/quiz upserts and role-plus-Auth updates span separate writes and are not a single cross-service transaction; role operations now order writes defensively. No callable or Admin SDK path has been integration-tested against a deployed project.

## Deployment and configuration

- Firebase Hosting serves the static root (`public: "."`) and ignores configuration, rules, indexes, QA/docs, functions, node_modules, and logs. It has short-route and legacy alias rewrites, direct `.html` retention, and security headers.
- `.firebaserc` selects the intended project. `firebase.json` sets Functions runtime `nodejs22`, Functions source, Firestore rules/indexes, Storage rules, and emulator ports.
- Vercel uses static filesystem routing, compatibility rewrites, and the six security headers. It explicitly blocks rules/configuration/Functions/docs paths from the public site.
- There is no root `package.json`, frontend build tool, or frontend build/test script. The site is static HTML/CSS/vanilla JS. `functions/package.json` declares Node.js 22, `npm test` (`node --test`) and `npm run lint` (`node --check index.js`).
- No tracked `.github/workflows` files exist; GitHub Actions deployment/build runs therefore have not been evidenced by a repository workflow. No environment variable manifest is tracked. Browser Firebase configuration is public; private Firebase Admin credentials are provided by the Cloud Functions runtime, not the client.
- Current production routes and headers were previously tested live. Exact Vercel deployment commit and Ready state remain not verified because authorized Vercel API/dashboard access is unavailable.

## Security controls, testing, and open gates

- Firestore rules deny by default. Storage rules restrict owner avatar files to PNG/JPEG/WebP below 5 MiB and deny other paths; no live bucket test is possible.
- CSP allows same-origin scripts plus Firebase/Google reCAPTCHA scripts, does not include `unsafe-eval`, and allows `unsafe-inline` styles. Both Hosting/Vercel configs declare CSP, HSTS, nosniff, frame denial, strict referrer policy, and restricted permissions.
- Source scan results: no unsafe HTML/code-evaluation sinks in the reviewed JavaScript/HTML; no tracked service-account JSON/private key or credential file identified. The Firebase Web API key is public client configuration. This does not replace provider-side key restrictions, secret-store review, or a historical Git secret scan.
- Function unit tests cover Auth context rejection, student privilege denial, email verification, forged identity/role/result fields, role freshness, lesson-ack eligibility, and quiz grading. Emulator-backed Firestore rules tests are absent; Java 17 is below the installed Firebase CLI emulator requirement of Java 21+.
- No production/test accounts, enrollments, quiz results, certificates, or payment records were created. No billing or backend deployment occurred.
- Critical unresolved gates: authenticated Auth lifecycle and cross-user tests need two authorized monitored test accounts; Firestore rules parity/emulator tests; undeployed Functions; App Check provider/site key; unavailable Storage; no payment provider; Vercel deployment provenance.
- Production verdict remains **NOT PRODUCTION READY**. See [CWU_PRODUCTION_READINESS_REPORT.md](./CWU_PRODUCTION_READINESS_REPORT.md) and [CWU_MANUAL_ACTION_REQUIRED.md](./CWU_MANUAL_ACTION_REQUIRED.md).

## Tracked source inventory

- Root: `.firebaserc`, `.gitignore`, `README.md`, the CWU release/action reports, `firebase.json`, `firestore.indexes.json`, `firestore.rules`, `storage.rules`, `vercel.json`, and `index.html`.
- `css/`: `animations.css`, `certificate.css`, `components.css`, `dashboard.css`, `home.css`, `responsive.css`, `style.css`.
- `data/`: `courses.js`, `questions.js`, `technologies.js`.
- `js/animations/`: `counters.js`, `interactions.js`, `reveal.js`.
- `js/core/`: `app.js`, `events.js`, `navigation.js`, `theme.js`.
- `js/features/`: `admin.js`, `auth.js`, `certificates.js`, `contact.js`, `courses.js`, `dashboard-profile.js`, `dashboard.js`, `firebase-auth.js`, `home-auth.js`, `lms-admin.js`, `lms-certificates.js`, `lms-courses.js`, `lms-dashboard.js`, `lms-quiz.js`, `quizzes.js`, `roadmap.js`, `study-materials.js`.
- `js/firebase/`: `auth-client.js`, `avatars.js`, `firebase-config.js`, `lms-client.js`, `profiles.js`.
- `js/utils/`: `helpers.js`, `storage.js`, `validation.js`; `js/certificate-generator.js` is the separate local-preview generator.
- `functions/`: `index.js`, `package.json`, `package-lock.json`, `lib/quiz-grading.js`, `lib/role-authorization.js`, `lib/certificate-eligibility.js`, `test/callable-guards.test.js`, `test/quiz-grading.test.js`.
- `pages/`: all 18 HTML pages enumerated in the Frontend section above.
- `assets/`: certificate and logo PNGs; course `SOURCES.md`; SVG illustrations `career-development`, `cloud-security`, `course-placeholder`, `cpp-programming`, `cyber-threat-intelligence`, `devops`, `digital-forensics`, `ethical-hacking`, `incident-response`, `java-programming`, `javascript`, `linux-security`, `network-security`, `networking`, `python-programming`, `python-security`, `secure-coding`, `soc-fundamentals`, and `web-development`.
- `docs/`: database structure, Firebase setup/security, production deployment/checklist, and three final security/production audits.
- `QA/`: accessibility, CWU website, functional, performance, responsive, security, and UI/UX audit documents.
- No tracked `.github/workflows/`, root package manifest, `.env` file, or frontend package lock exists. `functions/node_modules` and Firebase Hosting cache are generated/untracked workspace data, not application source.
