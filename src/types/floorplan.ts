export type RoomType = 'wohnraum' | 'nassraum' | 'kueche' | 'verkehr' | 'nebenraum' | 'buero_gewerbe' | 'technik' | 'garage' | 'aussenbereich' | 'sonstige';

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  wohnraum: 'Wohnraum',
  nassraum: 'Nassraum',
  kueche: 'Küche',
  verkehr: 'Verkehrsfläche',
  nebenraum: 'Nebenraum',
  buero_gewerbe: 'Büro/Gewerbe',
  technik: 'Technik',
  garage: 'Garage/Stellplatz',
  aussenbereich: 'Außenbereich',
  sonstige: 'Sonstiges',
};

export interface RoomMeasurement {
  name: string;
  type: RoomType;
  unitId: string;
  length: number;
  width: number;
  area: number;
  areaFactor: number;
  confidence: number;
  interpolated: boolean;
  tolerance: number;
  handwritten: boolean;
}

export interface DimensionChain {
  description: string;
  valueMeter: number;
  position: string;
  side: string;
  confidence: number;
}

export interface HintItem {
  type: string;
  area: string;
  description: string;
  recommendation: string;
}

export interface ResidentialUnit {
  unitId: string;
  label: string;
  type: string;
  netArea: number | null;
  livingAreaWoflv: number | null;
  roomCount: number | null;
}

export interface FloorData {
  pageNumber: number;
  isFloorplan: boolean;
  floor: string;
  floorConfidence: number | null;
  buildingType: string | null;
  scale: string | null;
  originalUnit: string | null;
  rooms: RoomMeasurement[];
  residentialUnits: ResidentialUnit[];
  dimensionChains: DimensionChain[];
  bgf: number;
  bgfOuterContour: number | null;
  bgfRoomSum: number | null;
  bgfMethod: string | null;
  hints: HintItem[];
}

