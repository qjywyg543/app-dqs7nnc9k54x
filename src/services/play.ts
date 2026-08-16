import { supabase } from '@/db/supabase';
import type { PlayRecord } from '@/types/lottery';

export async function savePlayRecord(
  gameCode: string,
  issue: string,
  numbers: number[],
  specialNumbers: number[],
  drawTime: string,
  mode: 'single' | 'complex' | 'dantuo' = 'single',
  danCount: number | null = null
): Promise<void> {
  const { error } = await supabase.from('user_play_records').insert({
    game_code: gameCode,
    issue,
    numbers,
    special_numbers: specialNumbers,
    mode,
    dan_count: danCount,
    status: 'pending',
    draw_time: drawTime,
  });

  if (error) {
    console.error('保存模拟试玩记录失败:', error);
    throw new Error(error.message);
  }
}

export async function getPlayRecords(page = 1, pageSize = 20): Promise<{ data: PlayRecord[]; count: number }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('user_play_records')
    .select('*', { count: 'exact' })
    .order('played_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('获取模拟试玩记录失败:', error);
    throw new Error(error.message);
  }

  return { data: (data as PlayRecord[]) ?? [], count: count ?? 0 };
}

export async function updatePendingRecords(): Promise<void> {
  const { error } = await supabase.rpc('check_pending_play_records');
  if (error) {
    console.error('更新模拟试玩记录失败:', error);
  }
}