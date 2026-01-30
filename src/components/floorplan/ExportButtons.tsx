import { Button } from '@/components/ui/button';
import { FloorplanAnalysis } from '@/types/floorplan';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonsProps {
  analysis: FloorplanAnalysis;
}

export function ExportButtons({ analysis }: ExportButtonsProps) {
  const exportAsJSON = () => {
    const data = {
      grundriss: {
        skalierung: analysis.scaling,
        raeume: analysis.rooms.map(room => ({
          name: room.name,
          typ: room.type,
          masse: {
            laenge: room.length,
            breite: room.width,
            flaeche: room.area,
            konfidenz: room.confidence,
            interpoliert: room.interpolated,
          },
        })),
        gesamt: {
          bgf: analysis.total.bgf,
          hinweise: analysis.total.hints,
          genauigkeit: analysis.total.accuracy,
        },
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grundriss-analyse-${analysis.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('JSON-Export erfolgreich');
  };

  const exportAsCSV = () => {
    const headers = ['Raum', 'Typ', 'Länge (m)', 'Breite (m)', 'Fläche (m²)', 'Konfidenz (%)', 'Interpoliert'];
    const rows = analysis.rooms.map(room => [
      room.name,
      room.type,
      room.length.toFixed(2),
      room.width.toFixed(2),
      room.area.toFixed(2),
      (room.confidence * 100).toFixed(0),
      room.interpolated ? 'Ja' : 'Nein',
    ]);

    // Add total row
    rows.push([]);
    rows.push(['Bruttogrundfläche (BGF)', '', '', '', analysis.total.bgf.toFixed(2), '', '']);
    rows.push(['Gesamtgenauigkeit', '', '', '', '', (analysis.total.accuracy * 100).toFixed(0), '']);

    const csvContent = [headers, ...rows]
      .map(row => row.join(';'))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grundriss-analyse-${analysis.id.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('CSV-Export erfolgreich');
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={exportAsJSON}>
        <FileJson className="mr-2 h-4 w-4" />
        JSON exportieren
      </Button>
      <Button variant="outline" onClick={exportAsCSV}>
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        CSV exportieren
      </Button>
    </div>
  );
}
