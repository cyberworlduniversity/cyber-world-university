# Firebase data structure

## Current implementation

The Firebase Web SDK and Firestore client are initialized once in `js/firebase/auth-client.js`. `js/firebase/profiles.js` reads and updates the signed-in user's `users/{uid}` profile. The Auth creation Cloud Function creates a profile with the Auth UID as its document ID and assigns a trusted `student` custom claim; deletion removes that profile.

The current profile fields are `uid`, `displayName`, `email`, `emailVerified`, `photoURL`, `role`, `status`, `createdAt`, and `updatedAt`. The role claim is authoritative for authorization. Profile fields are descriptive and must not be used to grant permissions. The profile owner can currently update only `displayName`, `photoURL`, and server timestamp `updatedAt`. Passwords remain exclusively in Firebase Authentication.

The current Firestore rules allow owner profile reads, constrained owner profile updates, and profile listing for a trusted admin claim. They deny every other collection and operation. The website's catalog, assessment questions, dashboard, admin table, and study materials are currently local/static/in-memory demo content, not Firestore records.

The project has no `firestore.indexes.json`. The Firestore database was subsequently created in `asia-south1`. A read-only request to an unmatched document returned `permission-denied`, as expected from deny-by-default rules. The schema below is implemented only for the `users/{uid}` profile slice; no other application collections or test documents have been created.

## Approved collection design (proposed, not active)

| Path | Purpose and core fields | Intended access after implementation |
| --- | --- | --- |
| `users/{uid}` | Auth-linked profile: `uid`, `displayName`, `email`, `emailVerified`, `photoURL`, `studentId`, `status`, `createdAt`, `updatedAt`. Preserve the existing `displayName` field rather than creating a duplicate `name`. | Owner reads their own profile and updates only explicitly allowed profile fields. Admin claim can manage profiles through trusted server code. Roles and account status are never client-writable. |
| `categories/{categoryId}` | Course category: title, slug, description, order, status, timestamps. | Public reads active/published categories; admin manages; teachers do not grant themselves categories. |
| `courses/{courseId}` | Course metadata: title, slug, description, categoryId, level, duration, thumbnail reference, instructorId, instructorName, status (`draft`, `published`, `archived`), timestamps. `published` may be derived from status to avoid inconsistent duplicate state. | Public reads published course metadata. Assigned teacher manages permitted course fields; admin manages all fields and assignment. |
| `courses/{courseId}/modules/{moduleId}` | Ordered course units: courseId, title, description, order, timestamps. | Readers follow the parent course's publication/enrollment access; assigned teacher/admin manages. |
| `courses/{courseId}/modules/{moduleId}/lessons/{lessonId}` | Lesson metadata and content: courseId, moduleId, title, description, content, videoUrl, duration, order, status, timestamps. | Published preview fields can be public; full lesson content is limited to enrolled students, assigned teacher, and admin. Assigned teacher/admin manages. |
| `courses/{courseId}/materials/{materialId}` | Material metadata: courseId, optional moduleId/lessonId, title, description, file reference/URL, fileType, timestamps. No file bytes are stored in Firestore. | Access follows lesson/course entitlement. Assigned teacher/admin manages metadata. Actual file storage is a separate future phase. |
| `enrollments/{uid_courseId}` | Enrollment association: studentId, courseId, status, enrolledAt, completedAt. Deterministic ID makes duplicate enrollment attempts idempotent. | Student reads their own enrollment. Assigned teacher can read only the limited enrollment information needed for their course. Create/approval/completion transitions should be server-controlled or strictly validated. |
| `users/{uid}/progress/{courseId_lessonId}` | Per-user lesson progress: studentId, courseId, moduleId, lessonId, completed, percentage, updatedAt. | Owner reads/writes only their progress for an enrolled course, with field/range validation. Trusted code controls completion claims where certification depends on them. |
| `quizzes/{quizId}` | Safe quiz metadata and learner-facing question text/options, courseId, optional moduleId, passingScore, timeLimit, publication state, timestamps. Correct answers are excluded. | Published safe quiz content readable by eligible learners; assigned teacher/admin manages. |
| `quizAnswerKeys/{quizId}` | Correct answers and scoring configuration, separated from learner-facing quiz content. | No direct client reads/writes. Trusted server code only. |
| `quizAttempts/{attemptId}` | Student submission: quizId, studentId, submitted responses, score, passed, startedAt, completedAt. | Student reads own attempts. Trusted server code validates answers and writes authoritative score/pass state. |
| `certificates/{certificateId}` | Minimal issued record: studentId, courseId, studentName at issue, courseName at issue, issueDate, certificateNumber, verificationStatus. Avoid email and unnecessary profile data. | Student reads own certificate. Trusted server code issues/changes records. Public verification uses a server response containing only explicitly public fields, not direct collection reads. |
| `reviews/{reviewId}` | Course feedback: studentId, courseId, rating, comment, moderation status, timestamps. | Enrolled student creates/edits their own review; admin moderates. Students cannot set moderation status or edit another review. |
| `articles/{articleId}` | Educational content: title, slug, excerpt, content, authorId, status, publishedAt, timestamps. | Public reads published articles; admin manages; teacher access requires explicit assignment/authorization. |
| `announcements/{announcementId}` | Platform/course notice: title, message, status, createdAt, expiresAt, createdBy, optional audience/courseId. | Public reads only currently published announcements; trusted admin manages. |
| `users/{uid}/notifications/{notificationId}` | User-specific notification: userId, title, message, type, read, createdAt. | Owner reads and marks their own notification read. Trusted code creates notifications. |
| `contactMessages/{messageId}` | Contact submission: name, email, subject, message, status, createdAt. | Client cannot read or write directly. A validated/rate-limited trusted endpoint creates messages; authorized admin processes them. |
| `auditLogs/{logId}` | Administrative event: actorUid, actorRole, action, targetType, targetId, timestamp, metadata. | Trusted server code writes; only trusted admin can read. Never log passwords, tokens, secrets, or unnecessary personal data. |

### Authorization and schema notes

- Only Firebase Authentication credentials authenticate a user. The trusted custom claim `request.auth.token.role` authorizes `student`, `teacher`, and `admin`; a client-written `users/{uid}.role` never grants access.
- The existing Auth trigger defaults public signups to the `student` custom claim. Elevating to `teacher` or `admin` remains a trusted-operator/Admin-SDK action outside frontend JavaScript.
- Firestore rules are not filters. List queries must be constrained so every returned document satisfies the rule; collection-group queries require separate review and tests.
- Server-only answer keys, scoring, contact intake, certificate issuance/verification, role changes, and audit history must use trusted server code. Avoid direct student writes for any state that affects awards or authorization.
- Rules must validate required fields, types, allowed field changes, ownership, lifecycle transitions, and parent-course assignment. Deny unknown collections and document paths by default.
- Add composite indexes only when validated application queries require them. Do not create indexes speculatively.

## Activation gate

The database is enabled, but the broader design is not active. Only `users/{uid}` is implemented in this phase. Emulator tests require Java 21+, and no rules or Functions deployment is performed by this change. Test isolated non-sensitive data only after rules/Functions are reviewed and deployed to the intended project.
