
export type FrequencyOption = '0' | '1–2' | '3–5' | '6–10' | '10+';
export type EngagementOption = '<20 likes' | '20–50 likes' | '50–100 likes' | '100–250 likes' | '250+ likes';

export interface LeadInfo {
  name: string;
  email: string;
  phone: string;
}

export interface Competitor {
  id: string;
  name: string;
  frequency: FrequencyOption;
  engagement: EngagementOption;
}

export interface UserInput {
  frequency: FrequencyOption;
  engagement: EngagementOption;
  userTopics: string[];
  competitorTopics: string[];
  competitors: Competitor[];
  leadInfo: LeadInfo;
}

export interface AIAnalysisResult {
  scoreInsight: string;
  opportunityAreas: string[];
  narrativePositioning: string;
  headlineSuggestions: {
    categoryLeadership: string;
    icpClarity: string;
    boldDifferentiation: string;
  };
}

export interface CalculatedData {
  userFreqScore: number;
  userEngScore: number;
  compAvgFreqScore: number;
  compAvgEngScore: number;
  finalPresenceScore: number;
}
