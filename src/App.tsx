/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { AudioProcessor, AudioPlayer } from './lib/audio-processor';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, GraduationCap, User, BookOpen, Key, ChevronDown, Settings, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Model Options ---
const IMAGE_MODELS = [
  { id: 'gemini-3.1-flash-image-preview', label: 'Gemini 3.1 Flash Image (Preview)' },
  { id: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image' },
];

const AUDIO_MODELS = [
  { id: 'gemini-3.1-flash-live-preview', label: 'Gemini 3.1 Flash Live (Preview)' },
  { id: 'gemini-2.5-flash-native-audio-preview-12-2025', label: 'Gemini 2.5 Flash Native Audio (Dec 25)' },
  { id: 'gemini-2.5-flash-native-audio-preview-09-2025', label: 'Gemini 2.5 Flash Native Audio (Sep 25)' },
];

const SYSTEM_INSTRUCTION = `You are a friendly 8-year-old student named 'Buddy'.
You are being taught by a child (your teacher). You are very enthusiastic about learning.
However, you are secretly a grammar expert.

SPEAKING STYLE: Speak slowly, clearly, and warmly — like reading a bedtime story to a 7-year-old. Pause naturally between sentences. Never rush.

RULES:
1. GENTLE CORRECTION: When your teacher (the child) makes a grammatical mistake, gently and playfully point it out.
2. REPETITION: After correcting them, ask them to say the correct version back to you so you can "learn it properly". Do this in a fun way, like "Can you say that again for me? I want to make sure I remember it right!".
3. VISUAL LABEL: Whenever you correct a sentence, you MUST call the 'show_correction' tool FIRST — before you say anything aloud. Call it immediately as soon as you decide to make a correction, so the text appears on screen at the same moment you begin speaking.
4. PHONICS & VOCAB: Use simple, age-appropriate vocabulary (7-10 years old). If a word is tricky, break it down using phonics (e.g., "That's a big word! Di-no-saur!").
5. ENCOURAGEMENT: Always stay in character as a student. If the child speaks correctly, praise them for being a great teacher!
6. NON-ANNOYING: Don't correct every single tiny thing if it interrupts the flow too much. Focus on clear mistakes.
7. ENGLISH ONLY: You must only speak and understand English. If the child speaks in another language, politely ask them to teach you in English because you are still learning English yourself.
8. PRONUNCIATION & SPELLING (Pronunciation Skill): Listen carefully for mispronounced or misspelled words. When you hear one, gently sound it out using phonics in a playful way. Example: "Ooh, that word is a bit tricky! It's said like this: el-e-phant!". Only call show_correction if the full sentence also has a grammar mistake.
9. VOCABULARY (Vocabulary Skill): When a child uses a word correctly that is slightly advanced, celebrate it! If they use a simpler word where a better one fits, playfully suggest the better word. Example: "Oh wow, 'big' is good — but you could also say 'enormous'! Can you try that?".
10. CONTENT SAFETY (Safety Skill): If the child uses any inappropriate, rude, or unkind words, do NOT repeat them. Gently and warmly redirect without shaming. Example: "Hmm, I don't think my teacher would use that word! Let's try saying it in a kinder way." Keep the tone light and never make the child feel bad.
11. MOOD DETECTION (Mood Skill): Pay close attention to the child's tone. If they sound frustrated, bored, tired, or upset, pause the lesson gently. Say something like "Hey, should we take a little break? We can come back when you're ready! You're doing great!" — and wait for them to re-engage. If they're excited and happy, match their energy and keep going!`;

// --- API Key Screen ---
function ApiKeyScreen({ onSubmit }: { onSubmit: (key: string) => void }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setError('Please enter your Gemini API key.');
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF0] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-black/5 shadow-xl p-10 max-w-md w-full"
      >
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
            <Key size={32} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Welcome to Grammar Buddy</h1>
            <p className="text-black/50 text-sm mt-1">
              To get started, please enter your <span className="font-semibold text-emerald-600">Google Gemini API key</span>.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-black/40 uppercase tracking-wider">Gemini API Key</label>
            <input
              type="password"
              value={key}
              onChange={e => { setKey(e.target.value); setError(''); }}
              placeholder="AIza..."
              className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono"
              autoFocus
            />
            {error && <p className="text-rose-500 text-xs">{error}</p>}
          </div>

          <p className="text-xs text-black/30 text-center">
            Your key is saved locally in your browser and never sent anywhere else.
          </p>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Grant Permission &amp; Continue
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-black/5 text-center">
          <p className="text-xs text-black/30">
            Get your free API key at{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-500 underline underline-offset-2"
            >
              aistudio.google.com
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// --- Model Selector Dropdown ---
function ModelSelect({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-black/40 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="appearance-none w-full bg-[#F5F4E8] border border-black/10 rounded-xl pl-3 pr-8 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {options.map(o => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/30 pointer-events-none" />
      </div>
    </div>
  );
}

export default function App() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [imageModel, setImageModel] = useState(IMAGE_MODELS[0].id);
  const [audioModel, setAudioModel] = useState(AUDIO_MODELS[0].id);
  const [showSettings, setShowSettings] = useState(false);

  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userTranscript, setUserTranscript] = useState<string>("");
  const [aiTranscript, setAiTranscript] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [correction, setCorrection] = useState<{ sentence: string; phonics?: string } | null>(null);

  const userTranscriptRef = useRef("");

  const [storyImages, setStoryImages] = useState<Array<{ image: string; scene: string }>>([]);
  const [bookTitle, setBookTitle] = useState("My Grammar Buddy Story");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState("");
  const [visualizerError, setVisualizerError] = useState<string | null>(null);
  const [nextAvailableTime, setNextAvailableTime] = useState(0);
  const [countdown, setCountdown] = useState(0);

  const audioProcessorRef = useRef<AudioProcessor | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const sessionRef = useRef<any>(null);

  // Load API key from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('grammarbuddy_api_key');
    if (stored) setApiKey(stored);
  }, []);

  const handleApiKeySubmit = (key: string) => {
    localStorage.setItem('grammarbuddy_api_key', key);
    setApiKey(key);
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('grammarbuddy_api_key');
    setApiKey(null);
    stopSession();
    setShowSettings(false);
  };

  // Countdown timer for quota
  useEffect(() => {
    if (nextAvailableTime > Date.now()) {
      const timer = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((nextAvailableTime - Date.now()) / 1000));
        setCountdown(remaining);
        if (remaining === 0) clearInterval(timer);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setCountdown(0);
    }
  }, [nextAvailableTime]);

  const downloadStorybook = () => {
    const pages = storyImages
      .map(
        (item, i) => `
      <div class="page">
        <div class="page-number">Page ${i + 1}</div>
        <img src="${item.image}" alt="Story scene ${i + 1}" />
        <p class="caption">"${item.scene}"</p>
      </div>`
      )
      .join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${bookTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Nunito', sans-serif; background: #fffdf0; color: #1a1a1a; }
    .cover {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #d1fae5 0%, #fef9c3 100%);
      text-align: center;
      padding: 48px;
      page-break-after: always;
    }
    .cover .star { font-size: 80px; margin-bottom: 24px; }
    .cover h1 { font-size: 56px; font-weight: 900; color: #065f46; line-height: 1.1; margin-bottom: 16px; }
    .cover .subtitle { font-size: 22px; color: #059669; font-weight: 700; }
    .cover .buddy { font-size: 100px; margin-top: 32px; }
    .page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      min-height: 100vh;
      padding: 48px 32px;
      page-break-after: always;
      background: #fffdf0;
    }
    .page-number {
      font-size: 13px;
      font-weight: 700;
      color: #a3a3a3;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 20px;
    }
    .page img {
      width: 100%;
      max-width: 800px;
      border-radius: 24px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.12);
      margin-bottom: 32px;
    }
    .caption {
      font-size: 24px;
      font-weight: 700;
      color: #064e3b;
      text-align: center;
      max-width: 680px;
      line-height: 1.5;
      background: #d1fae5;
      border-radius: 16px;
      padding: 20px 28px;
    }
    @media print {
      body { background: white; }
      .cover, .page { min-height: 100vh; }
    }
  </style>
</head>
<body>
  <div class="cover">
    <div class="star">&#11088;</div>
    <h1>${bookTitle}</h1>
    <div class="subtitle">A Grammar Buddy Adventure</div>
    <div class="buddy">&#128102;</div>
  </div>
  ${pages}
  <script>window.onload = function() { window.print(); };<\/script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const generateStoryImage = async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText || cleanText.length < 10) return;
    if (cleanText === lastProcessedTranscript) return;

    const now = Date.now();
    if (now < nextAvailableTime) {
      console.log("Skipping image generation - quota cooldown active");
      return;
    }

    setIsGeneratingImage(true);
    setVisualizerError(null);
    setLastProcessedTranscript(cleanText);

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey! });
      const response = await ai.models.generateContent({
        model: imageModel,
        contents: {
          parts: [
            {
              text: `A vibrant, whimsical, kid-friendly digital illustration for a storybook. The scene shows: ${cleanText}. IMPORTANT: Any text visible in the image must be strictly in English only. If the scene description contains non-English words, translate them to English for the visual representation. Style: soft colors, magical atmosphere, high quality, 3D render style but friendly.`,
            },
          ],
        },
        config: {
          responseModalities: ['IMAGE', 'TEXT'],
          imageConfig: {
            aspectRatio: "16:9",
          },
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (part?.inlineData) {
        const image = `data:image/png;base64,${part.inlineData.data}`;
        setStoryImages(prev => [...prev, { image, scene: cleanText }]);
        setNextAvailableTime(Date.now() + 120000);
      }
    } catch (err: any) {
      const isQuotaError =
        err?.status === "RESOURCE_EXHAUSTED" ||
        err?.code === 429 ||
        JSON.stringify(err).includes("429") ||
        JSON.stringify(err).includes("RESOURCE_EXHAUSTED");

      if (isQuotaError) {
        setVisualizerError("Buddy's magic paintbrush is a bit tired from all the drawing! Let's wait a few minutes before we create another scene.");
        setNextAvailableTime(Date.now() + 300000);
      } else {
        console.error("Image generation failed:", err);
        setVisualizerError("Oops! The magic sparkles got a little tangled. Let's try again in a moment!");
        setNextAvailableTime(Date.now() + 60000);
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const toggleConnection = async () => {
    if (isConnected) {
      stopSession();
    } else {
      startSession();
    }
  };

  const startSession = async () => {
    try {
      setError(null);
      setCorrection(null);
      userTranscriptRef.current = "";
      setUserTranscript("");
      setStoryImages([]);

      // Request mic permission up front so errors surface clearly
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        setError("Microphone access denied. Please allow microphone permissions and try again.");
        return;
      }

      const ai = new GoogleGenAI({ apiKey: apiKey! });
      audioPlayerRef.current = new AudioPlayer();

      // Connect to Live API first; await so sessionRef is set before audio flows
      const session = await ai.live.connect({
        model: audioModel,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: SYSTEM_INSTRUCTION,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          tools: [
            {
              functionDeclarations: [
                {
                  name: "show_correction",
                  description: "Displays the corrected sentence on the screen for the child to read and repeat.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      correctedSentence: {
                        type: Type.STRING,
                        description: "The full corrected sentence for the child to repeat.",
                      },
                      phonicsHint: {
                        type: Type.STRING,
                        description: "Optional phonics breakdown for a tricky word in the sentence (e.g. Di-no-saur).",
                      }
                    },
                    required: ["correctedSentence"],
                  },
                }
              ]
            }
          ]
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsListening(true);
          },
          onmessage: async (message) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              setIsSpeaking(true);
              await audioPlayerRef.current?.playChunk(base64Audio);
            }

            const toolCall = message.toolCall;
            if (toolCall?.functionCalls) {
              for (const fc of toolCall.functionCalls) {
                if (fc.name === "show_correction") {
                  const args = fc.args as any;
                  setCorrection({
                    sentence: args.correctedSentence,
                    phonics: args.phonicsHint
                  });

                  // Start image generation immediately on correction, don't wait for child's repeat
                  generateStoryImage(args.correctedSentence);

                  sessionRef.current?.sendToolResponse({
                    functionResponses: [{
                      name: "show_correction",
                      id: fc.id,
                      response: { success: true }
                    }]
                  });
                }
              }
            }

            if (message.serverContent?.interrupted) {
              audioPlayerRef.current?.stop(); // halts playback, keeps context alive
              setIsSpeaking(false);
            }

            if (message.serverContent?.turnComplete) {
              setIsSpeaking(false);
              if (userTranscriptRef.current) {
                generateStoryImage(userTranscriptRef.current);
              }
            }

            if (message.serverContent?.inputTranscription?.text) {
              const newText = message.serverContent.inputTranscription.text;
              userTranscriptRef.current += " " + newText;
              setUserTranscript(userTranscriptRef.current);
              // Clear Buddy's transcript when user starts speaking
              setAiTranscript("");
            }

            if (message.serverContent?.outputTranscription?.text) {
              setAiTranscript(prev => prev + " " + message.serverContent!.outputTranscription!.text);
            }
          },
          onclose: () => {
            stopSession();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setError("Oops! Something went wrong with the connection.");
            stopSession();
          }
        }
      });

      // Store session before starting audio so the callback can send data immediately
      sessionRef.current = session;

      // Now start capturing mic audio — session is ready to receive it
      audioProcessorRef.current = new AudioProcessor((base64Data) => {
        sessionRef.current?.sendRealtimeInput({
          audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
        });
      });

      try {
        await audioProcessorRef.current.start();
      } catch (err) {
        console.error("Microphone start failed:", err);
        setError("Could not start microphone. Please check your permissions.");
        stopSession();
      }

    } catch (err) {
      console.error("Failed to start session:", err);
      setError("Could not connect. Please check your API key and try again.");
    }
  };

  const stopSession = () => {
    audioProcessorRef.current?.stop();
    audioPlayerRef.current?.close(); // full teardown
    sessionRef.current?.close();
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    sessionRef.current = null;
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  // Derive latest image for display
  const latestStoryImage = storyImages[storyImages.length - 1]?.image ?? null;

  // Show API key screen if no key is set
  if (!apiKey) {
    return <ApiKeyScreen onSubmit={handleApiKeySubmit} />;
  }

  return (
    <div className="min-h-screen bg-[#FDFCF0] text-[#141414] font-sans selection:bg-emerald-200 flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-black/5 bg-white/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-sm">
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">Grammar Buddy</h1>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                Ages 7–10
              </span>
            </div>
            <p className="text-xs text-black/50 font-medium uppercase tracking-wider">AI Student Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isConnected && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium animate-pulse">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              Live Session
            </div>
          )}

          {/* Settings toggle */}
          <button
            onClick={() => setShowSettings(s => !s)}
            className="p-2.5 rounded-xl border border-black/10 hover:bg-black/5 transition-colors text-black/40"
            title="Model Settings"
          >
            <Settings size={18} />
          </button>

          <button
            onClick={toggleConnection}
            className={`px-6 py-2.5 rounded-full font-semibold transition-all shadow-sm flex items-center gap-2 ${
              isConnected
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
          >
            {isConnected ? (
              <><MicOff size={18} /> Stop Lesson</>
            ) : (
              <><Mic size={18} /> Start Lesson</>
            )}
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-white border-b border-black/5 shadow-sm"
          >
            <div className="max-w-6xl mx-auto px-8 py-5 flex flex-wrap items-end gap-6">
              <div className="flex items-center gap-2 text-black/40 uppercase text-xs font-bold tracking-widest mr-2">
                <Settings size={14} /> Model Settings
              </div>

              <div className="w-64">
                <ModelSelect
                  label="Image Model"
                  options={IMAGE_MODELS}
                  value={imageModel}
                  onChange={setImageModel}
                  disabled={isConnected}
                />
              </div>

              <div className="w-72">
                <ModelSelect
                  label="Live Audio Model"
                  options={AUDIO_MODELS}
                  value={audioModel}
                  onChange={setAudioModel}
                  disabled={isConnected}
                />
              </div>

              {isConnected && (
                <p className="text-xs text-amber-500 font-medium">Stop the session to change models.</p>
              )}

              <div className="ml-auto flex items-center gap-3">
                <button
                  onClick={handleClearApiKey}
                  className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-600 font-medium transition-colors"
                >
                  <Key size={13} /> Change API Key
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1.5 rounded-lg hover:bg-black/5 text-black/30 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-6xl mx-auto w-full p-8 flex flex-col gap-8">
        {/* Top Section: Interaction */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[400px]">
          {/* Teacher Section (Child) */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-black/40 uppercase text-xs font-bold tracking-widest">
              <User size={14} /> Teacher (You)
            </div>
            <div className="flex-1 bg-white rounded-3xl border border-black/5 shadow-sm p-8 flex flex-col items-center justify-center relative overflow-hidden group">
              <AnimatePresence mode="wait">
                {isListening ? (
                  <motion.div
                    key="listening"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <div className="relative">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500"
                      >
                        <Mic size={40} />
                      </motion.div>
                      <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 bg-emerald-200 rounded-full -z-10"
                      />
                    </div>
                    <p className="text-lg font-medium text-center">I'm listening, Teacher!<br /><span className="text-black/40 text-sm">Tell me something new!</span></p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-black/30"
                  >
                    <p className="text-lg">Click "Start Lesson" to begin teaching!</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Student Section (AI) */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-black/40 uppercase text-xs font-bold tracking-widest">
              <Sparkles size={14} className="text-amber-500" /> Student (Buddy)
            </div>
            <div className="flex-1 bg-white rounded-3xl border border-black/5 shadow-sm p-8 flex flex-col items-center justify-center relative overflow-hidden">
              <AnimatePresence mode="wait">
                {isSpeaking ? (
                  <motion.div
                    key="speaking"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <div className="w-32 h-32 bg-amber-100 rounded-full flex items-center justify-center relative">
                      <motion.div
                        animate={{
                          rotate: [0, -5, 5, -5, 0],
                          y: [0, -5, 0]
                        }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-6xl"
                      >
                        👦
                      </motion.div>
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-amber-500">
                        <Volume2 size={20} />
                      </div>
                    </div>
                    <div className="text-center w-full">
                      <p className="text-xl font-bold text-amber-600 mb-2">Buddy is speaking...</p>
                      <div className="flex gap-1 justify-center mb-3">
                        {[1, 2, 3].map(i => (
                          <motion.div
                            key={i}
                            animate={{ height: [8, 24, 8] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                            className="w-1.5 bg-amber-400 rounded-full"
                          />
                        ))}
                      </div>
                      {aiTranscript && (
                        <p className="text-sm text-amber-800/70 leading-relaxed px-2 line-clamp-4 italic">
                          {aiTranscript.trim()}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="waiting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="text-6xl grayscale opacity-50">👦</div>
                    <p className="text-lg font-medium text-black/30">Buddy is waiting to learn...</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* Bottom Section: Story Visualizer & Correction */}
        <section className="flex flex-col gap-4 pb-12">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-black/40 uppercase text-xs font-bold tracking-widest">
              <Sparkles size={14} className="text-emerald-500" /> Story Magic (Animation)
            </div>

            {/* Book title + download */}
            <div className="flex items-center gap-3 flex-1 justify-end flex-wrap">
              <input
                type="text"
                value={bookTitle}
                onChange={e => setBookTitle(e.target.value)}
                className="border border-black/10 rounded-xl px-3 py-1.5 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 w-56"
                placeholder="Book title..."
                aria-label="Storybook title"
              />
              {storyImages.length > 0 && (
                <button
                  onClick={downloadStorybook}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  <Download size={13} />
                  Download Storybook
                </button>
              )}
            </div>

            {isGeneratingImage && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 animate-pulse">
                Creating your story scene...
              </div>
            )}
            {!isGeneratingImage && countdown > 0 && (
              <div className="flex items-center gap-2 text-xs font-bold text-black/30">
                Paintbrush resting ({countdown}s)
              </div>
            )}
          </div>

          {/* Correction Label */}
          <AnimatePresence>
            {correction && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-amber-50 border-2 border-amber-200 p-6 rounded-3xl shadow-sm mb-4 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 flex-shrink-0">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Teacher, can you repeat this?</p>
                    <p className="text-2xl font-bold text-amber-900 leading-tight">
                      {correction.sentence}
                    </p>
                    {correction.phonics && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-500 uppercase">Phonics Tip:</span>
                        <span className="text-sm font-medium text-amber-700 bg-white px-2 py-0.5 rounded-md border border-amber-100">
                          {correction.phonics}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative aspect-video w-full bg-white rounded-[2rem] border border-black/5 shadow-lg overflow-hidden flex items-center justify-center">
            <AnimatePresence mode="wait">
              {visualizerError ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center p-12 flex flex-col items-center gap-4"
                >
                  <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
                    <VolumeX size={40} />
                  </div>
                  <div className="max-w-xs">
                    <p className="text-lg font-bold text-rose-600">Magic Break!</p>
                    <p className="text-sm text-rose-500/70">{visualizerError}</p>
                    {countdown > 0 ? (
                      <div className="mt-4 px-4 py-2 bg-rose-50 text-rose-500 rounded-full text-xs font-bold border border-rose-100">
                        Paintbrush ready in {countdown}s
                      </div>
                    ) : (
                      <button
                        onClick={() => generateStoryImage(userTranscriptRef.current)}
                        className="mt-4 px-4 py-2 bg-rose-100 text-rose-600 rounded-full text-xs font-bold hover:bg-rose-200 transition-colors"
                      >
                        Try Magic Again
                      </button>
                    )}
                  </div>
                </motion.div>
              ) : latestStoryImage ? (
                <motion.div
                  key={latestStoryImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 w-full h-full"
                >
                  <motion.img
                    src={latestStoryImage}
                    alt="Story illustration"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    animate={{
                      scale: [1, 1.1, 1],
                      x: [0, -10, 10, 0],
                      y: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                  <div className="absolute bottom-6 left-8 right-8">
                    <p className="text-white text-lg font-medium italic drop-shadow-md line-clamp-2">
                      "{userTranscript.slice(-150)}..."
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center p-12 flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-[#FDFCF0] rounded-full flex items-center justify-center text-black/10">
                    <Sparkles size={40} />
                  </div>
                  <div className="max-w-xs">
                    <p className="text-lg font-bold text-black/20">Your Story Animation</p>
                    <p className="text-sm text-black/10">Tell Buddy a story, and watch it come to life here!</p>
                  </div>
                </div>
              )}
            </AnimatePresence>

            {isGeneratingImage && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="text-emerald-500"
                  >
                    <Sparkles size={48} />
                  </motion.div>
                  <p className="font-bold text-emerald-600">Sprinkling magic dust...</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-rose-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 z-50"
          >
            <MicOff size={20} />
            <span className="font-medium">{error}</span>
            <button onClick={() => setError(null)} className="ml-2 hover:opacity-70">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions Overlay */}
      {!isConnected && !error && !latestStoryImage && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-30">
          <div className="bg-white/80 backdrop-blur-md border border-black/5 p-6 rounded-3xl shadow-xl text-center">
            <h3 className="font-bold text-lg mb-2">How to play:</h3>
            <p className="text-sm text-black/60 leading-relaxed">
              1. Click <span className="text-emerald-600 font-bold">Start Lesson</span><br />
              2. Teach Buddy something (like "The cat is on the mat")<br />
              3. Buddy will listen and learn from you!<br />
              4. Watch your story come to life at the bottom!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
