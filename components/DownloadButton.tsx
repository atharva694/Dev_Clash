"use client";

import { GenerateResponse } from "@/lib/types";
import { Download } from "lucide-react";

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
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/20"
    >
      <Download className="w-4 h-4" />
      Download Files
    </button>
  );
}
