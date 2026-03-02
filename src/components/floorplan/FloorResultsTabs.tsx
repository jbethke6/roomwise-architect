import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AnalysisResult, FloorData, RoomMeasurement } from '@/types/floorplan';
import { EditableResultsTable } from './EditableResultsTable';
import { AnalysisHints } from './AnalysisHints';
import { Building2, Layers, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloorResultsTabsProps {
  result: AnalysisResult;
  onResultChange: (result: AnalysisResult) => void;
}

export function FloorResultsTabs({ result, onResultChange }: FloorResultsTabsProps) {
  const floors = result.floors;

  const handleRoomsChange = (floorIndex: number, rooms: RoomMeasurement[]) => {
    const updatedFloors = [...result.floors];
    updatedFloors[floorIndex] = {
      ...updatedFloors[floorIndex],
      rooms,
      bgf: Math.round(rooms.reduce((s, r) => s + r.area, 0) * 100) / 100,
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
            {/* Total BGF Card */}
            <div className="rounded-xl border border-border bg-primary/5 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt-Bruttogrundfläche (BGF)</p>
                  <p className="text-3xl font-bold text-primary">
                    {result.totalBgf.toFixed(2)} m²
                  </p>
                </div>
                <div className="flex items-center gap-2">
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
            </div>

            {/* Floor breakdown */}
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="border-b border-border bg-muted/30 px-6 py-4">
                <h3 className="font-semibold text-foreground">Etagen-Übersicht</h3>
              </div>
              <div className="divide-y divide-border">
                {floors.map((floor, i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">{floor.floor}</p>
                        <p className="text-sm text-muted-foreground">
                          {floor.rooms.length} Räume
                        </p>
                      </div>
                    </div>
                    <p className="font-mono text-lg font-semibold text-foreground">
                      {floor.bgf.toFixed(2)} m²
                    </p>
                  </div>
                ))}
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

            {/* Errors */}
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

            {/* Skipped pages */}
            {result.skippedPages.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Übersprungene Seiten (keine Grundrisse): {result.skippedPages.join(', ')}
              </p>
            )}
          </div>
        </TabsContent>
      )}

      {/* Floor Tabs */}
      {floors.map((floor, i) => (
        <TabsContent key={i} value={`floor-${i}`}>
          <div className="space-y-6">
            <EditableResultsTable
              rooms={floor.rooms}
              floorLabel={floor.floor}
              bgf={floor.bgf}
              onRoomsChange={(rooms) => handleRoomsChange(i, rooms)}
            />

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
      ))}
    </Tabs>
  );
}
