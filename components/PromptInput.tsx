"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Loader2, Mic } from "lucide-react";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export function PromptInput({ onSubmit, isLoading }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setPrompt(currentTranscript);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.error(e);
        }
      } else {
        alert("Speech recognition is not supported in this browser.");
      }
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
    "Build a SaaS dashboard"
  ];

  return (
    <div className="w-full max-w-3xl mx-auto relative mt-8 z-10">
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
                : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
            disabled={isLoading}
            title={isListening ? "Stop listening" : "Start dictation"}
          >
             <Mic className="w-6 h-6" />
          </button>
          
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
