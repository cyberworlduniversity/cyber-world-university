# Firebase security model

## Implemented boundary

Security is enforced by Firebase rules and trusted Cloud Functions, not by hiding pages or checking roles in browser code.

| Resource | Current access |
| --- | --- |
| `users/{uid}` | Repository rules allow the signed-in owner to read one profile and update only matching `name`/`displayName`, `photoURL`, and `updatedAt`. A user with the trusted `admin` custom claim can list profiles. Clients cannot create, delete, or change role/status/email fields. |
| Other Firestore documents | Denied. |
| `users/{uid}/avatar/avatar.{png,jpg,jpeg,webp}` | Owner-only read, create, update, and delete; uploads must be image/png, image/jpeg, or image/webp and smaller than 5 MiB. |
| Other Storage objects | Denied. |

New public registrations receive the `student` role claim from the Auth creation trigger. The profile document is created by the Admin SDK, which bypasses client rules. The Auth deletion trigger removes that user's profile. Client-supplied role values are never accepted. `teacher` or `admin` claims must be granted by a trusted operator using the Admin SDK in a secure, non-browser environment. No self-service role assignment or admin UI exists.

Custom claims can take effect in an ID token only after it is refreshed. Rules that depend on a role claim must fail closed when the claim is absent or unrecognized.

## Approved future boundary (not deployed)

The approved data design is documented in `docs/DATABASE_STRUCTURE.md`. It covers profiles, public categories and published courses, nested modules/lessons/material metadata, owner-scoped enrollment/progress/notifications, published articles and announcements, reviews, and server-protected quiz keys/attempts, certificates, contact messages, and audit logs.

This boundary is a design only. Every collection other than the currently implemented user profile remains denied by repository rules. The enabled Firestore service returned `permission-denied` for an unauthenticated read of an unmatched path, confirming the deny-by-default boundary is active in the project. Do not add broad authenticated-user or public wildcard rules to make unfinished pages work. Assessment answers, scores, certificate eligibility, contact submissions, and audit records must be handled by trusted server-side code before these features are exposed.

Teacher access must be constrained to courses assigned to their trusted UID/claim-backed assignment. Student reads of other students' profiles or progress remain denied. Public certificate verification must not expose the certificate collection directly; use a trusted endpoint that returns only minimum public verification fields. Contact and audit collections remain server-only for writes, and quiz correct answers must never be present in learner-readable quiz documents.

## Release checks

Before deploying rules or Functions to a real project:

1. Enable Cloud Firestore for the intended Firebase project and verify its ID.
2. Install Java 21+ and run Firestore Emulator tests for owner access, cross-user denial, unauthenticated denial, role escalation denial, query constraints, assigned-teacher boundaries, private quiz keys, and server-only collections. Keep the existing Storage rules unchanged.
3. Review each allowed collection/path and confirm no catch-all rule grants access.
4. Confirm trusted role assignment and server-only writes use Admin SDK credentials outside Hosting and browser code.
5. Review Cloud Functions billing requirements and obtain project-owner approval.

The updated repository rules have not yet been compiled or exercised in the Emulator Suite because the current machine's Java is version 8. This change has not deployed the rules or Functions to the production project.
