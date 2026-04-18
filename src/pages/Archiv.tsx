import { useEffect, useState } from 'react';
import { Header } from '@/components/floorplan/Header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SendReportDialog } from '@/components/floorplan/SendReportDialog';
import { FloorResultsTabs } from '@/components/floorplan/FloorResultsTabs';
import { fetchArchive, fetchAuftragDetails, ArchiveEntry } from '@/lib/api';
import { getConfig } from '@/lib/config';
import { AnalysisResult } from '@/types/floorplan';
import { Loader2, Send, Eye, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const Archiv = () => {
  const config = getConfig();
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Send dialog
  const [sendOpen, setSendOpen] = useState(false);
  const [sendAuftrag, setSendAuftrag] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');

  // Details dialog
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsResult, setDetailsResult] = useState<AnalysisResult | null>(null);
  const [detailsTitle, setDetailsTitle] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchArchive(config.supabaseUrl, config.supabaseAnonKey);
      setEntries(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openSend = (auftragsnummer: string) => {
    setSendAuftrag(auftragsnummer);
    setSendOpen(true);
  };

  const openDetails = async (auftragsnummer: string) => {
    setDetailsTitle(auftragsnummer);
    setDetailsOpen(true);
    setDetailsResult(null);
    setDetailsLoading(true);
    try {
      const result = await fetchAuftragDetails(config.webhookUrl, auftragsnummer);
      setDetailsResult(result);
    } catch (err: any) {
      toast.error(`Details konnten nicht geladen werden: ${err.message}`);
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('de-DE', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-background">
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
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Archiv</h2>
              <p className="text-sm text-muted-foreground">
                Alle bisher analysierten BGF-Berechnungen
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
          </div>

          {loading && (
            <div className="flex items-center justify-center rounded-xl border border-border bg-card p-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Archiv wird geladen...</span>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground">Fehler beim Laden des Archivs</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && entries.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
              Noch keine Aufträge im Archiv.
            </div>
          )}

          {!loading && !error && entries.length > 0 && (
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Auftragsnummer</TableHead>
                    <TableHead className="text-right">Gesamt-BGF (m²)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Erstellt am</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id || entry.auftragsnummer}>
                      <TableCell className="font-mono">{entry.auftragsnummer}</TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {entry.gesamt_bgf != null ? Number(entry.gesamt_bgf).toFixed(2) : '–'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.status === 'success' ? 'default' : 'secondary'}>
                          {entry.status || 'unbekannt'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(entry.erstellt_am)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline" size="sm"
                            onClick={() => openDetails(entry.auftragsnummer)}
                          >
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openSend(entry.auftragsnummer)}
                          >
                            <Send className="mr-1.5 h-3.5 w-3.5" />
                            Bericht senden
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </main>
      </div>

      <SendReportDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        webhookUrl={config.webhookUrl}
        auftragsnummer={sendAuftrag}
        recipientName={recipientName}
        recipientEmail={recipientEmail}
        onAuftragsnummerChange={setSendAuftrag}
        onRecipientChange={(name, email) => {
          setRecipientName(name);
          setRecipientEmail(email);
        }}
        lockAuftragsnummer
      />

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Auftrag {detailsTitle} – Details</DialogTitle>
          </DialogHeader>
          {detailsLoading && (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Daten werden geladen...</span>
            </div>
          )}
          {!detailsLoading && detailsResult && (
            <FloorResultsTabs
              result={detailsResult}
              onResultChange={() => { /* read-only */ }}
              readOnly
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Archiv;
