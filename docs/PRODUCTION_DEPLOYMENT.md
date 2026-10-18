# CWU production deployment

## Current release status

**Firebase Hosting and Vercel are live. Latest bounded smoke checks observed all six expected security headers on both hosts. The exact current Vercel build SHA is unverified, and neither deployment establishes LMS production readiness.**

- Firebase project: `studio-100351834-51432`.
- Live URL: https://studio-100351834-51432.web.app.
- Vercel production URL: https://cyber-world-university-2026.vercel.app/.
- Public GitHub repository: https://github.com/cyberworlduniversity/cyber-world-university (`main` branch).
- The live Firebase Hosting channel listing showed the `live` release at `2026-10-18 13:22:50`.
- The completed deployment was Hosting-only. Firestore rules, Storage rules, Functions, Authentication settings, and App Check were not deployed or changed in that release.
- Live checks confirmed the Content-Security-Policy and baseline security headers. The Hosting ignore list excludes `QA/**`, `firestore.rules`, `storage.rules`, and `functions/**`; live requests to those source paths return 404.
- Vercel returns HTTP 404 for tested `/firestore.rules`, `/storage.rules`, Firebase config, Functions, QA, and docs paths. The deployed `/pages/...` clean routes work, but short aliases such as `/courses` and `/login` returned 404 in the latest live check. Matching static aliases exist in the local `vercel.json` only and have not been deployed or verified.
- The latest Vercel live smoke check returned CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`. This does not establish source/build parity.
- The live [vercel.json](../vercel.json) behavior enables clean URLs and denies the listed source paths. Exact Vercel deployment commit linkage remains unverified.
- The GitHub/Vercel and local/Firebase homepage text matches after normalizing line endings and trailing newlines.
- The website is a static frontend with demo/non-authoritative LMS areas. It is **NOT PRODUCTION READY as an operational LMS**. See [FINAL_PRODUCTION_SECURITY_AUDIT.md](./FINAL_PRODUCTION_SECURITY_AUDIT.md).
- No GitHub write or deployment was performed during this follow-up.

## Firebase redeployment currently not required

The Firebase Hosting security-header and source-exclusion changes are already live. The remaining `.gitignore`, documentation, and local Vercel configuration changes do not affect Firebase Hosting output. No additional Firebase deployment is required for those changes.

The Vercel source-path and clean-URL behavior is live, and the latest live header smoke check observed all six expected headers. Do not infer that local uncommitted source is deployed; verify deployment metadata before claiming source parity. No Vercel or Firebase deployment was performed during this follow-up.

Do not deploy Firestore rules, Storage rules, or Functions until their emulator tests pass and an authorized project operator approves the release. Do not redeploy Firebase Hosting unless a separately reviewed runtime fix is made.

## Future safe deployment sequence

On an authorized workstation with the required tools:

1. Confirm the intended GitHub repository and inspect the worktree/history; do not include `.env`, service-account JSON, private keys, or credentials.
2. Verify the active Vercel deployment SHA and compare it with the intended source; rerun the six-header smoke check after any authorized deployment.
3. Authenticate to Firebase and verify the selected project is `studio-100351834-51432`.
4. Run Firestore and Storage emulator tests and Functions tests. Review IAM, billing, App Check, Auth domains, and custom-claim assignment in Firebase Console.
5. Add the actual Vercel hostname to Firebase Auth authorized domains only after an authorized operator verifies it is needed and approves the change.
6. Deploy only the approved Firebase targets. For Hosting-only changes, review the dry-run file set and verify the live headers/routes/exclusions afterward.

## Rollback

For Hosting, use Firebase Console > Hosting > Release history to restore the last approved release, then verify the restored URL and headers. Do not delete Firebase data or roll back rules/Functions without a separate impact review.
