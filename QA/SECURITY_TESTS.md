# Security test checklist

- [x] Confirm no service-account private key is present in the browser config.
- [x] Inspect Firestore rules: profile reads are owner/admin scoped; owner updates cannot change role; all other documents deny access.
- [x] Inspect Storage rules: private avatar path is owner-only, validates content type and size; all other paths deny access.
- [x] Inspect account flow: no browser-provided role grants; public registration requests a student account.
- [x] Check HTML/JS for dynamic HTML sinks; the catalog's `innerHTML` assignment is a fixed static empty-state string, not user input.
- [ ] Run unauthenticated, owner, cross-user, and role-escalation rule tests in Firestore/Storage emulators.
- [ ] Verify Firebase App Check settings and production authorized domains.
- [ ] Review deployment IAM, Function billing, rate limits, data retention, and backup access.

## Status

Rules have not been compiled or emulator-tested. Java 8 is installed; Firebase CLI 15.34.0 requires Java 21+ for the Emulator Suite. Live Auth registration and password-reset requests succeeded, but email verification and an unrestricted sign-in/logout cycle remain unverified. Do not deploy the rules or treat this site as production-secure until those checks pass.
