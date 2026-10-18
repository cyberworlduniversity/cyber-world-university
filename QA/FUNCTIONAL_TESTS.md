# Functional test checklist

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
- [x] Confirm demo mode still validates login/registration when Firebase config is blank (tested earlier in browser).
- [x] Confirm password mismatch is reported by registration (tested earlier in browser).
- [x] Confirm registration creates a Firebase Auth account and sends an email-verification message.
- [x] Confirm password-reset request reaches Firebase and returns a non-enumerating confirmation.
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
- [x] JavaScript syntax passes for 30 first-party JS files.
- [x] Cloud Functions lint passes and the exports initialize under Node 22.
- [x] Firebase Auth registration and password-reset requests reach the configured project; login/logout remain unverified pending a successful email-verification sign-in.
