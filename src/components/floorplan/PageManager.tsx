import { ExtractedPage } from '@/types/floorplan';
import { X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface PageManagerProps {
  pages: ExtractedPage[];
  onPagesChange: (pages: ExtractedPage[]) => void;
  onStartAnalysis: () => void;
  isProcessing: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

export function PageManager({ pages, onPagesChange, onStartAnalysis, isProcessing, disabled = false, disabledReason }: PageManagerProps) {
  const removePage = (id: string) => {
    onPagesChange(pages.filter((p) => p.id !== id));
  };

  if (pages.length === 0) return null;

  const startBtn = (
    <Button
      onClick={onStartAnalysis}
      disabled={isProcessing || disabled}
      className="bg-copper hover:bg-copper-dark text-accent-foreground"
    >
      Analyse starten
    </Button>
  );

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="border-b border-border bg-muted/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">
              {pages.length} Seite{pages.length !== 1 ? 'n' : ''} bereit
            </h3>
            <p className="text-sm text-muted-foreground">
              Etagen & Nicht-Grundrisse werden automatisch erkannt
            </p>
          </div>
          {disabled && disabledReason ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0}>{startBtn}</span>
                </TooltipTrigger>
                <TooltipContent>{disabledReason}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            startBtn
          )}
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
            <div className="p-2">
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <FileText className="h-3 w-3 shrink-0" />
                {page.fileName} – Seite {page.pageNumber}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
