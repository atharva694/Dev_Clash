"use client";

import { useState } from "react";
import { GenerateResponse } from "@/lib/types";
import { Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="w-full h-full flex flex-col bg-[#020617]/80 backdrop-blur-xl rounded-xl overflow-hidden border border-white/5">
      <div className="flex items-center justify-between bg-[#0B0F19] border-b border-white/5 relative">
        <div className="flex relative">
          {(["html", "css", "js"] as Tab[]).map((tab) => (
            <motion.button
              whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              whileTap={{ scale: 0.98 }}
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-4 text-sm font-bold tracking-wide transition-colors relative z-10 cursor-pointer ${
                activeTab === tab
                  ? "text-cyan-400 bg-white/5"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {activeTab === tab && (
                <motion.div 
                  layoutId="active-tab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-violet-500 shadow-[0_0_15px_rgba(34,211,238,0.6)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              {tab === "html" ? "index.html" : tab === "css" ? "styles.css" : "script.js"}
            </motion.button>
          ))}
        </div>
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.2)" }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopy}
          className="mr-4 px-4 py-2 text-slate-300 hover:text-white bg-white/5 rounded-xl transition-all flex items-center gap-2 text-sm font-medium border border-white/10 cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          title="Copy code"
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.div
                key="check"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="flex items-center gap-1 text-emerald-400"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
      <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-transparent">
        <AnimatePresence mode="wait">
          <motion.pre 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="font-mono text-sm leading-relaxed text-slate-300"
          >
            <code>{contentMap[activeTab]}</code>
          </motion.pre>
        </AnimatePresence>
      </div>
    </div>
  );
}
