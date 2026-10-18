# Cyber World University

Cyber World University (CWU) is a cybersecurity education website with the tagline **Learn. Hack Ethically. Defend the Digital World.** The site uses static HTML, CSS, and vanilla JavaScript; Firebase Auth handles sign-in, while LMS pages call a source-only backend that is not deployed.

## Features

- Responsive CWU landing page with CWU logo branding, concise Home/Courses/Contact navigation, mobile navigation, and an explicit unavailable state instead of sample course totals or featured records.
- The site uses a dark-only theme; the theme switcher is disabled.
- Course catalog and detail pages request published backend records; they do not present local sample courses as published offerings. Enrollment and protected learning operations remain unavailable until Functions and App Check are configured.
- Firebase email/password account registration, email verification, sign-in persistence, password-reset requests, and sign-out.
- Backend-connected dashboard, quiz, certificate, and admin/teacher pages. These fail closed when App Check or deployed backend services are unavailable.
- Clearly labeled practice quizzes and editable certificate previews; neither produces official academic results or credentials.
- Firebase email/password account registration, email verification, sign-in persistence, password-reset requests, and sign-out.
- Semantic page structure, responsive layouts, keyboard focus states, reduced-motion support, unique page titles and descriptions.

## Folder structure

```text
cyber-world-university/
├── index.html
├── pages/
│   ├── about.html
│   ├── admin-panel.html
│   ├── blog.html
│   ├── certificates.html
│   ├── certificate-generator.html
│   ├── contact.html
│   ├── course-details.html
│   ├── courses.html
│   ├── faq.html
│   ├── login.html
│   ├── privacy.html
│   ├── quizzes.html
│   ├── register.html
│   ├── roadmap.html
│   ├── student-dashboard.html
│   ├── study-materials.html
│   ├── terms.html
│   └── verify-certificate.html
├── css/
│   ├── animations.css
│   ├── certificate.css
│   ├── components.css
│   ├── dashboard.css
│   ├── responsive.css
│   └── style.css
├── js/
│   ├── core/
│   ├── features/
│   ├── animations/
│   ├── utils/
│   └── certificate-generator.js
├── data/
    ├── courses.js
    ├── demo-users.js
    ├── questions.js
    └── technologies.js
└── assets/
    ├── images/
    │   └── courses/
    │       ├── SOURCES.md
    │       └── original CWU SVG course illustrations
    ├── logos/
    ├── certificates/
    └── avatars/
```

The supplied `CWU LOGO.PNG` is stored as `assets/logos/cwu-logo.png` and used throughout the site, including navigation, footer branding, course and platform brand marks, certificate and student ID previews, and page favicons. Course artwork in `assets/images/` is attached to matching course cards and detail pages. `assets/certificates/certificate.png` is displayed as supplied certificate artwork; the frontend does not issue or verify it.

`data/courses.js` and other legacy sample datasets are not used as authoritative catalog records. Homepage totals and featured sample courses have been removed. The current course pages render only backend-returned published records; no live published catalog is available while backend prerequisites are unresolved. Course artwork and image fallbacks remain available for previews. Image sources are documented in `assets/images/courses/SOURCES.md`.

The editable, print-oriented certificate generator is available at `pages/certificate-generator.html`. Its `css/certificate.css` stylesheet and `js/certificate-generator.js` behavior are independent of the shared site styles. Generated certificates are local visual previews only and do not represent authorized issuance or verification.

### Module boundaries

- `js/core/` contains shared page bootstrap, navigation, the fixed dark theme, and the lightweight event bus.
- `js/features/` contains isolated course, quiz, certificate, admin, auth, dashboard, roadmap, contact, and study-material page behaviors.
- `js/animations/` contains opt-in reveal, counter, and interaction modules. Reusable animation rules live in `css/animations.css`.
- `js/utils/` contains storage, validation, and UI helpers. Feature scripts receive shared helpers from classic script loading; page-specific data remains in `data/`.
- Shared UI styles live in `css/components.css`; layouts, responsive rules, and animation rules stay separate.

Add future functionality as a feature module with its own page/component and data or API adapter. Avoid coupling unrelated features through the page bootstrap. `CWU.events` offers a small in-memory publish/subscribe boundary for future integrations; it is not a backend or persistence layer.

Reusable component styles and helpers are prepared for badges, notifications, toast messages, native modal dialogs, tabs, progress indicators, skeleton loading, and empty states. The command palette, global search, notification delivery, AI, PWA, and backend features remain planned—not active.

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript ES6+

The project has no frontend framework or deployed LMS backend. The Firebase Web app configuration is public client configuration. A safe sign-in request using a reserved, nonexistent test identity reached Firebase Auth and was rejected with `INVALID_LOGIN_CREDENTIALS`; no positive login or account creation was attempted. Google Fonts is optional; pages fall back to system sans-serif fonts if unavailable.

### Firebase implementation status

The Firebase Hosting, Emulator Suite, and Cloud Functions configuration targets project `studio-100351834-51432` via `.firebaserc`. A live unauthenticated Firestore read returned HTTP 403 `PERMISSION_DENIED`; authenticated ownership and mutation boundaries were not tested. No Cloud Functions are deployed, and the configured Storage bucket is unavailable. A Functions deployment preflight reported that Blaze is required; billing was not enabled. Profile triggers, profile sync, course management, enrollment, progress, server-side quiz grading, certificate, and admin/teacher callables exist in source and are wired into the relevant pages, but cannot work in production until deployed. Callables enforce App Check; the site key and Console enforcement are not configured, so the shared client fails closed. New Auth accounts must not be assumed to have a `users/{uid}` profile or a server-assigned role. Firestore rules source denies client profile creation/deletion, restricts profile reads/updates, and denies unmatched collections; deployed-rule parity and authenticated tests remain NOT VERIFIED. Storage source rules are inactive while the bucket is unavailable. See [docs/FIREBASE_SETUP.md](./docs/FIREBASE_SETUP.md), [docs/FIREBASE_SECURITY.md](./docs/FIREBASE_SECURITY.md), and [docs/DATABASE_STRUCTURE.md](./docs/DATABASE_STRUCTURE.md).

