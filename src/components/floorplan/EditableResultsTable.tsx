import { useState, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FloorplanAnalysis, RoomMeasurement, ROOM_TYPE_LABELS } from '@/types/floorplan';
import { cn } from '@/lib/utils';
import { Info, AlertTriangle, CheckCircle, Pencil, Check, X, Plus, Trash2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EditableResultsTableProps {
  analysis: FloorplanAnalysis;
  onAnalysisChange: (analysis: FloorplanAnalysis) => void;
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

export function EditableResultsTable({ analysis, onAnalysisChange }: EditableResultsTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<RoomMeasurement>>({});

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditValues({ ...analysis.rooms[index] });
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditValues({});
  };

  const saveEditing = useCallback(() => {
    if (editingIndex === null) return;

    const updatedRooms = [...analysis.rooms];
    const length = editValues.length || 0;
    const width = editValues.width || 0;
    const area = Math.round(length * width * 100) / 100;

    updatedRooms[editingIndex] = {
      ...updatedRooms[editingIndex],
      name: editValues.name || updatedRooms[editingIndex].name,
      type: editValues.type || updatedRooms[editingIndex].type,
      length,
      width,
      area,
      confidence: 1.0, // Manual entry = 100% confidence
      interpolated: false,
    };

    const totalBgf = updatedRooms.reduce((sum, room) => sum + room.area, 0);
    const avgConfidence = updatedRooms.reduce((sum, room) => sum + room.confidence, 0) / updatedRooms.length;

    onAnalysisChange({
      ...analysis,
      rooms: updatedRooms,
      total: {
        ...analysis.total,
        bgf: Math.round(totalBgf * 100) / 100,
        accuracy: Math.round(avgConfidence * 100) / 100,
      },
    });

    setEditingIndex(null);
    setEditValues({});
  }, [editingIndex, editValues, analysis, onAnalysisChange]);

  const addRoom = () => {
    const newRoom: RoomMeasurement = {
      name: `Raum ${analysis.rooms.length + 1}`,
      type: 'raum',
      length: 0,
      width: 0,
      area: 0,
      confidence: 1.0,
      interpolated: false,
    };

    const updatedRooms = [...analysis.rooms, newRoom];
    const totalBgf = updatedRooms.reduce((sum, room) => sum + room.area, 0);

    onAnalysisChange({
      ...analysis,
      rooms: updatedRooms,
      total: {
        ...analysis.total,
        bgf: Math.round(totalBgf * 100) / 100,
      },
    });

    // Start editing the new room immediately
    setEditingIndex(updatedRooms.length - 1);
    setEditValues(newRoom);
  };

  const deleteRoom = (index: number) => {
    const updatedRooms = analysis.rooms.filter((_, i) => i !== index);
    const totalBgf = updatedRooms.reduce((sum, room) => sum + room.area, 0);
    const avgConfidence = updatedRooms.length > 0 
      ? updatedRooms.reduce((sum, room) => sum + room.confidence, 0) / updatedRooms.length 
      : 0;

    onAnalysisChange({
      ...analysis,
      rooms: updatedRooms,
      total: {
        ...analysis.total,
        bgf: Math.round(totalBgf * 100) / 100,
        accuracy: Math.round(avgConfidence * 100) / 100,
      },
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-muted/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Raumanalyse</h3>
            <p className="text-sm text-muted-foreground">
              {analysis.rooms.length} Räume • Klicken zum Bearbeiten
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={addRoom}>
            <Plus className="mr-2 h-4 w-4" />
            Raum hinzufügen
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[180px]">Raum</TableHead>
            <TableHead className="text-center">Typ</TableHead>
            <TableHead className="text-right">Länge (m)</TableHead>
            <TableHead className="text-right">Breite (m)</TableHead>
            <TableHead className="text-right">Fläche (m²)</TableHead>
            <TableHead className="text-center">Konfidenz</TableHead>
            <TableHead className="w-[100px] text-center">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {analysis.rooms.map((room, index) => (
            <TableRow
              key={index}
              className={cn(
                room.interpolated && 'bg-warning/5',
                editingIndex === index && 'bg-primary/5'
              )}
            >
              {editingIndex === index ? (
                <>
                  <TableCell>
                    <Input
                      value={editValues.name || ''}
                      onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={editValues.type}
                      onValueChange={(value) => setEditValues({ ...editValues, type: value as RoomMeasurement['type'] })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROOM_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={editValues.length || ''}
                      onChange={(e) => setEditValues({ ...editValues, length: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-right font-mono"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={editValues.width || ''}
                      onChange={(e) => setEditValues({ ...editValues, width: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-right font-mono"
                    />
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium text-muted-foreground">
                    {(((editValues.length || 0) * (editValues.width || 0))).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">Manuell</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={saveEditing}>
                        <Check className="h-4 w-4 text-success" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelEditing}>
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </>
              ) : (
                <>
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
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => startEditing(index)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteRoom(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </>
              )}
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
            <p className="text-sm text-muted-foreground">Ø Konfidenz</p>
            <p className="text-lg font-semibold">
              {(analysis.total.accuracy * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
