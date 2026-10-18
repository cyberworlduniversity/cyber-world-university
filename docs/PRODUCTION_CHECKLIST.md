# CWU production checklist

**Project:** `studio-100351834-51432`  
**Hosting:** https://studio-100351834-51432.web.app  
**Status:** Hosting deployment verified; **NOT PRODUCTION READY as an LMS**.

| Area | Status | Evidence / required action |
| --- | --- | --- |
| Public Hosting routes | PASS (smoke test) | 19 pages and 31 first-party destinations returned HTTP 200; not-found probe returned 404. |
| Responsive layout | PASS (layout smoke test) | 19 pages checked at 320, 375, 390, 412, 768, 1024, 1366, and 1440 CSS px; 152 checks with no horizontal overflow. Touch/device behavior remains untested. |
| Hosting security headers | PASS | Live CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` observed. Browser sweep found no CSP violations on audited pages. |
| Hosting source exclusions | PASS | Live `/firestore.rules`, `/storage.rules`, `/QA/SECURITY_TESTS.md`, `/functions/index.js`, and audit-report paths return 404. |
| Hosting deployment | PASS | Hosting-only release completed; live channel list shows `2026-10-18 13:22:50`. No backend target was deployed. |
| Git worktree / GitHub | NOT VERIFIED | Git CLI is unavailable and no remote/repository URL was confirmed. `.gitignore` now covers environment files, key/service-account files, and `.vercel/`. |
| Vercel | NOT DEPLOYED | No Vercel project, preview, production URL, or Firebase authorized-domain change was verified. |
| Firebase client project | PASS (source) | Project configuration was previously verified as `studio-100351834-51432`; this does not confirm all deployed Console settings. |
| Authentication runtime | NOT VERIFIED | No account credentials were supplied. Test registration, verification, login, reset, disabled-account behavior, session persistence, and logout with non-production identities. |
| Authorization / RBAC | FAIL for LMS release | Admin/student pages and learning data are demos. Implement and test trusted server-side authorization before offering privileged workflows. |
| Firestore rules | NOT VERIFIED | Source rules are restrictive; run emulator tests for unauthenticated, owner, cross-user, safe-field updates, role escalation, and immutable fields; verify deployed rules. |
| Storage rules | NOT VERIFIED | Source rules appear owner-scoped; run emulator tests for owner/cross-user access, invalid MIME/type, size, delete, and denied paths; verify deployed rules. |
| Cloud Functions | NOT VERIFIED | Source lint passed and profile triggers exist in source. Verify emulator behavior, deployed versions, runtime health, IAM, and billing. |
| App Check | NOT VERIFIED | Inspect Firebase Console configuration and enforcement. Do not mark PASS without evidence. |
| Secrets | PASS (limited scan) | Bounded source scan found no secret indicators; project searches found no `.pem`, `.key`, or service-account JSON. Git history and deployed secrets were not audited. |
| XSS / injection | PASS (static review only) | No confirmed user-controlled HTML sink in bounded source review. Dynamic injection testing remains outstanding. |
| Courses / enrollments / progress | FAIL for LMS release | Existing catalog/dashboard behavior is static/demo; backend-authoritative workflows are not verified. |
| Quizzes / exams | FAIL for LMS release | Sample scoring and attempts are client-side/demo and not authoritative. |
| Certificates | FAIL for LMS release | Generation and lookup are previews/samples; no trusted issuer record or completion validation was verified. |
| Payments | NOT CONFIGURED | No real provider or server-verified payment/webhook integration was found. |
| Print preview | NOT VERIFIED | Deployed markup and external handler are present, but the latest live interaction check did not conclusively trigger printing. |
| Performance | NOT VERIFIED | Lighthouse/Web Vitals not run; assess large certificate artwork and request/caching profile. |
| Accessibility | NOT VERIFIED | Complete keyboard, contrast, screen-reader, and assistive-technology audit remains outstanding. |

## Required before production LMS release

1. Implement server-authoritative RBAC and the required protected course, enrollment, progress, quiz/grading, and certificate workflows.
2. Test Firestore/Storage rules and Functions in emulators; verify deployed rules, Functions/IAM, Auth settings, and App Check with an authorized Firebase operator.
3. Test authenticated workflows using dedicated non-production student, teacher, and admin identities, including cross-user and privilege-escalation denials.
4. Confirm the dashboard print action and rerun its focused browser test.
5. Complete GitHub/Vercel setup only with authorized accounts and an actual repository/deployment; verify a preview before production and add the actual Vercel host to Firebase Auth only after deployment.
6. Complete full accessibility and performance review and repeat regression checks.

For the evidence and detailed findings, see [FINAL_PRODUCTION_SECURITY_AUDIT.md](./FINAL_PRODUCTION_SECURITY_AUDIT.md).
