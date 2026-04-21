# Workout Tracker

A minimal, dark-themed workout logging app built with React. Designed for use during training sessions — log sets, track RPE, and review your history.

## Features

- **7-day PPL program** — pre-loaded with a Push/Pull/Legs + Arms split, fully editable
- **Active session logging** — log weight, reps, and RPE (1–10) per set; sets pre-populate from your last session
- **Edit program** — rename days, change workout type, add/remove exercises
- **Workout history** — browse past sessions with set-level detail

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Deployment

The app is configured for zero-config deployment on [Vercel](https://vercel.com). Connect your GitHub repo and Vercel will detect Vite automatically.

Workout data is stored in `localStorage` — it persists across sessions in the same browser.

## Tech

- [Vite](https://vitejs.dev)
- [React 18](https://react.dev)
- [Bebas Neue](https://fonts.google.com/specimen/Bebas+Neue) + [DM Sans](https://fonts.google.com/specimen/DM+Sans) via Google Fonts
