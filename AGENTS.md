# Project rules
- Keep shared visual roles in src/styles.css and use semantic tokens in screens so the app retains a consistent theme.
- Use /guides as the disease search screen and keep its existing data and detail links so the redesign does not change garden or diagnosis logic.
- MobileLayout owns the viewport and scrolling for every content screen so tab navigation stays visible and safe areas remain consistent.
- Home-screen installation uses manifest-only metadata and InstallApp; do not add app-shell service workers unless offline use is requested.