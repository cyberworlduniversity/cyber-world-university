# CWU Final Production Security Audit

**Date:** 2026-10-18  
**Firebase project:** `studio-100351834-51432`  
**Firebase Hosting URL:** https://studio-100351834-51432.web.app  
**Vercel URL:** https://cyber-world-university-2026.vercel.app/  
**GitHub repository:** https://github.com/cyberworlduniversity/cyber-world-university (public `main` at `4eebedf869b9ec16002240d44102a30e6853ed7a`)

## Scope and evidence

Reviewed the static site, Firebase client/auth/profile integration, Firestore and Storage rules source, Cloud Functions source, hosting/deployment configuration, student/admin demo pages, and course/quiz/certificate/payment paths. Ran live checks against Firebase Hosting and Vercel, including the Vercel post-deployment verification below. No authenticated test identity, Firebase Console session, or emulator test run was available. Findings below distinguish source review from deployed runtime verification.

The current frontend is a static HTML/CSS/JavaScript site served from the repository root. The dashboard, admin, course, quiz, and certificate pages are demos; they are not a deployed, backend-authoritative LMS.

## Live Vercel post-deployment verification (2026-10-18)

- GitHub `main` points to `4eebedf869b9ec16002240d44102a30e6853ed7a`, and that commit adds `vercel.json` and updates the audit/deployment docs. GitHub reports no deployment records and the public Vercel response exposes no commit SHA. The live route behavior and timestamp are consistent with this commit, but exact build-SHA linkage is **NOT VERIFIED**.
- All ten requested source/config paths now return HTTP 404: `/firestore.rules`, `/storage.rules`, `/firebase.json`, `/.firebaserc`, `/functions/index.js`, `/functions/package.json`, `/QA/SECURITY_TESTS.md`, `/docs/FINAL_PRODUCTION_SECURITY_AUDIT.md`, `/docs/PRODUCTION_DEPLOYMENT.md`, and `/docs/PRODUCTION_CHECKLIST.md`.
- On the live homepage and public routes, HSTS is present (`max-age=63072000; includeSubDomains; preload`). CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` are absent. Security-header verification **FAILS** on Vercel.
- Extensionless dashboard, courses, login, and contact routes return HTTP 200. Their `.html` forms redirect once (HTTP 308) to the extensionless URL and then return HTTP 200; no redirect loop was observed.
- A browser sweep covered 19 routes at 320, 390, 768, and 1440 CSS px (76 checks). A rapid quiz navigation timed out once but an isolated retry returned HTTP 200. No console errors or failed network requests were observed. The certificate page has optional empty image slots; no broken image request was observed.
- No Firebase production settings or data were changed.

The header rules present in the pushed commit did not produce five of six required live headers. A local, schema-validated configuration change moves them into a continuing route-level Vercel header rule. That proposed correction is not pushed or deployed and still requires live verification.

## Production security gate

| Control | Result | Evidence / limitation |
| --- | --- | --- |
| Critical authentication | NOT VERIFIED | No test account credentials were supplied. Registration, login, reset, verification, disabled-account handling, and logout were not exercised against a user account. |
| Authorization / RBAC | FAIL | Role-backed student/teacher/admin workflows are not implemented and verified as protected backend operations. Dashboard and admin pages are public static demos, not access controls. |
| Firestore | NOT VERIFIED | Source rules are restrictive and deny unmatched paths; owner, cross-user, role-escalation, and deployed-rule behavior were not tested with authenticated identities or the emulator. |
| Storage | NOT VERIFIED | Source rules appear owner-scoped with path/type/size restrictions; authenticated upload/read/delete and deployed-rule behavior were not tested. |
| Cloud Functions | NOT VERIFIED | Source has Auth-triggered profile provisioning/cleanup and passed the Functions lint command. Deployed versions, runtime health, IAM, and authenticated behavior were not verified. |
| App Check | NOT VERIFIED | Firebase Console configuration and enforcement could not be inspected. |
| Certificates | FAIL | Generation and lookup are client-side sample/preview flows; no trusted issuance record, completion check, or authoritative verifier was demonstrated. |
| Payments | NOT CONFIGURED | No real payment provider, server-side transaction verification, or webhook was found in the reviewed application source. |
| Secrets | PASS (limited scan) | No credential/private-key indicators were found in the earlier bounded scan of 77 source/config/documentation files. This is not a full Git-history or deployed-secret audit. No service-account, `.pem`, or `.key` files were found in the project tree search. |
| XSS / injection | PASS (static review only) | The earlier source review found no confirmed user-controlled HTML sink; the identified `innerHTML` use inserts a fixed empty-state string. No comprehensive dynamic injection test was performed. |
| Security headers | PASS on Firebase Hosting; FAIL on Vercel | Hosting has the restrictive CSP and baseline headers. Vercel has HSTS only; five required headers are absent. |
| Mobile layout | PASS (layout smoke test) | All 19 audited pages passed at 320, 375, 390, 412, 768, 1024, 1366, and 1440 CSS px: 152 route/viewport checks, with no horizontal overflow or failed route. Touch/device testing was not performed. |
| Performance | NOT VERIFIED | No Lighthouse/Web Vitals run was completed. A prior asset scan identified certificate artwork as a possible optimization target. |
| Accessibility | NOT VERIFIED | A complete keyboard, contrast, screen-reader, and assistive-technology audit was not performed. |
| Hosting deployment | PASS | Hosting-only deployment succeeded. The Firebase Hosting channel list showed the live release at 2026-10-18 13:22:50. No Firestore rules, Storage rules, or Functions deployment was performed. |
| Vercel deployment | FAIL (security headers); exact commit NOT VERIFIED | Protected source paths return 404, but five required headers remain absent. Live behavior is consistent with `4eebedf`; the exact Vercel build SHA is not publicly exposed. |

## Hosting and route checks

- The live homepage and all 19 audited first-party page routes returned HTTP 200; the missing-route probe returned HTTP 404.
- A post-deployment browser sweep checked 19 pages at eight viewport widths (152 checks). It recorded no page exceptions, console errors, failed requests, route failures, horizontal overflow, or CSP violations.
- An earlier navigation sweep found 31 first-party internal destinations returning HTTP 200.
- Firebase Hosting homepage and student-dashboard responses contain the deployed CSP. Vercel responses do not contain a CSP. Both dashboards use `data-print-preview` and no inline `onclick`; the print control itself was not conclusively triggered.
- `/firestore.rules`, `/storage.rules`, `/QA/SECURITY_TESTS.md`, `/docs/FINAL_PRODUCTION_SECURITY_AUDIT.md`, and `/functions/index.js` return HTTP 404. The report is local documentation and is intentionally excluded from Hosting.
- A safe unauthenticated read attempt against Firestore previously returned HTTP 403. This does not verify authenticated owner/cross-user behavior or the deployed rules version.
- Current source configuration still targets `studio-100351834-51432` and sets `useEmulators: false`. Emulator connection code is present but guarded by that flag. There is no root build manifest; this is a plain static HTML/CSS/JavaScript site.
- Vercel production returns HTTP 200 for all 19 audited `.html` page routes. Extensionless dashboard/courses/login/contact routes return HTTP 200; `.html` requests receive one HTTP 308 redirect to their extensionless URL.
- The ten protected-source/config/documentation paths listed above return HTTP 404 on current Vercel production. This is source-exposure hardening, not evidence that backend rules have been authenticated or tested.
- Vercel live responses include HSTS only; CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy` are absent despite their presence in the pushed config.
- The public GitHub `main` branch, Vercel homepage, and local/Firebase homepage text match after normalizing line endings and trailing newlines. Raw-byte hashes differ because the files use different line-ending/encoding representations. No GitHub Actions workflows or workflow runs were listed.
- The current `main` branch at `4eebedf` has `vercel.json` with clean URLs, protected-path 404 rules, and global header configuration. A local edit changes the global header configuration to a continuing route-level rule because the pushed headers are not present live. That edit is not pushed.

