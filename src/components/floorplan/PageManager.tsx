import { ExtractedPage } from '@/types/floorplan';
import { X, FileText, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PageManagerProps {
  pages: ExtractedPage[];
  onPagesChange: (pages: ExtractedPage[]) => void;
  onStartAnalysis: () => void;
  isProcessing: boolean;
}

const FLOOR_SUGGESTIONS = ['KG', 'EG', '1.OG', '2.OG', '3.OG', 'DG'];

export function PageManager({ pages, onPagesChange, onStartAnalysis, isProcessing }: PageManagerProps) {
  const removePage = (id: string) => {
    onPagesChange(pages.filter((p) => p.id !== id));
  };

  const setFloor = (id: string, floor: string) => {
    onPagesChange(pages.map((p) => (p.id === id ? { ...p, floor } : p)));
  };

  if (pages.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="border-b border-border bg-muted/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">
              {pages.length} Seite{pages.length !== 1 ? 'n' : ''} bereit
            </h3>
            <p className="text-sm text-muted-foreground">
              Etagen zuweisen (optional) • Nicht-Grundrisse werden automatisch erkannt
            </p>
          </div>
          <Button
            onClick={onStartAnalysis}
            disabled={isProcessing}
            className="bg-copper hover:bg-copper-dark text-accent-foreground"
          >
            Analyse starten
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
        {pages.map((page) => (
          <div
            key={page.id}
            className="group relative rounded-lg border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Thumbnail */}
            <div className="aspect-[3/4] overflow-hidden bg-muted/50">
              <img
                src={page.thumbnailUrl}
                alt={`Seite ${page.pageNumber}`}
                className="h-full w-full object-contain"
              />
            </div>

            {/* Remove button */}
            <button
              onClick={() => removePage(page.id)}
              className="absolute top-1 right-1 rounded-full bg-destructive/80 p-1 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>

            {/* Info */}
            <div className="p-2 space-y-1.5">
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <FileText className="h-3 w-3 shrink-0" />
                {page.fileName}
              </p>

              {/* Floor tag input */}
              <div className="flex items-center gap-1">
                <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                <Input
                  value={page.floor || ''}
                  onChange={(e) => setFloor(page.id, e.target.value)}
                  placeholder="Etage..."
                  className="h-6 text-xs px-1"
                />
              </div>

              {/* Quick floor buttons */}
              <div className="flex flex-wrap gap-0.5">
                {FLOOR_SUGGESTIONS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFloor(page.id, f)}
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded border transition-colors',
                      page.floor === f
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/50 text-muted-foreground border-border hover:border-primary',
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
