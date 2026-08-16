import { useEffect, useMemo, useState } from 'react';
import { usePageView } from '@/hooks/usePageView';
import { copyToClipboard } from '@/lib/clipboard';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getGames,
  getHistory,
  generateRandomNumbers,
  calculateHotNumbers,
  calculateColdNumbers,
} from '@/services/lottery';
import { Brain, History, BarChart3, CheckCircle2, Copy, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import type { ColdNumber, HotNumber, LotteryGame, LotteryResult } from '@/types/lottery';

interface GeneratedPick {
  numbers: number[];
  special: number[];
  tags: string[];
  mode: string;
}

const AI_ALGORITHMS = [
  { id: 'hot', name: '热号追踪', desc: '优先近期高频号码', color: 'bg-red-500/10 text-red-600' },
  { id: 'cold', name: '冷号回补', desc: '关注长期遗漏号码', color: 'bg-blue-500/10 text-blue-600' },
  { id: 'odd-even', name: '奇偶平衡', desc: '按奇偶比例筛选', color: 'bg-purple-500/10 text-purple-600' },
  { id: 'big-small', name: '大小均衡', desc: '按大小比例分布', color: 'bg-orange-500/10 text-orange-600' },
  { id: 'sum', name: '和值范围', desc: '控制号码和值区间', color: 'bg-green-500/10 text-green-600' },
  { id: 'random', name: '随机森林', desc: '多路随机融合', color: 'bg-cyan-500/10 text-cyan-600' },
];

const DIY_METHODS = [
  { id: 'frequency', name: '频率分析法', desc: '优先选取历史高频出现号码' },
  { id: 'missing', name: '遗漏值分析法', desc: '选取遗漏期数大、回补概率高的号码' },
  { id: 'hot-cold', name: '冷热号追踪法', desc: '近30期冷热号按比例组合' },
  { id: 'zone', name: '区间分析法', desc: '均衡覆盖各号码区间' },
  { id: 'sum-value', name: '和值分析法', desc: '符合历史号码和值分布规律' },
  { id: 'span', name: '跨度分析法', desc: '预测符合历史最大-最小跨度规律' },
];

const PLAY_MODES = [
  { id: 'single', name: '单式', desc: '标准注数' },
  { id: 'complex', name: '复式', desc: '多选号码' },
  { id: 'dantuo', name: '胆拖', desc: '胆码+拖码' },
];

export default function Prediction() {
  usePageView();
  const [games, setGames] = useState<LotteryGame[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [history, setHistory] = useState<LotteryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupCount, setGroupCount] = useState(1);
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<string[]>(['hot', 'random']);
  const [selectedDiy, setSelectedDiy] = useState<string[]>(['frequency']);
  const [playMode, setPlayMode] = useState<'single' | 'complex' | 'dantuo'>('single');
  const [complexRed, setComplexRed] = useState<number>(0);
  const [complexBlue, setComplexBlue] = useState<number>(0);
  const [danCount, setDanCount] = useState<number>(1);
  const [tuoCount, setTuoCount] = useState<number>(5);
  const [generated, setGenerated] = useState<GeneratedPick[]>([]);

  const selectedGame = useMemo(
    () => games.find((g) => g.code === selectedCode) ?? null,
    [games, selectedCode]
  );

  useEffect(() => {
    async function load() {
      const data = await getGames();
      setGames(data);
      if (data.length > 0) setSelectedCode(data[0].code);
    }
    void load();
  }, []);

  useEffect(() => {
    if (!selectedGame) return;
    const gameCode = selectedGame.code;
    let cancelled = false;
    async function loadHistory() {
      setLoading(true);
      try {
        const data = await getHistory(gameCode, 50);
        if (!cancelled) setHistory(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [selectedGame]);

  useEffect(() => {
    if (!selectedGame) return;
    const redCount = selectedGame.red_count ?? 0;
    const blueCount = selectedGame.blue_count ?? 0;
    const redMax = selectedGame.red_max ?? redCount;
    const blueMax = selectedGame.blue_max ?? blueCount;
    setComplexRed(Math.min(redCount + 1, redMax));
    setComplexBlue(blueCount > 0 ? Math.min(blueCount + 1, blueMax) : 0);
    setDanCount(Math.min(1, Math.max(0, redCount - 1)));
    setTuoCount(Math.max(redCount - 1, 5));
  }, [selectedGame]);


  const hotNumbers = useMemo(() => {
    if (!selectedGame || !selectedGame.red_max) return [];
    const max = selectedGame.code === 'qxc' ? 14 : selectedGame.red_max;
    return calculateHotNumbers(history, max);
  }, [history, selectedGame]);

  const coldNumbers = useMemo(() => {
    if (!selectedGame || !selectedGame.red_max) return [];
    const max = selectedGame.code === 'qxc' ? 14 : selectedGame.red_max;
    return calculateColdNumbers(history, max);
  }, [history, selectedGame]);

  function ruleLabel(game: LotteryGame) {
    if (game.code === 'qxc') return '前6位(0-9)，第7位(0-14)';
    if (game.blue_count) return `${game.red_count}个红球(${game.red_min}-${game.red_max}) + ${game.blue_count}个蓝球(${game.blue_min}-${game.blue_max})`;
    return `${game.red_count}个数字(${game.red_min}-${game.red_max})`;
  }

  function toggleAlgorithm(id: string) {
    setSelectedAlgorithms((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleDiy(id: string) {
    setSelectedDiy((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function generatePicks() {
    if (!selectedGame) return;
    setLoading(true);
    const picks: GeneratedPick[] = [];

    for (let i = 0; i < groupCount; i++) {
      const pick = generateOnePick(
        selectedGame,
        hotNumbers,
        coldNumbers,
        selectedAlgorithms,
        selectedDiy,
        playMode,
        playMode === 'complex' ? { red: complexRed, blue: complexBlue } : undefined,
        playMode === 'dantuo' ? { dan: danCount, tuo: tuoCount } : undefined
      );
      picks.push(pick);
    }

    setGenerated(picks);
    setLoading(false);
  }

  function copyPick(pick: GeneratedPick) {
    const text = formatPickText(pick);
    void copyToClipboard(text, '号码已复制');
  }

  function copyAll() {
    const text = generated.map((p, i) => `第${i + 1}组：${formatPickText(p)}`).join('\n');
    void copyToClipboard(text, '全部号码已复制');
  }

  function formatPickText(pick: GeneratedPick) {
    const nums = pick.numbers.map((n) => String(n).padStart(2, '0')).join(' ');
    if (pick.special.length === 0) return nums;
    const special = pick.special.map((n) => String(n).padStart(2, '0')).join(' ');
    return `${nums} + ${special}`;
  }

  function playUrl(pick: GeneratedPick) {
    const params = new URLSearchParams();
    params.set('game', selectedCode);
    const redCount = selectedGame?.red_count ?? 0;
    const blueCount = selectedGame?.blue_count ?? 0;
    const numbers = pick.numbers.slice(0, redCount);
    const special = pick.special.slice(0, blueCount);
    params.set('numbers', numbers.join(','));
    if (special.length) params.set('special', special.join(','));
    return `/play?${params.toString()}`;
  }

  return (
    <div className="min-h-screen px-4 py-6 md:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link to="/">返回首页</Link>
          </Button>
          <h1 className="font-display text-2xl md:text-4xl text-foreground">AI智能选号</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <Card className="overflow-hidden border-border bg-gradient-to-br from-card to-muted">
            <CardContent className="p-4 text-center">
              <h2 className="font-display text-xl text-foreground">千问智体智能选号</h2>
              <p className="mx-auto mt-1 max-w-2xl text-xs text-muted-foreground">
                采集历史开奖结果与每日最新开奖数据，由千问智体进行大数据分析，为您推荐选号
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">选择彩票类型</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {games.map((game) => (
                  <button
                    key={game.code}
                    onClick={() => setSelectedCode(game.code)}
                    className={`rounded-lg border p-2 text-left transition-all ${
                      selectedCode === game.code
                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                    type="button"
                  >
                    <p className="text-sm font-semibold text-foreground">{game.display_name}</p>
                    <p className="text-xs text-muted-foreground">{ruleLabel(game)}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedGame && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">选号参数</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-sm font-medium">玩法模式</span>
                    <Tabs value={playMode} onValueChange={(v) => setPlayMode(v as 'single' | 'complex' | 'dantuo')}>
                      <TabsList className="grid w-full grid-cols-3">
                        {PLAY_MODES.map((m) => (
                          <TabsTrigger key={m.id} value={m.id}>
                            {m.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                    <p className="text-xs text-muted-foreground">
                      {PLAY_MODES.find((m) => m.id === playMode)?.desc}
                    </p>
                  </div>

                  {playMode === 'complex' && (
                    <div className="space-y-4 rounded-lg border border-border bg-muted p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">红球个数</span>
                          <span className="text-sm font-bold text-primary">{complexRed} 个</span>
                        </div>
                        <Slider
                          value={[complexRed]}
                          onValueChange={(value) => setComplexRed(value[0])}
                          min={selectedGame.red_count ?? 1}
                          max={selectedGame.red_max ?? 10}
                          step={1}
                        />
                        <p className="text-xs text-muted-foreground">标准 {selectedGame.red_count} 个，选择多选号码</p>
                      </div>
                      {selectedGame.blue_count && (selectedGame.blue_count ?? 0) > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">蓝球个数</span>
                            <span className="text-sm font-bold text-primary">{complexBlue} 个</span>
                          </div>
                          <Slider
                            value={[complexBlue]}
                            onValueChange={(value) => setComplexBlue(value[0])}
                            min={selectedGame.blue_count ?? 1}
                            max={selectedGame.blue_max ?? 10}
                            step={1}
                          />
                          <p className="text-xs text-muted-foreground">标准 {selectedGame.blue_count} 个，选择多选号码</p>
                        </div>
                      )}
                    </div>
                  )}

                  {playMode === 'dantuo' && (
                    <div className="space-y-4 rounded-lg border border-border bg-muted p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">胆码个数</span>
                          <span className="text-sm font-bold text-primary">{danCount} 个</span>
                        </div>
                        <Slider
                          value={[danCount]}
                          onValueChange={(value) => setDanCount(value[0])}
                          min={1}
                          max={Math.max(1, (selectedGame.red_count ?? 1) - 1)}
                          step={1}
                        />
                        <p className="text-xs text-muted-foreground">必中的号码，至少1个</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">拖码个数</span>
                          <span className="text-sm font-bold text-primary">{tuoCount} 个</span>
                        </div>
                        <Slider
                          value={[tuoCount]}
                          onValueChange={(value) => setTuoCount(value[0])}
                          min={Math.max(1, (selectedGame.red_count ?? 1) - danCount)}
                          max={selectedGame.red_max ?? 10}
                          step={1}
                        />
                        <p className="text-xs text-muted-foreground">搭配胆码的号码</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">生成组数</span>
                      <span className="text-sm font-bold text-primary">{groupCount} 组</span>
                    </div>
                    <Slider
                      value={[groupCount]}
                      onValueChange={(value) => setGroupCount(value[0])}
                      min={1}
                      max={10}
                      step={1}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted p-4">
                    <div>
                      <p className="text-sm font-medium">当前彩种</p>
                      <p className="text-xs text-muted-foreground">{selectedGame.display_name}</p>
                    </div>
                    <Badge variant="secondary">{selectedGame.display_name}</Badge>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted p-4">
                    <div>
                      <p className="text-sm font-medium">号码规则</p>
                      <p className="text-xs text-muted-foreground">{ruleLabel(selectedGame)}</p>
                    </div>
                  </div>

                  <Button
                    onClick={generatePicks}
                    disabled={loading}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Brain className="h-5 w-5" />
                    AI智能选号
                  </Button>
                </CardContent>
              </Card>

              {generated.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">AI推荐号码</CardTitle>
                        <CardDescription className="text-xs">基于选中算法生成的号码组合</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={copyAll}>
                        <Copy className="mr-1 h-4 w-4" />
                        复制全部
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {generated.map((pick, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-border bg-muted p-3"
                      >
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-semibold">第 {idx + 1} 组</span>
                            <Badge variant="secondary" className="text-xs">{pick.mode}</Badge>
                            {pick.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-[10px]">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => copyPick(pick)}>
                              <Copy className="mr-1 h-3 w-3" />
                              复制
                            </Button>
                            <Button asChild variant="default" size="sm" className="h-7 px-2 text-xs">
                              <Link to={playUrl(pick)}>
                                <ShoppingCart className="mr-1 h-3 w-3" />
                                模拟试玩
                              </Link>
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {pick.numbers.map((n, i) => (
                            <span
                              key={i}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground"
                            >
                              {String(n).padStart(2, '0')}
                            </span>
                          ))}
                          {pick.special.map((n, i) => (
                            <span
                              key={`s-${i}`}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                            >
                              {String(n).padStart(2, '0')}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Card className="cursor-pointer transition hover:border-primary/50">
                  <CardContent className="p-4">
                    <Link to={`/history?game=${selectedCode}`} className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <History className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">历史记录</p>
                        <p className="text-xs text-muted-foreground">查看选号历史</p>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer transition hover:border-primary/50">
                  <CardContent className="p-4">
                    <Link to={`/game/${selectedCode}`} className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                        <BarChart3 className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">走势分析</p>
                        <p className="text-xs text-muted-foreground">号码走势图表</p>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">AI算法</CardTitle>
                  <CardDescription className="text-xs">选择多种算法组合，提高选号覆盖率</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 md:grid-cols-2">
                    {AI_ALGORITHMS.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-start gap-2 rounded-lg border p-2 transition-all ${
                          selectedAlgorithms.includes(item.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card hover:border-primary/30'
                        }`}
                        onClick={() => toggleAlgorithm(item.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && toggleAlgorithm(item.id)}
                      >
                        <Checkbox
                          checked={selectedAlgorithms.includes(item.id)}
                          onCheckedChange={() => toggleAlgorithm(item.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{item.name}</span>
                            <span className={`rounded px-1.5 py-0 text-[10px] ${item.color}`}>AI</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        {selectedAlgorithms.includes(item.id) && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">DIY方法</CardTitle>
                  <CardDescription className="text-xs">自定义分析方法，与AI算法叠加使用</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 md:grid-cols-2">
                    {DIY_METHODS.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-start gap-2 rounded-lg border p-2 transition-all ${
                          selectedDiy.includes(item.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card hover:border-primary/30'
                        }`}
                        onClick={() => toggleDiy(item.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && toggleDiy(item.id)}
                      >
                        <Checkbox
                          checked={selectedDiy.includes(item.id)}
                          onCheckedChange={() => toggleDiy(item.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{item.name}</span>
                            <span className="rounded bg-muted px-1.5 py-0 text-[10px] text-muted-foreground">DIY</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        {selectedDiy.includes(item.id) && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Separator />

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">数据走势</CardTitle>
                  <CardDescription className="text-xs">热号与冷号分析</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="mb-2 text-sm font-semibold">热号推荐</h3>
                      <NumberGrid numbers={hotNumbers.slice(0, 12)} />
                    </div>
                    <div>
                      <h3 className="mb-2 text-sm font-semibold">冷号遗漏</h3>
                      <NumberGrid numbers={coldNumbers.slice(0, 12)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function NumberGrid({ numbers }: { numbers: HotNumber[] | ColdNumber[] }) {
  if (numbers.length === 0) {
    return <p className="text-muted-foreground">数据不足</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {numbers.map((item) => (
        <div
          key={item.number}
          className="flex flex-col items-center rounded-md border border-border bg-card p-1"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
            {String(item.number).padStart(2, '0')}
          </span>
          <span className="mt-0.5 text-[10px] text-muted-foreground">
            {'count' in item ? `${item.count}次` : `${item.missing}期`}
          </span>
        </div>
      ))}
    </div>
  );
}

function generateOnePick(
  game: LotteryGame,
  hotNumbers: HotNumber[],
  coldNumbers: ColdNumber[],
  algorithms: string[],
  diy: string[],
  mode: 'single' | 'complex' | 'dantuo',
  complex?: { red: number; blue: number },
  dantuo?: { dan: number; tuo: number }
): GeneratedPick {
  const redCount = game.red_count ?? 0;
  const blueCount = game.blue_count ?? 0;
  const redMin = game.red_min ?? 0;
  const redMax = game.red_max ?? 0;
  const blueMin = game.blue_min ?? 0;
  const blueMax = game.blue_max ?? 0;
  const allowDuplicate =
    game.code === '3d' ||
    game.code === 'pl3' ||
    game.code === 'pl5' ||
    game.code === 'qxc' ||
    game.code === 'seven';

  const tags: string[] = [];
  const topHot = hotNumbers.slice(0, 15).map((n) => n.number);
  const topCold = coldNumbers.slice(0, 10).map((n) => n.number);

  if (algorithms.includes('hot') || diy.includes('frequency')) {
    tags.push('热号');
  }
  if (algorithms.includes('cold') || diy.includes('missing')) {
    tags.push('冷号');
  }
  if (algorithms.includes('odd-even') || diy.includes('hot-cold')) {
    tags.push('奇偶');
  }
  if (algorithms.includes('random') || algorithms.length === 0) {
    tags.push('智能');
  }

  const modeLabel = mode === 'single' ? '单式' : mode === 'complex' ? '复式' : '胆拖';

  if (game.code === 'qxc') {
    const numbers = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10));
    numbers.push(Math.floor(Math.random() * 15));
    return { numbers, special: [], tags: tags.slice(0, 2), mode: modeLabel };
  }

  let numbers: number[] = [];
  let special: number[] = [];

  if (mode === 'single') {
    const base = generateRandomNumbers(redCount, redMin, redMax, blueCount, blueMin, blueMax, allowDuplicate, game.code);
    numbers = base.numbers;
    special = base.special;
  } else if (mode === 'complex') {
    const complexRedCount = Math.max(redCount, complex?.red ?? redCount + 1);
    const complexBlueCount = Math.max(blueCount, complex?.blue ?? blueCount + 1);
    const base = generateRandomNumbers(complexRedCount, redMin, redMax, complexBlueCount, blueMin, blueMax, allowDuplicate, game.code);
    numbers = base.numbers;
    special = base.special;
  } else {
    const danCnt = Math.max(1, Math.min(dantuo?.dan ?? 1, redCount - 1));
    const tuoCnt = Math.max(redCount - danCnt, dantuo?.tuo ?? 5);
    const dan = generateRandomNumbers(danCnt, redMin, redMax, 0, 0, 0, false, game.code).numbers;
    const tuo = pickUniqueFromRange(redMin, redMax, tuoCnt, dan);
    numbers = [...dan, ...tuo];
    if (blueCount > 0) {
      special = generateRandomNumbers(blueCount, blueMin, blueMax, 0, 0, 0, false, game.code).numbers;
    }
  }

  if ((algorithms.includes('hot') || diy.includes('frequency')) && topHot.length > 0) {
    const blendCount = Math.min(3, numbers.length);
    for (let i = 0; i < blendCount; i++) {
      const idx = Math.floor(Math.random() * numbers.length);
      const hot = topHot[Math.floor(Math.random() * topHot.length)];
      if (hot !== undefined && (!allowDuplicate || !numbers.includes(hot))) {
        numbers[idx] = hot;
      }
    }
  }

  if ((algorithms.includes('cold') || diy.includes('missing')) && topCold.length > 0) {
    const blendCount = Math.min(2, numbers.length);
    for (let i = 0; i < blendCount; i++) {
      const idx = Math.floor(Math.random() * numbers.length);
      const cold = topCold[Math.floor(Math.random() * topCold.length)];
      if (cold !== undefined && (!allowDuplicate || !numbers.includes(cold))) {
        numbers[idx] = cold;
      }
    }
  }

  if (!allowDuplicate && mode !== 'dantuo') {
    numbers = Array.from(new Set(numbers));
    while (numbers.length < (mode === 'single' ? redCount : numbers.length)) {
      const n = redMin + Math.floor(Math.random() * (redMax - redMin + 1));
      if (!numbers.includes(n)) numbers.push(n);
    }
    numbers.sort((a, b) => a - b);
  }

  if (!tags.length) tags.push('智能');

  return { numbers, special, tags: tags.slice(0, 3), mode: modeLabel };
}

function pickUniqueFromRange(min: number, max: number, count: number, exclude: number[]): number[] {
  const pool = Array.from({ length: max - min + 1 }, (_, i) => min + i).filter((n) => !exclude.includes(n));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
