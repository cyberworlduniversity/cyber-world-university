# Performance test checklist

- [x] Confirm the site has no frontend build system or client dependency installation requirement; Firebase Web SDK modules load from the pinned Google CDN.
- [x] Course image renderer sets fixed dimensions and lazy loading for course thumbnails.
- [ ] Measure Web Vitals (LCP, INP, CLS) using Lighthouse or field tooling.
- [ ] Inspect transferred image sizes, caching, and compression in a production-like server.
- [ ] Count Firebase reads/listeners after connected features are implemented.
- [ ] Test slow network, offline behavior, and SDK/CDN failure handling.

## Status

No Lighthouse/Web Vitals measurement or production deployment performance run was performed. Hosting and Firebase project configuration remain un-deployed.
