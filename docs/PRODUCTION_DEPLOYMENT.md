# CWU production deployment

## Current release status

**Firebase Hosting deployment succeeded on 2026-10-18. This does not establish LMS production readiness.**

- Firebase project: `studio-100351834-51432`.
- Live URL: https://studio-100351834-51432.web.app.
- The live Firebase Hosting channel listing showed the `live` release at `2026-10-18 13:22:50`.
- The completed deployment was Hosting-only. Firestore rules, Storage rules, Functions, Authentication settings, and App Check were not deployed or changed in that release.
- Live checks confirmed the Content-Security-Policy and baseline security headers. The Hosting ignore list excludes `QA/**`, `firestore.rules`, `storage.rules`, and `functions/**`; live requests to those source paths return 404.
- The website is a static frontend with demo/non-authoritative LMS areas. It is **NOT PRODUCTION READY as an operational LMS**. See [FINAL_PRODUCTION_SECURITY_AUDIT.md](./FINAL_PRODUCTION_SECURITY_AUDIT.md).
- GitHub status is unverified. Git is unavailable in this environment; no repository remote was confirmed.
- No Vercel project, deployment, or URL was verified. Do not claim a Vercel deployment succeeded.

## No redeployment currently required

The Hosting security-header and source-exclusion changes are already live. The remaining `.gitignore` and documentation changes do not affect Hosting output. No additional Firebase deployment is required for the work documented here.

Do not deploy Firestore rules, Storage rules, or Functions until their emulator tests pass and an authorized project operator approves the release. Do not redeploy Hosting unless a separately reviewed runtime fix is made.

## Future safe deployment sequence

On an authorized workstation with the required tools:

1. Confirm the intended GitHub repository and inspect the worktree/history; do not include `.env`, service-account JSON, private keys, or credentials.
2. Authenticate to Firebase and verify the selected project is `studio-100351834-51432`.
3. Run Firestore and Storage emulator tests and Functions tests. Review IAM, billing, App Check, Auth domains, and custom-claim assignment in Firebase Console.
4. If GitHub/Vercel is authorized, create and verify a Vercel preview before production. Test direct-route refresh, Firebase Auth, and the deployed site. Add only the actual Vercel hostname to Firebase Auth authorized domains after it exists.
5. Deploy only the approved Firebase targets. For Hosting-only changes, review the dry-run file set and verify the live headers/routes/exclusions afterward.

## Rollback

For Hosting, use Firebase Console > Hosting > Release history to restore the last approved release, then verify the restored URL and headers. Do not delete Firebase data or roll back rules/Functions without a separate impact review.
