import { Code2 } from "lucide-react";

export function Header() {
  return (
    <header className="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-violet-500 to-cyan-400 p-2 rounded-xl shadow-lg">
          <Code2 className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-cyan-300">
            Prompt-to-App
          </h1>
          <p className="text-xs text-slate-400 font-medium">AI Generator</p>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-4 text-sm text-slate-300">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Gemini 2.0 Flash
        </span>
      </div>
    </header>
  );
}
