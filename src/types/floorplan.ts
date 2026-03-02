export type RoomType = 'raum' | 'flur' | 'bad' | 'kueche' | 'schlafzimmer' | 'wohnzimmer' | 'balkon' | 'terrasse' | 'abstellraum' | 'other';

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  raum: 'Raum',
  flur: 'Flur',
  bad: 'Bad',
  kueche: 'Küche',
  schlafzimmer: 'Schlafzimmer',
  wohnzimmer: 'Wohnzimmer',
  balkon: 'Balkon',
  terrasse: 'Terrasse',
  abstellraum: 'Abstellraum',
  other: 'Sonstiges',
};

export interface RoomMeasurement {
  name: string;
  type: RoomType;
  length: number;
  width: number;
  area: number;
  confidence: number;
  interpolated: boolean;
  tolerance: number;
  handwritten: boolean;
}

export interface DimensionChain {
  description: string;
  valueMeter: number;
  reference: string;
  confidence: number;
}

export interface FloorData {
  pageNumber: number;
  isFloorplan: boolean;
  floor: string;
  rooms: RoomMeasurement[];
  dimensionChains: DimensionChain[];
  bgf: number;
  hints: string[];
}

export interface AnalysisResult {
  id: string;
  jobId: string;
  floors: FloorData[];
  skippedPages: number[];
  totalBgf: number;
  errors: string[];
  analyzedAt: Date;
  status: 'success' | 'partial';
}

export interface ExtractedPage {
  id: string;
  pageNumber: number;
  fileName: string;
  imageBase64: string;
  thumbnailUrl: string;
  floor?: string;
}

export interface AnalysisStatus {
  status: 'idle' | 'extracting' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  message: string;
}

// Legacy compat for components that still use this shape
export interface FloorplanAnalysis {
  id: string;
  fileName: string;
  timestamp: Date;
  scaling: { unit: string; pixelPerMeter: number };
  rooms: RoomMeasurement[];
  total: { bgf: number; hints: string[]; accuracy: number };
}

export function inferRoomType(name: string): RoomType {
  const lower = name.toLowerCase();
  if (lower.includes('wohn')) return 'wohnzimmer';
  if (lower.includes('schlaf') || lower.includes('kinder')) return 'schlafzimmer';
  if (lower.includes('küch') || lower.includes('kuch') || lower.includes('koch')) return 'kueche';
  if (lower.includes('bad') || lower.includes('wc') || lower.includes('dusch') || lower.includes('sanitär')) return 'bad';
  if (lower.includes('flur') || lower.includes('diele') || lower.includes('gang') || lower.includes('eingang')) return 'flur';
  if (lower.includes('balkon')) return 'balkon';
  if (lower.includes('terrass')) return 'terrasse';
  if (lower.includes('abstell') || lower.includes('kammer') || lower.includes('hwr') || lower.includes('lager')) return 'abstellraum';
  return 'raum';
}

export function mapApiResponse(apiResponse: any): AnalysisResult {
  const floors: FloorData[] = [];
  const skippedPages: number[] = [];

  for (const page of apiResponse.pages || []) {
    if (!page.istGrundriss) {
      skippedPages.push(page.pageNumber);
      continue;
    }

    const rooms: RoomMeasurement[] = (page.raeume || []).map((r: any) => ({
      name: r.name || 'Unbekannt',
      type: inferRoomType(r.name || ''),
      length: Number(r.laenge) || 0,
      width: Number(r.breite) || 0,
      area: Number(r.flaeche) || 0,
      confidence: Number(r.konfidenz) || 0.5,
      interpolated: r.interpoliert || false,
      tolerance: Number(r.toleranz) || 0.15,
      handwritten: r.handschriftlich || false,
    }));

    const dimensionChains: DimensionChain[] = (page.maszketten || []).map((m: any) => ({
      description: m.beschreibung || '',
      valueMeter: Number(m.wert_meter) || 0,
      reference: m.bezugspunkt || '',
      confidence: Number(m.konfidenz) || 0.5,
    }));

    floors.push({
      pageNumber: page.pageNumber,
      isFloorplan: true,
      floor: page.etage || `Seite ${page.pageNumber}`,
      rooms,
      dimensionChains,
      bgf: Number(page.bgfEtage) || rooms.reduce((s, r) => s + r.area, 0),
      hints: page.hinweise || [],
    });
  }

  return {
    id: crypto.randomUUID(),
    jobId: apiResponse.jobId || '',
    floors,
    skippedPages,
    totalBgf: Number(apiResponse.gesamtBGF) || floors.reduce((s, f) => s + f.bgf, 0),
    errors: apiResponse.fehler || [],
    analyzedAt: new Date(apiResponse.analysiert_am || Date.now()),
    status: apiResponse.status || 'success',
  };
}
