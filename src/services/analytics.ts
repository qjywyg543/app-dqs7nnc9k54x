import { supabase } from '@/db/supabase';

export type AnalyticsEventType = 'page_view' | 'button_click' | 'login' | 'register' | 'play_bet' | 'ai_pick' | 'check_prize';

export async function trackEvent(
  eventType: AnalyticsEventType,
  pagePath?: string,
  eventDetail?: Record<string, unknown>
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from('analytics_events').insert({
      event_type: eventType,
      user_id: session?.user?.id ?? null,
      page_path: pagePath ?? window.location.pathname,
      event_detail: eventDetail ?? {},
    });
  } catch (e) {
    console.error('埋点失败:', e);
  }
}

export interface AnalyticsStats {
  totalPageViews: number;
  todayPageViews: number;
  totalClicks: number;
  todayClicks: number;
  totalUsers: number;
  todayUsers: number;
  totalRegistrations: number;
  todayRegistrations: number;
  totalPlayBets: number;
  todayPlayBets: number;
}

export async function getAnalyticsStats(): Promise<AnalyticsStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: totalPageViews } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'page_view');

  const { count: todayPageViews } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'page_view')
    .gte('created_at', today.toISOString());

  const { count: totalClicks } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'button_click');

  const { count: todayClicks } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'button_click')
    .gte('created_at', today.toISOString());

  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: todayUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());

  const { count: totalRegistrations } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'register');

  const { count: todayRegistrations } = await supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'register')
    .gte('created_at', today.toISOString());

  const { count: totalPlayBets } = await supabase
    .from('user_play_records')
    .select('*', { count: 'exact', head: true });

  const { count: todayPlayBets } = await supabase
    .from('user_play_records')
    .select('*', { count: 'exact', head: true })
    .gte('played_at', today.toISOString());

  return {
    totalPageViews: totalPageViews ?? 0,
    todayPageViews: todayPageViews ?? 0,
    totalClicks: totalClicks ?? 0,
    todayClicks: todayClicks ?? 0,
    totalUsers: totalUsers ?? 0,
    todayUsers: todayUsers ?? 0,
    totalRegistrations: totalRegistrations ?? 0,
    todayRegistrations: todayRegistrations ?? 0,
    totalPlayBets: totalPlayBets ?? 0,
    todayPlayBets: todayPlayBets ?? 0,
  };
}

export async function getAnalyticsEvents(
  eventType?: AnalyticsEventType,
  startDate?: Date,
  endDate?: Date,
  limit = 100
): Promise<Array<{ id: string; event_type: string; page_path: string | null; event_detail: Record<string, unknown> | null; created_at: string }>> {
  let query = supabase
    .from('analytics_events')
    .select('id, event_type, page_path, event_detail, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (eventType) {
    query = query.eq('event_type', eventType);
  }
  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }
  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }

  const { data, error } = await query;
  if (error) {
    console.error('获取埋点数据失败:', error);
    throw new Error(error.message);
  }
  return (data ?? []) as Array<{ id: string; event_type: string; page_path: string | null; event_detail: Record<string, unknown> | null; created_at: string }>;
}

export async function getUsersList(page = 1, pageSize = 20): Promise<{ data: Array<{ id: string; email: string | null; phone: string | null; role: string; created_at: string }>; count: number }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('profiles')
    .select('id, email, phone, role, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('获取用户列表失败:', error);
    throw new Error(error.message);
  }

  return { data: (data ?? []) as Array<{ id: string; email: string | null; phone: string | null; role: string; created_at: string }>, count: count ?? 0 };
}
