import { useState, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { RoomMeasurement, RoomType, ROOM_TYPE_LABELS } from '@/types/floorplan';
import { cn } from '@/lib/utils';
import { Info, AlertTriangle, CheckCircle, Pencil, Check, X, Plus, Trash2, Hand } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface EditableResultsTableProps {
  rooms: RoomMeasurement[];
  floorLabel: string;
  bgf: number;
  unitId: string;
  onRoomsChange: (rooms: RoomMeasurement[]) => void;
  readOnly?: boolean;
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

function getToleranceBadge(tolerance: number) {
  if (tolerance <= 0) return null;
  const pct = (tolerance * 100).toFixed(0);
  return (
    <Badge variant="outline" className="text-xs font-normal">
      ±{pct}%
    </Badge>
  );
}

export function EditableResultsTable({ rooms, floorLabel, bgf, unitId, onRoomsChange, readOnly = false }: EditableResultsTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<RoomMeasurement>>({});
  const [isNewRoom, setIsNewRoom] = useState(false);

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditValues({ ...rooms[index] });
    setIsNewRoom(false);
  };

  const cancelEditing = () => {
    if (isNewRoom && editingIndex !== null) {
      onRoomsChange(rooms.filter((_, i) => i !== editingIndex));
    }
    setEditingIndex(null);
    setEditValues({});
    setIsNewRoom(false);
  };

  const saveEditing = useCallback(() => {
    if (editingIndex === null) return;
    const length = editValues.length || 0;
    const width = editValues.width || 0;
    const area = Math.round(length * width * 100) / 100;

    const updatedRooms = [...rooms];
    updatedRooms[editingIndex] = {
      ...updatedRooms[editingIndex],
      name: editValues.name || updatedRooms[editingIndex].name,
      type: editValues.type || updatedRooms[editingIndex].type,
      length,
      width,
      area,
      confidence: 1.0,
      interpolated: false,
      tolerance: 0,
    };

    onRoomsChange(updatedRooms);
    setEditingIndex(null);
    setEditValues({});
    setIsNewRoom(false);
  }, [editingIndex, editValues, rooms, onRoomsChange]);

  const addRoom = () => {
    const newRoom: RoomMeasurement = {
      name: `Raum ${rooms.length + 1}`,
      type: 'sonstige',
      unitId,
      length: 0,
      width: 0,
      area: 0,
      areaFactor: 1.0,
      confidence: 1.0,
      interpolated: false,
      tolerance: 0,
      handwritten: false,
    };
    const updated = [...rooms, newRoom];
    onRoomsChange(updated);
    setEditingIndex(updated.length - 1);
    setEditValues(newRoom);
    setIsNewRoom(true);
  };

  const deleteRoom = (index: number) => {
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditValues({});
      setIsNewRoom(false);
    } else if (editingIndex !== null && index < editingIndex) {
      setEditingIndex(editingIndex - 1);
    }
    onRoomsChange(rooms.filter((_, i) => i !== index));
  };

  const avgConfidence = rooms.length > 0
    ? rooms.reduce((s, r) => s + r.confidence, 0) / rooms.length
    : 0;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="border-b border-border bg-muted/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{floorLabel} – Raumanalyse</h3>
            <p className="text-sm text-muted-foreground">
              {rooms.length} Räume • Klicken zum Bearbeiten
            </p>
          </div>
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={addRoom} disabled={editingIndex !== null}>
              <Plus className="mr-2 h-4 w-4" />
              Raum hinzufügen
            </Button>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[160px]">Raum</TableHead>
            <TableHead className="text-center">Typ</TableHead>
            <TableHead className="text-right">Länge (m)</TableHead>
            <TableHead className="text-right">Breite (m)</TableHead>
            <TableHead className="text-right">Fläche (m²)</TableHead>
            <TableHead className="text-center">Konfidenz</TableHead>
            <TableHead className="text-center">Toleranz</TableHead>
            {!readOnly && <TableHead className="w-[90px] text-center">Aktionen</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rooms.map((room, index) => (
            <TableRow
              key={index}
              className={cn(
                room.interpolated && 'bg-warning/5',
                editingIndex === index && 'bg-primary/5',
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
                      onValueChange={(v) => setEditValues({ ...editValues, type: v as RoomType })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROOM_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number" step="0.01"
                      value={editValues.length || ''}
                      onChange={(e) => setEditValues({ ...editValues, length: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-right font-mono"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number" step="0.01"
                      value={editValues.width || ''}
                      onChange={(e) => setEditValues({ ...editValues, width: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-right font-mono"
                    />
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium text-muted-foreground">
                    {((editValues.length || 0) * (editValues.width || 0)).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">Manuell</Badge>
                  </TableCell>
                  <TableCell />
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
                          <TooltipContent>Maße wurden interpoliert (±{(room.tolerance * 100).toFixed(0)}%)</TooltipContent>
                        </Tooltip>
                      )}
                      {room.handwritten && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Hand className="h-4 w-4 text-copper" />
                          </TooltipTrigger>
                          <TooltipContent>Handschriftliche Beschriftung erkannt</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-normal">
                      {ROOM_TYPE_LABELS[room.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{room.length.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{room.width.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono font-medium">{room.area.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    {getConfidenceBadge(room.confidence, room.interpolated)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getToleranceBadge(room.tolerance)}
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => startEditing(index)}
                          disabled={editingIndex !== null}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteRoom(index)}
                          disabled={editingIndex !== null}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="border-t border-border bg-primary/5 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">BGF dieser Etage</p>
            <p className="text-2xl font-bold text-primary">
              {bgf.toFixed(2)} m²
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Ø Konfidenz</p>
            <p className="text-lg font-semibold">
              {(avgConfidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
