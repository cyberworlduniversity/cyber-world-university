# CWU Manual Actions Required

Updated: 2026-10-19

At the start of the 2026-10-19 final source review, local `main` and
`origin/main` matched at `df03794311b0329b2e4e86f38dd3c4495f04a9c9`. The final
review change set includes targeted Functions, Firestore-rule, and authentication
copy hardening plus source/readiness documentation. Firebase Hosting remains
deployed from routing/configuration commit `c51a569`; backend changes have not been
deployed.

No fake identities, credentials, payment records, enrollments, certificates, or
learning records were created. Firebase remains on the Spark plan. Do not enable
Blaze or add a billing account unless the project owner explicitly authorizes it.

## Required before authenticated positive tests

1. Provide two authorized, monitored test email inboxes (Student A and Student B)
   and explicitly authorize creating temporary test accounts. Do not send passwords.
2. Keep ownership of the test passwords and use the Firebase password-reset flow
   to remove or rotate them after testing.
3. Verify the test plan includes registration, email verification, login errors,
   logout/session persistence, owner profile access, cross-user profile denial,
   and attempts to alter role/admin/teacher fields. Do not use real student records.

## App Check

Current evidence: the CWU Web App was reported Not registered in Firebase Console;
the production source has no App Check site key and fails closed for LMS callable
requests when it is absent. Reconfirm this state in the Console before changing it.

1. Firebase Console → project `studio-100351834-51432` → **App Check**.
2. Select the CWU Web App and register the web app with the supported reCAPTCHA
   Enterprise provider.
3. Create a real reCAPTCHA Enterprise web key in Google Cloud Console for this
   project. Restrict its allowed domains to the actual production hostnames
   (`cyber-world-university-2026.vercel.app` and
   `studio-100351834-51432.web.app`) and any explicitly approved preview hosts.
4. If key creation, API activation, or provider registration requests a billing
   account or paid activation, stop. Do not enable billing without separate owner
   authorization.
5. Provide the resulting public site key through the approved source/configuration
   change for `js/firebase/firebase-config.js`; do not paste private credentials
   into source or chat. Deploy the frontend and verify App Check token acquisition
   and valid production request metrics.
6. Leave enforcement disabled until valid production clients are observed and
   tested. Enable enforcement only after a separately approved rollout.

## Cloud Functions and billing

Current evidence: a read-only Firebase CLI Functions listing returned no deployed
functions. The source contains 27 exports; callable endpoints enforce App Check,
privileged operations compare token/Auth/profile role state, and deployment preflight
previously reported Blaze is required. Hardening commit `ba80120` is pushed to
`main`; only the static Firebase Hosting site was deployed. Functions remain
undeployed and no billing setting was changed.

1. No Console change is authorized while billing is restricted.
2. **Do not enable Blaze, add a payment method, or start a paid service.**
3. If the project owner later authorizes billing, the owner must explicitly enable
   the Firebase Blaze plan in Firebase Console → Project settings / Usage and
   billing. Stop if the displayed charges or terms are not approved.
4. Before any later Functions deployment, confirm the target region. Firestore is
   documented in `asia-south1`; Functions source and browser client currently use
   `us-central1`. Then deploy Functions only in a separately authorized release.
5. After deployment, verify callable authentication, custom-claim RBAC, ownership,
   App Check, and denial cases using the authorized test accounts above.

## Storage and billing

Current evidence: the Firebase Console previously reported that Storage requires
a billing account; the configured bucket was not provisioned.

1. **Do not enable Blaze or create a bucket under the current authorization.**
2. If billing is separately authorized, initialize Firebase Storage in the
   approved region and verify the resulting bucket name matches the Firebase web
   app configuration.
3. Deploy the restrictive `storage.rules`, then test authenticated owner and
   non-owner access using non-sensitive test images. Do not upload student IDs or
   other personal documents.

## Firestore verification

1. Firebase Console → Firestore Database → `(default)` → **Rules** and **Indexes**.
2. Compare the deployed rules and indexes with `firestore.rules` and
   `firestore.indexes.json`. Do not publish a weaker rule set to make the client
   work.
3. Confirm deployed rule parity before authenticated owner/cross-user tests. Test
   denied profile role/admin/teacher changes and cross-user reads/writes with the
   two authorized accounts. No test accounts or data have been created.

## Payments

Payments and paid enrollment are not configured. A project owner must select and
authorize a real payment provider and merchant account before implementation can
be completed. Keep paid enrollment disabled; do not provide payment secrets in
source code or chat. Any provider setup requiring billing must be separately
authorized.

## Vercel deployment record

Public Vercel routes, headers, aliases, and browser behavior were verified. The
Vercel dashboard redirected to its sign-in page, and no Vercel CLI was installed,
so account identity, project settings, exact deployed commit, and Ready state could
not be confirmed.

1. Sign in to the Vercel team that owns `cyber-world-university-2026` and grant the
   authorized operator read access to the project deployments.
2. Vercel Dashboard → `cyber-world-university-2026` → **Deployments** → inspect the
   latest Production deployment.
3. Confirm its Git repository is `cyberworlduniversity/cyber-world-university`,
   branch is `main`, deployment status is **Ready**, and source commit is the latest
   `main` commit. If not, redeploy the current `main` commit and repeat the live
   route/header/browser checks.

## Already completed without a manual action

- Firebase Hosting was deployed from hardening commit `ba80120` using Hosting only;
  live core routes and response headers were rechecked after deployment.
- The Hosting route aliases now match the existing Vercel aliases.
- Vercel remains the primary production URL; Firebase Hosting is a secondary host.
- No Functions, Storage, Firestore rules/indexes, billing, or production data were
  changed by the Hosting deployment.
