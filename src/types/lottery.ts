export type LotteryCategory = 'welfare' | 'sports';

export interface LotteryGame {
  id: string;
  category: LotteryCategory;
  code: string;
  name: string;
  display_name: string;
  sort_order: number;
  red_count: number | null;
  red_min: number | null;
  red_max: number | null;
  blue_count: number | null;
  blue_min: number | null;
  blue_max: number | null;
  rules: string | null;
  prize_levels: PrizeLevel[] | null;
  draw_days: string | null;
  draw_time: string | null;
}

export interface PrizeLevel {
  level: number;
  name: string;
  condition: string;
  prize: string;
}

export interface LotteryResult {
  id: string;
  game_code: string;
  issue: string;
  draw_date: string;
  numbers: number[];
  special_numbers: number[];
  sales?: string | null;
  pool?: string | null;
  details?: Record<string, unknown> | null;
}

export interface GameWithLatest {
  game: LotteryGame;
  latest: LotteryResult | null;
}

export interface HotNumber {
  number: number;
  count: number;
}

export interface ColdNumber {
  number: number;
  missing: number;
}

export interface NumberFrequency {
  number: number;
  count: number;
}

export interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface PlayRecord {
  id: string;
  user_id: string;
  game_code: string;
  issue: string;
  numbers: number[];
  special_numbers: number[];
  mode: 'single' | 'complex' | 'dantuo';
  dan_count: number | null;
  status: 'pending' | 'won' | 'lost';
  draw_time: string | null;
  win_level: number | null;
  win_name: string | null;
  played_at: string;
}
