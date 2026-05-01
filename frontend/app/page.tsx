"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { PromptInput } from "@/components/PromptInput";
import { ProjectsGallery } from "@/components/ProjectsGallery";
import { LivePreview } from "@/components/LivePreview";
import { CodeView } from "@/components/CodeView";
import { DownloadButton } from "@/components/DownloadButton";
import { GenerateResponse, AppState } from "@/lib/types";
import { ArrowLeft, Wand2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [currentView, setCurrentView] = useState<"generator" | "projects">("generator");
  const [appState, setAppState] = useState<AppState>("idle");
  const [generatedCode, setGeneratedCode] = useState<GenerateResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async (prompt: string) => {
    setAppState("loading");
    setErrorMsg(null);
    setGeneratedCode(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate application. Please ensure the backend server is running.");
      }

      const data: GenerateResponse = await response.json();
      setGeneratedCode(data);
      setAppState("success");
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
      setAppState("error");
    }
  };

  const handleReset = () => {
    setAppState("idle");
    setGeneratedCode(null);
    setErrorMsg(null);
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-50 font-sans selection:bg-cyan-500/30 overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />

      <main className="flex-1 ml-64 flex flex-col min-h-screen relative z-10">
        <TopBar />

        <AnimatePresence mode="wait">
          {currentView === "projects" ? (
            <motion.div
              key="projects"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              <ProjectsGallery />
            </motion.div>
          ) : (
            <motion.div
              key="generator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar"
            >
              <AnimatePresence mode="wait">
                {appState === "idle" || appState === "loading" || appState === "error" ? (
                    <motion.div
                    key="input-view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full -mt-12"
                  >
                    <div className="text-center mb-10">
                      <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="text-5xl md:text-7xl font-black tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-100 to-slate-500 drop-shadow-sm"
                      >
                        What will you <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">build</span> today?
                      </motion.h1>
                      <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                        className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-medium"
                      >
                        Describe your dream application in plain english. Our AI will handle the architecture, design, and code in seconds.
                      </motion.p>
                    </div>

                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                      className="w-full"
                    >
                      <PromptInput onSubmit={handleGenerate} isLoading={appState === "loading"} />
                    </motion.div>

                    {appState === "error" && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center max-w-2xl w-full"
                      >
                        {errorMsg}
                        <button 
                          onClick={handleReset}
                          className="ml-4 underline hover:text-red-300 transition-colors"
                        >
                          Try Again
                        </button>
                      </motion.div>
                    )}
                    
                    {appState === "loading" && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-12 text-center"
                      >
                        <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
                          Nexus AI is architecting your application...
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="result-view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    className="flex-1 flex flex-col h-full"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <button 
                        onClick={handleReset}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5 backdrop-blur-md"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Generator
                      </button>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20 flex items-center gap-2 backdrop-blur-md">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                          Generation Complete
                        </span>
                        <DownloadButton code={generatedCode!} />
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col gap-2 h-full"
                      >
                        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 ml-1">
                          <span className="w-4 h-4 rounded bg-violet-500/20 flex items-center justify-center text-violet-400 text-[10px]">1</span>
                          Live Preview
                        </h3>
                        <div className="flex-1 bg-[#0F172A]/50 border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative group p-1 backdrop-blur-sm">
                          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                          {generatedCode && <LivePreview code={generatedCode} />}
                        </div>
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col gap-2 h-full"
                      >
                        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 ml-1">
                          <span className="w-4 h-4 rounded bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-[10px]">2</span>
                          Source Code
                        </h3>
                        <div className="flex-1 bg-[#0F172A] border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative group p-1 backdrop-blur-sm">
                          {generatedCode && <CodeView code={generatedCode} />}
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

