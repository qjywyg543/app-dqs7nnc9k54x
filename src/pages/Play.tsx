import { useEffect, useMemo, useState } from 'react';
import { usePageView } from '@/hooks/usePageView';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pagination } from '@/components/common/Pagination';
import { LotteryNumberInput } from '@/components/common/LotteryNumberInput';
import { useAuth } from '@/contexts/AuthContext';
import { getGames, getLatestResult, generateRandomNumbers } from '@/services/lottery';
import { getPlayRecords, savePlayRecord, updatePendingRecords } from '@/services/play';
import { parseUserInput, validateLotteryNumbers } from '@/lib/lottery-utils';
import { getNextIssue, calculateNextDrawTime } from '@/lib/draw-time';
import type { LotteryGame, LotteryResult, PlayRecord } from '@/types/lottery';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

type PlayMode = 'single' | 'complex' | 'dantuo';

const PLAY_MODES = [
  { id: 'single', name: '单式', desc: '标准投注' },
  { id: 'complex', name: '复式', desc: '多选号码' },
  { id: 'dantuo', name: '胆拖', desc: '胆码+拖码' },
];

function FormattedTime({ value }: { value: string }) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return <span>{value}</span>;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return (
    <div className="flex flex-col leading-tight">
      <span>{`${month}-${day}`}</span>
      <span className="text-muted-foreground">{`${hour}:${minute}:${second}`}</span>
    </div>
  );
}

function FormattedDrawTime({ value }: { value: string }) {
  const [date, time] = value.split(' ');
  return (
    <div className="flex flex-col leading-tight">
      <span>{date}</span>
      <span className="text-muted-foreground">{time}</span>
    </div>
  );
}

export default function Play() {
  usePageView();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen px-4 py-12 text-center">
        <p className="text-lg text-muted-foreground">请先登录后再模拟试玩</p>
        <Button asChild className="mt-4">
          <Link to="/login">去登录</Link>
        </Button>
      </div>
    );
  }

  return <PlayPage />;
}

