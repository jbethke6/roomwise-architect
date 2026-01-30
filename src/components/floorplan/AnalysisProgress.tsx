import { Progress } from '@/components/ui/progress';
import { AnalysisStatus } from '@/types/floorplan';
import { Loader2, CheckCircle2, AlertCircle, FileSearch } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisProgressProps {
  status: AnalysisStatus;
}

export function AnalysisProgress({ status }: AnalysisProgressProps) {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'complete':
        return <CheckCircle2 className="h-6 w-6 text-success" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-destructive" />;
      case 'processing':
      case 'uploading':
        return <Loader2 className="h-6 w-6 animate-spin text-copper" />;
      default:
        return <FileSearch className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'complete':
        return 'text-success';
      case 'error':
        return 'text-destructive';
      case 'processing':
      case 'uploading':
        return 'text-copper';
      default:
        return 'text-muted-foreground';
    }
  };

  if (status.status === 'idle') {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-4">
        {getStatusIcon()}
        <div className="flex-1">
          <p className={cn('font-medium', getStatusColor())}>{status.message}</p>
          {(status.status === 'processing' || status.status === 'uploading') && (
            <div className="mt-3">
              <Progress value={status.progress} className="h-2" />
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {status.progress}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Processing Steps Indicator */}
      {(status.status === 'processing' || status.status === 'uploading') && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {['Upload', 'Erkennung', 'Extraktion', 'Validierung'].map((step, index) => {
            const stepProgress = (index + 1) * 25;
            const isActive = status.progress >= stepProgress - 24 && status.progress < stepProgress + 1;
            const isComplete = status.progress >= stepProgress;

            return (
              <div
                key={step}
                className={cn(
                  'rounded-lg border p-2 text-center text-xs transition-all',
                  isComplete && 'border-success/50 bg-success/10 text-success',
                  isActive && !isComplete && 'border-copper/50 bg-copper/10 text-copper',
                  !isActive && !isComplete && 'border-border bg-muted/50 text-muted-foreground'
                )}
              >
                {step}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
