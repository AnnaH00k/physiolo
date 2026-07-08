# Physiolo

Physiolo is a small movement reminder app for desk work, built with Next.js and designed to run both as a full app and as a lightweight widget. It tracks desk sessions, reminds the user to move every 30 minutes, records completed movement breaks, and shows daily, monthly, and yearly progress.[1][2]

## Features

- Full app view and compact widget mode for quick access during work sessions.
- Desk session tracking with movement reminders every 30 minutes.
- Daily, monthly, and yearly progress registers.
- Shared state between app and widget using browser storage events.
- Static export setup for GitHub Pages deployment.

## How it works

Physiolo stores desk sessions, movement entries, and the shared timer state in browser storage so the main app and widget can stay aligned across open windows. The synchronization approach relies on storage-backed state and browser `storage` events, which are commonly used to keep separate tabs or windows in sync on the same origin.[2]

The reminder timer is best modeled as a shared deadline rather than an isolated countdown value in each window. With a persisted deadline, both the app and widget can derive the remaining time independently while still showing the same result.[2]

## Tech stack

- Next.js 15 App Router
- React
- TypeScript
- Static export for GitHub Pages
- localStorage-based synchronization between app and widget

## Project structure

```text
app/
  page.tsx
  widget/
    page.tsx
components/
  PhysioloApp.tsx
  StatsPanel.tsx
  SteampunkDecor.tsx
hooks/
  useMovementTimer.ts
lib/
  physiolo.ts
```

## Local development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Then open the local app in the browser, usually at `http://localhost:3000`.

## Production build

Create a production build with:

```bash
npm run build
```

Next.js static export generates the site into the `out/` directory when `output: "export"` is enabled.[1]

## GitHub Pages deployment

This project is configured for GitHub Pages under the repository path `/physiolo`, so the production site is expected at:

- Main app: `https://annah00k.github.io/physiolo/`
- Widget: `https://annah00k.github.io/physiolo/widget/`

For GitHub Pages project sites, Next.js usually needs both `basePath` and `assetPrefix` set to the repository name so links and static assets resolve correctly under the repository subpath.[3][4]

A typical `next.config.ts` for this setup looks like this:

```ts
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? "/physiolo" : "",
  assetPrefix: isProd ? "/physiolo/" : "",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

GitHub Pages deployments for Next.js static exports also commonly require a `.nojekyll` file so the `_next` asset directory is served correctly.[5][6]

## Widget behavior

The widget is intended to mirror the app state instead of acting like a separate timer. The app and widget can stay synchronized by writing shared state to local storage and reacting to browser storage updates across windows.[2]

## Notes

- This project is intended for static hosting rather than a traditional Node server deployment.[1]
- If deploying to a different repository or custom domain, update the `basePath` and `assetPrefix` values accordingly.[3][4]

## License

Add your preferred license here, for example MIT.
