export interface GenerateRequest {
  prompt: string;
}

export interface ReviewLog {
  round: number;
  approved: boolean;
  feedback: string;
}

export interface GenerateResponse {
  html_content: string;
  css_content: string;
  js_content: string;
  optimized_prompt?: string;
  review_log?: ReviewLog[];
  total_iterations?: number;
}

export type AppState = 'idle' | 'clarifying' | 'loading' | 'success' | 'error';
