import { GoogleGenAI, Type } from "@google/genai";

const MASTER_PROMPT = `
You are an advanced AI Safety Copilot designed to assist users in potentially dangerous situations.

Your job is to:
- Understand the user's situation from text, voice, scenario, or image
- Analyze the level of risk intelligently
- Identify possible dangers in the environment
- Provide clear, step-by-step safety advice
- Suggest immediate actions
- Decide whether an emergency SOS should be triggered

INPUT:
User Message: "{user_input}"
Scenario (if selected): "{scenario}"
Location (if available): "{location}"
Image Context (if image uploaded): Analyze the image for safety risks such as darkness, isolation, suspicious environment, or lack of people.

INSTRUCTIONS:
- If input is text/voice → analyze meaning and intent
- If scenario is given → simulate the situation
- If image is provided → analyze environment risks
- Combine all inputs for better decision making
- If danger is high → prioritize urgency

OUTPUT FORMAT (STRICT JSON):
{
  "riskLevel": "Low" | "Medium" | "High",
  "reason": "string",
  "observedRisks": ["string"],
  "advice": ["string"],
  "immediateAction": "string",
  "shouldTriggerSOS": boolean
}
`;

export async function analyzeSafety(params: {
  user_input?: string;
  scenario?: string;
  location?: string;
  image?: { data: string; mimeType: string };
}) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  const prompt = MASTER_PROMPT
    .replace("{user_input}", params.user_input || "None")
    .replace("{scenario}", params.scenario || "None")
    .replace("{location}", params.location || "Unknown");

  const contents: any[] = [{ text: prompt }];
  if (params.image) {
    contents.push({
      inlineData: {
        data: params.image.data,
        mimeType: params.image.mimeType,
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: contents.map(c => typeof c === 'string' ? { text: c } : c) },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            reason: { type: Type.STRING },
            observedRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
            advice: { type: Type.ARRAY, items: { type: Type.STRING } },
            immediateAction: { type: Type.STRING },
            shouldTriggerSOS: { type: Type.BOOLEAN }
          },
          required: ["riskLevel", "reason", "observedRisks", "advice", "immediateAction", "shouldTriggerSOS"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
}
