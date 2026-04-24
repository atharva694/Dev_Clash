"use client";

import { useState } from "react";
import { AppState, GenerateResponse } from "@/lib/types";
import { PromptInput } from "@/components/PromptInput";
import { LivePreview } from "@/components/LivePreview";
import { CodeView } from "@/components/CodeView";
import { DownloadButton } from "@/components/DownloadButton";
import { Questionnaire } from "@/components/Questionnaire";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { AlertCircle, RefreshCcw, Layers, Save, Download, Sparkles, Zap, Eye, Code2 } from "lucide-react";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [originalPrompt, setOriginalPrompt] = useState<string>("");
  const [previewTab, setPreviewTab] = useState<"visual" | "code">("visual");

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
    <div className="min-h-screen bg-[#0B0F19] text-white flex font-sans overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 ml-64 flex flex-col relative overflow-hidden h-screen">
        {/* Ambient background blurs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <TopBar />

        <main className="flex-1 flex flex-col pt-4 px-8 pb-8 relative z-10 overflow-y-auto">
          {state === "idle" || (state === "loading" && questions.length === 0) ? (
            <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full -mt-20">
              <h1 className="text-[28px] text-slate-300 font-light text-center mb-10 leading-snug">
                Experience the intersection of <span className="text-white font-semibold">intelligence</span> and <span className="text-white font-semibold">aesthetics</span>. Build<br/>
                production-ready interfaces with a single thought.
              </h1>
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
                <div className="bg-[#131825]/80 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 flex flex-col items-center gap-6 shadow-2xl">
                  <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-300 font-medium text-lg">Forging your interface...</p>
                </div>
             </div>
          )}

          {state === "error" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <div className="bg-[#131825]/80 p-8 rounded-[2rem] border border-red-500/30 max-w-lg w-full text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-100 mb-2">Generation Failed</h2>
                <p className="text-slate-400 mb-6">{error}</p>
                <button
                  onClick={() => setState("idle")}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-white/10"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Try Again
                </button>
              </div>
            </div>
          )}

          {state === "success" && result && (
            <div className="flex-1 flex flex-col h-full animate-in fade-in duration-500 pt-4">
              {/* Header Area */}
              <div className="flex justify-between items-end mb-6">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                     <Layers className="w-3.5 h-3.5 text-slate-500" />
                     Workspace / Project Alpha
                  </div>
                  <h2 className="text-4xl font-bold text-white tracking-tight">Interface <span className="text-slate-500 font-normal">Forge</span></h2>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setState("idle")}
                    className="px-6 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Draft
                  </button>
                  <div className="flex gap-2 items-center">
                    <DownloadButton code={result} />
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 flex gap-6 min-h-0">
                {/* Left Panel */}
                <div className="w-[340px] flex flex-col gap-6 shrink-0">
                  <div className="p-6 rounded-2xl border border-white/5 bg-[#131825] shadow-xl">
                     <h3 className="flex items-center gap-2 text-xs font-bold text-violet-400 uppercase tracking-wider mb-4">
                        <Sparkles className="w-4 h-4" />
                        Intelligence Input
                     </h3>
                     <textarea 
                       className="w-full h-40 bg-[#0B0F19] border border-white/5 rounded-xl p-4 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 resize-none mb-4 shadow-inner"
                       placeholder="Refine your component..."
                     />
                     <button className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.4)]">
                       <Zap className="w-4 h-4" />
                       Re-Forge Component
                     </button>
                  </div>

                  <div className="p-6 rounded-2xl border border-white/5 bg-[#131825] flex-1 shadow-xl">
                     <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-5">Properties</h3>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 font-medium">Framework</span>
                          <span className="text-slate-200 font-semibold bg-white/5 px-3 py-1 rounded-lg">React + Vite</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 font-medium">Styling</span>
                          <span className="text-slate-200 font-semibold bg-white/5 px-3 py-1 rounded-lg">Tailwind CSS</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 font-medium">Iterations</span>
                          <span className="text-slate-200 font-semibold bg-white/5 px-3 py-1 rounded-lg">{result.total_iterations}</span>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Right Panel (Preview) */}
                <div className="flex-1 rounded-2xl border border-white/5 bg-[#0B0F19] shadow-2xl flex flex-col overflow-hidden relative">
                  {/* Tabs header */}
                  <div className="h-14 border-b border-white/5 bg-[#131825]/80 flex items-center justify-between px-4 z-20 relative">
                     <div className="flex gap-2 bg-black/20 p-1 rounded-xl">
                        <button 
                          onClick={() => setPreviewTab("visual")}
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                            previewTab === "visual" 
                              ? "bg-[#1f2937] text-white shadow-sm border border-white/5" 
                              : "text-slate-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <Eye className="w-4 h-4" />
                          Visual Preview
                        </button>
                        <button 
                           onClick={() => setPreviewTab("code")}
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                            previewTab === "code" 
                              ? "bg-[#1f2937] text-white shadow-sm border border-white/5" 
                              : "text-slate-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <Code2 className="w-4 h-4" />
                          Source Code
                        </button>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right leading-tight">
                           Viewport<br/>
                           <span className="text-slate-300">1440px</span>
                        </div>
                        <div className="flex gap-1.5 pl-2 border-l border-white/10">
                           <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                           <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                           <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                        </div>
                     </div>
                  </div>
                  
                  <div className="flex-1 relative overflow-hidden bg-[#020617]">
                     {previewTab === "visual" ? (
                       <LivePreview code={result} />
                     ) : (
                       <div className="absolute inset-0 overflow-auto">
                         <CodeView code={result} />
                       </div>
                     )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
