import { useState, useCallback } from 'react';
import { Header } from '@/components/floorplan/Header';
import { UploadZone } from '@/components/floorplan/UploadZone';
import { AnalysisProgress } from '@/components/floorplan/AnalysisProgress';
import { ResultsTable } from '@/components/floorplan/ResultsTable';
import { AnalysisHints } from '@/components/floorplan/AnalysisHints';
import { ExportButtons } from '@/components/floorplan/ExportButtons';
import { simulateAnalysis } from '@/lib/mock-analysis';
import { AnalysisStatus, FloorplanAnalysis } from '@/types/floorplan';
import { Button } from '@/components/ui/button';
import { RotateCcw, Info } from 'lucide-react';

const Index = () => {
  const [status, setStatus] = useState<AnalysisStatus>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  const [analysis, setAnalysis] = useState<FloorplanAnalysis | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setAnalysis(null);
    setStatus({
      status: 'uploading',
      progress: 0,
      message: 'Wird vorbereitet...',
    });

    try {
      const result = await simulateAnalysis(file.name, (progress, message) => {
        setStatus({
          status: progress < 100 ? 'processing' : 'complete',
          progress,
          message,
        });
      });

      setAnalysis(result);
      setStatus({
        status: 'complete',
        progress: 100,
        message: 'Analyse abgeschlossen!',
      });
    } catch (error) {
      setStatus({
        status: 'error',
        progress: 0,
        message: 'Analyse fehlgeschlagen. Bitte versuchen Sie es erneut.',
      });
    }
  }, []);

  const handleReset = () => {
    setStatus({ status: 'idle', progress: 0, message: '' });
    setAnalysis(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Blueprint Grid Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--blueprint)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--blueprint)) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10">
        <Header />

        <main className="container mx-auto px-6 py-8">
          {/* Demo Notice */}
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-copper/30 bg-copper/5 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-copper" />
            <div className="text-sm">
              <p className="font-medium text-copper">Demo-Modus aktiv</p>
              <p className="text-muted-foreground">
                Diese Version zeigt simulierte Analyseergebnisse. Für echte KI-Analyse 
                kann später die Mistral-API angebunden werden.
              </p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Column - Upload */}
            <div className="space-y-6">
              <div>
                <h2 className="mb-2 text-2xl font-bold text-foreground">
                  Grundriss hochladen
                </h2>
                <p className="text-muted-foreground">
                  Laden Sie einen Grundriss als JPG, PNG oder PDF hoch. 
                  Die KI analysiert automatisch alle Räume und Maße.
                </p>
              </div>

              <UploadZone
                onFileSelect={handleFileSelect}
                isProcessing={status.status === 'processing' || status.status === 'uploading'}
              />

              <AnalysisProgress status={status} />
            </div>

            {/* Right Column - Results */}
            <div className="space-y-6">
              {analysis ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">
                        Analyseergebnis
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {analysis.fileName}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleReset}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Neue Analyse
                    </Button>
                  </div>

                  <ResultsTable analysis={analysis} />
                  <AnalysisHints analysis={analysis} />

                  <div className="flex justify-end">
                    <ExportButtons analysis={analysis} />
                  </div>
                </>
              ) : (
                <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">
                      Laden Sie einen Grundriss hoch,<br />
                      um die Analyse zu starten
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Import for the empty state icon
import { Building2 } from 'lucide-react';

export default Index;
