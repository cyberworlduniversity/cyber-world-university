# Cyber World University

Cyber World University (CWU) is a cybersecurity education frontend demo with the tagline **Learn. Hack Ethically. Defend the Digital World.** The current phase uses static HTML, CSS, and vanilla JavaScript and preserves the original landing page while adding a data-driven course catalog and learning-platform page previews.

## Features

- Responsive CWU landing page with CWU logo branding, concise Home/Courses/Contact navigation, mobile navigation, a focused course-led introduction, and catalog-derived course/topic/module totals.
- Theme selection supports Dark, Light, and System preferences through shared design tokens.
- Searchable and filterable catalog of 12 courses with category, difficulty, duration, certificate, technology, and learning-type filters. Search covers course title, category, description, difficulty, technologies, and skills. Every course has an individual local image, meaningful alt text, a resilient fallback, and the same image on its detail page.
- Course catalog and detail pages with enrollment links, course-specific assessment-preview links, study-material filters, interactive roadmap, certificate samples, editable certificate preview generator, and demo certificate lookup.
- Firebase email/password account registration, email verification, sign-in persistence, password-reset requests, and sign-out.
- Student dashboard and printable sample student ID card using clearly marked sample data.
- Admin panel with add/edit/delete/search/filter interactions limited to in-memory demo rows.
- Ten-question browser-only quiz preview with question navigation, countdown, score, and current-page attempt history. Course details link to practice-quiz and final-exam previews; both currently use the same sample question set and do not track eligibility.
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

Course records in `data/courses.js` use shared image/alt text, technology, skill, and learning-type metadata. The catalog search and filters, featured cards, and course details render from those shared records; course cards are not duplicated in HTML. Homepage course, topic, and module totals are calculated from the same dataset. Learner, completion, and certificate totals are not available because this frontend has no connected backend. Existing CWU course artwork is retained where available, and the remaining current/future image set uses locally authored SVG illustrations. Image sources are documented in `assets/images/courses/SOURCES.md`; image failures degrade to an accessible CWU fallback rather than a broken-image icon.

The editable, print-oriented certificate generator is available at `pages/certificate-generator.html`. Its `css/certificate.css` stylesheet and `js/certificate-generator.js` behavior are independent of the shared site styles. Generated certificates are local visual previews only and do not represent authorized issuance or verification.

### Module boundaries

- `js/core/` contains shared page bootstrap, navigation, theme selection, and the lightweight event bus.
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

The project has no frontend framework or complete LMS backend. A Firebase Web app configuration is present and the account pages initialize the Firebase SDK, but authentication requests currently fail because the Firebase project reports that Authentication is not configured. Google Fonts is optional; pages fall back to system sans-serif fonts if unavailable.

### Firebase implementation status

The Firebase Hosting, Emulator Suite, and Cloud Functions configuration targets project `studio-100351834-51432` via `.firebaserc`. Browser checks verified Firebase Auth registration and password-reset requests against the supplied Web app config. Login/logout remain unverified because the test account requires email verification and subsequent attempts were rate-limited. A trusted Auth trigger provisions new accounts with a student role claim and creates `users/{uid}`. `js/firebase/profiles.js` exposes owner-scoped profile reads/limited updates, and `js/firebase/avatars.js` provides validated owner avatar uploads/deletes. Firestore reserves profile listing for a trusted admin claim; Storage permits only owner-private avatar files. Other Firestore collections and Storage paths remain denied. Test Auth accounts were created; no Firestore/Storage writes or production deployment were performed. Setup steps are in [docs/FIREBASE_SETUP.md](./docs/FIREBASE_SETUP.md); rules and the proposed data model are described in [docs/FIREBASE_SECURITY.md](./docs/FIREBASE_SECURITY.md) and [docs/DATABASE_STRUCTURE.md](./docs/DATABASE_STRUCTURE.md). No role-management workflow, protected dashboard, course data, enrollment, assessments, certificates, or full administrative backend is implemented.

## Public navigation and learner flow

Public page headers expose only Home, Courses, Contact, Login, and Register. The footer is limited to Courses, Contact, Privacy, and Terms. Dashboard, admin, study, assessment, certificate, and other demo pages are not linked as top-level public navigation.

The homepage introduces CWU, shows catalog-derived course/topic/module totals and six featured courses, summarizes four learning benefits, explains a six-step intended learner journey, and ends with a course/contact call to action. It does not claim learner or certificate totals, which are not tracked. Its security-learning visual is a labeled, illustrative preview. The catalog links to course details; course details offer login/register links and contextual assessment previews. A successful demo login or registration reveals a link to the sample student dashboard and carries the selected course into that preview. Public registration is learner-focused; admin and teacher roles are not offered in the registration form or public navigation.

The supplied Firebase Web app config activates account registration, email verification, sign-in, persistence, sign-out, and password-reset flows. Registration and reset requests were verified in a live browser; successful sign-in/logout still require a verified account and a retry after Firebase's rate limit clears. Without config, the previous demo form behavior remains. Enrollment/progress is not stored, and the dashboard is not access-controlled. Course cards clearly indicate that progress is not tracked in this demo. The final-exam link currently opens a clearly labeled sample using the same 10 practice questions; it does not represent a real final exam. Certificate previews are not issued or restricted by completion status. Production LMS behavior requires server-enforced authorization, enrollment, assessment, and certificate services.

## Run locally

Open `index.html` in a browser, or serve the project root with any static file server and open the local URL. No build or dependency installation is required. Firebase-backed account forms require HTTP(S), valid Web app configuration, and network access to Google's Firebase SDK CDN; opening a page via `file://` does not test Firebase.

## Demo authentication and data warning

The current Firebase configuration and Auth registration/reset requests work in a local HTTP browser. The test sign-in attempt was rate-limited, so login/logout still need an end-to-end retry after the created account's email is verified. The pages do not silently fall back to claiming successful authentication. Even after Auth is enabled, this frontend does not yet authorize dashboard roles or protect sample dashboard data. Never enter a password used on another service.

The course catalog and demo-user list are static sample data. Quiz attempts and admin edits exist only in the current page session; contact forms do not send messages. Dashboard metrics, certificates, QR placeholders, and verification records are illustrative and are not production records or credentials. Theme preference may be saved in browser local storage; local storage is not authentication or secure data storage.

Security learning content is intended for authorized labs, legal testing, and systems the learner owns or has explicit permission to assess.

## Development phases

1. HTML, CSS, and JavaScript frontend prototype — current.
2. Refine frontend architecture and page flows.
3. Introduce React only when migration is requested.
4. Design and implement backend APIs and data storage.
5. Add authentication, authorization/RBAC, LMS workflows, and admin/teacher management.
6. Implement trusted certificate issuance and verification.
7. Review production security, accessibility, and deployment.

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
| Payments | DEFERRED |
| Backend API | PLANNED |
| Database | PLANNED |
| Global search and command palette | PLANNED |
| React migration | PLANNED |

AI, payments, real identity/authorization, a backend/database, and service workers are intentionally not implemented in this frontend phase. Never expose API keys or secrets in client-side scripts.
