import type { LotteryGame } from '@/types/lottery';

const DAY_MAP: Record<string, number> = {
  '周一': 1,
  '周二': 2,
  '周三': 3,
  '周四': 4,
  '周五': 5,
  '周六': 6,
  '周日': 0,
  '周天': 0,
  '每天': -1,
};

export function getNextIssue(issue: string): string {
  const num = Number(issue);
  if (!Number.isNaN(num)) {
    return String(num + 1).padStart(issue.length, '0');
  }
  return issue;
}

export function calculateNextDrawTime(game: LotteryGame, latestDrawDate?: string): string {
  const drawDays = game.draw_days;
  const drawTime = game.draw_time;
  if (!drawDays || !drawTime) return '待公布';

  const timeMatch = drawTime.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return '待公布';

  const [hour, minute] = [Number(timeMatch[1]), Number(timeMatch[2])];

  const baseDate = latestDrawDate ? new Date(`${latestDrawDate}T00:00:00`) : new Date();
  // Start searching from the day after the latest draw date
  let current = new Date(baseDate);
  current.setDate(current.getDate() + 1);
  current.setHours(hour, minute, 0, 0);

  if (drawDays.includes('每天')) {
    return formatDateTime(current);
  }

  const targetDays = Object.entries(DAY_MAP)
    .filter(([name]) => drawDays.includes(name))
    .map(([, day]) => day);

  if (targetDays.length === 0) return '待公布';

  // Find the next matching day within 14 days
  for (let i = 0; i < 14; i++) {
    const candidate = new Date(current);
    candidate.setDate(current.getDate() + i);
    if (targetDays.includes(candidate.getDay())) {
      return formatDateTime(candidate);
    }
  }

  return '待公布';
}

function formatDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}
