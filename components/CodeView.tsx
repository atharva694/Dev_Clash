"use client";

import { useState } from "react";
import { GenerateResponse } from "@/lib/types";
import { Copy, Check } from "lucide-react";

interface CodeViewProps {
  code: GenerateResponse;
}

type Tab = "html" | "css" | "js";

export function CodeView({ code }: CodeViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("html");
  const [copied, setCopied] = useState(false);

  const contentMap = {
    html: code.html_content,
    css: code.css_content,
    js: code.js_content,
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(contentMap[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e] rounded-xl overflow-hidden border border-slate-700">
      <div className="flex items-center justify-between bg-[#2d2d2d] border-b border-black/20">
        <div className="flex">
          {(["html", "css", "js"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium transition-colors border-r border-black/20 ${
                activeTab === tab
                  ? "bg-[#1e1e1e] text-blue-400 border-t-2 border-t-blue-500"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#252525] border-t-2 border-t-transparent"
              }`}
            >
              {tab === "html" ? "index.html" : tab === "css" ? "styles.css" : "script.js"}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopy}
          className="mr-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors flex items-center gap-2 text-xs"
          title="Copy code"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        <pre className="font-mono text-sm leading-relaxed text-slate-300">
          <code>{contentMap[activeTab]}</code>
        </pre>
      </div>
    </div>
  );
}
