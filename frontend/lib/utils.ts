export function extractJsonFromMarkdown(text: string): string {
  // Try to find JSON inside markdown fences
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match && match[1]) {
    return match[1];
  }
  return text; // Return as-is if no fences
}

export function parseResponse(text: string): any {
  try {
    const cleanJson = extractJsonFromMarkdown(text);
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Invalid JSON format from AI");
  }
}
