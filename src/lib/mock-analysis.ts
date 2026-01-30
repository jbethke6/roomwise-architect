import { FloorplanAnalysis, RoomMeasurement } from '@/types/floorplan';

// Mock data generator for demo purposes
export function generateMockAnalysis(fileName: string): FloorplanAnalysis {
  const rooms: RoomMeasurement[] = [
    {
      name: 'Wohnzimmer',
      type: 'wohnzimmer',
      length: 5.2,
      width: 4.1,
      area: 21.32,
      confidence: 0.94,
      interpolated: false,
    },
    {
      name: 'Küche',
      type: 'kueche',
      length: 3.8,
      width: 2.9,
      area: 11.02,
      confidence: 0.91,
      interpolated: false,
    },
    {
      name: 'Schlafzimmer 1',
      type: 'schlafzimmer',
      length: 4.0,
      width: 3.5,
      area: 14.0,
      confidence: 0.88,
      interpolated: true,
    },
    {
      name: 'Schlafzimmer 2',
      type: 'schlafzimmer',
      length: 3.2,
      width: 2.8,
      area: 8.96,
      confidence: 0.85,
      interpolated: true,
    },
    {
      name: 'Bad',
      type: 'bad',
      length: 2.4,
      width: 1.9,
      area: 4.56,
      confidence: 0.92,
      interpolated: false,
    },
    {
      name: 'Flur',
      type: 'flur',
      length: 4.5,
      width: 1.2,
      area: 5.4,
      confidence: 0.78,
      interpolated: true,
    },
    {
      name: 'Balkon',
      type: 'balkon',
      length: 3.0,
      width: 1.5,
      area: 4.5,
      confidence: 0.96,
      interpolated: false,
    },
  ];

  const totalBgf = rooms.reduce((sum, room) => sum + room.area, 0);
  const avgConfidence = rooms.reduce((sum, room) => sum + room.confidence, 0) / rooms.length;

  return {
    id: crypto.randomUUID(),
    fileName,
    timestamp: new Date(),
    scaling: {
      unit: 'm',
      pixelPerMeter: 42.5,
    },
    rooms,
    total: {
      bgf: Math.round(totalBgf * 100) / 100,
      hints: [
        'Maße für Schlafzimmer 1 & 2 aus Proportionen interpoliert',
        'Flurbreite aus angrenzenden Räumen abgeleitet',
        'Maßstab aus Maßkette bei Wohnzimmer erkannt',
      ],
      accuracy: Math.round(avgConfidence * 100) / 100,
    },
  };
}

// Simulate analysis delay
export function simulateAnalysis(
  fileName: string,
  onProgress: (progress: number, message: string) => void
): Promise<FloorplanAnalysis> {
  return new Promise((resolve) => {
    const steps = [
      { progress: 10, message: 'Bild wird hochgeladen...', delay: 500 },
      { progress: 25, message: 'Bildqualität wird geprüft...', delay: 800 },
      { progress: 40, message: 'Maßstab wird erkannt...', delay: 1000 },
      { progress: 55, message: 'Räume werden identifiziert...', delay: 1200 },
      { progress: 70, message: 'Maße werden extrahiert...', delay: 1000 },
      { progress: 85, message: 'Fehlende Werte werden interpoliert...', delay: 800 },
      { progress: 95, message: 'Ergebnisse werden validiert...', delay: 600 },
      { progress: 100, message: 'Analyse abgeschlossen!', delay: 400 },
    ];

    let currentStep = 0;

    const processStep = () => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        onProgress(step.progress, step.message);
        currentStep++;
        setTimeout(processStep, step.delay);
      } else {
        resolve(generateMockAnalysis(fileName));
      }
    };

    processStep();
  });
}
