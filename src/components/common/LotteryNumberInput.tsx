import { Input } from '@/components/ui/input';

interface LotteryNumberInputProps {
  redCount: number;
  blueCount: number;
  values: string[];
  onChange: (index: number, value: string) => void;
  redRangeHint?: string;
  blueRangeHint?: string;
  className?: string;
}

export function LotteryNumberInput({
  redCount,
  blueCount,
  values,
  onChange,
  redRangeHint,
  blueRangeHint,
  className,
}: LotteryNumberInputProps) {
  const redValues = values.slice(0, redCount);
  const blueValues = values.slice(redCount, redCount + blueCount);

  return (
    <div className={`space-y-4 ${className ?? ''}`}>
      {redCount > 0 && (
        <div className="rounded-xl border border-accent/20 bg-accent/[0.03] p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex h-4 w-4 rounded-full bg-accent/80" />
            <span className="text-sm font-medium text-foreground">红球区</span>
            <span className="text-xs text-muted-foreground">{redCount} 个号码</span>
            {redRangeHint && (
              <span className="ml-auto text-xs text-muted-foreground">可选 {redRangeHint}</span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
            {redValues.map((value, index) => (
              <Input
                key={`red-${index}`}
                value={value}
                onChange={(e) => onChange(index, e.target.value)}
                className="border-accent/20 bg-background/80 text-center placeholder:text-muted-foreground/40"
                maxLength={3}
                inputMode="numeric"
                aria-label={`红球 ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {blueCount > 0 && (
        <div className="rounded-xl border border-info/20 bg-info/[0.03] p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex h-4 w-4 rounded-full bg-info/80" />
            <span className="text-sm font-medium text-foreground">蓝球区</span>
            <span className="text-xs text-muted-foreground">{blueCount} 个号码</span>
            {blueRangeHint && (
              <span className="ml-auto text-xs text-muted-foreground">可选 {blueRangeHint}</span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
            {blueValues.map((value, index) => (
              <Input
                key={`blue-${index}`}
                value={value}
                onChange={(e) => onChange(redCount + index, e.target.value)}
                className="border-info/20 bg-background/80 text-center placeholder:text-muted-foreground/40"
                maxLength={3}
                inputMode="numeric"
                aria-label={`蓝球 ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