export interface AnalysisResult {
  id: string;
  jobId: string;
  floors: FloorData[];
  skippedPages: number[];
  totalBgf: number;
  buildingType: string | null;
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

export function inferRoomType(name: string): RoomType {
  const lower = name.toLowerCase();
  if (lower.includes('wohn') || lower.includes('schlaf') || lower.includes('kinder') || lower.includes('gäste') || lower.includes('zimmer') || lower.includes('esszimmer')) return 'wohnraum';
  if (lower.includes('bad') || lower.includes('wc') || lower.includes('dusch') || lower.includes('sanitär') || lower.includes('sauna')) return 'nassraum';
  if (lower.includes('küch') || lower.includes('kuch') || lower.includes('koch') || lower.includes('teeküche')) return 'kueche';
  if (lower.includes('flur') || lower.includes('diele') || lower.includes('gang') || lower.includes('eingang') || lower.includes('treppenhaus') || lower.includes('aufzug')) return 'verkehr';
  if (lower.includes('abstell') || lower.includes('kammer') || lower.includes('hwr') || lower.includes('lager') || lower.includes('keller') || lower.includes('speise')) return 'nebenraum';
  if (lower.includes('büro') || lower.includes('besprechung') || lower.includes('empfang') || lower.includes('verkauf')) return 'buero_gewerbe';
  if (lower.includes('technik') || lower.includes('heizung') || lower.includes('server') || lower.includes('hausanschluss')) return 'technik';
  if (lower.includes('garage') || lower.includes('stellplatz') || lower.includes('carport') || lower.includes('rampe')) return 'garage';
  if (lower.includes('balkon') || lower.includes('terrass') || lower.includes('loggia')) return 'aussenbereich';
  return 'sonstige';
}

function normalizeFloorName(raw: string): string {
  if (!raw) return 'Unbekannt';
  const s = raw.trim();
  const lower = s.toLowerCase();

  if (/^(eg|erdgeschoss|ground\s*floor|ebene\s*0|geschoss\s*0)$/i.test(s)) return 'EG';
  if (/^(kg|kellergeschoss|untergeschoss|ug|basement)$/i.test(s)) return 'KG';
  if (/^(dg|dachgeschoss|staffelgeschoss|attic)$/i.test(s)) return 'DG';

  const ogMatch = s.match(/^(\d+)\s*\.?\s*(og|obergeschoss|stock|floor|etage)/i);
  if (ogMatch) return `${ogMatch[1]}.OG`;
  if (/^(og|obergeschoss|1st\s*floor)$/i.test(s)) return '1.OG';

  const ugMatch = s.match(/^(\d+)\s*\.?\s*(ug|untergeschoss)/i);
  if (ugMatch) return `${ugMatch[1]}.UG`;

  if (/^\d+$/.test(s)) {
    const n = parseInt(s);
    if (n === 0) return 'EG';
    if (n < 0) return `${Math.abs(n)}.UG`;
    return `${n}.OG`;
  }

  return s;
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
      type: r.raumtyp ? mapRoomType(r.raumtyp) : inferRoomType(r.name || ''),
      unitId: r.einheit_id || 'WE_1',
      length: Number(r.laenge) || 0,
      width: Number(r.breite) || 0,
      area: Number(r.flaeche) || 0,
      areaFactor: Number(r.anrechnung_faktor) ?? 1.0,
      confidence: Number(r.konfidenz) || 0.5,
      interpolated: r.interpoliert || false,
      tolerance: Number(r.toleranz) || 0.15,
      handwritten: r.handschriftlich || false,
    }));

    const dimensionChains: DimensionChain[] = (page.maszketten || []).map((m: any) => ({
      description: m.beschreibung || '',
      valueMeter: Number(m.wert_meter) || 0,
      position: m.position || '',
      side: m.seite || '',
      confidence: Number(m.konfidenz) || 0.5,
    }));

    const hints: HintItem[] = normalizeHints(page.hinweise);

    const residentialUnits: ResidentialUnit[] = (page.wohneinheiten || []).map((we: any) => ({
      unitId: we.einheit_id || '',
      label: we.bezeichnung || '',
      type: we.typ || '',
      netArea: we.flaeche_netto != null ? Number(we.flaeche_netto) : null,
      livingAreaWoflv: we.wohnflaeche_woflv != null ? Number(we.wohnflaeche_woflv) : null,
      roomCount: we.anzahl_zimmer != null ? Number(we.anzahl_zimmer) : null,
    }));

    floors.push({
      pageNumber: page.pageNumber,
      isFloorplan: true,
      floor: normalizeFloorName(page.etage || `Seite ${page.pageNumber}`),
      floorConfidence: page.etage_konfidenz != null ? Number(page.etage_konfidenz) : null,
      buildingType: page.gebaeude_typ || null,
      scale: page.massstab || null,
      originalUnit: page.einheit_original || null,
      rooms,
      residentialUnits,
      dimensionChains,
      bgf: Number(page.bgfEtage) || rooms.reduce((s, r) => s + r.area, 0),
      bgfOuterContour: page.bgf_aussenkontur != null ? Number(page.bgf_aussenkontur) : null,
      bgfRoomSum: page.bgf_raum_summe != null ? Number(page.bgf_raum_summe) : null,
      bgfMethod: page.bgf_methode || null,
      hints,
    });
  }

  return {
    id: crypto.randomUUID(),
    jobId: apiResponse.jobId || '',
    floors,
    skippedPages,
    totalBgf: Number(apiResponse.gesamtBGF) || floors.reduce((s, f) => s + f.bgf, 0),
    buildingType: apiResponse.gebaeude_typ || null,
    errors: apiResponse.fehler || [],
    analyzedAt: new Date(apiResponse.analysiert_am || Date.now()),
    status: apiResponse.status || 'success',
  };
}

function mapRoomType(raumtyp: string): RoomType {
  const map: Record<string, RoomType> = {
    wohnraum: 'wohnraum',
    nassraum: 'nassraum',
    kueche: 'kueche',
    verkehr: 'verkehr',
    nebenraum: 'nebenraum',
    buero_gewerbe: 'buero_gewerbe',
    technik: 'technik',
    garage: 'garage',
    aussenbereich: 'aussenbereich',
    sonstige: 'sonstige',
  };
  return map[raumtyp] || 'sonstige';
}

function normalizeHints(hinweise: any): HintItem[] {
  if (!hinweise || !Array.isArray(hinweise)) return [];
  return hinweise.map((h: any) => {
    if (typeof h === 'string') {
      return { type: 'info', area: '', description: h, recommendation: '' };
    }
    return {
      type: h.typ || 'info',
      area: h.bereich || '',
      description: h.beschreibung || '',
      recommendation: h.empfehlung || '',
    };
  });
}