**Current release gate:** **NOT PRODUCTION READY.** See [CWU_PRODUCTION_RELEASE_REPORT.md](./CWU_PRODUCTION_RELEASE_REPORT.md) for current test evidence, Vercel route/CSP blockers, billing state, and remaining backend requirements.

## Public navigation and learner flow

Public page headers expose only Home, Courses, Contact, Login, and Register. The footer is limited to Courses, Contact, Privacy, and Terms. Dashboard, admin, study, assessment, certificate, and other demo pages are not linked as top-level public navigation.

The homepage introduces CWU and clearly states that live course listings are unavailable; illustrative learning visuals are labeled as samples. Topic cards link to the backend catalog rather than to hard-coded sample course IDs. Course pages request backend records and do not create client-side enrollments. A verified Firebase Auth session does not grant protected access or create a learner profile. Public registration is learner-focused; admin and teacher roles are not offered in the registration form or public navigation.

When the Firebase Web app configuration is present, registration creates a Firebase Authentication account and requests email verification; it does not create a CWU learner profile in the client. Profile lifecycle triggers and all LMS callables exist only in source and are not deployed. The pages call these operations through an App Check-aware client, which rejects calls locally while the site key is absent. Firebase client authentication is not backend authorization. Without Firebase configuration or when initialization fails, the auth controls stay disabled and report an error. The dashboard does not present sample records as learner data. Practice quiz scores and certificate-generator output are explicitly non-official previews. Production LMS behavior requires App Check setup, emulator-tested server enforcement, deployment, and independent verification.

## Run locally

Open `index.html` in a browser, or serve the project root with any static file server and open the local URL. No build or dependency installation is required. Firebase-backed account forms require HTTP(S), valid Web app configuration, and network access to Google's Firebase SDK CDN; opening a page via `file://` does not test Firebase.

## Demo authentication and data warning

The Firebase configuration is present, but no real test inbox or account was provided, so no account was created and positive registration, email delivery, login, or logout persistence was not tested. A safe sign-in attempt using a reserved `.invalid` address and dummy-only password was rejected by Firebase with `INVALID_LOGIN_CREDENTIALS`. The page does not claim that sign-in succeeded when Firebase rejects it. A created Auth account would not imply a CWU profile or assigned role. Never enter a password used on another service.

Legacy course and demo-user datasets remain in the repository but are not rendered as authoritative course or learner records. Practice quiz scores are local-only and non-official; the certificate generator creates only a preview. The admin/teacher page no longer exposes in-memory admin records. Contact forms do not send messages. Theme preference may be saved in browser local storage; local storage is not authentication or secure data storage.

Security learning content is intended for authorized labs, legal testing, and systems the learner owns or has explicit permission to assess.

## Development phases

1. Static HTML, CSS, and JavaScript frontend — current public site.
2. Firebase Auth client is implemented; positive account lifecycle tests remain unverified.
3. LMS callable source and page integrations exist, but Functions, App Check, and Storage prerequisites block production use.
4. Test rules, identity ownership, roles, course enrollment, grading, and certificates in non-production emulators/accounts.
5. Do not enable billing or deploy backend services without explicit authorization.
6. Complete accessibility, mobile, performance, and release verification before production claims.

The current folder structure keeps shared styles, page scripts, and reusable data separate to make a future migration into React components, pages, features, services, and utilities easier. React is not installed.

## Animation and accessibility

Animations are separated into `css/animations.css` and `js/animations/`. Intersection observers reveal elements once, counters animate only when visible, and effects use transforms and opacity. The `prefers-reduced-motion` setting disables non-essential motion while keeping all content and controls available. Decorative effects are restrained; no continuous particle or matrix effect is enabled.

## Future feature registry

Statuses describe roadmap intent only; no planned item should be mistaken for a working production service.

| Feature area | Status |
| --- | --- |
| AI study assistant and AI learning tools | PLANNED |
| Progressive Web App (PWA) and offline learning | PLANNED |
| Gamification: XP, badges, streaks, and achievements | PLANNED |
| Notifications and announcements | PLANNED |
| Learning and administration analytics | PLANNED |
| Security Center | PLANNED |
| Advanced LMS, video, assignments, and exams | PLANNED |
| Interactive and cybersecurity labs | PLANNED |
| Coding playground | PLANNED |
| Career center | PLANNED |
| Job board | PLANNED |
| Community | PLANNED |
| Discussion forum | PLANNED |
| Mentorship | PLANNED |
| Live classes | PLANNED |
| Payments | NOT CONFIGURED |
| LMS callable backend | IMPLEMENTED IN SOURCE; NOT DEPLOYED |
| Firestore database | CONFIGURED; RULE/INDEX PARITY NOT VERIFIED |
| Global search and command palette | PLANNED |
| React migration | PLANNED |

Payments have no provider, transaction, or server-side verification flow and must remain unavailable until these are implemented. AI and service workers are intentionally not implemented. Trusted LMS authorization exists only in source callables and must not be treated as available until App Check, billing authorization, deployment, and independent backend tests are complete. Never expose private API secrets in client-side scripts; Firebase Web configuration is public client configuration, not an Admin credential.
