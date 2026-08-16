import type { LotteryGame, LotteryResult } from '@/types/lottery';

export function formatDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}年${month}月${day}日 ${week} ${hour}:${minute}:${second}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getCategoryName(category: string): string {
  return category === 'welfare' ? '福彩' : '体彩';
}

export function getNumberColor(number: number, game: LotteryGame): string {
  if (game.code === 'ssq') return 'bg-red-600';
  if (game.code === 'dlt') return 'bg-red-600';
  if (game.code === 'qlc') return 'bg-red-600';
  if (game.code === 'kl8') return 'bg-red-600';
  return 'bg-primary';
}

export function getSpecialColor(gameCode: string): string {
  if (gameCode === 'ssq') return 'bg-blue-600';
  if (gameCode === 'dlt') return 'bg-blue-600';
  return 'bg-accent';
}

export function getNumberRange(game: LotteryGame): { max: number; min: number } {
  return {
    min: game.red_min ?? 0,
    max: game.red_max ?? 0,
  };
}

export function getSpecialRange(game: LotteryGame): { max: number; min: number } {
  return {
    min: game.blue_min ?? 0,
    max: game.blue_max ?? 0,
  };
}

export function getResultNumbers(result: LotteryResult): number[] {
  return result.numbers;
}

export function getResultSpecialNumbers(result: LotteryResult): number[] {
  return result.special_numbers;
}

export function parseUserInput(input: string): number[] {
  return input
    .split(/[\s,，]+/)
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n));
}

export function validateNumbers(
  numbers: number[],
  min: number,
  max: number,
  count: number,
  allowDuplicate = false
): string | null {
  if (numbers.length !== count) {
    return `请输入 ${count} 个号码`;
  }
  if (!allowDuplicate && new Set(numbers).size !== count) {
    return '号码不能重复';
  }
  if (numbers.some((n) => n < min || n > max)) {
    return `号码范围应在 ${min} 到 ${max} 之间`;
  }
  return null;
}

export function getQXCNumberRange(index: number): { min: number; max: number } {
  if (index === 6) return { min: 0, max: 14 };
  return { min: 0, max: 9 };
}

export function validateLotteryNumbers(
  game: LotteryGame,
  redInputs: number[],
  blueInputs: number[],
  mode: 'single' | 'complex' | 'dantuo' = 'single',
  danCount: number | null = null
): string | null {
  const redCount = game.red_count ?? 0;
  const blueCount = game.blue_count ?? 0;
  const redMin = game.red_min ?? 0;
  const redMax = game.red_max ?? 0;
  const blueMin = game.blue_min ?? 0;
  const blueMax = game.blue_max ?? 0;
  const allowDuplicate = game.code === '3d' || game.code === 'pl3' || game.code === 'pl5' || game.code === 'qxc' || game.code === 'seven';

  if (game.code === 'qxc') {
    if (redInputs.length !== 7) return '请输入 7 个号码';
    for (let i = 0; i < 7; i++) {
      const { min, max } = getQXCNumberRange(i);
      if (redInputs[i] < min || redInputs[i] > max) {
        return `七星彩第 ${i + 1} 位号码应在 ${min} 到 ${max} 之间`;
      }
    }
    return null;
  }

  if (mode === 'dantuo') {
    const dCount = danCount ?? 1;
    if (redInputs.length < redCount + dCount) {
      return '胆拖号码数量不足';
    }
    const dan = redInputs.slice(0, dCount);
    const tuo = redInputs.slice(dCount);
    if (new Set(dan).size !== dan.length) return '胆码不能重复';
    if (new Set(tuo).size !== tuo.length) return '拖码不能重复';
    if (new Set([...dan, ...tuo]).size !== dan.length + tuo.length) return '胆码和拖码不能重复';
    if (dan.some((n) => n < redMin || n > redMax)) return `胆码范围应在 ${redMin} 到 ${redMax} 之间`;
    if (tuo.some((n) => n < redMin || n > redMax)) return `拖码范围应在 ${redMin} 到 ${redMax} 之间`;
    if (tuo.length < redCount - dCount) return `拖码至少需要 ${redCount - dCount} 个`;
  } else if (mode === 'complex') {
    if (redInputs.length < redCount) return `红球至少选择 ${redCount} 个`;
    if (blueCount > 0 && blueInputs.length < blueCount) return `蓝球至少选择 ${blueCount} 个`;
    if (!allowDuplicate && new Set(redInputs).size !== redInputs.length) return '红球号码不能重复';
    if (!allowDuplicate && blueCount > 0 && new Set(blueInputs).size !== blueInputs.length) return '蓝球号码不能重复';
    if (redInputs.some((n) => n < redMin || n > redMax)) return `红球范围应在 ${redMin} 到 ${redMax} 之间`;
    if (blueCount > 0 && blueInputs.some((n) => n < blueMin || n > blueMax)) return `蓝球范围应在 ${blueMin} 到 ${blueMax} 之间`;
  } else {
    const redError = validateNumbers(redInputs, redMin, redMax, redCount, allowDuplicate);
    if (redError) return redError;
    if (blueCount > 0) {
      const blueError = validateNumbers(blueInputs, blueMin, blueMax, blueCount, false);
      if (blueError) return blueError;
    }
  }

  return null;
}

export function generateIssueRange(game: LotteryGame, result: LotteryResult): string {
  return `第 ${result.issue} 期`;
}
