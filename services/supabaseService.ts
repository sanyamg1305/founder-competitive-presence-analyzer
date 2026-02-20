
import { createClient } from '@supabase/supabase-js';
import { UserInput, CalculatedData } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const saveAnalysisSession = async (input: UserInput, calculated: CalculatedData) => {
  if (!supabase) {
    console.warn('Supabase not configured. Skipping save.');
    return null;
  }

  const { data, error } = await supabase
    .from('founder_analyses')
    .insert([
      {
        full_name: input.leadInfo.name,
        email: input.leadInfo.email,
        phone: input.leadInfo.phone,
        user_frequency: input.frequency,
        user_engagement: input.engagement,
        user_topics: input.userTopics,
        competitor_topics: input.competitorTopics,
        competitor_data: input.competitors,
        presence_score: Math.round(calculated.finalPresenceScore)
      },
    ]);

  if (error) {
    console.error('Error saving to Supabase:', error);
    throw error;
  }
  return data;
};
