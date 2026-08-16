import { useEffect, useMemo, useState } from 'react';
import { usePageView } from '@/hooks/usePageView';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { LotteryNumberInput } from '@/components/common/LotteryNumberInput';
import { getGames, getHistory, checkWin, generateRandomNumbers } from '@/services/lottery';
import { parseUserInput, validateLotteryNumbers } from '@/lib/lottery-utils';
import type { LotteryGame, LotteryResult } from '@/types/lottery';

export default function CheckPrize() {
  usePageView();
  const [games, setGames] = useState<LotteryGame[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [inputs, setInputs] = useState<string[]>([]);
  const [result, setResult] = useState<{ level: number | null; name: string | null; prize: string | null } | null>(null);
  const [issues, setIssues] = useState<LotteryResult[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'single' | 'complex' | 'dantuo'>('single');
  const [redInputCount, setRedInputCount] = useState<number>(0);
  const [blueInputCount, setBlueInputCount] = useState<number>(0);
  const [danCount, setDanCount] = useState<number>(1);
  const [tuoCount, setTuoCount] = useState<number>(5);
  const [betCount, setBetCount] = useState<number>(1);
  const [digitMode, setDigitMode] = useState<'直选' | '组选三' | '组选六'>('直选');

  const selectedGame = useMemo(
    () => games.find((g) => g.code === selectedCode) ?? null,
    [games, selectedCode]
  );

  const selectedResult = useMemo(
    () => issues.find((r) => r.issue === selectedIssue) ?? null,
    [issues, selectedIssue]
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
    setResult(null);
    setError(null);
    const rCount = selectedGame.red_count ?? 0;
    const bCount = selectedGame.blue_count ?? 0;
    setMode('single');
    setRedInputCount(rCount);
    setBlueInputCount(bCount);
    setDanCount(1);
    setTuoCount(Math.max(1, rCount - 1));
    setBetCount(1);
    setInputs(Array.from({ length: rCount + bCount }, () => ''));

    const gameCode = selectedGame.code;
    async function loadIssues() {
      const data = await getHistory(gameCode, 100);
      setIssues(data);
      if (data.length > 0) setSelectedIssue(data[0].issue);
    }
    void loadIssues();
  }, [selectedGame]);

  useEffect(() => {
    if (!selectedGame) return;
    const rCount = selectedGame.red_count ?? 0;
    const bCount = selectedGame.blue_count ?? 0;
    if (mode === 'single') {
      setRedInputCount(rCount);
      setBlueInputCount(bCount);
      setInputs(Array.from({ length: rCount + bCount }, () => ''));
    } else if (mode === 'complex') {
      const redMax = selectedGame.red_max ?? rCount;
      const blueMax = selectedGame.blue_max ?? bCount;
      setRedInputCount(Math.min(rCount + 1, redMax));
      setBlueInputCount(bCount > 0 ? Math.min(bCount + 1, blueMax) : 0);
      setInputs(Array.from({ length: Math.min(rCount + 1, redMax) + (bCount > 0 ? Math.min(bCount + 1, blueMax) : 0) }, () => ''));
    } else {
      setRedInputCount(danCount + tuoCount);
      setBlueInputCount(bCount);
      setInputs(Array.from({ length: danCount + tuoCount + bCount }, () => ''));
    }
  }, [mode, selectedGame, danCount, tuoCount]);

  function handleInputChange(index: number, value: string) {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  }

  function handleRandom() {
    if (!selectedGame) return;
    const allowDuplicate = selectedGame.code === '3d' || selectedGame.code === 'pl3' || selectedGame.code === 'pl5' || selectedGame.code === 'qxc' || selectedGame.code === 'seven';
    let redCount = selectedGame.red_count ?? 0;
    let blueCount = selectedGame.blue_count ?? 0;

    if (mode === 'complex') {
      redCount = redInputCount;
      blueCount = blueInputCount;
    } else if (mode === 'dantuo') {
      redCount = danCount + tuoCount;
      blueCount = selectedGame.blue_count ?? 0;
    }

    const { numbers, special } = generateRandomNumbers(
      redCount,
      selectedGame.red_min ?? 0,
      selectedGame.red_max ?? 0,
      blueCount,
      selectedGame.blue_min ?? 0,
      selectedGame.blue_max ?? 0,
      allowDuplicate,
      selectedGame.code
    );
    const all = [...numbers, ...special];
    setInputs(all.map(String));
  }

  function handleCheck() {
    if (!selectedGame || !selectedResult) {
      setError('暂无开奖数据或彩种信息');
      return;
    }
    setError(null);
    setResult(null);

    const redCount = selectedGame.red_count ?? 0;
    const blueCount = selectedGame.blue_count ?? 0;
    const redInputs = inputs.slice(0, redInputCount).map((s) => parseUserInput(s)[0]);
    const blueInputs = inputs.slice(redInputCount, redInputCount + blueInputCount).map((s) => parseUserInput(s)[0]);

    if (selectedGame.code === '3d' || selectedGame.code === 'pl3' || selectedGame.code === 'pl5' || selectedGame.code === 'qxc' || selectedGame.code === 'seven') {
      const validationError = validateLotteryNumbers(selectedGame, redInputs, blueInputs, 'single', null);
      if (validationError) {
        setError(validationError);
        return;
      }
      const playMode = (selectedGame.code === '3d' || selectedGame.code === 'pl3') ? digitMode : undefined;
      const win = checkWin(selectedGame, selectedResult, redInputs, [], playMode);
      setResult(win);
      setBetCount(1);
      return;
    }

    const validationError = validateLotteryNumbers(selectedGame, redInputs, blueInputs, mode, mode === 'dantuo' ? danCount : null);
    if (validationError) {
      setError(validationError);
      return;
    }

    const win = findBestWin(selectedGame, selectedResult, redInputs, blueInputs, mode, danCount);
    setResult(win.best);
    setBetCount(win.count);
  }

  return (
    <div className="min-h-screen px-4 py-6 md:py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link to="/">返回首页</Link>
          </Button>
          <h1 className="font-display text-2xl md:text-4xl text-foreground">中奖查询</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>选择彩种、期号并输入号码</CardTitle>
              <CardDescription>系统将根据您选择的期号开奖结果进行中奖判定</CardDescription>
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
                    <Label>选择查询期号</Label>
                    <Select value={selectedIssue} onValueChange={setSelectedIssue}>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择期号" />
                      </SelectTrigger>
                      <SelectContent>
                        {issues.map((r) => (
                          <SelectItem key={r.issue} value={r.issue}>
                            第 {r.issue} 期（{r.draw_date}）
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>输入号码</Label>
                      <Button type="button" variant="ghost" size="sm" onClick={handleRandom}>
                        随机一注
                      </Button>
                    </div>

                    {(selectedGame.code === 'ssq' || selectedGame.code === 'dlt') && (
                      <Tabs value={mode} onValueChange={(v) => setMode(v as 'single' | 'complex' | 'dantuo')}>
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="single">单式</TabsTrigger>
                          <TabsTrigger value="complex">复式</TabsTrigger>
                          <TabsTrigger value="dantuo">胆拖</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    )}

                    {mode === 'complex' && (
                      <div className="space-y-4 rounded-lg border border-border bg-muted p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">红球个数</Label>
                            <span className="text-sm font-bold text-primary">{redInputCount} 个</span>
                          </div>
                          <Slider
                            value={[redInputCount]}
                            onValueChange={(value) => setRedInputCount(value[0])}
                            min={selectedGame.red_count ?? 1}
                            max={selectedGame.red_max ?? 33}
                            step={1}
                          />
                          <p className="text-xs text-muted-foreground">标准 {selectedGame.red_count} 个，选择多个号码</p>
                        </div>
                        {(selectedGame.blue_count ?? 0) > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">蓝球个数</Label>
                              <span className="text-sm font-bold text-primary">{blueInputCount} 个</span>
                            </div>
                            <Slider
                              value={[blueInputCount]}
                              onValueChange={(value) => setBlueInputCount(value[0])}
                              min={selectedGame.blue_count ?? 1}
                              max={selectedGame.blue_max ?? 16}
                              step={1}
                            />
                            <p className="text-xs text-muted-foreground">标准 {selectedGame.blue_count} 个，选择多个号码</p>
                          </div>
                        )}
                      </div>
                    )}

                    {mode === 'dantuo' && (
                      <div className="space-y-4 rounded-lg border border-border bg-muted p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">胆码个数</Label>
                            <span className="text-sm font-bold text-primary">{danCount} 个</span>
                          </div>
                          <Slider
                            value={[danCount]}
                            onValueChange={(value) => setDanCount(value[0])}
                            min={1}
                            max={Math.max(1, (selectedGame.red_count ?? 1) - 1)}
                            step={1}
                          />
                          <p className="text-xs text-muted-foreground">必中的号码，胆码填在前 {danCount} 个框</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">拖码个数</Label>
                            <span className="text-sm font-bold text-primary">{tuoCount} 个</span>
                          </div>
                          <Slider
                            value={[tuoCount]}
                            onValueChange={(value) => setTuoCount(value[0])}
                            min={Math.max(1, (selectedGame.red_count ?? 1) - danCount)}
                            max={selectedGame.red_max ?? 33}
                            step={1}
                          />
                          <p className="text-xs text-muted-foreground">搭配胆码的号码，拖码填在后面 {tuoCount} 个框</p>
                        </div>
                      </div>
                    )}

                    {(selectedGame.code === '3d' || selectedGame.code === 'pl3') && (
                      <Tabs value={digitMode} onValueChange={(v) => setDigitMode(v as '直选' | '组选三' | '组选六')}>
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="直选">直选</TabsTrigger>
                          <TabsTrigger value="组选三">组选三</TabsTrigger>
                          <TabsTrigger value="组选六">组选六</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    )}

                    <LotteryNumberInput
                      redCount={redInputCount}
                      blueCount={blueInputCount}
                      values={inputs}
                      onChange={handleInputChange}
                      redRangeHint={selectedGame.code === 'qxc' ? '前6位 0-9，第7位 0-14' : `${selectedGame.red_min}-${selectedGame.red_max}`}
                      blueRangeHint={blueInputCount > 0 ? `${selectedGame.blue_min}-${selectedGame.blue_max}` : undefined}
                    />
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row">
                    <Button onClick={handleCheck} className="flex-1">
                      查询中奖
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                      <Link to={`/game/${selectedGame.code}`}>查看走势</Link>
                    </Button>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                  )}

                  {result && (
                    <div className="rounded-lg border border-border bg-muted p-4 text-center">
                      {result.level ? (
                        <>
                          <p className="text-lg font-semibold text-foreground">恭喜中奖！</p>
                          <div className="mt-2 flex items-center justify-center gap-3">
                            <Badge variant="default" className="text-base">
                              {result.name}
                            </Badge>
                            <span className="text-primary font-display text-2xl">{result.prize}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-lg text-muted-foreground">未中奖，再接再厉</p>
                      )}
                      {mode !== 'single' && betCount > 1 && (
                        <p className="mt-1 text-xs text-muted-foreground">共 {betCount} 注组合</p>
                      )}
                      {selectedResult && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          比对期号：第 {selectedResult.issue} 期 {selectedResult.draw_date}
                        </p>
                      )}
                    </div>
                  )}

                  {selectedResult && (
                    <div className="rounded-lg border border-border bg-card p-4">
                      <p className="mb-2 text-sm font-medium">第 {selectedResult.issue} 期开奖号码</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedResult.numbers.map((n, i) => (
                          <span key={i} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm text-accent-foreground">
                            {String(n).padStart(2, '0')}
                          </span>
                        ))}
                        {selectedResult.special_numbers.map((n, i) => (
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
        </motion.div>
      </div>
    </div>
  );
}

function findBestWin(
  game: LotteryGame,
  result: LotteryResult,
  redInputs: number[],
  blueInputs: number[],
  mode: 'single' | 'complex' | 'dantuo',
  danCount: number
): { best: { level: number | null; name: string | null; prize: string | null }; count: number } {
  if (game.code === 'kl8') {
    const win = checkWin(game, result, redInputs, [], redInputs.length.toString());
    return { best: win, count: 1 };
  }

  const redCount = game.red_count ?? 0;
  const blueCount = game.blue_count ?? 0;

  let redCombinations: number[][];
  if (mode === 'dantuo') {
    const dan = redInputs.slice(0, danCount);
    const tuo = redInputs.slice(danCount);
    redCombinations = combine(tuo, redCount - danCount).map((c) => [...dan, ...c]);
  } else {
    redCombinations = combine(redInputs, redCount);
  }

  const blueCombinations = blueCount > 0 ? combine(blueInputs, blueCount) : [[]];

  let best: { level: number | null; name: string | null; prize: string | null } = { level: null, name: null, prize: null };
  let bestLevel = Infinity;
  let count = 0;

  for (const reds of redCombinations) {
    for (const blues of blueCombinations) {
      const win = checkWin(game, result, reds, blues);
      count++;
      if (win.level !== null && win.level < bestLevel) {
        best = win;
        bestLevel = win.level;
      }
    }
  }

  return { best, count };
}

function combine<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  if (arr.length === k) return [arr.slice()];
  if (k === 1) return arr.map((item) => [item]);

  const result: T[][] = [];
  for (let i = 0; i <= arr.length - k; i++) {
    const head = arr[i];
    const tail = arr.slice(i + 1);
    for (const sub of combine(tail, k - 1)) {
      result.push([head, ...sub]);
    }
  }
  return result;
}
