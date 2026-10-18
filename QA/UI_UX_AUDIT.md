# UI/UX audit checklist

- [x] Check all pages have document titles.
- [x] Check local course artwork references during a browser sweep; missing raster files were replaced with local SVGs.
- [x] Check for horizontal overflow on 19 pages at 320, 375, 768, and 1280 CSS pixels; no overflow was observed.
- [x] Check visible account, contact, catalog, quiz, certificate, and navigation controls in browser flows.
- [ ] Visually inspect every page, both themes, and all overlay/menu/table states.
- [ ] Check typography, spacing, alignment, contrast, and tap targets manually.
- [ ] Review empty, loading, and error states for all backend-dependent screens.
- [ ] Review image crops and certificate printing at desktop and mobile sizes.

## Fixes

- Replaced unavailable `cybersecurity-fundamentals.jpg` with `course-placeholder.svg`.
- Replaced unavailable `web-security.jpg` with `secure-coding.svg`.
- Updated `assets/images/courses/SOURCES.md` to match files currently present.
- Changed the certificate preview heading from a second page-level `<h1>` to `<h2>`.

## Limitations

This audit has not visually inspected every page state, theme, or interactive overlay. Earlier browser scans reported incomplete lazy-loaded images before they had been fetched; those entries were not treated as broken assets. The actual HTTP 404 responses were the two missing JPEG paths above.
