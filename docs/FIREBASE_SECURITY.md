# Firebase security model

## Repository rule boundary (deployment not verified)

Security is enforced by Firebase rules and trusted Cloud Functions, not by hiding pages or checking roles in browser code.

| Resource | Current access |
| --- | --- |
| `users/{uid}` | Source rules allow the signed-in owner to read one profile and update only matching `name`/`displayName`, `photoURL`, and `updatedAt`. Admin reads require both the signed `admin` custom claim and the server-maintained profile role to be `admin`, so a stale token alone does not retain admin reads after role revocation. Clients cannot create, delete, or change role/status/email fields. Authenticated owner and role cases are not live-tested; deployed-rule parity is unknown. |
| Other Firestore documents | Denied by repository source rules. Only specific unauthenticated probes have been tested live. |
| `users/{uid}/avatar/avatar.{png,jpg,jpeg,webp}` | Source rules allow owner-only read, create, update, and delete; uploads must be image/png, image/jpeg, or image/webp and smaller than 5 MiB. The configured bucket does not exist, so this boundary is not live-tested. |
| Other Storage objects | Denied by repository source rules; Storage is not configured in the project. |

The Auth creation trigger in source would assign new public registrations the `student` role claim and create a profile using the Admin SDK. The source-only `syncCurrentUserProfile` callable uses the authenticated UID, reads the Firebase Auth user record, and synchronizes a profile without accepting a client UID or role. Source-only LMS callables also define assigned-teacher/admin authorization for course and quiz management, server-side enrollment/progress/grading/certificate operations, and admin role changes. No Cloud Functions are deployed in the Firebase project; a dry-run deployment check reported that Functions require the Blaze plan. Billing was not enabled. Do not claim new registrations currently receive a server-assigned role/profile or that these callables provide a live authorization boundary. The Auth deletion trigger and all callable operations remain source-only. `teacher` and `admin` claims must be granted through a trusted operator or an already-authorized server callable, never from browser code.

Custom claims can take effect in an ID token only after it is refreshed. Privileged callable operations additionally compare the token role with the current Auth custom claim and server-maintained profile role. Admin Firestore rules require both claim and profile role to match. The role-update callable writes the profile role before updating the custom claim so revocation fails closed if claim update fails. These source defenses are not live verified until deployed and emulator/authenticated tests pass.

## Source-only backend boundary (not deployed)

The approved data design is documented in `docs/DATABASE_STRUCTURE.md`. It covers profiles, public categories and published courses, nested modules/lessons/material metadata, owner-scoped enrollment/progress/notifications, published articles and announcements, reviews, and server-protected quiz keys/attempts, certificates, contact messages, and audit logs.

The callable implementation is source only. Every collection other than the user-profile path remains denied to browser clients by repository source rules; the Admin SDK callables bypass client rules and require emulator authorization/integration tests. Live unauthenticated read, create, update, and delete probes returned HTTP 403 `PERMISSION_DENIED`; these probes do not establish authenticated owner isolation, callable transaction behavior, or deployed-rule parity. Do not add broad authenticated-user or public wildcard rules to make unfinished pages work. Assessment answers, scores, certificate eligibility, contact submissions, and audit records must remain server-side.

Teacher access must be constrained to courses assigned to their trusted UID/claim-backed assignment. Student reads of other students' profiles or progress remain denied. Public certificate verification must not expose the certificate collection directly; use a trusted endpoint that returns only minimum public verification fields. Contact and audit collections remain server-only for writes, and quiz correct answers must never be present in learner-readable quiz documents.

## Release checks

Before deploying rules or Functions to a real project:

1. Verify the intended Firebase project ID. The `(default)` Firestore database already exists; do not create another database.
2. Install Java 21+ and run Firestore Emulator tests for owner access, cross-user denial, unauthenticated denial, role escalation denial, query constraints, assigned-teacher boundaries, private quiz keys, and server-only collections. Keep the existing Storage rules unchanged.
3. Review each allowed collection/path and confirm no catch-all rule grants access.
4. Confirm trusted role assignment and server-only writes use Admin SDK credentials outside Hosting and browser code.
5. Review Cloud Functions billing requirements and obtain project-owner approval.

The source rules compiled successfully during a Firebase dry-run preflight, but have not been exercised in the Emulator Suite because the current machine has Java 17 and the current emulator setup requires Java 21+. The preflight did not deploy rules; Functions deployment is blocked by the current Firebase plan. No production rules or Functions were deployed.
