import { GoogleGenAI, Modality } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

// This is the correct way to access environment variables in a Vite project.
// The variable MUST be prefixed with VITE_ in your Vercel/environment settings.
const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  // This error will be thrown if the key is missing, preventing a broken deployment.
  throw new Error("VITE_API_KEY is not set. Please add it to your environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const base64ToInlineData = (base64String: string, mimeType: string) => {
  // Ensure we only get the data part of the base64 string
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

    // Find the first image part in the response
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
        const base64ImageBytes = part.inlineData.data;
        const imageMimeType = part.inlineData.mimeType;
        return `data:${imageMimeType};base64,${base64ImageBytes}`;
      }
    }

    // If no image part is found, throw an error.
    throw new Error("No image was generated in the response.");

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Pass a more specific error message up to the UI.
    throw new Error("Failed to generate image. The API call failed.");
  }
};
