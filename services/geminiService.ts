
import { GoogleGenAI } from "@google/genai";
import { PacePlan, WeatherInfo } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getRaceStrategy = async (plan: PacePlan): Promise<string> => {
  const ai = getAI();
  
  const targetTimeStr = `${Math.floor(plan.targetTimeSeconds / 3600)}h ${Math.floor((plan.targetTimeSeconds % 3600) / 60)}m`;
  const paceStr = `${Math.floor(plan.averagePaceSecondsPerKm / 60)}:${Math.floor(plan.averagePaceSecondsPerKm % 60).toString().padStart(2, '0')} min/km`;
  
  const prompt = `Act as an expert marathon coach for Pace Buddy.
I am running a ${plan.type === 'custom' ? plan.distanceKm + 'km race' : plan.type} with a target time of ${targetTimeStr}.
This requires a steady pace of ${paceStr}.
My hydration strategy is every ${plan.hydrationIntervalKm}km and fueling is every ${plan.gelIntervalKm}km.

Provide a concise, high-impact race strategy (max 200 words) including:
1. Start strategy
2. Middle management
3. Late race strategy
4. Final kick advice.
Keep the tone encouraging and professional. Do not use markdown headers, just plain text with line breaks.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });

    return response.text || "Could not retrieve strategy.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const getWeatherByLocation = async (lat: number, lng: number): Promise<WeatherInfo> => {
  const ai = getAI();
  const prompt = `Provide the current weather for a runner at location ${lat}, ${lng}. 
  Include: 
  - Approximate Temperature in Celsius 
  - Current condition (e.g. Sunny, Rain, Cloudy)
  - A very brief advice for a runner (e.g. "Stay hydrated, it's hot").
  
  Return ONLY a plain text summary.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "Weather data unavailable";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .filter((c: any) => c.web)
      .map((c: any) => ({
        title: c.web.title,
        uri: c.web.uri,
      }));

    // Simple parsing logic for the response
    const tempMatch = text.match(/(-?\d+)\s?°?C/);
    const temp = tempMatch ? tempMatch[0] : "--°C";
    
    return {
      temp,
      condition: "Current Stats",
      description: text,
      sources: sources.slice(0, 2),
    };
  } catch (error) {
    console.error("Weather fetch failed:", error);
    return {
      temp: "--",
      condition: "Error",
      description: "Could not fetch real-time weather.",
      sources: [],
    };
  }
};
