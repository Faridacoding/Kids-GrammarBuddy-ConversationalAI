# Grammar Buddy

An AI-powered grammar learning app for children ages 7–10, where kids learn by teaching an AI student named Buddy. At the end of the interaction both the parent and the kid take away a memorabilia(PDF) of the child's conversation with the AI. Sample PDF(**Story about Sky.pdf**)added in the repo.

---

## What is Grammar Buddy?

Grammar Buddy flips the traditional learning model: instead of being corrected by a teacher, the child *becomes* the teacher. They narrate stories to Buddy — a friendly, enthusiastic 8-year-old AI student — who listens, asks questions, and gently corrects grammar mistakes in real-time, all while staying in character as a curious peer.

This role-reversal approach encourages higher engagement, confidence, and ownership of learning.

---

## How It Works

1. **Child speaks** into the microphone — narrating a story or answering Buddy's questions
2. **Audio streams** to the Gemini Live API in real-time (16kHz PCM, base64-encoded)
3. **Buddy responds** in character as an enthusiastic student, asking follow-up questions
4. **Grammar mistakes** trigger a `show_correction` tool call — the corrected sentence appears on screen with an optional phonics hint (e.g., "Di-no-saur"), and stays visible so the child can read and repeat it
5. **Story narration** triggers Gemini image generation, building illustrated 16:9 scenes as the story unfolds

---

## Features

- **Real-time voice conversation** with Buddy via Gemini Live API
- **In-character grammar correction** — Buddy stays in the "confused student" persona while correcting
- **Phonics hints** displayed alongside corrections to support pronunciation
- **Story illustrations** generated from the child's narration
- **Storybook export** — download the session as a self-contained HTML file with cover page and illustrated scenes
- **Adaptive image quota management** — 5-min cooldown on 429 errors, 1-min on others

> Built with [Claude Code](https://claude.ai/code) using the Claude Sonnet 4.6 model (`claude-sonnet-4-6`).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS + Motion (animations) |
| AI | Google Gemini Live API + Image Generation |
| Icons | Lucide React |

---

## Models Used

| Use case | Model ID |
|---|---|
| Live audio (primary) | `gemini-2.5-flash-preview-native-audio-dialog` |
| Live audio (fallback) | `gemini-2.0-flash-live-001` |
| Image generation (primary) | `gemini-3.1-flash-preview-image-generation` |
| Image generation (fallback) | `gemini-2.5-flash-preview-image-generation` |

---

## Project Structure

```
GrammarBuddyConversationalAI-GrammarBuddy/
├── src/
│   ├── App.tsx                # Core app logic, session management, UI layout
│   ├── main.tsx               # React entry point
│   ├── index.css              # Global styles
│   └── lib/
│       └── audio-processor.ts # Mic capture (16kHz) and audio playback (24kHz)
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── metadata.json
```

---

## Key Files

| File | Role |
|---|---|
| `src/App.tsx` | All state, API calls, Buddy's system prompt, UI layout |
| `src/lib/audio-processor.ts` | `AudioProcessor` (capture + encode) and `AudioPlayer` (decode + queue playback) |
| `src/main.tsx` | React entry point |
| `vite.config.ts` | Dev server config (port 3000) |

---

## Getting Started

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the app:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:3000` in your browser and enter your Gemini API key when prompted.
   The key is stored in `localStorage` — never hardcoded.

**Other commands:**
```bash
npm run build    # production build
npm run preview  # preview production build
```
