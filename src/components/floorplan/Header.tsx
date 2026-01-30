import { Building2, Ruler } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Grundriss-Analyzer</h1>
            <p className="text-xs text-muted-foreground">KI-gestützte Flächenanalyse</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Ruler className="h-4 w-4" />
          <span>Demo-Modus</span>
        </div>
      </div>
    </header>
  );
}
