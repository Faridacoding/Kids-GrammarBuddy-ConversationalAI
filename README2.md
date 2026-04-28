## GrammarBuddy - Project Overview

**GrammarBuddy** is an AI-powered educational web app that helps children (ages 7-10) improve grammar through a unique role-reversal: the child teaches an AI student called "Buddy," and Buddy gently corrects grammar mistakes in real-time.

---

### Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS + Framer Motion (animations) |
| AI | Google Gemini 2.5 Flash (Live Audio API + Image generation) |
| Icons | Lucide React |
| Backend (included) | Express + better-sqlite3 (not actively used in frontend) |

---

### How It Works

**Core Interaction Loop:**
1. Child speaks into microphone → Web Audio API captures and encodes to base64 PCM
2. Audio streams to **Gemini Live API** in real-time
3. Buddy (the AI) responds in character as an enthusiastic 8-year-old student
4. If a grammar mistake is detected, Buddy calls a `show_correction` tool — displaying the corrected sentence with an optional phonics hint
5. The child's story narrative triggers **Gemini image generation**, producing animated illustrations in a 16:9 story panel

---

### Key Files
| File | Role |
|---|---|
| `src/App.tsx` | Main component — all state, API calls, UI layout |
| `src/lib/audio-processor.ts` | Web Audio API wrapper (capture at 16kHz, playback at 24kHz) |
| `src/main.tsx` | React entry point |
| `vite.config.ts` | Dev server config (port 3000, HMR toggle for AI Studio) |
| `metadata.json` | AI Studio deployment metadata |

---

### Notable Design Choices
- **Role-reversal pedagogy**: Child as teacher → higher engagement and ownership of learning
- **Quota management**: Image generation detects 429 errors and applies adaptive cooldowns (1–5 min)
- **Bidirectional audio streaming**: Uses `gemini-2.5-flash-native-audio-preview` for low-latency voice
- **In-character corrections**: Buddy stays in the "confused student" persona even when correcting grammar
- **Deployed on Google AI Studio** with runtime-injected API keys

---

### Project Structure
```
GrammarBuddyConversationalAI-GrammarBuddy/
├── src/
│   ├── App.tsx            # Core app logic + UI
│   ├── main.tsx           # Entry point
│   ├── index.css          # Global styles
│   └── lib/
│       └── audio-processor.ts
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── metadata.json
```

It's a compact, well-structured codebase — approximately 12 source files total. The entire product logic lives in `App.tsx`, which handles the Gemini Live session, grammar correction tool calls, image generation with throttling, and the full UI layout.
