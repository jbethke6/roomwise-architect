import { useState, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AnalysisResult, FloorData, RoomMeasurement, ResidentialUnit, ExtractedPage } from '@/types/floorplan';
import { EditableResultsTable } from './EditableResultsTable';
import { AnalysisHints } from './AnalysisHints';
import { FloorplanPreview } from './FloorplanPreview';
import { Building2, Layers, AlertTriangle, CheckCircle, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloorResultsTabsProps {
  result: AnalysisResult;
  onResultChange: (result: AnalysisResult) => void;
  pages?: ExtractedPage[];
  readOnly?: boolean;
}

/** Group rooms by unitId and return sorted groups */
function groupRoomsByUnit(rooms: RoomMeasurement[], units: ResidentialUnit[]) {
  const unitMap = new Map<string, RoomMeasurement[]>();
  for (const room of rooms) {
    const key = room.unitId || 'WE_1';
    if (!unitMap.has(key)) unitMap.set(key, []);
    unitMap.get(key)!.push(room);
  }

  // Sort by unitId naturally
  const sortedKeys = Array.from(unitMap.keys()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return sortedKeys.map(unitId => {
    const unitInfo = units.find(u => u.unitId === unitId);
    return {
      unitId,
      label: unitInfo?.label || unitId,
      type: unitInfo?.type || '',
      livingAreaWoflv: unitInfo?.livingAreaWoflv ?? null,
      netArea: unitInfo?.netArea ?? null,
      roomCount: unitInfo?.roomCount ?? null,
      rooms: unitMap.get(unitId)!,
    };
  });
}

export function FloorResultsTabs({ result, onResultChange, pages = [], readOnly = false }: FloorResultsTabsProps) {
  const floors = result.floors;

  const getFloorImage = (floor: FloorData): string | null => {
    const page = pages.find(p => p.pageNumber === floor.pageNumber);
    if (page) return page.imageBase64;
    const byFloor = pages.find(p => p.floor && p.floor === floor.floor);
    return byFloor?.imageBase64 || null;
  };

  const handleRoomsChange = (floorIndex: number, unitId: string, updatedUnitRooms: RoomMeasurement[]) => {
    const floor = result.floors[floorIndex];
    // Replace only rooms belonging to this unit, keep others
    const otherRooms = floor.rooms.filter(r => (r.unitId || 'WE_1') !== unitId);
    const allRooms = [...otherRooms, ...updatedUnitRooms];

    const updatedFloors = [...result.floors];
    updatedFloors[floorIndex] = {
      ...updatedFloors[floorIndex],
      rooms: allRooms,
      bgf: Math.round(allRooms.reduce((s, r) => s + r.area, 0) * 100) / 100,
    };

    onResultChange({
      ...result,
      floors: updatedFloors,
      totalBgf: Math.round(updatedFloors.reduce((s, f) => s + f.bgf, 0) * 100) / 100,
    });
  };

  if (floors.length === 0) {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-foreground">Keine Grundrisse erkannt</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Keiner der hochgeladenen Seiten wurde als Grundriss (Draufsicht) erkannt.
          {result.skippedPages.length > 0 && (
            <> Übersprungene Seiten: {result.skippedPages.join(', ')}</>
          )}
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue={floors.length > 1 ? 'summary' : `floor-0`} className="w-full">
      <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
        {floors.length > 1 && (
          <TabsTrigger value="summary" className="gap-1.5">
            <Layers className="h-4 w-4" />
            Zusammenfassung
          </TabsTrigger>
        )}
        {floors.map((floor, i) => (
          <TabsTrigger key={i} value={`floor-${i}`} className="gap-1.5">
            <Building2 className="h-4 w-4" />
            {floor.floor}
            <Badge variant="secondary" className="ml-1 text-xs">
              {floor.bgf.toFixed(1)} m²
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Summary Tab */}
      {floors.length > 1 && (
        <TabsContent value="summary">
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-primary/5 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt-Bruttogrundfläche (BGF)</p>
                  <p className="text-3xl font-bold text-primary">
                    {result.totalBgf.toFixed(2)} m²
                  </p>
                </div>
                <Badge className={cn(
                  result.status === 'success'
                    ? 'bg-success/20 text-success'
                    : 'bg-warning/20 text-warning',
                )}>
                  {result.status === 'success' ? (
                    <><CheckCircle className="mr-1 h-3 w-3" />Vollständig</>
                  ) : (
                    <><AlertTriangle className="mr-1 h-3 w-3" />Teilweise</>
                  )}
                </Badge>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="border-b border-border bg-muted/30 px-6 py-4">
                <h3 className="font-semibold text-foreground">Etagen-Übersicht</h3>
              </div>
              <div className="divide-y divide-border">
                {floors.map((floor, i) => {
                  const unitGroups = groupRoomsByUnit(floor.rooms, floor.residentialUnits);
                  return (
                    <div key={i} className="px-6 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium text-foreground">{floor.floor}</p>
                            <p className="text-sm text-muted-foreground">
                              {floor.rooms.length} Räume
                              {unitGroups.length > 1 && ` • ${unitGroups.length} Wohneinheiten`}
                            </p>
                          </div>
                        </div>
                        <p className="font-mono text-lg font-semibold text-foreground">
                          {floor.bgf.toFixed(2)} m²
                        </p>
                      </div>
                      {unitGroups.length > 1 && (
                        <div className="ml-8 mt-2 space-y-1">
                          {unitGroups.map(group => (
                            <div key={group.unitId} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <Home className="h-3.5 w-3.5" />
                                {group.label}
                                {group.livingAreaWoflv != null && (
                                  <Badge variant="outline" className="text-xs font-normal ml-1">
                                    WoFlV: {group.livingAreaWoflv.toFixed(1)} m²
                                  </Badge>
                                )}
                              </span>
                              <span className="font-mono">
                                {group.rooms.reduce((s, r) => s + r.area, 0).toFixed(2)} m²
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="border-t-2 border-primary/30 bg-primary/5 px-6 py-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground">Gesamt BGF</p>
                  <p className="font-mono text-xl font-bold text-primary">
                    {result.totalBgf.toFixed(2)} m²
                  </p>
                </div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-xl border border-warning/50 bg-warning/10 p-4">
                <h4 className="font-semibold text-foreground mb-2">Warnungen</h4>
                <ul className="space-y-1">
                  {result.errors.map((err, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.skippedPages.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Übersprungene Seiten (keine Grundrisse): {result.skippedPages.join(', ')}
              </p>
            )}
          </div>
        </TabsContent>
      )}

      {/* Floor Tabs */}
      {floors.map((floor, i) => {
        const unitGroups = groupRoomsByUnit(floor.rooms, floor.residentialUnits);
        const hasMultipleUnits = unitGroups.length > 1;
        const floorImage = getFloorImage(floor);

        return (
          <TabsContent key={i} value={`floor-${i}`}>
            <div className="space-y-6">
              {/* Floor plan image preview */}
              {floorImage && (
                <FloorplanPreview imageUrl={floorImage} fileName={`${floor.floor} – Seite ${floor.pageNumber}`} />
              )}

              {/* Rooms grouped by residential unit */}
              {hasMultipleUnits ? (
                unitGroups.map(group => (
                  <div key={group.unitId} className="space-y-2">
                    {/* Unit header */}
                    <div className="flex items-center gap-2 px-1">
                      <Home className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-foreground text-sm">{group.label}</h3>
                      {group.type && (
                        <Badge variant="outline" className="text-xs font-normal">{group.type}</Badge>
                      )}
                      {group.livingAreaWoflv != null && (
                        <Badge variant="secondary" className="text-xs">
                          WoFlV: {group.livingAreaWoflv.toFixed(1)} m²
                        </Badge>
                      )}
                      {group.roomCount != null && (
                        <span className="text-xs text-muted-foreground">
                          {group.roomCount} Zimmer
                        </span>
                      )}
                    </div>
                    <EditableResultsTable
                      rooms={group.rooms}
                      floorLabel={`${floor.floor} – ${group.label}`}
                      bgf={Math.round(group.rooms.reduce((s, r) => s + r.area, 0) * 100) / 100}
                      unitId={group.unitId}
                      onRoomsChange={(rooms) => handleRoomsChange(i, group.unitId, rooms)}
                      readOnly={readOnly}
                    />
                  </div>
                ))
              ) : (
                <EditableResultsTable
                  rooms={floor.rooms}
                  floorLabel={floor.floor}
                  bgf={floor.bgf}
                  unitId={unitGroups[0]?.unitId || 'WE_1'}
                  onRoomsChange={(rooms) => handleRoomsChange(i, unitGroups[0]?.unitId || 'WE_1', rooms)}
                  readOnly={readOnly}
                />
              )}

              {floor.hints.length > 0 && (
                <AnalysisHints hints={floor.hints} />
              )}

              {floor.dimensionChains.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <h4 className="font-semibold text-foreground mb-3 text-sm">Erkannte Maßketten</h4>
                  <div className="space-y-2">
                    {floor.dimensionChains.map((chain, ci) => (
                      <div key={ci} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{chain.description}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{chain.valueMeter.toFixed(2)} m</span>
                          <Badge variant="secondary" className="text-xs">
                            {(chain.confidence * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
