# Grammar Buddy — Claude Code Context

## Project Overview

Grammar Buddy is an AI-powered grammar learning app for children ages 7–10.

**Core pedagogy (role-reversal):** The child teaches an AI "student" named Buddy. When Buddy hears a grammar mistake, it gently corrects the child in character — as a friendly peer, not a teacher.

**Grammar correction flow:**
- When a mistake is detected, Buddy calls the `show_correction` tool
- The corrected sentence is kept on screen as large, readable text so the child can read it aloud and repeat it
- An optional phonics hint is displayed alongside (e.g., "Di-no-saur") to support pronunciation
- The correction persists until the session ends — this is intentional so the child has time to read and repeat

**Other features:**
- Story narration triggers Gemini image generation, building illustrated scenes in a 16:9 story panel
- Sessions can be exported as a downloadable HTML storybook (cover page + illustrated scenes)

## Architecture

- **Single-page React app** — all core logic lives in `src/App.tsx`
- **Audio pipeline** (`src/lib/audio-processor.ts`):
  - `AudioProcessor`: captures mic at 16kHz, converts to 16-bit PCM, base64-encodes, streams to Gemini Live API
  - `AudioPlayer`: receives 24kHz PCM audio from Gemini, decodes, and queues sequential playback
- **Gemini Live API**: real-time bidirectional audio streaming (child speaks → Buddy responds)
- **Gemini image generation**: story illustrations generated from the child's narration

## Key Conventions & Gotchas

- **API key**: user-provided at runtime, stored in `localStorage` — never hardcode it
- **Image quota throttling**: 5-min cooldown on 429 errors, 1-min on others — do not remove this logic
- **Buddy's persona**: defined in the system prompt inside `startSession()` in `src/App.tsx` — edits here directly affect AI behavior and the child's experience
- **Correction persistence**: `setCorrection(null)` is only called on session reset (intentional — child needs time to read)
- **Deployment target**: Google AI Studio — this affects HMR settings in `vite.config.ts`

## Dev Commands

```bash
npm run dev      # local dev server
npm run build    # production build
npm run preview  # preview production build
```

## Models in Use

| Use case | Model ID |
|----------|----------|
| Live audio (primary) | `gemini-2.5-flash-preview-native-audio-dialog` |
| Live audio (fallback) | `gemini-2.0-flash-live-001` |
| Image generation (primary) | `gemini-3.1-flash-preview-image-generation` |
| Image generation (fallback) | `gemini-2.5-flash-preview-image-generation` |

## Out of Scope

- `express` and `better-sqlite3` are in `package.json` but unused — do not build backend features around them without explicit discussion
