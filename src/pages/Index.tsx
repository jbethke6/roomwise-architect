import { useState, useCallback } from 'react';
import { Header } from '@/components/floorplan/Header';
import { UploadZone } from '@/components/floorplan/UploadZone';
import { AnalysisProgress } from '@/components/floorplan/AnalysisProgress';
import { EditableResultsTable } from '@/components/floorplan/EditableResultsTable';
import { FloorplanPreview } from '@/components/floorplan/FloorplanPreview';
import { AnalysisHints } from '@/components/floorplan/AnalysisHints';
import { ExportButtons } from '@/components/floorplan/ExportButtons';
import { simulateAnalysis } from '@/lib/mock-analysis';
import { AnalysisStatus, FloorplanAnalysis } from '@/types/floorplan';
import { Button } from '@/components/ui/button';
import { RotateCcw, Upload, Building2 } from 'lucide-react';

const Index = () => {
  const [status, setStatus] = useState<AnalysisStatus>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  const [analysis, setAnalysis] = useState<FloorplanAnalysis | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileSelect = useCallback(async (file: File) => {
    setAnalysis(null);
    setFileName(file.name);
    
    // Create object URL for preview
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    
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
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setStatus({ status: 'idle', progress: 0, message: '' });
    setAnalysis(null);
    setImageUrl(null);
    setFileName('');
  };

  const handleAnalysisChange = (updatedAnalysis: FloorplanAnalysis) => {
    setAnalysis(updatedAnalysis);
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
          {!analysis ? (
            // Upload State
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center">
                <h2 className="mb-2 text-2xl font-bold text-foreground">
                  Grundriss hochladen
                </h2>
                <p className="text-muted-foreground">
                  Laden Sie einen Grundriss als JPG, PNG oder PDF hoch. 
                  Die Räume werden automatisch erkannt und vermessen.
                </p>
              </div>

              <UploadZone
                onFileSelect={handleFileSelect}
                isProcessing={status.status === 'processing' || status.status === 'uploading'}
              />

              <AnalysisProgress status={status} />
            </div>
          ) : (
            // Results State - Split Layout
            <div className="space-y-6">
              {/* Header Row */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    BGF-Berechnung
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Bearbeiten Sie Räume und Maße nach Bedarf
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ExportButtons analysis={analysis} />
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    <Upload className="mr-2 h-4 w-4" />
                    Neuer Grundriss
                  </Button>
                </div>
              </div>

              {/* Split Layout: Preview + Table */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Left: Floorplan Preview */}
                <div className="space-y-4">
                  {imageUrl && (
                    <FloorplanPreview imageUrl={imageUrl} fileName={fileName} />
                  )}
                  <AnalysisHints analysis={analysis} />
                </div>

                {/* Right: Editable Table */}
                <div>
                  <EditableResultsTable 
                    analysis={analysis} 
                    onAnalysisChange={handleAnalysisChange}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
