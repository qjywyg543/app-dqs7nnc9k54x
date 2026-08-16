import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageView } from '@/hooks/usePageView';
import { copyToClipboard } from '@/lib/clipboard';
import { motion } from 'motion/react';
import { ChevronRight, Gamepad2, LogIn, LogOut, User, Store, MessageCircle, MapPin, ShieldAlert, Copy, Sparkles, Trophy, Clock, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { WeChatIcon } from '@/components/icons/WeChatIcon';
import PageMeta from '@/components/common/PageMeta';
import { getGames } from '@/services/lottery';
import type { LotteryGame } from '@/types/lottery';

const WECHAT_ID = 'clx543';
const STORE_ADDRESS = '无锡市锡山区锡北镇向阳新村63号';
const QR_CODE_URL = 'https://miaoda-conversation-file.cdn.bcebos.com/user-dqic9bb9h6gw/app-dqs7nnc9k54x/20260816/md_20260816_112631_7.png';

const WEEKDAY_MAP: Record<string, number> = {
  '日': 0,
  '周日': 0,
  '一': 1,
  '周一': 1,
  '二': 2,
  '周二': 2,
  '三': 3,
  '周三': 3,
  '四': 4,
  '周四': 4,
  '五': 5,
  '周五': 5,
  '六': 6,
  '周六': 6,
};

function parseDrawDays(drawDays: string): number[] {
  if (drawDays.includes('每日')) return [0, 1, 2, 3, 4, 5, 6];
  const days: number[] = [];
  const parts = drawDays.replace(/[、,\s]/g, ' ').split(' ').filter(Boolean);
  for (const part of parts) {
    const day = WEEKDAY_MAP[part];
    if (day !== undefined && !days.includes(day)) {
      days.push(day);
    }
  }
  return days.sort((a, b) => a - b);
}

function getNextDrawDate(drawDays: string, drawTime: string): Date {
  const days = parseDrawDays(drawDays);
  const [hour, minute] = drawTime.split(':').map(Number);
  const now = new Date();

  for (let i = 0; i < 8; i++) {
    const candidate = new Date(now);
    candidate.setHours(hour, minute, 0, 0);
    candidate.setDate(now.getDate() + i);
    if (i === 0 && candidate <= now) {
      continue;
    }
    if (days.includes(candidate.getDay())) {
      return candidate;
    }
  }

  return new Date(now.getTime() + 86400000);
}

function CountdownUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="countdown-digit">{value}</span>
      <span className="mt-1 text-[10px] text-white/70 md:text-xs">{label}</span>
    </div>
  );
}

function Countdown({ targetDate }: { targetDate: Date }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const diff = Math.max(0, targetDate.getTime() - now.getTime());
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return (
    <div className="flex items-center gap-2">
      <CountdownUnit value={String(hours).padStart(2, '0')} label="时" />
      <span className="text-lg font-bold text-white/80">:</span>
      <CountdownUnit value={String(minutes).padStart(2, '0')} label="分" />
      <span className="text-lg font-bold text-white/80">:</span>
      <CountdownUnit value={String(seconds).padStart(2, '0')} label="秒" />
    </div>
  );
}

function TodayDraw({ games }: { games: LotteryGame[] }) {
  const upcoming = useMemo(() => {
    if (games.length === 0) return null;
    const candidates = games
      .filter((g): g is LotteryGame & { draw_days: string; draw_time: string } => Boolean(g.draw_days && g.draw_time))
      .map((g) => ({
        game: g,
        date: getNextDrawDate(g.draw_days, g.draw_time),
      }));
    candidates.sort((a, b) => a.date.getTime() - b.date.getTime());
    return candidates[0] ?? null;
  }, [games]);

  if (!upcoming) return null;

  return (
    <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm md:mt-6 md:flex-row md:justify-center md:px-6 md:py-4">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-white/80" />
        <span className="text-sm font-medium text-white/90">距离 {upcoming.game.display_name} 开奖还有</span>
      </div>
      <Countdown targetDate={upcoming.date} />
    </div>
  );
}

function QuickGameCard({ game }: { game: LotteryGame }) {
  return (
    <Link
      to={`/game/${game.code}`}
      className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-card"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Trophy className="h-5 w-5" />
      </span>
      <span className="text-sm font-medium text-foreground">{game.display_name}</span>
      <span className="text-xs text-muted-foreground">{game.draw_days}</span>
    </Link>
  );
}

