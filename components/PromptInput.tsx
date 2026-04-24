"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

const EXAMPLES = [
  "Build a dark mode Pomodoro timer",
  "Create a personal portfolio with a glassmorphism contact form",
  "A weather dashboard using Tailwind CSS",
];

export function PromptInput({ onSubmit, isLoading }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim());
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto glass-panel p-6 rounded-2xl shadow-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the web app you want to build..."
            className="w-full h-32 glass-input rounded-xl p-4 text-slate-100 placeholder:text-slate-500 resize-none font-medium text-lg transition-all"
            disabled={isLoading}
            maxLength={1000}
          />
          <div className="absolute bottom-3 right-4 text-xs text-slate-500">
            {prompt.length} / 1000
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setPrompt(ex)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {ex}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={!prompt.trim() || isLoading}
          className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating App...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Code
            </>
          )}
        </button>
      </form>
    </div>
  );
}
