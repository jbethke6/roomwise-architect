import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FloorplanAnalysis, ROOM_TYPE_LABELS } from '@/types/floorplan';
import { cn } from '@/lib/utils';
import { Info, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ResultsTableProps {
  analysis: FloorplanAnalysis;
}

function getConfidenceBadge(confidence: number, interpolated: boolean) {
  if (confidence >= 0.9) {
    return (
      <Badge className="bg-success/20 text-success hover:bg-success/30">
        <CheckCircle className="mr-1 h-3 w-3" />
        {(confidence * 100).toFixed(0)}%
      </Badge>
    );
  }
  if (confidence >= 0.75) {
    return (
      <Badge className="bg-warning/20 text-warning hover:bg-warning/30">
        {(confidence * 100).toFixed(0)}%
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="bg-destructive/20 text-destructive hover:bg-destructive/30">
      <AlertTriangle className="mr-1 h-3 w-3" />
      {(confidence * 100).toFixed(0)}%
    </Badge>
  );
}

export function ResultsTable({ analysis }: ResultsTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-muted/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Raumanalyse</h3>
            <p className="text-sm text-muted-foreground">
              {analysis.rooms.length} Räume erkannt
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Maßstab</p>
            <p className="font-mono text-sm">
              1px = {(1 / analysis.scaling.pixelPerMeter * 100).toFixed(2)}cm
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[200px]">Raum</TableHead>
            <TableHead className="text-center">Typ</TableHead>
            <TableHead className="text-right">Länge (m)</TableHead>
            <TableHead className="text-right">Breite (m)</TableHead>
            <TableHead className="text-right">Fläche (m²)</TableHead>
            <TableHead className="text-center">Konfidenz</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {analysis.rooms.map((room, index) => (
            <TableRow
              key={index}
              className={cn(
                room.interpolated && 'bg-warning/5'
              )}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {room.name}
                  {room.interpolated && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-warning" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Maße wurden interpoliert
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary" className="font-normal">
                  {ROOM_TYPE_LABELS[room.type]}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono">
                {room.length.toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {room.width.toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-mono font-medium">
                {room.area.toFixed(2)}
              </TableCell>
              <TableCell className="text-center">
                {getConfidenceBadge(room.confidence, room.interpolated)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Footer - Total */}
      <div className="border-t border-border bg-primary/5 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Bruttogrundfläche (BGF)</p>
            <p className="text-2xl font-bold text-primary">
              {analysis.total.bgf.toFixed(2)} m²
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Gesamtgenauigkeit</p>
            <p className="text-lg font-semibold">
              {(analysis.total.accuracy * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
