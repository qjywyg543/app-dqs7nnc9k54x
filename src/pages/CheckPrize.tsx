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
    const count = (selectedGame.red_count ?? 0) + (selectedGame.blue_count ?? 0);
    setInputs(Array.from({ length: count }, () => ''));

    const gameCode = selectedGame.code;
    async function loadIssues() {
      const data = await getHistory(gameCode, 100);
      setIssues(data);
      if (data.length > 0) setSelectedIssue(data[0].issue);
    }
    void loadIssues();
  }, [selectedGame]);

  function handleInputChange(index: number, value: string) {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  }

  function handleRandom() {
    if (!selectedGame) return;
    const { numbers, special } = generateRandomNumbers(
      selectedGame.red_count ?? 0,
      selectedGame.red_min ?? 0,
      selectedGame.red_max ?? 0,
      selectedGame.blue_count ?? 0,
      selectedGame.blue_min ?? 0,
      selectedGame.blue_max ?? 0,
      selectedGame.code === '3d' || selectedGame.code === 'pl3' || selectedGame.code === 'pl5' || selectedGame.code === 'qxc' || selectedGame.code === 'seven',
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
    const redInputs = inputs.slice(0, redCount).map((s) => parseUserInput(s)[0]);
    const blueInputs = inputs.slice(redCount, redCount + blueCount).map((s) => parseUserInput(s)[0]);

    const validationError = validateLotteryNumbers(selectedGame, redInputs, blueInputs);
    if (validationError) {
      setError(validationError);
      return;
    }

    const win = checkWin(selectedGame, selectedResult, redInputs, blueInputs);
    setResult(win);
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

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>输入号码</Label>
                      <Button type="button" variant="ghost" size="sm" onClick={handleRandom}>
                        随机一注
                      </Button>
                    </div>
                    <LotteryNumberInput
                      redCount={selectedGame.red_count ?? 0}
                      blueCount={selectedGame.blue_count ?? 0}
                      values={inputs}
                      onChange={handleInputChange}
                      redRangeHint={selectedGame.code === 'qxc' ? '前6位 0-9，第7位 0-14' : `${selectedGame.red_min}-${selectedGame.red_max}`}
                      blueRangeHint={(selectedGame.blue_count ?? 0) > 0 ? `${selectedGame.blue_min}-${selectedGame.blue_max}` : undefined}
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
