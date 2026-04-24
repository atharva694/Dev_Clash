"use client";

import { useState } from "react";
import { AppState, GenerateResponse } from "@/lib/types";
import { Header } from "@/components/Header";
import { PromptInput } from "@/components/PromptInput";
import { LivePreview } from "@/components/LivePreview";
import { CodeView } from "@/components/CodeView";
import { DownloadButton } from "@/components/DownloadButton";
import { Questionnaire } from "@/components/Questionnaire";
import { AlertCircle, RefreshCcw, Sparkles, CheckCircle2, XCircle, SearchCode } from "lucide-react";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [originalPrompt, setOriginalPrompt] = useState<string>("");

  const handleInitialSubmit = async (prompt: string) => {
    setState("loading");
    setError(null);
    setResult(null);
    setOriginalPrompt(prompt);

    try {
      const res = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned invalid response: ${text.substring(0, 200)}`);
      }

      if (!res.ok) {
        throw new Error(data.detail || data.error || "Failed to clarify prompt");
      }

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setState("clarifying");
      } else {
        // No questions needed, just generate
        handleGenerate(prompt);
      }
    } catch (err: any) {
      setError(err.message || "Network error — is the backend running?");
      setState("error");
    }
  };

  const handleGenerate = async (prompt: string) => {
    setState("loading");
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned invalid response: ${text.substring(0, 200)}`);
      }

      if (!res.ok) {
        throw new Error(data.detail || data.error || "Failed to generate code");
      }

      setResult(data as GenerateResponse);
      setState("success");
    } catch (err: any) {
      setError(err.message || "Network error — is the backend running?");
      setState("error");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-black">
      <Header />

      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full relative">
        {/* Background glow effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

        {state === "idle" || (state === "loading" && questions.length === 0) ? (
          <div className="flex-1 flex items-center justify-center -mt-20">
            <PromptInput onSubmit={handleInitialSubmit} isLoading={state === "loading"} />
          </div>
        ) : null}

        {state === "clarifying" && (
          <div className="flex-1 flex items-center justify-center -mt-20">
            <Questionnaire 
              questions={questions} 
              onComplete={(answers) => {
                const combinedPrompt = `${originalPrompt}\n\nUser's clarifications:\n${Object.entries(answers).map(([q, a]) => `- ${q}\n  ${a}`).join("\n")}`;
                handleGenerate(combinedPrompt);
              }} 
            />
          </div>
        )}

        {(state === "loading" && questions.length > 0) && (
           <div className="flex-1 flex items-center justify-center -mt-20">
              <div className="glass-panel p-8 rounded-3xl flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-300 font-medium">Generating your app based on answers...</p>
              </div>
           </div>
        )}

        {state === "error" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 z-10">
            <div className="glass-panel p-8 rounded-2xl max-w-lg w-full text-center border-red-500/30">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-100 mb-2">Generation Failed</h2>
              <p className="text-slate-400 mb-6">{error}</p>
              <button
                onClick={() => setState("idle")}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        )}

        {state === "success" && result && (
          <div className="flex flex-col h-[calc(100vh-8rem)] gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out z-10">
            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
              <button
                onClick={() => setState("idle")}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                ← New Prompt
              </button>
              <DownloadButton code={result} />
            </div>

            {result.optimized_prompt && (
              <details className="glass-panel rounded-xl border border-violet-500/20 group">
                <summary className="cursor-pointer p-4 flex items-center gap-3 text-sm font-medium text-violet-300 hover:text-violet-200 transition-colors select-none">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span>AI-Enhanced Prompt</span>
                  <span className="ml-auto text-xs text-slate-500 group-open:hidden">Click to expand</span>
                </summary>
                <div className="px-4 pb-4 pt-0">
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{result.optimized_prompt}</p>
                </div>
              </details>
            )}

            {result.review_log && result.review_log.length > 0 && (
              <details className="glass-panel rounded-xl border border-blue-500/20 group">
                <summary className="cursor-pointer p-4 flex items-center gap-3 text-sm font-medium text-blue-300 hover:text-blue-200 transition-colors select-none">
                  <SearchCode className="w-4 h-4 text-blue-400" />
                  <span>Critic Refinement Log ({result.total_iterations} rounds)</span>
                  <span className="ml-auto text-xs text-slate-500 group-open:hidden">Click to expand</span>
                </summary>
                <div className="px-4 pb-4 pt-0 space-y-3">
                  {result.review_log.map((log) => (
                    <div key={log.round} className={`p-3 rounded-lg border ${log.approved ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {log.approved ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span className={`text-sm font-bold ${log.approved ? 'text-green-400' : 'text-red-400'}`}>
                          Round {log.round}: {log.approved ? "Approved" : "Rejected (Sent back for fixes)"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap pl-6">{log.feedback}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
              {/* Left pane: Live Preview */}
              <div className="flex flex-col h-full min-h-[400px]">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1">Live Preview</h3>
                <div className="flex-1 shadow-2xl rounded-xl ring-1 ring-white/10 overflow-hidden">
                  <LivePreview code={result} />
                </div>
              </div>

              {/* Right pane: Code View */}
              <div className="flex flex-col h-full min-h-[400px]">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1">Source Code</h3>
                <div className="flex-1 shadow-2xl rounded-xl ring-1 ring-white/10 overflow-hidden">
                  <CodeView code={result} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
