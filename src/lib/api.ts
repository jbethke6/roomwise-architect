import { ExtractedPage, AnalysisResult, mapApiResponse } from '@/types/floorplan';

const TIMEOUT = 5 * 60 * 1000; // 5 minutes

export interface AnalyzeRequest {
  jobId: string;
  auftragsnummer?: string;
  vorgangsnummer?: string;
  kunde_name?: string;
  kunde_email?: string;
  pages: {
    pageNumber: number;
    imageBase64: string;
    etage?: string;
  }[];
}

export interface AuftragsInfo {
  vorgangsnummer: string;
  kundeName: string;
  kundeEmail: string;
}

/**
 * Send pages to the n8n webhook for analysis
 */
export async function analyzeFloorplans(
  webhookUrl: string,
  pages: ExtractedPage[],
  auftragsInfo?: AuftragsInfo,
): Promise<AnalysisResult> {
  const jobId = crypto.randomUUID();

  const payload: AnalyzeRequest = {
    jobId,
    vorgangsnummer: auftragsInfo?.vorgangsnummer,
    kunde_name: auftragsInfo?.kundeName,
    kunde_email: auftragsInfo?.kundeEmail,
    auftragsnummer: auftragsInfo?.vorgangsnummer,
    pages: pages.map((p, i) => ({
      pageNumber: i + 1,
      imageBase64: p.imageBase64,
      etage: p.floor || undefined,
    })),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Server-Fehler ${response.status}: ${text}`);
    }

    const data = await response.json();
    return mapApiResponse(data);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Zeitüberschreitung: Die Analyse hat zu lange gedauert. Bitte versuche es mit weniger Seiten.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Send the report PDF to the configured recipient via the n8n PDF/Mail webhook
 */
export async function sendReport(
  pdfWebhookUrl: string,
  auftragsnummer: string,
  empfaenger_email: string,
  empfaenger_name: string,
): Promise<void> {
  const url = pdfWebhookUrl || 'https://n8n.smartimmo.solutions/webhook/grundriss-pdf-mail';
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ auftragsnummer, empfaenger_email, empfaenger_name }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Fehler ${response.status}: ${text}`);
  }
}

/**
 * Fetch all archived analyses from Supabase REST API
 */
export interface ArchiveEntry {
  id: string;
  auftragsnummer: string;
  gesamt_bgf: number | null;
  status: string | null;
  erstellt_am: string;
  [key: string]: any;
}

export async function fetchArchive(
  supabaseUrl: string,
  supabaseAnonKey: string,
): Promise<ArchiveEntry[]> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL oder API-Key fehlt. Bitte in den erweiterten Einstellungen konfigurieren.');
  }

  const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/auftraege?select=*&order=erstellt_am.desc`;
  const response = await fetch(url, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Archiv-Fehler ${response.status}: ${text}`);
  }

  return response.json();
}

/**
 * Fetch full result for a single auftragsnummer from the n8n GET webhook
 */
export async function fetchAuftragDetails(
  webhookUrl: string,
  auftragsnummer: string,
): Promise<AnalysisResult> {
  // Derive base URL (everything before /webhook/...)
  const baseUrl = webhookUrl.split('/webhook/')[0];
  const detailsUrl = `${baseUrl}/webhook/2488f7cf-757d-4b47-926f-4bb3abc15819?auftragsnummer=${encodeURIComponent(auftragsnummer)}`;

  const response = await fetch(detailsUrl);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Details-Fehler ${response.status}: ${text}`);
  }

  const data = await response.json();
  return mapApiResponse(Array.isArray(data) ? data[0] : data);
}