function PlayPage() {
  const [searchParams] = useSearchParams();
  const [games, setGames] = useState<LotteryGame[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [playMode, setPlayMode] = useState<PlayMode>('single');
  const [inputs, setInputs] = useState<string[]>([]);
  const [danInputs, setDanInputs] = useState<string[]>([]);
  const [tuoInputs, setTuoInputs] = useState<string[]>([]);
  const [blueInputs, setBlueInputs] = useState<string[]>([]);
  const [complexRed, setComplexRed] = useState<number>(0);
  const [complexBlue, setComplexBlue] = useState<number>(0);
  const [danCount, setDanCount] = useState<number>(1);
  const [tuoCount, setTuoCount] = useState<number>(5);
  const [danBlueCount, setDanBlueCount] = useState<number>(1);
  const [latest, setLatest] = useState<LotteryResult | null>(null);
  const [nextIssue, setNextIssue] = useState<string>('');
  const [nextDrawTime, setNextDrawTime] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<PlayRecord[]>([]);
  const [recordsCount, setRecordsCount] = useState(0);
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const selectedGame = useMemo(() => games.find((g) => g.code === selectedCode) ?? null, [games, selectedCode]);

  useEffect(() => {
    async function load() {
      const data = await getGames();
      setGames(data);
      const queryGame = searchParams.get('game');
      const initialCode = queryGame && data.some((g) => g.code === queryGame)
        ? queryGame
        : data[0]?.code ?? '';
      setSelectedCode(initialCode);
    }
    void load();
  }, [searchParams]);

  useEffect(() => {
    if (!selectedGame) return;
    setSubmitted(false);
    setError(null);
    const redCount = selectedGame.red_count ?? 0;
    const blueCount = selectedGame.blue_count ?? 0;
    const redMax = selectedGame.red_max ?? redCount;
    const blueMax = selectedGame.blue_max ?? blueCount;
    setComplexRed(Math.min(redCount + 1, redMax));
    setComplexBlue(blueCount > 0 ? Math.min(blueCount + 1, blueMax) : 0);
    setDanCount(Math.min(1, Math.max(0, redCount - 1)));
    setTuoCount(Math.max(redCount - 1, 5));
    setDanBlueCount(blueCount > 0 ? Math.min(blueCount, blueMax) : 0);
    resetInputs('single', selectedGame, searchParams);

    async function loadLatest() {
      const data = await getLatestResult(selectedGame!.code);
      setLatest(data);
      if (data) {
        setNextIssue(getNextIssue(data.issue));
        setNextDrawTime(calculateNextDrawTime(selectedGame!, data.draw_date));
      } else {
        setNextIssue('');
        setNextDrawTime('');
      }
    }
    void loadLatest();
  }, [selectedGame, searchParams]);

  useEffect(() => {
    loadRecords(recordsPage);
  }, [recordsPage]);

  async function loadRecords(page: number) {
    setRecordsLoading(true);
    try {
      await updatePendingRecords();
      const { data, count } = await getPlayRecords(page, PAGE_SIZE);
      setRecords(data);
      setRecordsCount(count);
    } catch (e) {
      console.error(e);
    } finally {
      setRecordsLoading(false);
    }
  }

  function resetInputs(mode: PlayMode, game: LotteryGame, params: URLSearchParams) {
    const redCount = game.red_count ?? 0;
    const blueCount = game.blue_count ?? 0;
    const redMax = game.red_max ?? redCount;
    const blueMax = game.blue_max ?? blueCount;

    const numbersParam = params.get('numbers');
    const specialParam = params.get('special');

    if (mode === 'single' || mode === 'complex') {
      const count = mode === 'single' ? redCount + blueCount : Math.min(redMax + blueMax, 32);
      const initial: string[] = Array.from({ length: count }, () => '');
      if (numbersParam) {
        const numbers = numbersParam.split(',').map((n) => n.trim()).filter(Boolean);
        numbers.forEach((n, i) => {
          if (mode === 'single') {
            if (i < redCount) initial[i] = n;
          } else {
            if (i < redMax) initial[i] = n;
          }
        });
      }
      if (specialParam) {
        const special = specialParam.split(',').map((n) => n.trim()).filter(Boolean);
        special.forEach((n, i) => {
          const idx = mode === 'single' ? redCount + i : redMax + i;
          if (idx < count) initial[idx] = n;
        });
      }
      setInputs(initial);
      setDanInputs(Array.from({ length: Math.min(1, redCount - 1) }, () => ''));
      setTuoInputs(Array.from({ length: Math.max(redCount - 1, 5) }, () => ''));
      setBlueInputs(Array.from({ length: blueCount }, () => ''));
    } else {
      const dCount = Math.min(1, Math.max(0, redCount - 1));
      const tCount = Math.max(redCount - 1, 5);
      const dInitial: string[] = Array.from({ length: dCount }, () => '');
      const tInitial: string[] = Array.from({ length: tCount }, () => '');
      const bInitial: string[] = Array.from({ length: blueMax }, () => '');
      if (numbersParam) {
        const numbers = numbersParam.split(',').map((n) => n.trim()).filter(Boolean);
        numbers.forEach((n, i) => {
          if (i < dCount) dInitial[i] = n;
          else if (i < dCount + tCount) tInitial[i - dCount] = n;
        });
      }
      if (specialParam) {
        const special = specialParam.split(',').map((n) => n.trim()).filter(Boolean);
        special.forEach((n, i) => {
          if (i < blueMax) bInitial[i] = n;
        });
      }
      setDanInputs(dInitial);
      setTuoInputs(tInitial);
      setBlueInputs(bInitial);
      setInputs([]);
    }
  }

  function handleInputChange(index: number, value: string) {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  }

  function handleDanInputChange(index: number, value: string) {
    const newInputs = [...danInputs];
    newInputs[index] = value;
    setDanInputs(newInputs);
  }

  function handleTuoInputChange(index: number, value: string) {
    const newInputs = [...tuoInputs];
    newInputs[index] = value;
    setTuoInputs(newInputs);
  }

  function handleBlueInputChange(index: number, value: string) {
    const newInputs = [...blueInputs];
    newInputs[index] = value;
    setBlueInputs(newInputs);
  }

  function handleRandom() {
    if (!selectedGame) return;
    if (playMode === 'single' || playMode === 'complex') {
      const redCount = playMode === 'single' ? selectedGame.red_count ?? 0 : complexRed;
      const blueCount = playMode === 'single' ? selectedGame.blue_count ?? 0 : complexBlue;
      const { numbers, special } = generateRandomNumbers(
        redCount,
        selectedGame.red_min ?? 0,
        selectedGame.red_max ?? 0,
        blueCount,
        selectedGame.blue_min ?? 0,
        selectedGame.blue_max ?? 0,
        selectedGame.code === '3d' || selectedGame.code === 'pl3' || selectedGame.code === 'pl5' || selectedGame.code === 'qxc' || selectedGame.code === 'seven',
        selectedGame.code
      );
      setInputs([...numbers, ...special].map(String));
    } else {
      const { numbers: dan } = generateRandomNumbers(danCount, selectedGame.red_min ?? 0, selectedGame.red_max ?? 0, 0, 0, 0, false, selectedGame.code);
      const rest = Array.from({ length: selectedGame.red_max ?? 0 }, (_, i) => (selectedGame.red_min ?? 0) + i).filter((n) => !dan.includes(n));
      for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
      const tuo = rest.slice(0, tuoCount);
      const { numbers: special } = generateRandomNumbers(danBlueCount, selectedGame.blue_min ?? 0, selectedGame.blue_max ?? 0, 0, 0, 0, false, selectedGame.code);
      setDanInputs(dan.map(String));
      setTuoInputs(tuo.map(String));
      setBlueInputs(special.map(String));
    }
  }

  async function handlePlay() {
    if (!selectedGame || !latest) {
      setError('暂无开奖数据或彩种信息');
      return;
    }
    setError(null);
    setSubmitted(false);

    const redCount = selectedGame.red_count ?? 0;
    const blueCount = selectedGame.blue_count ?? 0;
    let redInputs: number[] = [];
    let blueInputsValue: number[] = [];
    let mode: 'single' | 'complex' | 'dantuo' = 'single';
    let danCountValue: number | null = null;

    if (playMode === 'single') {
      redInputs = inputs.slice(0, redCount).map((s) => parseUserInput(s)[0]);
      blueInputsValue = inputs.slice(redCount, redCount + blueCount).map((s) => parseUserInput(s)[0]);
      mode = 'single';
    } else if (playMode === 'complex') {
      redInputs = inputs.slice(0, complexRed).map((s) => parseUserInput(s)[0]);
      blueInputsValue = inputs.slice(complexRed, complexRed + complexBlue).map((s) => parseUserInput(s)[0]);
      mode = 'complex';
    } else {
      const dan = danInputs.slice(0, danCount).map((s) => parseUserInput(s)[0]);
      const tuo = tuoInputs.slice(0, tuoCount).map((s) => parseUserInput(s)[0]);
      const special = blueInputs.slice(0, danBlueCount).map((s) => parseUserInput(s)[0]);
      redInputs = [...dan, ...tuo];
      blueInputsValue = special;
      mode = 'dantuo';
      danCountValue = danCount;
    }

    const validationError = validateLotteryNumbers(selectedGame, redInputs, blueInputsValue, mode, danCountValue);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const issue = getNextIssue(latest.issue);
      const drawTime = calculateNextDrawTime(selectedGame, latest.draw_date);
      await savePlayRecord(
        selectedGame.code,
        issue,
        redInputs,
        blueInputsValue,
        drawTime,
        mode,
        danCountValue
      );
      toast.success('模拟试玩成功');
      setSubmitted(true);
      await loadRecords(recordsPage);
    } catch (e) {
      toast.error('保存模拟试玩记录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen px-4 py-6 md:py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link to="/">返回首页</Link>
          </Button>
          <h1 className="font-display text-2xl md:text-4xl text-foreground">模拟试玩</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>选择彩种并选号</CardTitle>
              <CardDescription>免费虚拟投注，预约下一期号码</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>选择彩种</Label>
                <Select value={selectedCode} onValueChange={setSelectedCode}>
                  <SelectTrigger>
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
              </div>

              {selectedGame && (
                <>
                  <div className="space-y-2">
                    <Label>玩法模式</Label>
                    <Tabs value={playMode} onValueChange={(v) => {
                      const mode = v as PlayMode;
                      setPlayMode(mode);
                      resetInputs(mode, selectedGame, searchParams);
                    }}>
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
                      {(selectedGame.blue_count ?? 0) > 0 && (
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
                      {(selectedGame.blue_count ?? 0) > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">蓝球个数</span>
                            <span className="text-sm font-bold text-primary">{danBlueCount} 个</span>
                          </div>
                          <Slider
                            value={[danBlueCount]}
                            onValueChange={(value) => setDanBlueCount(value[0])}
                            min={selectedGame.blue_count ?? 1}
                            max={selectedGame.blue_max ?? 10}
                            step={1}
                          />
                          <p className="text-xs text-muted-foreground">标准 {selectedGame.blue_count} 个，选择多选号码</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>
                        {playMode === 'dantuo' ? '输入号码' : '输入号码'}
                      </Label>
                      <Button type="button" variant="ghost" size="sm" onClick={handleRandom}>
                        随机生成
                      </Button>
                    </div>
                    {(playMode === 'single' || playMode === 'complex') && (
                      <LotteryNumberInput
                        redCount={playMode === 'single' ? selectedGame.red_count ?? 0 : complexRed}
                        blueCount={playMode === 'single' ? selectedGame.blue_count ?? 0 : complexBlue}
                        values={inputs}
                        onChange={handleInputChange}
                        redRangeHint={selectedGame.code === 'qxc' ? '前6位 0-9，第7位 0-14' : `${selectedGame.red_min}-${selectedGame.red_max}`}
                        blueRangeHint={(playMode === 'single' ? (selectedGame.blue_count ?? 0) : complexBlue) > 0 ? `${selectedGame.blue_min}-${selectedGame.blue_max}` : undefined}
                      />
                    )}
                    {playMode === 'dantuo' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">胆码区</p>
                          <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                            {danInputs.slice(0, danCount).map((value, i) => (
                              <Input
                                key={`dan-${i}`}
                                value={value}
                                onChange={(e) => handleDanInputChange(i, e.target.value)}
                                className="text-center"
                                inputMode="numeric"
                                aria-label={`胆码 ${i + 1}`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">拖码区</p>
                          <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                            {tuoInputs.slice(0, tuoCount).map((value, i) => (
                              <Input
                                key={`tuo-${i}`}
                                value={value}
                                onChange={(e) => handleTuoInputChange(i, e.target.value)}
                                className="text-center"
                                inputMode="numeric"
                                aria-label={`拖码 ${i + 1}`}
                              />
                            ))}
                          </div>
                        </div>
                        {(selectedGame.blue_count ?? 0) > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">蓝球区</p>
                            <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                              {blueInputs.slice(0, danBlueCount).map((value, i) => (
                                <Input
                                  key={`blue-${i}`}
                                  value={value}
                                  onChange={(e) => handleBlueInputChange(i, e.target.value)}
                                  className="text-center"
                                  inputMode="numeric"
                                  aria-label={`蓝球 ${i + 1}`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Button onClick={handlePlay} disabled={loading} className="w-full">
                    {loading ? '提交中...' : '提交模拟试玩'}
                  </Button>

                  {error && (
                    <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                  )}

                  {submitted && (
                    <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-center">
                      <p className="text-lg font-semibold text-foreground">投注成功</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        已预约第 {nextIssue} 期，预计开奖时间
                        <span className="mx-1 font-medium text-foreground">{nextDrawTime}</span>
                      </p>
                    </div>
                  )}

                  {latest && (
                    <div className="rounded-lg border border-border bg-card p-4">
                      <p className="mb-2 text-sm font-medium">第 {latest.issue} 期开奖号码</p>
                      <div className="flex flex-wrap gap-2">
                        {latest.numbers.map((n, i) => (
                          <span key={i} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm text-accent-foreground">
                            {String(n).padStart(2, '0')}
                          </span>
                        ))}
                        {latest.special_numbers.map((n, i) => (
                          <span key={`s-${i}`} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
                            {String(n).padStart(2, '0')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>我的模拟试玩记录</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recordsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : records.length === 0 ? (
                <p className="text-muted-foreground">暂无模拟试玩记录</p>
              ) : (
                <>
                  <div className="hidden md:block w-full max-w-full overflow-x-auto bg-card">
                    <Table className="[&>div]:max-w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap px-2 py-2 text-xs">投注时间</TableHead>
                          <TableHead className="whitespace-nowrap px-2 py-2 text-xs">彩种</TableHead>
                          <TableHead className="whitespace-nowrap px-2 py-2 text-xs">期号</TableHead>
                          <TableHead className="whitespace-nowrap px-2 py-2 text-xs">号码</TableHead>
                          <TableHead className="whitespace-nowrap px-2 py-2 text-xs">开奖时间</TableHead>
                          <TableHead className="whitespace-nowrap px-2 py-2 text-xs">结果</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {records.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="px-2 py-2 align-top text-xs">
                              <FormattedTime value={item.played_at} />
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-2 py-2 align-top text-xs">
                              {games.find((g) => g.code === item.game_code)?.display_name ?? item.game_code}
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-2 py-2 align-top text-xs">{item.issue}</TableCell>
                            <TableCell className="px-2 py-2 align-top">
                              <div className="flex flex-wrap gap-0.5">
                                {item.numbers.map((n, i) => (
                                  <span key={i} className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] text-accent-foreground">
                                    {String(n).padStart(2, '0')}
                                  </span>
                                ))}
                                {item.special_numbers.map((n, i) => (
                                  <span key={`s-${i}`} className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                                    {String(n).padStart(2, '0')}
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="px-2 py-2 align-top text-xs">
                              {item.draw_time ? <FormattedDrawTime value={item.draw_time} /> : <span className="text-muted-foreground">待公布</span>}
                            </TableCell>
                            <TableCell className="whitespace-nowrap px-2 py-2 align-top text-xs">
                              {item.status === 'pending' ? (
                                <span className="text-muted-foreground">待开奖</span>
                              ) : item.status === 'won' ? (
                                <Badge variant="default" className="text-xs">{item.win_name}</Badge>
                              ) : (
                                <span className="text-muted-foreground">未中</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="md:hidden space-y-3">
                    {records.map((item) => (
                      <div key={item.id} className="rounded-lg border border-border bg-card p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-medium">{games.find((g) => g.code === item.game_code)?.display_name ?? item.game_code}</span>
                            <span className="text-muted-foreground">第{item.issue}期</span>
                          </div>
                          {item.status === 'pending' ? (
                            <span className="text-xs text-muted-foreground">待开奖</span>
                          ) : item.status === 'won' ? (
                            <Badge variant="default" className="text-xs">{item.win_name}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">未中</span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-0.5">
                          {item.numbers.map((n, i) => (
                            <span key={i} className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] text-accent-foreground">
                              {String(n).padStart(2, '0')}
                            </span>
                          ))}
                          {item.special_numbers.map((n, i) => (
                            <span key={`s-${i}`} className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                              {String(n).padStart(2, '0')}
                            </span>
                          ))}
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex flex-col">
                            <span>投注</span>
                            <FormattedTime value={item.played_at} />
                          </div>
                          <div className="flex flex-col">
                            <span>开奖</span>
                            {item.draw_time ? <FormattedDrawTime value={item.draw_time} /> : <span>待公布</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Pagination
                    page={recordsPage}
                    totalPages={Math.max(1, Math.ceil(recordsCount / PAGE_SIZE))}
                    total={recordsCount}
                    pageSize={PAGE_SIZE}
                    onPageChange={setRecordsPage}
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