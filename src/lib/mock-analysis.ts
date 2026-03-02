import { RoomMeasurement } from '@/types/floorplan';

// Mock data generator for demo/testing purposes
export function generateMockRooms(): RoomMeasurement[] {
  return [
    { name: 'Wohnzimmer', type: 'wohnzimmer', length: 5.2, width: 4.1, area: 21.32, confidence: 0.94, interpolated: false, tolerance: 0, handwritten: false },
    { name: 'Küche', type: 'kueche', length: 3.8, width: 2.9, area: 11.02, confidence: 0.91, interpolated: false, tolerance: 0, handwritten: false },
    { name: 'Schlafzimmer 1', type: 'schlafzimmer', length: 4.0, width: 3.5, area: 14.0, confidence: 0.88, interpolated: true, tolerance: 0.15, handwritten: false },
    { name: 'Bad', type: 'bad', length: 2.4, width: 1.9, area: 4.56, confidence: 0.92, interpolated: false, tolerance: 0, handwritten: false },
    { name: 'Flur', type: 'flur', length: 4.5, width: 1.2, area: 5.4, confidence: 0.78, interpolated: true, tolerance: 0.12, handwritten: true },
    { name: 'Balkon', type: 'balkon', length: 3.0, width: 1.5, area: 4.5, confidence: 0.96, interpolated: false, tolerance: 0, handwritten: false },
  ];
}
