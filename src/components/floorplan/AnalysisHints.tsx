import { Info, Lightbulb } from 'lucide-react';

interface AnalysisHintsProps {
  hints: string[];
}

export function AnalysisHints({ hints }: AnalysisHintsProps) {
  if (hints.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-copper" />
        <h3 className="font-semibold text-foreground">Analyse-Hinweise</h3>
      </div>
      <ul className="space-y-2">
        {hints.map((hint, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{hint}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
