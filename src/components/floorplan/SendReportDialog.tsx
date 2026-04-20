import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { sendReport } from '@/lib/api';

interface SendReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfWebhookUrl: string;
  auftragsnummer: string;
  recipientName: string;
  recipientEmail: string;
  onAuftragsnummerChange?: (value: string) => void;
  onRecipientChange: (name: string, email: string) => void;
  /** When true, the auftragsnummer field is locked (used in Archiv) */
  lockAuftragsnummer?: boolean;
}

export function SendReportDialog({
  open, onOpenChange, pdfWebhookUrl, auftragsnummer,
  recipientName, recipientEmail,
  onAuftragsnummerChange, onRecipientChange,
  lockAuftragsnummer = false,
}: SendReportDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const auftragValid = auftragsnummer.trim().length > 0;
  const nameValid = recipientName.trim().length > 0;
  const emailValid = recipientEmail.includes('@') && recipientEmail.trim().length > 2;
  const canSubmit = auftragValid && nameValid && emailValid && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await sendReport(pdfWebhookUrl, auftragsnummer.trim(), recipientEmail.trim(), recipientName.trim());
      toast.success('Bericht wird erstellt und versendet...');
      onOpenChange(false);
    } catch (err: any) {
      console.error('Send report error:', err);
      toast.error(`Fehler beim Versenden: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bericht versenden</DialogTitle>
          <DialogDescription>
            Geben Sie Auftrags- und Empfängerdaten ein, um den BGF-Report zu versenden.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="auftragsnummer">Auftragsnummer *</Label>
            <Input
              id="auftragsnummer"
              value={auftragsnummer}
              onChange={(e) => onAuftragsnummerChange?.(e.target.value)}
              placeholder="z.B. 2025-0042"
              disabled={submitting || lockAuftragsnummer}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipient-name">Empfänger Name *</Label>
            <Input
              id="recipient-name"
              value={recipientName}
              onChange={(e) => onRecipientChange(e.target.value, recipientEmail)}
              placeholder="Max Mustermann"
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipient-email">Empfänger E-Mail *</Label>
            <Input
              id="recipient-email"
              type="email"
              value={recipientEmail}
              onChange={(e) => onRecipientChange(recipientName, e.target.value)}
              placeholder="empfaenger@beispiel.de"
              disabled={submitting}
            />
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Der BGF-Report wird als PDF erstellt und an die eingegebene E-Mail-Adresse gesendet.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Wird gesendet...</>
            ) : (
              <><Send className="mr-2 h-4 w-4" />Bericht senden</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
