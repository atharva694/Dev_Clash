"use client";

import { GenerateResponse } from "@/lib/types";
import { Download } from "lucide-react";
import { motion } from "framer-motion";

interface DownloadButtonProps {
  code: GenerateResponse;
}

export function DownloadButton({ code }: DownloadButtonProps) {
  const handleDownload = () => {
    // Generate standard HTML template linking to CSS/JS
    const htmlWithLinks = code.html_content.replace(
      '</head>', 
      '  <link rel="stylesheet" href="styles.css">\n</head>'
    ).replace(
      '</body>',
      '  <script src="script.js"></script>\n</body>'
    );

    const files = [
      { name: "index.html", content: htmlWithLinks, type: "text/html" },
      { name: "styles.css", content: code.css_content, type: "text/css" },
      { name: "script.js", content: code.js_content, type: "text/javascript" },
    ];

    files.forEach((file) => {
      const blob = new Blob([file.content], { type: file.type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(16,185,129,0.4)" }}
      whileTap={{ scale: 0.95 }}
      onClick={handleDownload}
      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/30 cursor-pointer text-sm"
    >
      <Download className="w-4 h-4" />
      Download Files
    </motion.button>
  );
}
