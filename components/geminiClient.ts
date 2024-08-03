import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(API_KEY);

export const geminiVisionModel = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

export async function analyzeImage(imageData: string) {
  try {
    const result = await geminiVisionModel.generateContent([
      "Analyze this image and describe what you see. Focus on important objects, people, text, and any potential obstacles or hazards.",
      { inlineData: { data: imageData, mimeType: "image/jpeg" } },
    ]);

    return result.response.text();
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw error;
  }
}