import { useEffect, useState } from 'react';
import { usePageView } from '@/hooks/usePageView';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import PageMeta from '@/components/common/PageMeta';
import { getGamesWithLatest } from '@/services/lottery';
import type { GameWithLatest, LotteryCategory } from '@/types/lottery';

const CATEGORY_META: Record<string, { title: string; icon: string; desc: string }> = {
  welfare: {
    title: '福利彩票',
    icon: '福',
    desc: '双色球、福彩3D、七乐彩、快乐8 等福彩玩法最新开奖结果',
  },
  sports: {
    title: '体育彩票',
    icon: '体',
    desc: '大乐透、排列3、排列5、七星彩、7位数 等体彩玩法最新开奖结果',
  },
};

export default function CategoryPage() {
  usePageView();
  const { category } = useParams<{ category: string }>();
  const [games, setGames] = useState<GameWithLatest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const meta = category ? CATEGORY_META[category] : undefined;
  const valid = category === 'welfare' || category === 'sports';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const data = await getGamesWithLatest();
        if (!cancelled) setGames(data.filter((g) => g.game.category === category));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (valid) void load();
    return () => {
      cancelled = true;
    };
  }, [category, valid]);

  if (!valid || !meta) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-lg text-muted-foreground">未找到该分类</p>
        <Button asChild className="mt-4">
          <Link to="/">返回首页</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`${meta.title}开奖结果 - 中国彩票开奖大厅`}
        description={meta.desc}
      />
      <div className="px-4 py-6 md:py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link to="/">
                <ArrowLeft className="mr-1 h-4 w-4" />
                返回首页
              </Link>
            </Button>
          </div>

          <div className="mb-8 flex items-center gap-4 rounded-2xl border border-border bg-gradient-to-br from-card to-muted p-6 shadow-card">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary font-display text-3xl text-primary-foreground shadow-card">
              {meta.icon}
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-2xl md:text-4xl text-foreground">{meta.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">{meta.desc}</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>
          )}

          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))
            ) : (
              games.map((item, index) => (
                <motion.div
                  key={item.game.code}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <GameCard item={item} />
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function GameCard({ item }: { item: GameWithLatest }) {
  const { game, latest } = item;
  return (
    <Card className="overflow-hidden border-border bg-gradient-card transition-shadow hover:shadow-hover">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg font-bold text-foreground">{game.display_name}</CardTitle>
          {latest && (
            <Badge variant="secondary" className="shrink-0">
              第 {latest.issue} 期
            </Badge>
          )}
        </div>
        {latest && <p className="text-xs text-muted-foreground">开奖日期 {latest.draw_date}</p>}
      </CardHeader>
      <CardContent>
        {latest ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {latest.numbers.map((num, i) => (
                <Ball key={`r-${i}`} number={num} type="red" />
              ))}
              {latest.special_numbers.map((num, i) => (
                <Ball key={`b-${i}`} number={num} type="blue" />
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {game.draw_days} {game.draw_time}
              </span>
              <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                <Link to={`/game/${game.code}`}>
                  查看详情
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">暂无开奖数据</div>
        )}
      </CardContent>
    </Card>
  );
}

function Ball({ number, type }: { number: number; type: 'red' | 'blue' }) {
  return (
    <span
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold shadow-card ${
        type === 'red'
          ? 'bg-accent text-accent-foreground'
          : 'bg-primary text-primary-foreground'
      }`}
    >
      {String(number).padStart(2, '0')}
    </span>
  );
}