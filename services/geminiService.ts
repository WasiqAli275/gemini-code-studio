import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Attachment, ModelType } from "../types";

// Initialize the client.
// Note: We use the `process.env.API_KEY` as strictly required by the instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are an expert Senior Software Engineer and Technical Lead. 
Your goal is to assist users with complex coding tasks, file analysis, and architectural decisions.
You have access to files provided by the user. Always analyze the provided code/text files thoroughly before answering.
If the user asks about ZIP files, explain that while you receive the *contents* of files directly, this interface extracts them for you to read.
Prioritize clean, modern, and performant code solutions. Use Markdown for all code blocks.
`;

export const sendMessageToGemini = async (
  prompt: string,
  attachments: Attachment[],
  model: ModelType,
  history: { role: string; parts: { text: string }[] }[] = []
): Promise<string> => {
  try {
    const parts: any[] = [];

    // Process attachments to build context
    // We wrap text-based files in a clear delimiter format so the model understands filenames and content.
    for (const file of attachments) {
      if (file.isText) {
        parts.push({
          text: `\n\n--- START OF FILE: ${file.name} ---\n${file.content}\n--- END OF FILE: ${file.name} ---\n\n`
        });
      } else {
        // Handle images or other binary formats if supported
        // Removing the data:image/... prefix for the API if present
        const base64Data = file.content.split(',')[1] || file.content;
        parts.push({
          inlineData: {
            mimeType: file.type,
            data: base64Data
          }
        });
      }
    }

    // Add the user's text prompt
    if (prompt.trim()) {
      parts.push({ text: prompt });
    }

    // Since we are building a simple "one-shot" chat wrapper for this demo to support file context easily per message,
    // we will construct the request using generateContent.
    // For a full chat history implementation, we would append the history to the contents array.
    
    // Construct the full history for the API
    const contents = history.map(h => ({
      role: h.role,
      parts: h.parts
    }));

    // Add the current message
    contents.push({
      role: 'user',
      parts: parts
    });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // Using a reasonable token limit for coding tasks
        maxOutputTokens: 8192, 
      }
    });

    return response.text || "No response generated.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to communicate with Gemini.");
  }
};