export default function Home() {
  usePageView();
  const { user, profile, signOut } = useAuth();
  const [games, setGames] = useState<LotteryGame[]>([]);

  useEffect(() => {
    getGames()
      .then(setGames)
      .catch(() => setGames([]));
  }, []);

  function copyWechat() {
    void copyToClipboard(WECHAT_ID, '微信号已复制');
  }

  function openWechat() {
    window.location.href = 'weixin://';
  }

  return (
    <>
      <PageMeta
        title="中国彩票开奖大厅 - 福彩体彩实时开奖"
        description="提供双色球、大乐透、福彩3D、排列3、排列5、七乐彩、快乐8、七星彩、7位数等彩种的最新开奖结果、历史开奖、走势分析和预测推荐。"
      />
      <div className="flex flex-col px-4 py-4 md:py-6">
        <div className="mx-auto w-full max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative mb-5 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary to-red-900 p-5 text-center shadow-card md:p-8"
          >
            <div className="banner-glow absolute inset-0 pointer-events-none" />
            <div className="relative z-10">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90 backdrop-blur-sm">
                <Sparkles className="h-3 w-3" />
                <span>实时开奖 · 历史查询 · 走势分析 · 预测推荐</span>
              </div>
              <h1 className="font-display text-2xl text-white drop-shadow md:text-5xl">中国彩票开奖大厅</h1>
              <p className="mx-auto mt-2 max-w-xl text-xs text-white/80 md:text-sm">
                汇聚福彩、体彩最新开奖结果，千问智体大数据分析，助力选号
              </p>

              <TodayDraw games={games} />

              <div className="mt-4 flex flex-col items-stretch justify-center gap-2 md:mt-6 md:flex-row md:items-center">
                <Link
                  to="/play"
                  className="group flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary shadow-lg transition-all hover:bg-white/90 md:justify-start"
                >
                  <Gamepad2 className="h-4 w-4" />
                  模拟试玩
                  <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <div className="grid grid-cols-3 gap-2">
                  <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link to="/prediction">预测推荐</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-white/10 text-white hover:bg-white/20">
                    <Link to="/category/welfare">福彩开奖</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-white/10 text-white hover:bg-white/20">
                    <Link to="/category/sports">体彩开奖</Link>
                  </Button>
                </div>

                {user ? (
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="group flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 md:justify-start"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                      <User className="h-3 w-3" />
                    </span>
                    <span className="max-w-[100px] truncate">{profile?.email?.split('@')[0] ?? '用户'}</span>
                    <LogOut className="h-3 w-3 text-white/70" />
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="group flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 md:justify-start"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                      <LogIn className="h-3 w-3" />
                    </span>
                    登录 / 注册
                    <ChevronRight className="h-3 w-3 text-white/70 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {games.length > 0 && (
              <Card className="mb-5 overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <History className="h-4 w-4 text-primary" />
                    热门彩种
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
                    {games.map((game) => (
                      <QuickGameCard key={game.code} game={game} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="mb-5 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Store className="h-4 w-4 text-primary" />
                  实体彩票代销店
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{STORE_ADDRESS}</span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-2 text-sm">
                      <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>微信：{WECHAT_ID}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="h-8 gap-1 bg-accent text-xs text-accent-foreground hover:bg-accent/90" onClick={copyWechat}>
                        <Copy className="mr-1 h-3 w-3" />
                        复制
                      </Button>
                      <Button size="sm" className="h-8 gap-1 bg-primary text-xs text-primary-foreground hover:bg-primary/90" onClick={openWechat}>
                        <WeChatIcon className="h-3.5 w-3.5" />
                        打开微信
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">本店持有中国福利彩票、中国体育彩票官方代销证，诚信经营，欢迎到店交流。</p>
                  <Button asChild size="sm" className="h-7 text-xs">
                    <Link to="/contact">查看资质与二维码</Link>
                  </Button>
                </div>
                <Link to="/contact" className="flex items-center justify-center rounded-lg border border-border bg-muted p-2 transition hover:opacity-90">
                  <img src={QR_CODE_URL} alt="店主微信二维码" className="h-20 w-20 object-contain" />
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          <Card className="mb-5 border-destructive/30 bg-destructive/5">
            <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <p className="font-semibold text-destructive">谨防线上购彩诈骗</p>
                  <p className="text-sm text-muted-foreground">国家禁止互联网销售彩票，请认准实体代销网点，确认实体店主身份，核实出票信息。</p>
                </div>
              </div>
              <Button asChild variant="destructive" size="sm" className="shrink-0">
                <Link to="/contact">查看实体店主认证</Link>
              </Button>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>数据来源于中国福彩网、中国体彩网及地方体彩网，仅供参考</p>
            <p className="mt-1">理性购彩，量力而行</p>
          </div>
        </div>
      </div>
    </>
  );
}
