
import { GoogleGenAI, Type } from "@google/genai";
import { UserInput, AIAnalysisResult, CalculatedData } from "../types";

export const analyzePresence = async (
  input: UserInput,
  calculated: CalculatedData
): Promise<AIAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

  const prompt = `
    Analyze this LinkedIn founder presence data for a "Myntmore" competitor tool.
    
    DATA:
    - Founder Presence Score: ${calculated.finalPresenceScore}/100
    - Founder Frequency: ${input.frequency} posts/month (Numeric weight: ${calculated.userFreqScore})
    - Founder Avg Engagement: ${input.engagement} (Numeric weight: ${calculated.userEngScore})
    - Competitor Avg Frequency weight: ${calculated.compAvgFreqScore}
    - Competitor Avg Engagement weight: ${calculated.compAvgEngScore}
    - Founder Topics: ${input.userTopics.join(', ')}
    - Competitor Topics: ${input.competitorTopics.join(', ')}
    
    TONE:
    Direct, data-driven, slightly urgent, helpful, SaaS-premium.
    
    REQUIRED OUTPUT:
    1. A short insight about the presence score.
    2. 3-4 bullet insights for opportunity areas (frequency gaps, visibility, narrative).
    3. A narrative positioning recommendation (1 paragraph).
    4. 3 headline styles: Category leadership, ICP clarity, and Bold differentiation.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scoreInsight: { type: Type.STRING },
          opportunityAreas: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          narrativePositioning: { type: Type.STRING },
          headlineSuggestions: {
            type: Type.OBJECT,
            properties: {
              categoryLeadership: { type: Type.STRING },
              icpClarity: { type: Type.STRING },
              boldDifferentiation: { type: Type.STRING }
            },
            required: ['categoryLeadership', 'icpClarity', 'boldDifferentiation']
          }
        },
        required: ['scoreInsight', 'opportunityAreas', 'narrativePositioning', 'headlineSuggestions']
      }
    }
  });

  return JSON.parse(response.text);
};
