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
  userSpecial: number[],
  mode?: string
): { level: number | null; name: string | null; prize: string | null } {
  if (game.code === 'ssq') {
    return checkSSQ(result, userNumbers, userSpecial);
  }
  if (game.code === 'dlt') {
    return checkDLT(result, userNumbers, userSpecial);
  }
  if (game.code === '3d' || game.code === 'pl3') {
    return checkDigit3(result, userNumbers, game.code, mode);
  }
  if (game.code === 'pl5' || game.code === 'seven' || game.code === 'qxc') {
    return checkPositionMatch(result, userNumbers, game.code);
  }
  if (game.code === 'qlc') {
    return checkQLC(result, userNumbers, result.special_numbers?.[0] ?? null);
  }
  if (game.code === 'kl8') {
    return checkKL8(result, userNumbers, mode);
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
  code: string,
  mode?: string
): { level: number | null; name: string | null; prize: string | null } {
  const draw = result.numbers;
  const user = userNumbers;
  const playMode = mode || '直选';

  if (playMode === '直选') {
    if (draw.every((n, i) => n === user[i])) {
      return { level: 1, name: '直选', prize: '1040元' };
    }
    return { level: null, name: null, prize: null };
  }

  if (playMode === '组选三') {
    if (draw.length === 3 && user.length === 3) {
      const drawSorted = [...draw].sort();
      const userSorted = [...user].sort();
      if (drawSorted[0] === drawSorted[1] || drawSorted[1] === drawSorted[2]) {
        if (drawSorted[0] === userSorted[0] && drawSorted[1] === userSorted[1] && drawSorted[2] === userSorted[2]) {
          return { level: 2, name: '组选三', prize: '346元' };
        }
      }
    }
    return { level: null, name: null, prize: null };
  }

  if (playMode === '组选六') {
    if (draw.length === 3 && user.length === 3) {
      const drawSet = new Set(draw);
      const userSet = new Set(user);
      if (drawSet.size === 3 && userSet.size === 3 && drawSet.size === userSet.size && draw.every((n) => userSet.has(n))) {
        return { level: 3, name: '组选六', prize: '173元' };
      }
    }
    return { level: null, name: null, prize: null };
  }

  return { level: null, name: null, prize: null };
}

function checkPositionMatch(
  result: LotteryResult,
  userNumbers: number[],
  code: string
): { level: number | null; name: string | null; prize: string | null } {
  if (code === 'pl5') {
    const matchCount = result.numbers.filter((n, i) => n === userNumbers[i]).length;
    if (matchCount === 5) return { level: 1, name: '一等奖', prize: '100000元' };
    return { level: null, name: null, prize: null };
  }

  if (code === 'seven') {
    const maxConsecutive = longestConsecutiveMatch(result.numbers, userNumbers);
    if (maxConsecutive === 7) return { level: 1, name: '特等奖', prize: '浮动' };
    if (maxConsecutive === 6) return { level: 2, name: '一等奖', prize: '浮动' };
    if (maxConsecutive === 5) return { level: 3, name: '二等奖', prize: '浮动' };
    if (maxConsecutive === 4) return { level: 4, name: '三等奖', prize: '500元' };
    if (maxConsecutive === 3) return { level: 5, name: '四等奖', prize: '20元' };
    if (maxConsecutive === 2) return { level: 6, name: '五等奖', prize: '5元' };
    return { level: null, name: null, prize: null };
  }

  if (code === 'qxc') {
    const maxConsecutive = longestConsecutiveMatch(result.numbers, userNumbers);
    if (maxConsecutive === 7) return { level: 1, name: '一等奖', prize: '浮动' };
    if (maxConsecutive === 6) return { level: 2, name: '二等奖', prize: '浮动' };
    if (maxConsecutive === 5) return { level: 3, name: '三等奖', prize: '浮动' };
    if (maxConsecutive === 4) return { level: 4, name: '四等奖', prize: '500元' };
    if (maxConsecutive === 3) return { level: 5, name: '五等奖', prize: '30元' };
    if (maxConsecutive === 2) return { level: 6, name: '六等奖', prize: '5元' };
    return { level: null, name: null, prize: null };
  }

  return { level: null, name: null, prize: null };
}

function longestConsecutiveMatch(draw: number[], user: number[]): number {
  let max = 0;
  let current = 0;
  for (let i = 0; i < draw.length; i++) {
    if (draw[i] === user[i]) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  }
  return max;
}

function checkQLC(
  result: LotteryResult,
  userNumbers: number[],
  specialNumber: number | null
): { level: number | null; name: string | null; prize: string | null } {
  const basicMatch = result.numbers.filter((n) => userNumbers.includes(n)).length;
  const specialMatch = specialNumber !== null && userNumbers.includes(specialNumber);

  if (basicMatch === 7) return { level: 1, name: '一等奖', prize: '浮动' };
  if (basicMatch === 6 && specialMatch) return { level: 2, name: '二等奖', prize: '浮动' };
  if (basicMatch === 6) return { level: 3, name: '三等奖', prize: '浮动' };
  if (basicMatch === 5 && specialMatch) return { level: 4, name: '四等奖', prize: '200元' };
  if (basicMatch === 5) return { level: 5, name: '五等奖', prize: '50元' };
  if (basicMatch === 4 && specialMatch) return { level: 6, name: '六等奖', prize: '10元' };
  if (basicMatch === 4) return { level: 7, name: '七等奖', prize: '5元' };
  return { level: null, name: null, prize: null };
}

function checkKL8(
  result: LotteryResult,
  userNumbers: number[],
  mode?: string
): { level: number | null; name: string | null; prize: string | null } {
  const pick = mode ? parseInt(mode, 10) : userNumbers.length;
  if (pick < 1 || pick > 10) return { level: null, name: null, prize: null };

  const match = result.numbers.filter((n) => userNumbers.includes(n)).length;
  const rules: Record<number, { match: number; name: string; prize: string }[]> = {
    10: [
      { match: 10, name: '选十中十', prize: '浮动' },
      { match: 9, name: '选十中九', prize: '8000元' },
      { match: 8, name: '选十中八', prize: '800元' },
      { match: 7, name: '选十中七', prize: '80元' },
      { match: 6, name: '选十中六', prize: '5元' },
      { match: 5, name: '选十中五', prize: '3元' },
    ],
    9: [
      { match: 9, name: '选九中九', prize: '300000元' },
      { match: 8, name: '选九中八', prize: '2000元' },
      { match: 7, name: '选九中七', prize: '200元' },
      { match: 6, name: '选九中六', prize: '20元' },
      { match: 5, name: '选九中五', prize: '5元' },
      { match: 4, name: '选九中四', prize: '3元' },
    ],
    8: [
      { match: 8, name: '选八中八', prize: '50000元' },
      { match: 7, name: '选八中七', prize: '800元' },
      { match: 6, name: '选八中六', prize: '100元' },
      { match: 5, name: '选八中五', prize: '10元' },
      { match: 4, name: '选八中四', prize: '3元' },
    ],
    7: [
      { match: 7, name: '选七中七', prize: '10000元' },
      { match: 6, name: '选七中六', prize: '200元' },
      { match: 5, name: '选七中五', prize: '80元' },
      { match: 4, name: '选七中四', prize: '10元' },
      { match: 3, name: '选七中三', prize: '3元' },
    ],
    6: [
      { match: 6, name: '选六中六', prize: '5000元' },
      { match: 5, name: '选六中五', prize: '100元' },
      { match: 4, name: '选六中四', prize: '30元' },
      { match: 3, name: '选六中三', prize: '10元' },
      { match: 2, name: '选六中二', prize: '3元' },
    ],
    5: [
      { match: 5, name: '选五中五', prize: '1000元' },
      { match: 4, name: '选五中四', prize: '50元' },
      { match: 3, name: '选五中三', prize: '10元' },
      { match: 2, name: '选五中二', prize: '3元' },
    ],
    4: [
      { match: 4, name: '选四中四', prize: '100元' },
      { match: 3, name: '选四中三', prize: '20元' },
      { match: 2, name: '选四中二', prize: '3元' },
    ],
    3: [
      { match: 3, name: '选三中三', prize: '53元' },
      { match: 2, name: '选三中二', prize: '3元' },
    ],
    2: [
      { match: 2, name: '选二中二', prize: '19元' },
    ],
    1: [
      { match: 1, name: '选一中一', prize: '4.6元' },
    ],
  };

  const levels = rules[pick] ?? [];
  for (let i = 0; i < levels.length; i++) {
    if (match === levels[i].match) {
      return { level: i + 1, name: levels[i].name, prize: levels[i].prize };
    }
  }

  return { level: null, name: null, prize: null };
}
