# Dev_Clash
Repo Belongs to team Dark_Syntax

# Prompt-to-App AI Generator

A web-based tool that uses Google Gemini API to convert natural language prompts into fully functional, live-rendered web applications.

## Features
- **1-Strike Coder-Critic Loop:** Generates code and fixes syntax in a strict pipeline.
- **Live Preview:** Renders the generated HTML/CSS/JS securely in an iframe.
- **Code Viewer:** Syntax-highlighted code editor with copy functionality.
- **Local Download:** Export the generated files (`index.html`, `styles.css`, `script.js`) directly to your machine.

## Setup

1. Install dependencies:
   ```bash
   npm install
   pip install -r backend/requirements.txt
   ```

2. Add your Gemini API Keys:
   Create a `.env.local` file in the root directory and add your keys:
   ```
   GEMINI_API_KEY=your_api_key_here
   GEMINI_API_KEY_2=your_second_key
   ```

3. Run the development servers:
   ```bash
   # Terminal 1
   npm run dev

   # Terminal 2
   cd backend
   uvicorn main:app --reload --port 8000
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Tech Stack
- **Frontend:** Next.js 15 (App Router), Tailwind CSS
- **Backend:** FastAPI, Python
- **AI Integration:** `@google/genai` (Gemini 3.1 Pro Preview / 2.5 Flash)
- **Language:** TypeScript & Python
