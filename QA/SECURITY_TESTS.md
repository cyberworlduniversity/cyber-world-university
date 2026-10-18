# Security test checklist

> **Historical checklist.** These rows are not a fresh verification. See [CWU_PRODUCTION_RELEASE_REPORT.md](../CWU_PRODUCTION_RELEASE_REPORT.md) for the current no-billing results and blockers.

- [x] Confirm no service-account private key is present in the browser config.
- [x] Inspect Firestore rules: profile reads are owner/admin scoped; owner updates cannot change role; all other documents deny access.
- [x] Inspect Storage rules: private avatar path is owner-only, validates content type and size; all other paths deny access.
- [x] Inspect account flow: no browser-provided role grants; profile provisioning and role assignment depend on an undeployed Auth trigger.
- [x] Scan current first-party HTML/JavaScript for `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`, string timers, and `javascript:` URLs; none were found in application source. This is a static scan, not runtime fuzzing.
- [x] Inspect frontend role use: no `localStorage`/`sessionStorage` role grants or role-based admin privilege check; profile role display and verified-email dashboard-preview link are presentation only.
- [ ] Run unauthenticated, owner, cross-user, and role-escalation rule tests in Firestore/Storage emulators.
- [ ] Verify Firebase App Check settings and production authorized domains.
- [ ] Review deployment IAM, Function billing, rate limits, data retention, and backup access.

## Status

Repository rules compiled during a Firebase dry-run preflight but have not been emulator-tested or deployed. Java 8 is installed; Firebase CLI 15.34.0 requires Java 21+ for the Emulator Suite. Live unauthenticated Firestore read/create/update/delete probes were denied. A live login attempt for a nonexistent account was denied and the UI displayed an error. Registration was tested locally with mocked Firebase Auth endpoints only; no real test account or verification email was used. Valid-account login/logout, authenticated profile isolation, escalation checks, and email delivery remain unverified. Cloud Functions deployment requires Blaze; billing was not enabled. Do not treat this site as production-secure until the required backend and security checks pass.
