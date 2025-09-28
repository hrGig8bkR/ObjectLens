import { GoogleGenAI, Modality } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

// Fix: Use process.env.API_KEY to get the API key as required by the coding guidelines. This also resolves the TypeScript error regarding 'import.meta.env'.
const apiKey = process.env.API_KEY;

if (!apiKey) {
  throw new Error("API_KEY is not defined. Please check your environment variables.");
}

const ai = new GoogleGenAI({ apiKey });

const base64ToInlineData = (base64String: string, mimeType: string) => {
  const base64Data = base64String.split(',')[1];
  return {
    inlineData: {
      data: base64Data,
      mimeType: mimeType,
    },
  };
};

export const generateProductImage = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
  try {
    const imagePart = base64ToInlineData(base64Image, mimeType);
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [imagePart, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes = part.inlineData.data;
        const imageMimeType = part.inlineData.mimeType;
        return `data:${imageMimeType};base64,${base64ImageBytes}`;
      }
    }

    throw new Error("No image was generated in the response.");

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate image.");
  }
};
