# CWU Website QA Report

**Run date:** 2026-10-18  
**Environment:** Windows; local Python HTTP server; Node.js 20.12.2, Functions checked with Node.js 22.23.3; Firebase CLI 15.34.0; Java 8.  
**Scope:** Static CWU site, supplied Firebase Web app config, local Auth-page SDK initialization, static checks, browser responsive/resource sweep, and limited live Auth checks. No production deployment or Firestore/Storage writes.

| # | Area | Status | Evidence / remaining work |
|---|---|---|---|
| 1 | Overall status | PARTIAL | Existing static site remains; production LMS requires Firebase setup and additional backend work. |
| 2 | Build status | PARTIAL | No root build script/framework. 30 first-party JS files pass syntax; Functions lint/load pass under Node 22. |
| 3 | Firebase status | PARTIAL | Client SDK initializes for `studio-100351834-51432`; registration and password-reset requests succeeded. |
| 4 | Authentication | PARTIAL | Registration and password-reset request passed. Login/logout could not be completed: login attempts were rate-limited, and email verification is required before sign-in is accepted. |
| 5 | Firestore | REQUIRES MANUAL TEST | Profile rules/module exist; no live or emulator read/write tested. |
| 6 | Storage | REQUIRES MANUAL TEST | Owner-only avatar rules/module exist; no upload tested. |
| 7 | Realtime | NOT IMPLEMENTED | No app realtime listeners are connected. |
| 8 | Course system | PARTIAL | Existing catalog uses local data; no Firestore courses. Missing image paths were fixed. |
| 9 | Enrollment | NOT IMPLEMENTED | Demo links only; no persistent enrollment backend. |
| 10 | Student dashboard | PARTIAL | Existing demo page, not authenticated or data-protected. |
| 11 | Teacher dashboard | NOT IMPLEMENTED | No trusted teacher workflow/page integration. |
| 12 | Admin dashboard | PARTIAL | In-memory demo only; no authorized backend. |
| 13 | Quiz system | PARTIAL | Browser-only sample quiz; no trusted scoring or persistent attempts. |
| 14 | Final exam | PARTIAL | Sample assessment preview, not a protected or authoritative exam. |
| 15 | Certificate system | PARTIAL | Local preview only; not issued from completion. |
| 16 | Certificate verification | PARTIAL | Demo lookup only; no authoritative backend verification. |
| 17 | Navigation | PARTIAL | Local HTML asset/link references resolve; course login/register/assessment links and mobile menu tested; full destination audit remains. |
| 18 | Forms | PARTIAL | Contact validation and live Firebase registration/reset passed; authenticated sign-in/logout awaits email verification and rate-limit cooldown. |
| 19 | Responsive design | PASS | 19 pages × four widths (320, 375, 768, 1280); no horizontal overflow observed. |
| 20 | Mobile testing | PARTIAL | Narrow viewports measured; interaction/touch-target checks remain. |
| 21 | Dark mode | REQUIRES MANUAL TEST | Theme control exists; no complete visual audit of every page/state. |
| 22 | Light mode | REQUIRES MANUAL TEST | Theme control exists; no complete visual audit of every page/state. |
| 23 | Accessibility | PARTIAL | 19-page scan found controls with labels/names, images with alt attributes, unique IDs, and one H1 per page after fixing certificate preview heading; keyboard, contrast, assistive-tech checks remain. |
| 24 | SEO | PARTIAL | Existing per-page metadata not comprehensively audited. |
| 25 | Performance | REQUIRES MANUAL TEST | No Lighthouse/Web Vitals measurement. |
| 26 | Security | PARTIAL | Rules inspected, not emulator-tested. Other data collections intentionally deny access. |
| 27 | Browser console | PARTIAL | No page JavaScript exceptions during the 19-page/4-viewport sweep or the successful registration/reset flows. The rate-limited sign-in produced a Firebase HTTP 400 / `auth/too-many-requests` browser console entry. |
| 28 | Network requests | PARTIAL | After fixing the missing JPEG references, no HTTP failures or broken images across the 76-page/viewport sweep; no production network profile. |
| 29 | Broken links | FIXED | Static local resource references resolve; course data's two missing JPEG references now use local SVGs. |
| 30 | Visual/UI issues | PARTIAL | Responsive measurements and representative interactions complete; full visual review across all states not done. |
| 31 | Fixed issues | FIXED | Replaced two missing raster course image paths with existing local SVGs, corrected source notes, and fixed duplicate page-level heading on certificate generator. |
| 32 | Remaining issues | PARTIAL | Verify a test account from an inbox under the tester's control, retry sign-in after the rate limit clears, then test logout; emulator/rules tests; unimplemented LMS backend; visual/accessibility/performance follow-up. |
| 33 | Manual testing | REQUIRES MANUAL TEST | Complete email verification and successful login/logout using a tester-controlled address; install Java 21+ to run emulators. |
| 34 | Production readiness | FAILED | Login/logout flow remains incomplete; security rules untested; major LMS features remain demo-only; nothing deployed. |

## Test artifacts

- `FUNCTIONAL_TESTS.md`
- `UI_UX_AUDIT.md`
- `RESPONSIVE_TESTS.md`
- `ACCESSIBILITY_TESTS.md`
- `SECURITY_TESTS.md`
- `PERFORMANCE_TESTS.md`
