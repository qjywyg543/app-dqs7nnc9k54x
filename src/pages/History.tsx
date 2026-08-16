import { useEffect, useState } from 'react';
import { usePageView } from '@/hooks/usePageView';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/common/Pagination';
import { getGames, getHistory } from '@/services/lottery';
import type { LotteryGame, LotteryResult } from '@/types/lottery';

const PAGE_SIZE = 20;

export default function History() {
  usePageView();
  const [games, setGames] = useState<LotteryGame[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [history, setHistory] = useState<LotteryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const selectedGame = games.find((g) => g.code === selectedCode);

  useEffect(() => {
    async function load() {
      const data = await getGames();
      setGames(data);
      if (data.length > 0) setSelectedCode(data[0].code);
    }
    void load();
  }, []);

  useEffect(() => {
    if (!selectedCode) return;
    let cancelled = false;
    async function loadHistory() {
      setLoading(true);
      try {
        const data = await getHistory(selectedCode, 100);
        if (!cancelled) {
          setHistory(data);
          setPage(1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [selectedCode]);

  const totalPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedHistory = history.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="min-h-screen px-4 py-6 md:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link to="/">返回首页</Link>
          </Button>
          <h1 className="font-display text-2xl md:text-4xl text-foreground">历史开奖</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>选择彩种</CardTitle>
              <CardDescription>查看该彩种的历史开奖记录（最多近100期）</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedCode} onValueChange={setSelectedCode}>
                <SelectTrigger className="w-full md:w-80">
                  <SelectValue placeholder="请选择彩种" />
                </SelectTrigger>
                <SelectContent>
                  {games.map((game) => (
                    <SelectItem key={game.code} value={game.code}>
                      {game.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{selectedGame?.display_name ?? '开奖'} 历史记录</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <>
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
                                  <span
                                    key={i}
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground"
                                  >
                                    {String(n).padStart(2, '0')}
                                  </span>
                                ))}
                                {item.special_numbers.map((n, i) => (
                                  <span
                                    key={`s-${i}`}
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
                                  >
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
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
