
import { FrequencyOption, EngagementOption } from './types';

export const ACCENT_COLOR = '#FFC947';

export const FREQUENCY_OPTIONS: FrequencyOption[] = ['0', '1–2', '3–5', '6–10', '10+'];
export const ENGAGEMENT_OPTIONS: EngagementOption[] = ['<20 likes', '20–50 likes', '50–100 likes', '100–250 likes', '250+ likes'];

export const TOPIC_OPTIONS = [
  'Hiring / Recruiting',
  'Recruiting Operations',
  'AI & Automation',
  'Product Updates',
  'Industry Insights',
  'Founder Journey',
  'Customer Stories',
  'Fundraising',
  'Leadership & Culture'
];

export const FREQUENCY_MAP: Record<FrequencyOption, number> = {
  '0': 0,
  '1–2': 1.5,
  '3–5': 4,
  '6–10': 8,
  '10+': 12,
};

export const ENGAGEMENT_MAP: Record<EngagementOption, number> = {
  '<20 likes': 10,
  '20–50 likes': 35,
  '50–100 likes': 75,
  '100–250 likes': 175,
  '250+ likes': 300,
};
