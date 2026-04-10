/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { AudioProcessor, AudioPlayer } from './lib/audio-processor';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, GraduationCap, User, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SYSTEM_INSTRUCTION = `You are a friendly 8-year-old student named 'Buddy'. 
You are being taught by a child (your teacher). You are very enthusiastic about learning. 
However, you are secretly a grammar expert. 

RULES:
1. GENTLE CORRECTION: When your teacher (the child) makes a grammatical mistake, gently and playfully point it out. 
2. REPETITION: After correcting them, ask them to say the correct version back to you so you can "learn it properly". Do this in a fun way, like "Can you say that again for me? I want to make sure I remember it right!". 
3. VISUAL LABEL: Whenever you correct a sentence, you MUST call the 'show_correction' tool with the corrected sentence.
4. PHONICS & VOCAB: Use simple, age-appropriate vocabulary (7-10 years old). If a word is tricky, break it down using phonics (e.g., "That's a big word! Di-no-saur!").
5. ENCOURAGEMENT: Always stay in character as a student. If the child speaks correctly, praise them for being a great teacher!
6. NON-ANNOYING: Don't correct every single tiny thing if it interrupts the flow too much. Focus on clear mistakes.
7. ENGLISH ONLY: You must only speak and understand English. If the child speaks in another language, politely ask them to teach you in English because you are still learning English yourself.`;

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userTranscript, setUserTranscript] = useState<string>("");
  const [aiTranscript, setAiTranscript] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
  // Correction State
  const [correction, setCorrection] = useState<{ sentence: string; phonics?: string } | null>(null);
  
  // Refs for transcription to avoid closure issues in Live API callbacks
  const userTranscriptRef = useRef("");
  
  // Story Visualizer State
  const [storyImage, setStoryImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState("");
  const [visualizerError, setVisualizerError] = useState<string | null>(null);
  const [nextAvailableTime, setNextAvailableTime] = useState(0);
  const [countdown, setCountdown] = useState(0);

  const audioProcessorRef = useRef<AudioProcessor | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const sessionRef = useRef<any>(null);

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

  const generateStoryImage = async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText || cleanText.length < 10) return; // Need a bit more context for a good image
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
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `A vibrant, whimsical, kid-friendly digital illustration for a storybook. The scene shows: ${cleanText}. IMPORTANT: Any text visible in the image must be strictly in English only. If the scene description contains non-English words, translate them to English for the visual representation. Style: soft colors, magical atmosphere, high quality, 3D render style but friendly.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
          },
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (part?.inlineData) {
        setStoryImage(`data:image/png;base64,${part.inlineData.data}`);
        // Success cooldown: 2 minutes
        setNextAvailableTime(Date.now() + 120000);
      }
    } catch (err: any) {
      // Check for quota error (429)
      const isQuotaError = 
        err?.status === "RESOURCE_EXHAUSTED" || 
        err?.code === 429 ||
        JSON.stringify(err).includes("429") ||
        JSON.stringify(err).includes("RESOURCE_EXHAUSTED");

      if (isQuotaError) {
        setVisualizerError("Buddy's magic paintbrush is a bit tired from all the drawing! Let's wait a few minutes before we create another scene.");
        // Quota error cooldown: 5 minutes
        setNextAvailableTime(Date.now() + 300000); 
      } else {
        console.error("Image generation failed:", err);
        setVisualizerError("Oops! The magic sparkles got a little tangled. Let's try again in a moment!");
        // Generic error cooldown: 1 minute
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
      userTranscriptRef.current = ""; // Reset transcript on new session
      setUserTranscript("");
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      audioPlayerRef.current = new AudioPlayer();
      
      // Create AudioProcessor early so it's ready for onopen
      audioProcessorRef.current = new AudioProcessor((base64Data) => {
        sessionPromise.then(session => {
          session.sendRealtimeInput({
            media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          });
        });
      });

      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
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
            audioProcessorRef.current?.start();
          },
          onmessage: async (message) => {
            // Handle audio output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              setIsSpeaking(true);
              await audioPlayerRef.current?.playChunk(base64Audio);
            }

            // Handle tool calls
            const toolCall = message.toolCall;
            if (toolCall?.functionCalls) {
              for (const fc of toolCall.functionCalls) {
                if (fc.name === "show_correction") {
                  const args = fc.args as any;
                  setCorrection({
                    sentence: args.correctedSentence,
                    phonics: args.phonicsHint
                  });
                  
                  // Send empty response back to keep the session happy
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: [{
                        name: "show_correction",
                        id: fc.id,
                        response: { success: true }
                      }]
                    });
                  });
                }
              }
            }

            // Handle interruption
            if (message.serverContent?.interrupted) {
              audioPlayerRef.current?.stop();
              setIsSpeaking(false);
            }

            // Handle end of turn
            if (message.serverContent?.turnComplete) {
              setIsSpeaking(false);
              // Use the ref to get the most up-to-date transcript
              if (userTranscriptRef.current) {
                generateStoryImage(userTranscriptRef.current);
              }
            }

            // Handle user transcription
            if (message.serverContent?.inputTranscription?.text) {
               const newText = message.serverContent.inputTranscription.text;
               userTranscriptRef.current += " " + newText;
               setUserTranscript(userTranscriptRef.current);
            }

            // Handle model transcription
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

      sessionRef.current = await sessionPromise;

    } catch (err) {
      console.error("Failed to start session:", err);
      setError("Could not start the session. Please check your microphone permissions.");
    }
  };

  const stopSession = () => {
    audioProcessorRef.current?.stop();
    audioPlayerRef.current?.stop();
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

  return (
    <div className="min-h-screen bg-[#FDFCF0] text-[#141414] font-sans selection:bg-emerald-200 flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-black/5 bg-white/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-sm">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Grammar Buddy</h1>
            <p className="text-xs text-black/50 font-medium uppercase tracking-wider">AI Student Assistant</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {isConnected && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium animate-pulse">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              Live Session
            </div>
          )}
          <button 
            onClick={toggleConnection}
            className={`px-6 py-2.5 rounded-full font-semibold transition-all shadow-sm flex items-center gap-2 ${
              isConnected 
                ? 'bg-rose-500 text-white hover:bg-rose-600' 
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
          >
            {isConnected ? (
              <>
                <MicOff size={18} /> Stop Lesson
              </>
            ) : (
              <>
                <Mic size={18} /> Start Lesson
              </>
            )}
          </button>
        </div>
      </header>

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
                    <p className="text-lg font-medium text-center">I'm listening, Teacher!<br/><span className="text-black/40 text-sm">Tell me something new!</span></p>
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
                    <div className="text-center">
                      <p className="text-xl font-bold text-amber-600 mb-2">Buddy is speaking...</p>
                      <div className="flex gap-1 justify-center">
                        {[1, 2, 3].map(i => (
                          <motion.div 
                            key={i}
                            animate={{ height: [8, 24, 8] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                            className="w-1.5 bg-amber-400 rounded-full"
                          />
                        ))}
                      </div>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-black/40 uppercase text-xs font-bold tracking-widest">
              <Sparkles size={14} className="text-emerald-500" /> Story Magic (Animation)
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
              ) : storyImage ? (
                <motion.div 
                  key={storyImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 w-full h-full"
                >
                  <motion.img 
                    src={storyImage} 
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
      {!isConnected && !error && !storyImage && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-30">
          <div className="bg-white/80 backdrop-blur-md border border-black/5 p-6 rounded-3xl shadow-xl text-center">
            <h3 className="font-bold text-lg mb-2">How to play:</h3>
            <p className="text-sm text-black/60 leading-relaxed">
              1. Click <span className="text-emerald-600 font-bold">Start Lesson</span><br/>
              2. Teach Buddy something (like "The cat is on the mat")<br/>
              3. Buddy will listen and learn from you!<br/>
              4. Watch your story come to life at the bottom!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
