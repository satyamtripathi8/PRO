/**
 * Frontend Feature Flags (EPIC 0)
 * Read from Vite env vars. Default true if not set.
 */

function flag(key: string, defaultVal = true): boolean {
  const val = import.meta.env[key];
  if (val === undefined || val === '') return defaultVal;
  return val.toLowerCase() !== 'false' && val !== '0';
}

export const FEATURES = {
  BEHAVIOR_AI:    flag('VITE_ENABLE_BEHAVIOR_AI',    true),
  ANALYTICS_PAGE: flag('VITE_ENABLE_ANALYTICS_PAGE', true),
  ADMIN_PANEL:    flag('VITE_ENABLE_ADMIN_PANEL',    true),
  AI_COACH:       flag('VITE_ENABLE_AI_COACH',       true),
  LEADERBOARD:    flag('VITE_ENABLE_LEADERBOARD',    true),
} as const;

export type FeatureName = keyof typeof FEATURES;
