"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, Loader2, Code2 } from "lucide-react";

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
      .then(res => res.json())
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
      <div className="flex-1 flex flex-col items-center justify-center -mt-20">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <Code2 className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">No projects yet</h2>
        <p className="text-slate-400">Generate your first app to see it here.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Your Projects</h1>
        <p className="text-slate-400">View and download your previously generated applications.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-[#131825] border border-white/5 rounded-2xl overflow-hidden hover:border-violet-500/50 transition-all group shadow-lg">
            <div className="h-40 bg-[#0B0F19] border-b border-white/5 relative flex items-center justify-center overflow-hidden">
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
                <span className="text-xs px-2 py-1 bg-violet-500/10 text-violet-400 rounded-lg font-medium">App</span>
              </div>
              <div className="flex gap-2">
                <a 
                  href={project.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium text-slate-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Preview
                </a>
                <a 
                  href={project.download_url}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium text-white transition-colors shadow-lg shadow-violet-900/20"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
