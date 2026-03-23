import { Info, Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';
import { HintItem } from '@/types/floorplan';
import { cn } from '@/lib/utils';

interface AnalysisHintsProps {
  hints: HintItem[];
}

const HINT_STYLES: Record<string, { icon: typeof Info; color: string }> = {
  fehler: { icon: AlertTriangle, color: 'text-destructive' },
  warnung: { icon: AlertTriangle, color: 'text-warning' },
  info: { icon: Info, color: 'text-primary' },
  ok: { icon: CheckCircle, color: 'text-success' },
};

export function AnalysisHints({ hints }: AnalysisHintsProps) {
  if (hints.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-copper" />
        <h3 className="font-semibold text-foreground">Analyse-Hinweise</h3>
      </div>
      <ul className="space-y-2">
        {hints.map((hint, index) => {
          const style = HINT_STYLES[hint.type] || HINT_STYLES.info;
          const Icon = style.icon;
          return (
            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', style.color)} />
              <div>
                {hint.area && <span className="font-medium text-foreground">{hint.area}: </span>}
                <span>{hint.description}</span>
                {hint.recommendation && (
                  <span className="ml-1 text-xs text-muted-foreground">→ {hint.recommendation}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
