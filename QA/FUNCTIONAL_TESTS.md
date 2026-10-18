# Functional test checklist

> Firebase account-flow results in this checklist are historical and do not describe the current deployment. See [CWU_PRODUCTION_RELEASE_REPORT.md](../CWU_PRODUCTION_RELEASE_REPORT.md) for current evidence. Recent local browser tests did not create accounts or send email.

## Public pages and navigation

- [x] Inventory all 19 first-party HTML pages.
- [x] Confirm local `script`, `link`, `img`, and `source` references resolve across 22 checked HTML documents.
- [x] Load all 19 application pages at four viewport sizes; no page script errors or failed network requests after the course image fix.
- [ ] Open every public and demo page and verify all page-specific controls.
- [ ] Verify homepage → catalog → course details → register/login → learner content → quiz/exam → certificate → verification end to end.
- [x] Verify valid contact submission, course search/filter/clear, course detail account/assessment links, quiz submit/restart, certificate preview, and sample verification.
- [x] Verify empty contact form is blocked by native required-field validation.
- [ ] Verify every dynamic and static navigation destination.

## Account flows

- [x] Confirm account pages load the Firebase SDK over HTTP with the supplied Web config.
- [x] Confirm missing Firebase configuration leaves sign-in, registration, and password-reset controls disabled; no demo authentication fallback is provided.
- [ ] Verify registration-handler password mismatch handling with a mocked Firebase SDK; no real account may be created.
- [x] Mock Firebase signup, display-name update, verification-email request, and sign-out; this did not create a real Firebase account or send email.
- [ ] Test a Firebase password-reset request with a user-controlled test inbox; no real reset request was sent in this hardening pass.
- [ ] Complete email verification, login, persistence, and sign-out using an email inbox controlled by the tester; prior login attempts were rate-limited.
- [ ] Verify trusted profile creation and deletion in the Functions Emulator.
- [ ] Verify owner profile read/update in Firestore Emulator.

## Course, assessment, and certificate

- [x] Test course search, category filter, clearing filters, and detail/account/assessment links.
- [x] Test quiz initial state, unanswered submission, and restart.
- [x] Test certificate preview name update, local generate, and sample verification.
- [ ] Test every course filter, combined filters, quiz answer navigation/timing, uploaded image validation, and printing.
- [ ] Confirm production enrollment, progress, scoring, issuance, and verification remain unavailable until trusted backend workflows exist.

## Current findings

- [x] Fixed missing course image references that generated HTTP 404 requests by mapping the courses to local SVG artwork.
- [x] Verified the fix: no broken images or HTTP failures across 19 pages at four viewport sizes.
- [x] JavaScript syntax passes for 32 first-party JS files in the final pre-push review.
- [x] Cloud Functions lint passes and the exports initialize under Node 22.
- [ ] Test registration and password-reset requests against Firebase using a user-controlled test inbox; no real registration, reset request, or verification email was performed during the current hardening pass.
- [x] Locally mock Firebase Auth registration/verification request, verified login/logout-refresh, unverified-email rejection, and invalid credentials; no Firestore request was made and no real account or email was used.
- [x] In a local browser with a mocked Firebase rejection, login displayed an authentication error rather than success and issued no POST; only synthetic `.invalid` credentials were entered.
- [x] In a local browser, confirm missing Firebase configuration leaves sign-in, registration, and password-reset controls disabled; Firebase module initialization failure leaves submit controls disabled; an Enter key attempt sends no POST and adds no credentials to the URL.
- [x] Check admin, quiz, course, certificate-generator, sample-lookup, and dashboard UI: backend states are unavailable/not configured and client-side results are explicitly samples/previews.
