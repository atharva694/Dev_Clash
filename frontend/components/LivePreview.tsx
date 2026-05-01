"use client";

import { useMemo } from "react";
import { GenerateResponse } from "@/lib/types";

interface LivePreviewProps {
  code: GenerateResponse;
}

export function LivePreview({ code }: LivePreviewProps) {
  const srcDoc = useMemo(() => {
    // We inject Tailwind via CDN if not present
    const hasTailwind = code.html_content.includes("cdn.tailwindcss.com");
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          ${!hasTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
          <style>
            ${code.css_content}
          </style>
        </head>
        <body>
          ${code.html_content}
          <script>
            try {
              ${code.js_content}
            } catch(e) {
              console.error("Generated JS Error:", e);
            }
          </script>
        </body>
      </html>
    `;
  }, [code]);

  return (
    <div className="w-full h-full bg-white rounded-xl overflow-hidden shadow-inner border border-slate-700/50 flex flex-col">
      <div className="bg-slate-800 border-b border-slate-700 p-2 flex items-center gap-2">
        <div className="flex gap-1.5 ml-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="flex-1 text-center text-xs text-slate-400 font-mono bg-slate-900 rounded py-1 mx-4 border border-slate-700">
          live-preview.local
        </div>
      </div>
      <iframe
        className="w-full flex-1 bg-white"
        srcDoc={srcDoc}
        sandbox="allow-scripts allow-modals allow-forms allow-popups"
        title="Live Preview"
      />
    </div>
  );
}
