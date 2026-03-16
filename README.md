# AstroScout Frontend

React + TypeScript + Vite frontend for AstroScout.

## Features

- Home page with product overview and quick navigation.
- Community feed for public observation logs.
- Observation planner workspace with:
  - map-based latitude/longitude selection
  - observing score and factor breakdown
  - integrated AI assistant panel
- Sky101 classroom with interactive visual scene.
- Authentication pages (register/login/demo login).
- Profile page for user info and personal logs.
- Observation log create/edit/detail pages.

## Tech stack

- React 19
- TypeScript
- Vite
- React Router
- Axios
- Tailwind CSS
- Three.js (Sky101 scene)

## Backend dependency

This frontend expects the backend API base URL:

- http://localhost:8081

The API client is configured in:

- src/api.ts

If your backend runs on another port/domain, update the base URL there.

## Local development

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Open browser:

- http://localhost:5173

## Build and preview

Build production bundle:

```bash
npm run build
```

Preview local production build:

```bash
npm run preview
```

## Main routes

- / : Home
- /community : Community feed
- /plan : Planner workspace + AI assistant
- /sky101 : Sky101 classroom
- /assistant : Standalone AI chat page
- /login : Login
- /register : Register
- /profile : Profile

## Typical usage flow

1. Open /plan.
2. Pick coordinates from map and choose date.
3. Click Calculate observing score.
4. Review score/weather/moon/light pollution.
5. Ask follow-up planning questions in the AI panel.

## Notes

- Planner AI requests include selected latitude, longitude, and date.
- Backend hydrates missing planning context automatically when possible.
- If planning context is missing for a planning-style question, assistant asks for location and date first.