Firebase Hosting Content-Security-Policy:

```text
default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://firebasestorage.googleapis.com https://firebasestorage.app https://*.firebaseapp.com
```

## Findings and remaining risks

### Production blockers

1. **RBAC and protected workflows are absent or demo-only.** A public static admin page is not a protected admin console. Course changes, enrollment, progress, quiz grading, certificates, and payment state are not authoritative server-side operations.
2. **Authenticated Firebase behavior is unverified.** No test account was available for registration/login/logout, user profile read/write, cross-user denial, or role-escalation tests.
3. **Firebase backend release state is unverified.** Firestore/Storage deployed rules, Functions deployment/IAM, App Check, Auth authorized domains, and Console settings were not checked.
4. **Five required Vercel security headers are missing.** Only HSTS is present; a local route-level header configuration is prepared but has not been deployed.
5. **Exact Vercel deployment SHA is not directly verifiable.** Live behavior and timestamp are consistent with `4eebedf`, but public Vercel/GitHub deployment metadata did not bind the active deployment to that SHA.
6. **The live print-preview control was not conclusively exercised** in the latest browser check, despite the deployed markup and external handler being present.

No confirmed critical exploitable vulnerability was established by the bounded source review and unauthenticated live checks. This is not equivalent to a full penetration test.

## Changes applied

- Added a source-restricted Content Security Policy and retained baseline security headers in Hosting configuration.
- Excluded `QA/**`, `firestore.rules`, `storage.rules`, and `functions/**` from Hosting deployment.
- Removed the student dashboard's inline print handler and attached printing from its external dashboard script.
- Hardened `.gitignore` against environment files, private keys, service-account JSON, and Vercel local metadata.
- The pushed Vercel config blocks protected-source paths and enables clean URLs, but the configured response headers are not effective in live responses.
- Prepared a local route-level Vercel header fix; it is not deployed.
- Updated deployment/checklist documentation and recorded the audit evidence.
- Deployed Hosting only. No Auth, Firestore, Storage, Functions, App Check, or role-policy deployment/configuration change was made in this Hosting release.

