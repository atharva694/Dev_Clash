"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, Loader2, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

interface HistoryItem {
  id: string;
  url: string;
  download_url: string;
  prompt?: string;
  timestamp?: number;
}

export function HistoryGallery() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then(async res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch history: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        setHistory(data.projects || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center -mt-20">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-4" />
        <p className="text-slate-400">Loading conversation history...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 flex flex-col items-center justify-center -mt-20"
      >
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">No history yet</h2>
        <p className="text-slate-400">Your generated applications and prompts will appear here.</p>
      </motion.div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
      <div className="mb-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Conversation History</h1>
        <p className="text-slate-400">Review your past prompts and their corresponding generated apps.</p>
      </div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-4xl mx-auto flex flex-col gap-8"
      >
        {history.map((item) => (
          <motion.div 
            variants={itemVariants}
            key={item.id} 
            className="flex flex-col gap-4"
          >
            {/* User Prompt Bubble */}
            <div className="flex justify-end">
              <div className="bg-violet-600 text-white p-4 rounded-2xl rounded-tr-sm max-w-[85%] shadow-lg">
                <p className="text-sm font-medium whitespace-pre-wrap">{item.prompt || "Generated Application"}</p>
                {item.timestamp && (
                  <span className="text-[10px] text-violet-200 mt-2 block opacity-70">
                    {new Date(item.timestamp * 1000).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* AI Output Bubble */}
            <div className="flex justify-start">
              <div className="bg-[#0B0F19]/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl w-full max-w-[85%]">
                <div className="h-64 bg-[#020617] border-b border-white/5 relative flex items-center justify-center overflow-hidden group">
                  <iframe 
                    src={item.url} 
                    className="w-full h-full pointer-events-none scale-75 origin-top-left absolute top-0 left-0" 
                    style={{ width: '133%', height: '133%' }}
                    title={`Preview of ${item.id}`}
                  />
                  <div className="absolute inset-0 bg-transparent group-hover:bg-black/10 transition-colors pointer-events-none" />
                </div>
                <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg font-medium border border-cyan-500/20 text-xs">
                      App Generated
                    </span>
                    <span className="text-slate-500">ID: {item.id}</span>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <motion.a 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={item.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-sm font-semibold text-slate-200 transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Preview
                    </motion.a>
                    <motion.a 
                      whileHover={{ scale: 1.05, boxShadow: "0px 0px 15px rgba(124,58,237,0.5)" }}
                      whileTap={{ scale: 0.95 }}
                      href={item.download_url}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-all shadow-lg shadow-violet-900/30 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </motion.a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
