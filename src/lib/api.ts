import { ExtractedPage, AnalysisResult, mapApiResponse } from '@/types/floorplan';

const TIMEOUT = 5 * 60 * 1000; // 5 minutes

export interface AnalyzeRequest {
  jobId: string;
  auftragsnummer?: string;
  pages: {
    pageNumber: number;
    imageBase64: string;
    etage?: string;
  }[];
}

/**
 * Send pages to the n8n webhook for analysis
 */
export async function analyzeFloorplans(
  webhookUrl: string,
  pages: ExtractedPage[],
): Promise<AnalysisResult> {
  const jobId = crypto.randomUUID();

  const payload: AnalyzeRequest = {
    jobId,
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
