"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, Loader2, Code2 } from "lucide-react";
import { motion } from "framer-motion";

interface Project {
  id: string;
  url: string;
  download_url: string;
}

export function ProjectsGallery() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then(async res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch projects: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        setProjects(data.projects || []);
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
        <p className="text-slate-400">Loading projects...</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 flex flex-col items-center justify-center -mt-20"
      >
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <Code2 className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">No projects yet</h2>
        <p className="text-slate-400">Generate your first app to see it here.</p>
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Your Projects</h1>
        <p className="text-slate-400">View and download your previously generated applications.</p>
      </div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {projects.map((project) => (
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
            key={project.id} 
            className="bg-[#0B0F19]/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300 group shadow-xl hover:shadow-[0_10px_40px_-10px_rgba(34,211,238,0.3)] cursor-pointer"
          >
            <div className="h-40 bg-[#020617] border-b border-white/5 relative flex items-center justify-center overflow-hidden">
              <iframe 
                src={project.url} 
                className="w-full h-full pointer-events-none scale-75 origin-top-left absolute top-0 left-0" 
                style={{ width: '133%', height: '133%' }}
              />
              <div className="absolute inset-0 bg-transparent group-hover:bg-black/10 transition-colors pointer-events-none" />
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white truncate pr-2">Project {project.id}</h3>
                <span className="text-xs px-2 py-1 bg-violet-500/10 text-violet-400 rounded-lg font-medium border border-violet-500/20">App</span>
              </div>
              <div className="flex gap-2">
                <motion.a 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href={project.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-sm font-semibold text-slate-200 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  Preview
                </motion.a>
                <motion.a 
                  whileHover={{ scale: 1.05, boxShadow: "0px 0px 15px rgba(124,58,237,0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  href={project.download_url}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-all shadow-lg shadow-violet-900/30 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download
                </motion.a>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
