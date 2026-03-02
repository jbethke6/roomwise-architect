import { Button } from '@/components/ui/button';
import { AnalysisResult } from '@/types/floorplan';
import { FileJson, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonsProps {
  result: AnalysisResult;
}

export function ExportButtons({ result }: ExportButtonsProps) {
  const exportAsJSON = () => {
    const data = {
      grundriss_analyse: {
        jobId: result.jobId,
        analysiert_am: result.analyzedAt.toISOString(),
        gesamt_bgf: result.totalBgf,
        status: result.status,
        etagen: result.floors.map((floor) => ({
          etage: floor.floor,
          bgf: floor.bgf,
          raeume: floor.rooms.map((room) => ({
            name: room.name,
            typ: room.type,
            laenge: room.length,
            breite: room.width,
            flaeche: room.area,
            konfidenz: room.confidence,
            interpoliert: room.interpolated,
            toleranz: room.tolerance,
            handschriftlich: room.handwritten,
          })),
          hinweise: floor.hints,
        })),
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bgf-analyse-${result.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON-Export erfolgreich');
  };

  const exportAsCSV = () => {
    const headers = ['Etage', 'Raum', 'Typ', 'Länge (m)', 'Breite (m)', 'Fläche (m²)', 'Konfidenz (%)', 'Toleranz (%)', 'Interpoliert', 'Handschrift'];
    const rows: string[][] = [];

    for (const floor of result.floors) {
      for (const room of floor.rooms) {
        rows.push([
          floor.floor,
          room.name,
          room.type,
          room.length.toFixed(2),
          room.width.toFixed(2),
          room.area.toFixed(2),
          (room.confidence * 100).toFixed(0),
          (room.tolerance * 100).toFixed(0),
          room.interpolated ? 'Ja' : 'Nein',
          room.handwritten ? 'Ja' : 'Nein',
        ]);
      }
    }

    rows.push([]);
    rows.push(['Gesamt BGF', '', '', '', '', result.totalBgf.toFixed(2), '', '', '', '']);

    const csvContent = [headers, ...rows].map((row) => row.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bgf-analyse-${result.id.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV-Export erfolgreich');
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportAsJSON}>
        <FileJson className="mr-2 h-4 w-4" />
        JSON
      </Button>
      <Button variant="outline" size="sm" onClick={exportAsCSV}>
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        CSV
      </Button>
    </div>
  );
}
