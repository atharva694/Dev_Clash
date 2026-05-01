"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, Mic, MicOff, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

const TYPING_PROMPTS = [
  "Make me a portfolio app with dark mode and animations...",
  "Make me a pomodoro timer with sound notifications...",
  "Build a SaaS dashboard with analytics charts...",
];

const TYPING_SPEED = 60;    // ms per character when typing
const DELETING_SPEED = 30;  // ms per character when deleting
const PAUSE_AFTER_TYPE = 1800; // ms to pause after fully typed
const PAUSE_AFTER_DELETE = 400; // ms to pause after fully deleted

export function PromptInput({ onSubmit, isLoading }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Typewriter animation for placeholder
  useEffect(() => {
    let currentIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let timeoutId: NodeJS.Timeout;

    const tick = () => {
      const currentPrompt = TYPING_PROMPTS[currentIndex];

      if (!isDeleting) {
        // Typing forward
        currentCharIndex++;
        setAnimatedPlaceholder(currentPrompt.slice(0, currentCharIndex));

        if (currentCharIndex === currentPrompt.length) {
          // Finished typing — pause, then start deleting
          isDeleting = true;
          timeoutId = setTimeout(tick, PAUSE_AFTER_TYPE);
        } else {
          timeoutId = setTimeout(tick, TYPING_SPEED);
        }
      } else {
        // Deleting backward
        currentCharIndex--;
        setAnimatedPlaceholder(currentPrompt.slice(0, currentCharIndex));

        if (currentCharIndex === 0) {
          // Finished deleting — move to next prompt
          isDeleting = false;
          currentIndex = (currentIndex + 1) % TYPING_PROMPTS.length;
          timeoutId = setTimeout(tick, PAUSE_AFTER_DELETE);
        } else {
          timeoutId = setTimeout(tick, DELETING_SPEED);
        }
      }
    };

    timeoutId = setTimeout(tick, PAUSE_AFTER_DELETE);

    return () => clearTimeout(timeoutId);
  }, []);

  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release mic
        stream.getTracks().forEach((t) => t.stop());

        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (audioBlob.size < 100) {
          setMicError("Recording was too short. Hold the mic button and speak, then click again to stop.");
          return;
        }

        // Send to backend for Gemini transcription
        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");

          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Transcription failed: ${res.statusText}`);
          }

          const data = await res.json();

          const transcript = data.transcript;
          if (transcript) {
            setPrompt((prev) => (prev ? prev + " " + transcript : transcript));
          }
        } catch (err: any) {
          setMicError(err.message || "Failed to transcribe audio. Please try again.");
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setMicError("Microphone access denied. Please allow mic permissions in your browser.");
      } else if (err.name === "NotFoundError") {
        setMicError("No microphone found. Please connect a microphone.");
      } else {
        setMicError("Could not access microphone: " + err.message);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim());
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto relative z-10">
      {/* Mic error toast */}
      <AnimatePresence>
        {micError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm"
          >
            <MicOff className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="flex-1">{micError}</p>
            <button onClick={() => setMicError(null)} className="shrink-0 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={handleSubmit}
        className="relative w-full rounded-[2rem] border border-white/5 bg-[#131825]/40 backdrop-blur-xl p-8 shadow-2xl flex flex-col min-h-[280px]"
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={animatedPlaceholder || "Describe your dream application..."}
          className="flex-1 bg-transparent border-none resize-none text-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-0 leading-relaxed transition-all duration-300 peer"
          disabled={isLoading}
          maxLength={2000}
        />
        {/* Glowing border effect on focus */}
        <div className="absolute inset-0 rounded-[2rem] border-2 border-transparent peer-focus:border-cyan-500/30 peer-focus:shadow-[0_0_30px_rgba(34,211,238,0.1)] pointer-events-none transition-all duration-500"></div>



        <div className="flex justify-between items-end mt-auto pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={toggleListening}
            className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all cursor-pointer ${
              isListening
                ? "bg-red-500/20 border-red-500/50 text-red-400 animate-pulse"
                : isTranscribing
                ? "bg-violet-500/20 border-violet-500/50 text-violet-400"
                : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
            disabled={isLoading || isTranscribing}
            title={isListening ? "Stop recording" : isTranscribing ? "Transcribing..." : "Start voice input"}
          >
            {isTranscribing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>

          {/* Recording indicator */}
          {isListening && (
            <div className="flex items-center gap-2 text-red-400 text-sm font-medium animate-pulse">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              Recording... click mic to stop
            </div>
          )}
          {isTranscribing && (
            <div className="flex items-center gap-2 text-violet-400 text-sm font-medium">
              <Loader2 className="w-3 h-3 animate-spin" />
              Transcribing with AI...
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0px 0px 25px rgba(34,211,238,0.4)" }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-bold tracking-wide text-sm shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            <span className="relative z-10 flex items-center gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Constructing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Construct
                </>
              )}
            </span>
          </motion.button>
        </div>
      </form>
    </div>
  );
}