## Files changed

- `.gitignore`
- `firebase.json`
- `vercel.json` (remote config at `4eebedf`; local route-level header correction is not deployed)
- `js/features/dashboard.js`
- `pages/student-dashboard.html`
- `docs/PRODUCTION_DEPLOYMENT.md`
- `docs/PRODUCTION_CHECKLIST.md`
- `docs/FINAL_PRODUCTION_AUDIT.md`
- `docs/FINAL_PRODUCTION_SECURITY_AUDIT.md`

The application/Hosting changes in `firebase.json`, `js/features/dashboard.js`, and `pages/student-dashboard.html` were included in the completed Hosting deployment. Documentation and `.gitignore` are not Hosting runtime changes.

## Tests performed

**Passed**

- Hosting-only deployment completed; live channel/release listing returned the `live` channel.
- Live homepage, 19 page routes, and 31 internal destinations returned HTTP 200; not-found probe returned HTTP 404.
- Post-deployment responsive route sweep: 152 checks across the eight widths listed above; no overflow, console/page errors, failed requests, route failures, or observed CSP violations.
- Live security-header checks confirmed CSP, HSTS, MIME sniffing protection, frame restriction, referrer policy, and permissions policy.
- Hosting exclusion checks returned HTTP 404 for rules, QA, audit-doc, and Functions source paths.
- Safe unauthenticated Firestore read was denied with HTTP 403.
- Functions source lint/syntax check passed in the earlier audit.
- Current Functions lint passed again, and 31 first-party JavaScript files passed Node module syntax checks.
- Confirmed the Firebase source project ID and checked emulator mode is disabled in the checked-in client config.
- Verified GitHub `main` equals `4eebedf869b9ec16002240d44102a30e6853ed7a`; it adds `vercel.json`. GitHub has no deployment records and Vercel exposes no build SHA, so exact build linkage remains unverified.
- Confirmed all ten requested Vercel source/config/docs paths return HTTP 404.
- Confirmed Vercel has HSTS but lacks CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`.
- Tested all 19 audited Vercel `.html` routes and extensionless dashboard/courses/login/contact routes. Clean URLs return HTTP 200; `.html` URLs redirect once with HTTP 308. No loop observed.
- Browser smoke sweep covered 19 routes × four viewport widths (76 checks); isolated quiz retry passed; zero console errors and zero failed network requests observed. Optional empty image slots were not failed asset requests.
- Validated the local route-level Vercel header configuration against Vercel's published schema and representative deny routes. This validates config structure only, not live behavior.
- Compared local, GitHub/Vercel, and Firebase homepage text; they match after normalizing line endings and trailing newlines.
- Added a local Vercel route-level header correction. No GitHub write or Vercel deployment access was available, so it is not deployed or live-verified.
- Earlier demo checks exercised course search, study-material filtering, quiz preview, certificate preview/sample lookup, and contact-form local validation. These are demo interactions, not authenticated LMS acceptance tests.

**Failed or not verified**

- Role authorization is not a completed protected LMS workflow.
- Authenticated registration/login/logout and user-profile lifecycle were not tested.
- Owner/cross-user Firestore and Storage tests, role-escalation tests, and rule emulator tests were not run.
- Deployed Firestore/Storage rule versions, deployed Functions/IAM, App Check, Firebase Console settings, and complete Auth configuration were not verified.
- Certificate issuance/verification, payment flows, backend course/quiz workflows, and the dashboard print interaction were not verified as production features.
- The pushed path-blocking/clean-URL rules are live; five security headers still need an updated deployment and live verification.
- Exact Vercel deployment SHA remains unverified because Vercel exposes no build SHA and GitHub returned zero deployment records.
- Vercel domain authorization in Firebase, Lighthouse, and full accessibility testing were not verified.

## Required next actions

1. Do not represent CWU as a production LMS until secure server-authoritative RBAC, course/enrollment/progress, grading, and certificate workflows are implemented and tested.
2. Run Firestore/Storage emulator tests for unauthenticated, owner, cross-user, safe-field update, role escalation, file validation, and delete cases.
3. With an authorized Firebase operator, verify deployed rules, Functions/IAM, Auth domains, App Check, and project settings; test using dedicated non-production identities.
4. Push the local route-level header correction in `vercel.json` to GitHub `main` and verify all six headers on live Vercel.
5. Obtain Vercel deployment metadata or an immutable deployment URL to verify the active build SHA.
6. Confirm/fix the print-preview interaction in a browser and rerun the focused UI regression.
7. Verify the Vercel domain in Firebase Authentication authorized domains through an authorized Firebase Console session.
8. Complete a performance/accessibility pass and rerun regression tests before any LMS release.

## Final status

**NOT PRODUCTION READY**

Firebase Hosting and Vercel public routes passed bounded route smoke checks, and Vercel source paths are now blocked. Vercel's required headers are incomplete; critical authenticated authorization, Firebase backend deployment/configuration, and production LMS workflows remain unverified or unimplemented.
