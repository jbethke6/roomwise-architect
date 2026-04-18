import { useState, useCallback } from 'react';
import { Header } from '@/components/floorplan/Header';
import { UploadZone } from '@/components/floorplan/UploadZone';
import { PageManager } from '@/components/floorplan/PageManager';
import { AnalysisProgress } from '@/components/floorplan/AnalysisProgress';
import { FloorResultsTabs } from '@/components/floorplan/FloorResultsTabs';
import { ExportButtons } from '@/components/floorplan/ExportButtons';
import { SendReportDialog } from '@/components/floorplan/SendReportDialog';
import { analyzeFloorplans } from '@/lib/api';
import { getConfig, saveConfig, AppConfig } from '@/lib/config';
import { AnalysisStatus, AnalysisResult, ExtractedPage } from '@/types/floorplan';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Upload, Settings, Send, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [config, setConfigState] = useState(getConfig);
  const [pages, setPages] = useState<ExtractedPage[]>([]);
  const [status, setStatus] = useState<AnalysisStatus>({ status: 'idle', progress: 0, message: '' });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showConfig, setShowConfig] = useState(!config.webhookUrl);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [auftragsnummer, setAuftragsnummer] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');

  const updateConfig = (patch: Partial<AppConfig>) => {
    const updated = { ...config, ...patch };
    setConfigState(updated);
    saveConfig(updated);
  };

  const handlePagesReady = useCallback((newPages: ExtractedPage[]) => {
    setPages(newPages);
  }, []);

  const handleStartAnalysis = useCallback(async () => {
    if (!config.webhookUrl) {
      toast.error('Bitte zuerst die Webhook-URL konfigurieren');
      setShowConfig(true);
      return;
    }

    if (pages.length === 0) {
      toast.error('Keine Seiten zum Analysieren');
      return;
    }

    setStatus({ status: 'processing', progress: 20, message: 'Seiten werden an den Server gesendet...' });

    try {
      setStatus({ status: 'processing', progress: 40, message: `${pages.length} Seiten werden analysiert (KI-Erkennung)...` });

      const analysisResult = await analyzeFloorplans(config.webhookUrl, pages);

      setResult(analysisResult);
      setStatus({ status: 'complete', progress: 100, message: 'Analyse abgeschlossen!' });

      if (analysisResult.floors.length === 0) {
        toast.warning('Keine Grundrisse erkannt. Wurden nur Ansichten/Schnitte hochgeladen?');
      } else {
        toast.success(`${analysisResult.floors.length} Etage(n) erkannt – ${analysisResult.totalBgf.toFixed(2)} m² BGF`);
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      setStatus({
        status: 'error',
        progress: 0,
        message: `Fehler: ${error.message}`,
      });
      toast.error(error.message);
    }
  }, [config.webhookUrl, pages]);

  const handleReset = () => {
    setPages([]);
    setResult(null);
    setStatus({ status: 'idle', progress: 0, message: '' });
  };

  const handleResultChange = (updatedResult: AnalysisResult) => {
    setResult(updatedResult);
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
          {!result ? (
            /* ── UPLOAD & REVIEW PHASE ── */
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Webhook Config */}
              {showConfig && (
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Backend-Konfiguration</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Gib die Production Webhook-URL deiner n8n-Instanz ein:
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={config.webhookUrl}
                      onChange={(e) => updateConfig({ webhookUrl: e.target.value })}
                      placeholder="https://deine-n8n-instanz.de/webhook/grundriss-analyze"
                      className="flex-1 font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => config.webhookUrl && setShowConfig(false)}
                      disabled={!config.webhookUrl}
                    >
                      OK
                    </Button>
                  </div>

                  <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="mt-4">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between">
                        Erweiterte Einstellungen (Archiv)
                        <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="supabase-url" className="text-xs">Supabase URL</Label>
                        <Input
                          id="supabase-url"
                          value={config.supabaseUrl}
                          onChange={(e) => updateConfig({ supabaseUrl: e.target.value })}
                          placeholder="https://xxxxx.supabase.co"
                          className="font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="supabase-key" className="text-xs">Supabase Anon Key</Label>
                        <Input
                          id="supabase-key"
                          value={config.supabaseAnonKey}
                          onChange={(e) => updateConfig({ supabaseAnonKey: e.target.value })}
                          placeholder="eyJhbGciOi..."
                          className="font-mono text-sm"
                          type="password"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Erforderlich, um auf das Archiv aller bisherigen Analysen zuzugreifen.
                      </p>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}

              {/* Config toggle when hidden */}
              {!showConfig && config.webhookUrl && (
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setShowConfig(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Backend-URL ändern
                  </Button>
                </div>
              )}

              <div className="text-center">
                <h2 className="mb-2 text-2xl font-bold text-foreground">Grundrisse hochladen</h2>
                <p className="text-muted-foreground">
                  Laden Sie Grundrisse als JPG, PNG oder mehrseitige PDF hoch.
                  Ansichten, Schnitte und Normen werden automatisch erkannt und ignoriert.
                </p>
              </div>

              <UploadZone
                onPagesReady={handlePagesReady}
                isProcessing={status.status === 'processing'}
                existingPages={pages}
              />

              <PageManager
                pages={pages}
                onPagesChange={setPages}
                onStartAnalysis={handleStartAnalysis}
                isProcessing={status.status === 'processing'}
              />

              <AnalysisProgress status={status} />
            </div>
          ) : (
            /* ── RESULTS PHASE ── */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">BGF-Berechnung</h2>
                  <p className="text-sm text-muted-foreground">
                    {result.floors.length} Etage(n) • {result.floors.reduce((s, f) => s + f.rooms.length, 0)} Räume •
                    Bearbeiten Sie Werte nach Bedarf
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ExportButtons result={result} />
                  <Button size="sm" onClick={() => setSendDialogOpen(true)}>
                    <Send className="mr-2 h-4 w-4" />
                    Bericht erstellen & senden
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    <Upload className="mr-2 h-4 w-4" />
                    Neuer Grundriss
                  </Button>
                </div>
              </div>

              <FloorResultsTabs result={result} onResultChange={handleResultChange} pages={pages} />
            </div>
          )}
        </main>
      </div>

      {result && (
        <SendReportDialog
          open={sendDialogOpen}
          onOpenChange={(open) => {
            setSendDialogOpen(open);
            // Pre-fill with jobId on first open if user hasn't typed anything yet
            if (open && !auftragsnummer) setAuftragsnummer(result.jobId);
          }}
          webhookUrl={config.webhookUrl}
          auftragsnummer={auftragsnummer}
          recipientName={recipientName}
          recipientEmail={recipientEmail}
          onAuftragsnummerChange={setAuftragsnummer}
          onRecipientChange={(name, email) => {
            setRecipientName(name);
            setRecipientEmail(email);
          }}
        />
      )}
    </div>
  );
};

export default Index;
