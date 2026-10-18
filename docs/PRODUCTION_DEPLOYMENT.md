# CWU production deployment

## Current release status

**Firebase Hosting deployment succeeded on 2026-10-18. A separate Vercel production deployment is live, but its security configuration requires a fix before the Vercel site is acceptable. Neither deployment establishes LMS production readiness.**

- Firebase project: `studio-100351834-51432`.
- Live URL: https://studio-100351834-51432.web.app.
- Vercel production URL: https://cyber-world-university-2026.vercel.app/.
- Public GitHub repository: https://github.com/cyberworlduniversity/cyber-world-university (`main` branch).
- The live Firebase Hosting channel listing showed the `live` release at `2026-10-18 13:22:50`.
- The completed deployment was Hosting-only. Firestore rules, Storage rules, Functions, Authentication settings, and App Check were not deployed or changed in that release.
- Live checks confirmed the Content-Security-Policy and baseline security headers. The Hosting ignore list excludes `QA/**`, `firestore.rules`, `storage.rules`, and `functions/**`; live requests to those source paths return 404.
- The Vercel production site currently serves `/firestore.rules`, `/storage.rules`, `/firebase.json`, `/.firebaserc`, `/functions/`, `/QA/`, and `/docs/` paths with HTTP 200 and does not send a CSP or several other baseline headers. Do not treat Vercel as security-hardened.
- Added [vercel.json](../vercel.json) locally to enable clean URLs, deny those source paths, and apply CSP/security headers. It is not on GitHub `main` and has not been deployed. GitHub/Vercel write or deployment credentials are unavailable in this session.
- The GitHub/Vercel and local/Firebase homepage text matches after normalizing line endings and trailing newlines.
- The website is a static frontend with demo/non-authoritative LMS areas. It is **NOT PRODUCTION READY as an operational LMS**. See [FINAL_PRODUCTION_SECURITY_AUDIT.md](./FINAL_PRODUCTION_SECURITY_AUDIT.md).
- The GitHub repository and Vercel URL are verified as live resources; the worktree cannot be pushed because Git is unavailable here and the GitHub integration is read-only.

## No redeployment currently required

The Firebase Hosting security-header and source-exclusion changes are already live. The remaining `.gitignore`, documentation, and local Vercel configuration changes do not affect Firebase Hosting output. No additional Firebase deployment is required for those changes.

The Vercel configuration fix is **not live**. Push `vercel.json` to the GitHub `main` branch or otherwise deploy it through the authorized Vercel project. After deployment, verify blocked paths return 404, required headers are present, and extensionless page routes resolve. No Firebase deployment is needed to apply that Vercel change.

Do not deploy Firestore rules, Storage rules, or Functions until their emulator tests pass and an authorized project operator approves the release. Do not redeploy Firebase Hosting unless a separately reviewed runtime fix is made.

## Future safe deployment sequence

On an authorized workstation with the required tools:

1. Confirm the intended GitHub repository and inspect the worktree/history; do not include `.env`, service-account JSON, private keys, or credentials.
2. Push the reviewed `vercel.json`; verify a Vercel deployment, denial of source/config paths, and response security headers.
3. Authenticate to Firebase and verify the selected project is `studio-100351834-51432`.
4. Run Firestore and Storage emulator tests and Functions tests. Review IAM, billing, App Check, Auth domains, and custom-claim assignment in Firebase Console.
5. Add the actual Vercel hostname to Firebase Auth authorized domains only after an authorized operator verifies it is needed and approves the change.
6. Deploy only the approved Firebase targets. For Hosting-only changes, review the dry-run file set and verify the live headers/routes/exclusions afterward.

## Rollback

For Hosting, use Firebase Console > Hosting > Release history to restore the last approved release, then verify the restored URL and headers. Do not delete Firebase data or roll back rules/Functions without a separate impact review.
