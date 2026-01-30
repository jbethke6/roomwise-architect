export interface RoomMeasurement {
  name: string;
  type: 'raum' | 'flur' | 'bad' | 'kueche' | 'schlafzimmer' | 'wohnzimmer' | 'balkon' | 'terrasse' | 'abstellraum' | 'other';
  length: number;
  width: number;
  area: number;
  confidence: number;
  interpolated: boolean;
}

export interface FloorplanAnalysis {
  id: string;
  fileName: string;
  timestamp: Date;
  scaling: {
    unit: string;
    pixelPerMeter: number;
  };
  rooms: RoomMeasurement[];
  total: {
    bgf: number;
    hints: string[];
    accuracy: number;
  };
}

export interface AnalysisStatus {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  message: string;
}

export const ROOM_TYPE_LABELS: Record<RoomMeasurement['type'], string> = {
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
