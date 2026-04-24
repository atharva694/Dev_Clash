"use client";

import { useState } from "react";
import { Sparkles, Loader2, Mic } from "lucide-react";

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export function PromptInput({ onSubmit, isLoading }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim());
    }
  };

  return (
    <div className="w-full relative mt-8 z-10">
      <form 
        onSubmit={handleSubmit} 
        className="relative w-full rounded-[2rem] border border-white/5 bg-[#131825]/40 backdrop-blur-xl p-8 shadow-2xl flex flex-col min-h-[320px]"
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What masterpiece shall we craft today?"
          className="flex-1 bg-transparent border-none resize-none text-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-0 leading-relaxed"
          disabled={isLoading}
          maxLength={2000}
        />
        
        <div className="flex justify-between items-end mt-4">
          <button 
            type="button" 
            className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            disabled={isLoading}
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
