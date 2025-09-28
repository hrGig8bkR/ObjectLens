import { GoogleGenAI, Modality } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

// For Vite client-side projects, environment variables must be prefixed with VITE_
// and accessed via import.meta.env
const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  // This error will be thrown during the build process if the key is missing,
  // or in the browser console if it's not exposed correctly.
  throw new Error("VITE_API_KEY is not defined. Please check your environment variables.");
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
