"use client";

import { useState, useRef } from "react";
import { Sparkles, Loader2, Mic, MicOff, X } from "lucide-react";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export function PromptInput({ onSubmit, isLoading }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.detail || "Transcription failed");
          }

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

  const suggestions = [
    "Make me a portfolio app",
    "Make me a pomodoro app",
    "Build a SaaS dashboard",
  ];

  return (
    <div className="w-full max-w-3xl mx-auto relative mt-8 z-10">
      {/* Mic error toast */}
      {micError && (
        <div className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm animate-in fade-in duration-300">
          <MicOff className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="flex-1">{micError}</p>
          <button onClick={() => setMicError(null)} className="shrink-0 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="relative w-full rounded-[2rem] border border-white/5 bg-[#131825]/40 backdrop-blur-xl p-8 shadow-2xl flex flex-col min-h-[280px]"
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What masterpiece shall we craft today?"
          className="flex-1 bg-transparent border-none resize-none text-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-0 leading-relaxed"
          disabled={isLoading}
          maxLength={2000}
        />

        <div className="flex flex-wrap gap-2 mt-2 mb-4">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setPrompt(suggestion)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              disabled={isLoading}
            >
              {suggestion}
            </button>
          ))}
        </div>

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

          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-cyan-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
          >
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
          </button>
        </div>
      </form>
    </div>
  );
}
