# CWU final security audit

> Historical snapshot. Later live checks and current blockers are recorded in [CWU_PRODUCTION_RELEASE_REPORT.md](../CWU_PRODUCTION_RELEASE_REPORT.md). Do not use the evidence below as current deployment status.

**Assessment date:** 2026-10-18  
**Project:** `studio-100351834-51432`  
**Scope:** Repository source, Firebase configuration and rule files, account/profile code, static HTML/JavaScript/CSS, Hosting configuration, and existing QA evidence. No production writes or deployment were performed.

## Summary

No confirmed exploitable source-code vulnerability was identified in this pass. This is not a production security certification: deployed Firebase settings and runtime authorization behavior could not be verified.

| Control | Finding |
| --- | --- |
| Firebase Web configuration | Source points to the intended project. Browser configuration is public app configuration, not an Admin credential. |
| Authentication | Firebase email/password flows are implemented in source; a successful verified login/logout regression was not run in this environment. |
| Firestore | Source rules restrict profile reads to the owner or a trusted admin claim, permit only safe owner profile updates, and deny unmatched paths. Emulator/runtime rule tests remain outstanding. |
| Storage | Source rules restrict avatar operations to the matching authenticated UID and deny other paths. Emulator/runtime tests remain outstanding. |
| Roles | New public registrations default to the `student` custom claim in the trusted Auth trigger. Operator role-grant controls and deployed Function IAM were not verified. |
| XSS | Source search found one `innerHTML` use: a fixed, non-user-controlled empty-state string. No runtime payload test was performed. |
| Secrets | A limited scan of first-party source/config/docs found no private-key marker or secret-like assignment. Git history and deployed secrets were not inspected. |
| Hosting headers | Baseline clickjacking, MIME-sniffing, referrer, permissions, and HSTS headers are configured in source. They have not been verified on a deployed response. The CSP currently limits framing only; it is not a comprehensive script/content policy. |
| App Check | Not verified; Firebase Console review is required. |
| Payments | Not configured in the reviewed source. |
| LMS authorization | Learning, admin, quiz, exam, enrollment, progress, and certificate flows remain demos/static content, not trusted backend operations. |

## Finding addressed in source

The Hosting public directory is the repository root. `firebase.json` now excludes `QA/**` so internal QA reports are not included in future Hosting releases. This change has not been deployed; public availability of any previously deployed files was not checked.

## Verification limitations

- Firebase CLI authentication is unavailable in this environment; project listing and Hosting dry run failed before deployment.
- Git is unavailable, so worktree status/history could not be reviewed.
- Java 8 is installed; the Firebase Emulator Suite requires a newer supported JDK in this setup.
- Production Auth settings, authorized domains, App Check, IAM, deployed rules/Functions, HTTPS and response headers were not verified.
- No test account was used for live registration, verified login/logout, profile access, or privilege-escalation tests.

## Release decision

**NOT PRODUCTION READY.** Complete the checks in [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md), test the rules and Function in emulators, and review deployed Firebase configuration before release. The current site may be presented only as a website/demo, not as a secure operational LMS.
