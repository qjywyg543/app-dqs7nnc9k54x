import { useEffect, useMemo, useState } from 'react';
import { usePageView } from '@/hooks/usePageView';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/common/Pagination';
import { getGameByCode, getHistory } from '@/services/lottery';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { LotteryGame, LotteryResult } from '@/types/lottery';

const PAGE_SIZE = 20;

function generateChartColors(count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const hue = (i * 360) / Math.max(count, 1);
    return `hsl(${hue}, 70%, 50%)`;
  });
}

export default function GameDetail() {
  usePageView();
  const { code } = useParams<{ code: string }>();
  const [game, setGame] = useState<LotteryGame | null>(null);
  const [history, setHistory] = useState<LotteryResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [trendRange, setTrendRange] = useState(30);

  useEffect(() => {
    if (!code) return;
    const gameCode = code;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const [gameData, historyData] = await Promise.all([
          getGameByCode(gameCode),
          getHistory(gameCode, 100),
        ]);
        if (!cancelled) {
          setGame(gameData);
          setHistory(historyData);
          setPage(1);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const latest = history[0];

  const totalPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedHistory = history.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const trendData = useMemo(() => {
    const slice = history.slice(0, trendRange).reverse();
    return slice.map((item, index) => {
      const entry: Record<string, number | string> = {
        name: item.issue.slice(-3),
        index: index + 1,
      };
      const allNumbers = [...item.numbers, ...item.special_numbers];
      allNumbers.forEach((num, i) => {
        entry[`n${i + 1}`] = num;
      });
      return entry;
    });
  }, [history, trendRange]);

  const lineCount = game ? Math.min((game.red_count ?? 0) + (game.blue_count ?? 0), 12) : 0;
  const chartColors = generateChartColors(Math.max(lineCount, 1));

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!game) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-lg text-muted-foreground">未找到该彩种</p>
        <Button asChild className="mt-4">
          <Link to="/">返回首页</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 md:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link to="/">返回首页</Link>
          </Button>
          <h1 className="font-display text-2xl md:text-4xl text-foreground">{game.display_name}</h1>
          <Badge variant="secondary">{game.draw_days}</Badge>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid gap-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">最新开奖</CardTitle>
              {latest && <CardDescription>第 {latest.issue} 期 {latest.draw_date}</CardDescription>}
            </CardHeader>
            <CardContent>
              {latest ? (
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  {latest.numbers.map((num, i) => (
                    <Ball key={i} number={num} type="red" />
                  ))}
                  {latest.special_numbers.map((num, i) => (
                    <Ball key={`s-${i}`} number={num} type="blue" />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">暂无数据</p>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="rules" className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:w-auto">
              <TabsTrigger value="rules">玩法说明</TabsTrigger>
              <TabsTrigger value="history">历史开奖</TabsTrigger>
              <TabsTrigger value="trend">走势图</TabsTrigger>
            </TabsList>

            <TabsContent value="rules" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>玩法说明</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{game.rules}</p>
                  <div>
                    <h3 className="mb-3 font-semibold">号码范围</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-accent/10 px-3 py-1 text-sm text-accent-foreground">
                        {game.code === 'qxc'
                          ? '前6位：0-9，第7位：0-14'
                          : `${game.red_min}-${game.red_max}`}
                      </span>
                      {game.blue_count && game.blue_count > 0 && (
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary-foreground">
                          {game.blue_min}-{game.blue_max}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-3 font-semibold">奖级设置</h3>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>奖级</TableHead>
                            <TableHead>中奖条件</TableHead>
                            <TableHead>奖金</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {game.prize_levels?.map((level) => (
                            <TableRow key={level.level}>
                              <TableCell className="font-medium">{level.name}</TableCell>
                              <TableCell>{level.condition}</TableCell>
                              <TableCell>{level.prize}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>历史开奖</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="w-full max-w-full overflow-x-auto bg-card">
                    <Table className="[&>div]:max-w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">期号</TableHead>
                          <TableHead className="whitespace-nowrap">开奖日期</TableHead>
                          <TableHead className="whitespace-nowrap">开奖号码</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedHistory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="whitespace-nowrap font-medium">{item.issue}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.draw_date}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex flex-wrap gap-1">
                                {item.numbers.map((n, i) => (
                                  <span key={i} className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground">
                                    {String(n).padStart(2, '0')}
                                  </span>
                                ))}
                                {item.special_numbers.map((n, i) => (
                                  <span key={`s-${i}`} className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                    {String(n).padStart(2, '0')}
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Pagination
                    page={safePage}
                    totalPages={totalPages}
                    total={history.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPage}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trend" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <CardTitle>开奖走势图</CardTitle>
                    <div className="flex gap-2">
                      {[10, 30, 100].map((r) => (
                        <Button
                          key={r}
                          size="sm"
                          variant={trendRange === r ? 'default' : 'outline'}
                          onClick={() => setTrendRange(r)}
                        >
                          近{r}期
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full min-w-0 overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                        <defs>
                          {Array.from({ length: lineCount }).map((_, i) => (
                            <linearGradient key={i} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={chartColors[i]} stopOpacity={0.35} />
                              <stop offset="95%" stopColor={chartColors[i]} stopOpacity={0} />
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 8,
                            fontSize: 13,
                          }}
                        />
                        <Legend wrapperStyle={{ paddingTop: 8, fontSize: 13 }} />
                        {Array.from({ length: lineCount }).map((_, i) => (
                          <Area
                            key={i}
                            type="monotone"
                            dataKey={`n${i + 1}`}
                            name={`第${i + 1}个号码`}
                            stroke={chartColors[i]}
                            fill={`url(#grad-${i})`}
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: chartColors[i] }}
                            activeDot={{ r: 5 }}
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

function Ball({ number, type }: { number: number; type: 'red' | 'blue' }) {
  return (
    <span
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-base font-bold shadow-card md:h-12 md:w-12 md:text-lg ${
        type === 'red'
          ? 'bg-accent text-accent-foreground'
          : 'bg-primary text-primary-foreground'
      }`}
    >
      {String(number).padStart(2, '0')}
    </span>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
      <Skeleton className="mb-6 h-10 w-40" />
      <Skeleton className="mb-6 h-32 w-full rounded-lg" />
      <Skeleton className="h-80 w-full rounded-lg" />
    </div>
  );
}
