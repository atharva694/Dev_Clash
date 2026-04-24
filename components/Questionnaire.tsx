"use client";

import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";

interface QuestionnaireProps {
  questions: string[];
  onComplete: (answers: Record<string, string>) => void;
}

export function Questionnaire({ questions, onComplete }: QuestionnaireProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(answers);
  };

  return (
    <div className="w-full max-w-2xl mx-auto glass-panel p-8 rounded-3xl shadow-xl animate-in fade-in zoom-in duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-violet-500/20 rounded-xl">
          <Sparkles className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Let's clarify a few things</h2>
          <p className="text-sm text-slate-400">Answer these quick questions to get a better result.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q, idx) => (
          <div key={idx} className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">
              {q}
            </label>
            <input
              type="text"
              value={answers[q] || ""}
              onChange={(e) => setAnswers({ ...answers, [q]: e.target.value })}
              className="w-full glass-input rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-violet-500/50 outline-none transition-all"
              placeholder="Your answer..."
              required
            />
          </div>
        ))}

        <button
          type="submit"
          className="flex items-center justify-center gap-2 w-full py-3.5 px-6 mt-4 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold shadow-lg shadow-blue-900/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          Generate App
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
