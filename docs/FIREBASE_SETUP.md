# Firebase setup

## Current status

The supplied Web app config and local Firebase CLI alias target project `studio-100351834-51432`. The project has Email/Password Authentication and a `(default)` Firestore database in `asia-south1`. Live unauthenticated Firestore read and create/update/delete probes returned `PERMISSION_DENIED`. The repository contains source-only profile and LMS callable Functions; `firebase functions:list` previously returned no deployed functions. A Functions dry-run preflight reported that the project must use the Blaze plan; billing was not enabled and no deployment was performed. The configured Firebase Storage bucket does not exist, so Storage rules have no live bucket against which to test. No dedicated test accounts were created. LMS callable behavior and production client integration remain NOT VERIFIED.

## Firebase Console setup

The supplied Web app config is set in `js/firebase/firebase-config.js`, and `.firebaserc` associates the local Firebase CLI with `studio-100351834-51432`. Verify that this is the intended CWU project before any deployment.

1. Open [Firebase Console](https://console.firebase.google.com/) and select your CWU project.
2. Open **Project settings** (the gear next to Project Overview) > **General** > **Your apps**.
3. Select the existing Web app, or choose **Add app** > **Web** if no Web app exists.
4. Under **SDK setup and configuration**, select **Config** and copy the `firebaseConfig` object. The values needed by this site are `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, and `appId`.
5. For authentication, open **Build** > **Authentication** and verify Email/Password is enabled for the same project ID `studio-100351834-51432` used by this Web app. Add your local and production website domains under **Settings** > **Authorized domains** when those domains are known.
6. Cloud Firestore has been created in Production mode for project `studio-100351834-51432`, database `(default)`, location `asia-south1`. Do not create another database or change its mode/location. A read-only unmatched-document request was denied as expected.
7. Review the repository's deny-by-default client rules and test them in the Emulator Suite before deploying them. Source-only Functions use the Admin SDK for LMS collections; they are not deployed, and no client rules should be broadened to support the demos.
8. Open **Build** > **Storage** > **Get started** if a bucket does not exist. Do not select public access. Review and test the repository's private-avatar-only rules before deploying them.
9. In the project directory, sign in with the Firebase CLI and verify the selected project:

   ```powershell
   firebase login
   firebase projects:list
   firebase use
   ```

   Confirm the active project is `studio-100351834-51432`. The repository's `.firebaserc` selects this alias; do not put credentials or private keys there.

Do not create a second project if the CWU project already exists. Do not switch a project to Blaze/billing or deploy to production without reviewing the expected costs and obtaining the project owner's approval.

## Frontend configuration

The existing site has no bundler, so browser-safe Firebase web configuration is kept in `js/firebase/firebase-config.js`. It contains the supplied Web app values for project `studio-100351834-51432`. The Firebase web configuration (including its API key) identifies the web app; it is not an Admin SDK credential or a private secret. Access control must come from Firebase Security Rules and trusted server-side code, not from hiding this configuration.

Never put service-account JSON, Admin SDK credentials, private keys, or server secrets in the site or in a file served by Hosting. If server-side configuration is later needed, keep it in the Cloud Functions environment or a secret manager.

The script sets `window.CWU_FIREBASE.isConfigured` when all required Web app fields are present. The login and registration pages use the Firebase JS SDK 11.10.0 from Google's CDN when configured. If Firebase is unavailable or unconfigured, submission remains unavailable and the UI explains that authentication is not configured; it does not simulate a successful account or login. Firebase requires these pages to be served over HTTP(S), not opened through `file://`. `useEmulators` defaults to `false`; set it to `true` only for local emulator development. In that mode, Auth, Firestore, and Storage connect to local emulator endpoints rather than production services. The Firestore SDK is initialized and the default database is enabled. Unauthenticated reads of unmatched paths are expected to return `permission-denied`.

Firebase email/password registration, email verification, sign-in, local/session persistence, password-reset requests, and sign-out are implemented in the client. Registration creates an Auth account and requests verification. `createUserProfile` and `deleteUserProfile` are source-only Cloud Functions; `syncCurrentUserProfile` is a source-only callable invoked by profile loading to synchronize Auth identity fields and a trusted role claim. These Functions are not deployed because deploying Functions currently requires a Blaze plan. Until deployment and verification, new accounts have no guaranteed `users/{uid}` document or server-assigned `student` role, and profile loading that requires the callable is unavailable. `teacher` and `admin` claims require a trusted operator using the Firebase Admin SDK. Never grant these roles from a form or client JavaScript.

The repository's Firestore rules allow an authenticated user to read only their own profile and allow profile listing only with an admin custom claim. The client cannot create, delete, or change a role; profile updates are restricted to matching `name`/`displayName`, photo URL, and a server-time `updatedAt`. A live unauthenticated read returned HTTP 403; authenticated owner and cross-user cases have not been tested. The rules have not been deployed as part of this hardening pass. Storage source rules intend to allow an owner to access only their own PNG, JPEG, or WebP avatar under `users/{uid}/avatar/`, limited to less than 5 MiB; this is not live-tested because the bucket does not exist. All other Firestore collections and Storage paths remain denied to clients in source; the Admin SDK callables write those collections server-side. Dashboard, course, quiz, certificate, and admin/teacher pages are wired to backend callables but remain unavailable because Functions are undeployed and App Check has no site key/configuration. Sample practice quizzes and certificate previews remain explicitly non-official.

## Local development

After verifying the Firebase CLI project alias, install Function dependencies, set `useEmulators: true` in `js/firebase/firebase-config.js`, and run the configured services from the project directory:

```powershell
Set-Location functions
npm install
Set-Location ..
firebase emulators:start --only auth,firestore,functions,storage,hosting
```

Use Node.js 22 for Functions and Java 21 or newer for the current Firebase Emulator Suite. The emulator ports are Auth `9099`, Firestore `8080`, Functions `5001`, Storage `9199`, Hosting `5000`, and Emulator UI `4000`. The source rules allow only owner profile reads/limited updates, admin profile listing by trusted role claim, and access to a user's own avatar. All other Firestore collections and Storage paths remain denied to clients. Backend Admin SDK callables provide source-only access and require emulator authorization tests before deployment. The current development environment has Node 22 available via the Node package runtime and Java 17; the emulator suite was not run.

The current website can still be opened directly from `index.html` or served by another local static server. Firebase-backed features will require a local HTTP server and configured emulators; opening a page with `file://` is not a Firebase test.

## Hosting

The Hosting configuration serves the existing project root without introducing a frontend build step. Once the correct Firebase project is associated and the site has been reviewed for deployable content, deploy Hosting with:

```powershell
firebase deploy --only hosting
```

Deploying Cloud Functions requires a Firebase project with billing enabled. Do not enable billing or deploy without the project owner's approval. Do not deploy to production based solely on untested rules. Install a Java 21-or-newer JDK before using Firebase emulators; this development machine currently has Java 8, which the installed Firebase CLI does not support.
