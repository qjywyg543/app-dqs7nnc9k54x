import { supabase } from '@/db/supabase';
import type {
  ColdNumber,
  GameWithLatest,
  HotNumber,
  LotteryGame,
  LotteryResult,
  NumberFrequency,
} from '@/types/lottery';

export async function getGames(): Promise<LotteryGame[]> {
  const { data, error } = await supabase
    .from('lottery_games')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getGameByCode(code: string): Promise<LotteryGame | null> {
  const { data, error } = await supabase
    .from('lottery_games')
    .select('*')
    .eq('code', code)
    .single();

  if (error) return null;
  return data;
}

export async function getLatestResult(code: string): Promise<LotteryResult | null> {
  const { data, error } = await supabase
    .from('lottery_results')
    .select('*')
    .eq('game_code', code)
    .order('draw_date', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
}

export async function getGamesWithLatest(): Promise<GameWithLatest[]> {
  const games = await getGames();
  const results = await Promise.all(
    games.map(async (game) => {
      const latest = await getLatestResult(game.code);
      return { game, latest };
    })
  );
  return results;
}

export async function getHistory(code: string, limit = 100): Promise<LotteryResult[]> {
  const { data, error } = await supabase
    .from('lottery_results')
    .select('*')
    .eq('game_code', code)
    .order('draw_date', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getHistoryByDateRange(
  code: string,
  startDate: string,
  endDate: string
): Promise<LotteryResult[]> {
  const { data, error } = await supabase
    .from('lottery_results')
    .select('*')
    .eq('game_code', code)
    .gte('draw_date', startDate)
    .lte('draw_date', endDate)
    .order('draw_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export function getAllNumbers(results: LotteryResult[]): number[] {
  return results.flatMap((r) => r.numbers);
}

export function getAllSpecialNumbers(results: LotteryResult[]): number[] {
  return results.flatMap((r) => r.special_numbers);
}

export function calculateHotNumbers(results: LotteryResult[], maxNumber: number): HotNumber[] {
  const allNumbers = getAllNumbers(results);
  const counts: Record<number, number> = {};

  for (let i = 1; i <= maxNumber; i++) {
    counts[i] = 0;
  }

  for (const num of allNumbers) {
    if (num >= 1 && num <= maxNumber) {
      counts[num] = (counts[num] ?? 0) + 1;
    }
  }

  return Object.entries(counts)
    .map(([number, count]) => ({ number: Number(number), count }))
    .sort((a, b) => b.count - a.count || a.number - b.number);
}

export function calculateColdNumbers(results: LotteryResult[], maxNumber: number): ColdNumber[] {
  const counts: Record<number, number> = {};

  for (let i = 1; i <= maxNumber; i++) {
    counts[i] = 0;
  }

  for (let index = 0; index < results.length; index++) {
    for (const num of results[index].numbers) {
      if (num >= 1 && num <= maxNumber) {
        counts[num] = index + 1;
      }
    }
  }

  return Object.entries(counts)
    .map(([number, missing]) => ({ number: Number(number), missing }))
    .sort((a, b) => b.missing - a.missing || a.number - b.number);
}

export function calculateFrequency(results: LotteryResult[], maxNumber: number): NumberFrequency[] {
  return calculateHotNumbers(results, maxNumber);
}

export function calculateMissing(results: LotteryResult[], maxNumber: number): ColdNumber[] {
  return calculateColdNumbers(results, maxNumber);
}

export function generateRandomNumbers(
  redCount: number,
  redMin: number,
  redMax: number,
  blueCount: number,
  blueMin: number,
  blueMax: number,
  allowDuplicate = false,
  gameCode?: string
): { numbers: number[]; special: number[] } {
  if (gameCode === 'qxc') {
    const numbers = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10));
    numbers.push(Math.floor(Math.random() * 15));
    return { numbers, special: [] };
  }

  const numbers = allowDuplicate
    ? Array.from({ length: redCount }, () => redMin + Math.floor(Math.random() * (redMax - redMin + 1)))
    : pickUnique(redMin, redMax, redCount);

  const special = allowDuplicate
    ? Array.from({ length: blueCount }, () => blueMin + Math.floor(Math.random() * (blueMax - blueMin + 1)))
    : pickUnique(blueMin, blueMax, blueCount);

  return { numbers, special };
}

function pickUnique(min: number, max: number, count: number): number[] {
  const pool = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).sort((a, b) => a - b);
}

export function checkWin(
  game: LotteryGame,
  result: LotteryResult,
  userNumbers: number[],
  userSpecial: number[]
): { level: number | null; name: string | null; prize: string | null } {
  if (game.code === 'ssq') {
    return checkSSQ(result, userNumbers, userSpecial);
  }
  if (game.code === 'dlt') {
    return checkDLT(result, userNumbers, userSpecial);
  }
  if (game.code === '3d' || game.code === 'pl3') {
    return checkDigit3(result, userNumbers, game.code);
  }
  if (game.code === 'pl5' || game.code === 'seven' || game.code === 'qxc') {
    return checkPositionMatch(result, userNumbers, game.code);
  }
  if (game.code === 'qlc') {
    return checkQLC(result, userNumbers);
  }
  if (game.code === 'kl8') {
    return checkKL8(result, userNumbers);
  }
  return { level: null, name: null, prize: null };
}

function checkSSQ(
  result: LotteryResult,
  userNumbers: number[],
  userBlue: number[]
): { level: number | null; name: string | null; prize: string | null } {
  const redMatch = result.numbers.filter((n) => userNumbers.includes(n)).length;
  const blueMatch = result.special_numbers.length > 0 && userBlue.includes(result.special_numbers[0]);

  if (redMatch === 6 && blueMatch) return { level: 1, name: '一等奖', prize: '浮动' };
  if (redMatch === 6) return { level: 2, name: '二等奖', prize: '浮动' };
  if (redMatch === 5 && blueMatch) return { level: 3, name: '三等奖', prize: '3000元' };
  if (redMatch === 5 || (redMatch === 4 && blueMatch)) return { level: 4, name: '四等奖', prize: '200元' };
  if (redMatch === 4 || (redMatch === 3 && blueMatch)) return { level: 5, name: '五等奖', prize: '10元' };
  if ((redMatch === 2 && blueMatch) || blueMatch) return { level: 6, name: '六等奖', prize: '5元' };
  return { level: null, name: null, prize: null };
}

function checkDLT(
  result: LotteryResult,
  userNumbers: number[],
  userSpecial: number[]
): { level: number | null; name: string | null; prize: string | null } {
  const frontMatch = result.numbers.filter((n) => userNumbers.includes(n)).length;
  const backMatch = result.special_numbers.filter((n) => userSpecial.includes(n)).length;

  if (frontMatch === 5 && backMatch === 2) return { level: 1, name: '一等奖', prize: '浮动' };
  if (frontMatch === 5 && backMatch === 1) return { level: 2, name: '二等奖', prize: '浮动' };
  if (frontMatch === 5 || (frontMatch === 4 && backMatch === 2)) return { level: 3, name: '三等奖', prize: '10000元' };
  if (frontMatch === 4 && backMatch === 1) return { level: 4, name: '四等奖', prize: '3000元' };
  if (frontMatch === 4 || (frontMatch === 3 && backMatch === 2)) return { level: 5, name: '五等奖', prize: '300元' };
  if (frontMatch === 3 && backMatch === 1) return { level: 6, name: '六等奖', prize: '200元' };
  if (frontMatch === 3 || (frontMatch === 2 && backMatch === 2) || (frontMatch === 1 && backMatch === 2)) return { level: 7, name: '七等奖', prize: '100元' };
  if (frontMatch === 2 || (frontMatch === 0 && backMatch === 2) || (frontMatch === 1 && backMatch === 1)) return { level: 8, name: '八等奖', prize: '15元' };
  if ((frontMatch === 2 && backMatch === 1) || (frontMatch === 0 && backMatch === 1) || (frontMatch === 1 && backMatch === 0)) return { level: 9, name: '九等奖', prize: '5元' };
  return { level: null, name: null, prize: null };
}

function checkDigit3(
  result: LotteryResult,
  userNumbers: number[],
  code: string
): { level: number | null; name: string | null; prize: string | null } {
  const match = result.numbers.every((n, i) => n === userNumbers[i]);
  if (match) {
    return code === '3d'
      ? { level: 1, name: '直选', prize: '1040元' }
      : { level: 1, name: '直选', prize: '1040元' };
  }
  return { level: null, name: null, prize: null };
}

function checkPositionMatch(
  result: LotteryResult,
  userNumbers: number[],
  code: string
): { level: number | null; name: string | null; prize: string | null } {
  const matchCount = result.numbers.filter((n, i) => n === userNumbers[i]).length;

  if (code === 'pl5') {
    if (matchCount === 5) return { level: 1, name: '一等奖', prize: '100000元' };
    return { level: null, name: null, prize: null };
  }

  if (code === 'seven') {
    if (matchCount === 7) return { level: 1, name: '特等奖', prize: '浮动' };
    if (matchCount === 6) return { level: 2, name: '一等奖', prize: '浮动' };
    if (matchCount === 5) return { level: 3, name: '二等奖', prize: '浮动' };
    if (matchCount === 4) return { level: 4, name: '三等奖', prize: '浮动' };
    if (matchCount === 3) return { level: 5, name: '四等奖', prize: '500元' };
    if (matchCount === 2) return { level: 6, name: '五等奖', prize: '20元' };
    if (matchCount === 1) return { level: 7, name: '六等奖', prize: '5元' };
    return { level: null, name: null, prize: null };
  }

  if (code === 'qxc') {
    if (matchCount === 7) return { level: 1, name: '一等奖', prize: '浮动' };
    if (matchCount === 6) return { level: 2, name: '二等奖', prize: '浮动' };
    if (matchCount === 5) return { level: 3, name: '三等奖', prize: '浮动' };
    if (matchCount === 4) return { level: 4, name: '四等奖', prize: '500元' };
    if (matchCount === 3) return { level: 5, name: '五等奖', prize: '30元' };

    const hasConsecutiveTwo = result.numbers.some((n, i) => {
      if (i >= result.numbers.length - 1) return false;
      return n === userNumbers[i] && result.numbers[i + 1] === userNumbers[i + 1];
    });
    if (hasConsecutiveTwo) return { level: 6, name: '六等奖', prize: '5元' };

    return { level: null, name: null, prize: null };
  }

  return { level: null, name: null, prize: null };
}

function checkQLC(
  result: LotteryResult,
  userNumbers: number[]
): { level: number | null; name: string | null; prize: string | null } {
  const match = result.numbers.filter((n) => userNumbers.includes(n)).length;
  if (match === 7) return { level: 1, name: '一等奖', prize: '浮动' };
  if (match === 6) return { level: 2, name: '二等奖', prize: '浮动' };
  if (match === 5) return { level: 3, name: '三等奖', prize: '浮动' };
  if (match === 4) return { level: 4, name: '四等奖', prize: '200元' };
  if (match === 3) return { level: 5, name: '五等奖', prize: '10元' };
  if (match === 2) return { level: 6, name: '六等奖', prize: '5元' };
  return { level: null, name: null, prize: null };
}

function checkKL8(
  result: LotteryResult,
  userNumbers: number[]
): { level: number | null; name: string | null; prize: string | null } {
  const match = result.numbers.filter((n) => userNumbers.includes(n)).length;
  if (match === 10) return { level: 1, name: '选十中十', prize: '浮动' };
  if (match === 9) return { level: 2, name: '选十中九', prize: '8000元' };
  if (match === 8) return { level: 3, name: '选十中八', prize: '800元' };
  if (match === 7) return { level: 4, name: '选十中七', prize: '80元' };
  if (match === 6) return { level: 5, name: '选十中六', prize: '5元' };
  if (match === 5) return { level: 6, name: '选十中五', prize: '3元' };
  return { level: null, name: null, prize: null };
}
