import { createClient } from 'npm:@supabase/supabase-js@2.103.1';

const GAMES = [
  { code: 'ssq', name: 'ssq' },
  { code: '3d', name: '3d' },
  { code: 'qlc', name: 'qlc' },
  { code: 'kl8', name: 'kl8' },
];

const SPORTS_TYPES: Record<string, string> = {
  dlt: 'lo',
  pl3: 'p3',
  pl5: 'p5',
  qxc: 's7',
  seven: 'p7',
};

const WELFARE_API = 'https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice';
const SPORTS_BASE = 'https://www.js-lottery.com/Lottery/_ListData';

interface WelfareResult {
  code: string;
  date: string;
  red: string;
  blue?: string;
  red1?: string;
}

interface SportsResult {
  issue: string;
  date: string;
  numbers: string;
}

async function fetchWelfare(name: string): Promise<WelfareResult[]> {
  const url = `${WELFARE_API}?name=${name}&issueCount=30&issueStart=&issueEnd=&dayStart=&dayEnd=&pageNo=1&pageSize=30`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  if (!response.ok) {
    throw new Error(`福彩接口请求失败: ${response.status}`);
  }
  const data = await response.json();
  return data.result ?? [];
}

async function fetchSports(itemType: string): Promise<SportsResult[]> {
  const results: SportsResult[] = [];
  for (let page = 1; page <= 3; page++) {
    const url = `${SPORTS_BASE}?itemType=${itemType}&pageindex=${page}&size=10`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    if (!response.ok) {
      throw new Error(`体彩接口请求失败: ${response.status}`);
    }
    const html = await response.text();
    const rows = parseHtmlRows(html);
    results.push(...rows);
  }
  return results;
}

function parseHtmlRows(html: string): SportsResult[] {
  const rows: SportsResult[] = [];
  const regex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const rowHtml = match[1];
    const cells: string[] = [];
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push(cellMatch[1].replace(/<[^>]+>/g, '').trim());
    }
    if (cells.length >= 3 && /^\d{4}-\d{2}-\d{2}$/.test(cells[0]) && /^\d+$/.test(cells[1])) {
      rows.push({ date: cells[0], issue: cells[1], numbers: cells[2] });
    }
  }
  return rows;
}

function parseWelfareNumbers(item: WelfareResult, code: string): { numbers: number[]; special: number[] } {
  const red = item.red || item.red1 || '';
  const numbers = red.split(',').map((n) => Number(n.trim())).filter((n) => !Number.isNaN(n));
  const special = (item.blue || '')
    .split(',')
    .map((n) => Number(n.trim()))
    .filter((n) => !Number.isNaN(n));

  if (code === 'kl8') return { numbers, special: [] };
  if (code === '3d') return { numbers, special: [] };
  if (code === 'qlc') return { numbers, special };
  return { numbers, special };
}

function parseSportsNumbers(item: SportsResult, code: string): { numbers: number[]; special: number[] } {
  const nums = item.numbers.split(/\s+/).map((n) => Number(n.trim())).filter((n) => !Number.isNaN(n));
  if (code === 'dlt') return { numbers: nums.slice(0, 5), special: nums.slice(5) };
  return { numbers: nums, special: [] };
}

function cleanDate(dateStr: string): string {
  return dateStr.replace(/\([^)]*\)/g, '').trim();
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const inserted: string[] = [];
  const failed: string[] = [];

  try {
    for (const game of GAMES) {
      try {
        const results = await fetchWelfare(game.name);
        for (const item of results) {
          const { numbers, special } = parseWelfareNumbers(item, game.code);
          const { error } = await supabase.from('lottery_results').upsert({
            game_code: game.code,
            issue: item.code,
            draw_date: cleanDate(item.date),
            numbers,
            special_numbers: special,
          }, { onConflict: 'game_code,issue' });
          if (error) throw error;
          inserted.push(`${game.code}-${item.code}`);
        }
      } catch (e) {
        failed.push(`${game.code}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    for (const [code, itemType] of Object.entries(SPORTS_TYPES)) {
      try {
        const results = await fetchSports(itemType);
        for (const item of results) {
          const { numbers, special } = parseSportsNumbers(item, code);
          const { error } = await supabase.from('lottery_results').upsert({
            game_code: code,
            issue: item.issue,
            draw_date: item.date,
            numbers,
            special_numbers: special,
          }, { onConflict: 'game_code,issue' });
          if (error) throw error;
          inserted.push(`${code}-${item.issue}`);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : JSON.stringify(e);
        failed.push(`${code}: ${message}`);
      }
    }

    try {
      await supabase.rpc('check_pending_play_records');
    } catch (e) {
      const message = e instanceof Error ? e.message : JSON.stringify(e);
      failed.push(`check_pending_play_records: ${message}`);
    }

    return new Response(
      JSON.stringify({ success: true, inserted: inserted.length, failed }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
