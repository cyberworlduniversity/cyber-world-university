# CWU production checklist

> **Historical snapshot.** Several rows below reflect earlier deployment and test evidence. The latest no-billing status, including updated authentication/UI integration and Vercel route checks, is in [CWU_PRODUCTION_RELEASE_REPORT.md](../CWU_PRODUCTION_RELEASE_REPORT.md).

**Project:** `studio-100351834-51432`  
**Hosting:** https://studio-100351834-51432.web.app  
**Vercel:** https://cyber-world-university-2026.vercel.app/  
**Status:** Static Hosting is live; Firebase backend features remain incomplete; **NOT PRODUCTION READY as an LMS**.

| Area | Status | Evidence / required action |
| --- | --- | --- |
| Public Hosting routes | PASS | 19 pages and 31 first-party destinations returned HTTP 200; not-found probe returned 404. |
| Responsive layout | PASS | Prior Firebase sweep: 19 pages at eight widths (152 checks). Vercel sweep: 19 routes at 320, 390, 768, and 1440 CSS px (76 checks). Touch/device behavior remains untested. |
| Hosting security headers | PASS | Latest Firebase Hosting and Vercel responses returned CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`. This is not a full browser CSP audit. |
| Hosting source exclusions | PASS | Live `/firestore.rules`, `/storage.rules`, `/QA/SECURITY_TESTS.md`, `/functions/index.js`, and audit-report paths return 404. |
| Hosting deployment | PASS | Hosting-only release completed; live channel list shows `2026-10-18 13:22:50`. No backend target was deployed. |
| GitHub repository | PASS | Public repository and `main` branch verified. No GitHub writes or pushes were performed in this pass. |
| Vercel production | PASS | Live `/pages/login` and `/pages/register` returned HTTP 200; all six expected security headers were observed, and selected rules/Functions source paths returned 404. Exact deployment commit linkage remains unverified. |
| Vercel short page aliases | FAIL | Live `/courses`, `/login`, `/register`, `/student-dashboard`, `/admin-panel`, `/certificates`, and `/verify-certificate` returned HTTP 404; `/pages/...` clean routes work. Matching aliases were added to local `vercel.json` but were not deployed or live-verified. |
| Deployment commit linkage | NOT VERIFIED | GitHub `main` is `4eebedf`; live Vercel behavior/timestamp are consistent, but its deployed SHA is not exposed and GitHub has no deployment record. |
| Deployment source parity | NOT VERIFIED | Homepage text comparisons are not proof of exact source/build parity; the active Vercel SHA is not exposed. |
| Vercel authorized domain | NOT VERIFIED | Inspect Firebase Authentication authorized domains in Console; do not assume this domain is configured. |
| Firebase client project | NOT VERIFIED | Source configuration names `studio-100351834-51432`; current deployed client/source parity and all Firebase Console settings have not been confirmed. |
| Authentication runtime | NOT VERIFIED | A live nonexistent-account login returned `INVALID_LOGIN_CREDENTIALS` and the UI displayed an error, not success. Local mocked tests cover registration/verification request, verified login/logout-refresh, unverified-email rejection, and invalid credentials; no Firestore requests were made. No real test accounts or verification emails were used. |
| Authentication initialization UX | PASS | Local browser checks verified no-config and Firebase module-initialization-failure states keep submit/reset controls disabled. A fake credential Enter-key attempt made no POST and did not put values in the URL. No real credentials or account were used; live positive Auth remains unverified. |
| Demo feature claims | PASS | Local browser checks showed explicit NOT CONFIGURED admin/backend status, practice/demo quiz output, no-issuance certificate preview copy, unavailable sample verification, and course enrollment-not-configured messaging. |
| Authorization / RBAC | NOT CONFIGURED | No protected server-side student/teacher/admin workflows are deployed; the public pages are previews, not access controls. |
| Frontend role handling | NOT CONFIGURED | No client-side role grants or role-based access protection are implemented. The profile role is display-only; browser storage is not an authority. |
| Firestore rules | NOT VERIFIED | Live unauthenticated read, create, update, and delete probes returned HTTP 403 `PERMISSION_DENIED`. Source rules passed Firebase dry-run compilation. Authenticated owner, cross-user, escalation cases and source/deployed rule parity remain unverified; no rules were deployed. |
| Storage rules | NOT CONFIGURED | Configured bucket returned HTTP 404, “The specified bucket does not exist.” Source rules were not live-tested or deployed. |
| Cloud Functions | NOT CONFIGURED | Source now includes profile sync, course listing/enrollment/content, progress, quiz grading, certificate issue/verification, admin role/course, and assigned teacher operations. Node 22 module load, auth/input guard checks, and grading unit tests passed; no Functions are deployed. A prior dry-run preflight reported Blaze is required; billing remains disabled. |
| App Check | NOT VERIFIED | Inspect Firebase Console configuration and enforcement. Do not mark PASS without evidence. |
| Secrets | NOT VERIFIED | Bounded scan found the expected Firebase Web API key in public client configuration; no private-key markers, service-account credentials, `.pem`/`.key`, or `.env` files were found. Git history and deployed secrets were not audited. |
| XSS / injection | NOT VERIFIED | Bounded first-party source scan found no dynamic HTML/code-execution sinks; an earlier harmless payload rendered as text in the live certificate generator. Other pages and payloads were not comprehensively fuzzed. |
| Courses / enrollments / progress | NOT CONFIGURED | Catalog/dashboard content is static/demo; no backend-authoritative enrollment or progress service is deployed. |
| Quizzes / exams | NOT CONFIGURED | Scoring and attempts are client-side practice/demo only; authoritative server-side grading is unavailable. |
| Certificates | NOT CONFIGURED | Generation and lookup are previews/samples; no trusted issuance, completion validation, or verification service is deployed. |
| Payments | NOT CONFIGURED | No real provider, payment success flow, server-side transaction validation, or webhook integration was found. |
| Print preview | NOT VERIFIED | Deployed markup and external handler are present, but the latest live interaction check did not conclusively trigger printing. |
| Performance | NOT VERIFIED | Lighthouse/Web Vitals not run; assess large certificate artwork and request/caching profile. |
| Accessibility | NOT VERIFIED | Complete keyboard, contrast, screen-reader, and assistive-technology audit remains outstanding. |

## Required before production LMS release

1. Implement server-authoritative RBAC and the required protected course, enrollment, progress, quiz/grading, and certificate workflows.
2. Test Firestore/Storage rules and Functions in emulators; verify deployed rules, Functions/IAM, Auth settings, and App Check with an authorized Firebase operator.
3. Test authenticated workflows using dedicated non-production student, teacher, and admin identities, including cross-user and privilege-escalation denials.
4. Confirm the dashboard print action and rerun its focused browser test.
5. Continue monitoring the live Vercel headers and confirm the active build SHA; no deployment action is authorized by this checklist.
6. Obtain Vercel deployment metadata or an immutable deployment URL to confirm the exact active build SHA; deploy the approved alias change only after review, then verify the short routes and `.html` routes.
7. Verify the Vercel hostname in Firebase Auth authorized domains through an authorized Firebase Console session.
8. Complete full accessibility and performance review and test the additional 360px/414px mobile widths before release.
9. Run Firestore/Functions Emulator Suite integration tests using JDK 21+ (current environment has Java 17), then deploy Functions/indexes only after the project owner authorizes Blaze.

For the evidence and detailed findings, see [FINAL_PRODUCTION_SECURITY_AUDIT.md](./FINAL_PRODUCTION_SECURITY_AUDIT.md).
