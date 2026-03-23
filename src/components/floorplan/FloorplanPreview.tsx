import { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Maximize2, Move, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';

interface FloorplanPreviewProps {
  imageUrl: string;
  fileName: string;
}

function useZoomPan(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom((prev) => {
      const next = Math.min(Math.max(prev + delta, 0.25), 8);
      // Reset pan when zooming back to fit
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [containerRef, handleWheel]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (zoom <= 1) return;
    setIsPanning(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [zoom]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  }, [isPanning]);

  const onPointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 8));
  const zoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(prev - 0.25, 0.25);
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };
  const rotate = () => setRotation((prev) => (prev + 90) % 360);
  const rotateBack = () => setRotation((prev) => (prev - 90 + 360) % 360);
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); setRotation(0); };

  return {
    zoom, rotation, pan, isPanning,
    onPointerDown, onPointerMove, onPointerUp,
    zoomIn, zoomOut, rotate, rotateBack, resetView,
  };
}

export function FloorplanPreview({ imageUrl, fileName }: FloorplanPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dialogContainerRef = useRef<HTMLDivElement>(null);
  const view = useZoomPan(containerRef);
  const dialogView = useZoomPan(dialogContainerRef);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Grundriss</h3>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {fileName}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={view.zoomOut} title="Herauszoomen">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <button
              onClick={view.resetView}
              className="text-xs text-muted-foreground w-14 text-center hover:text-foreground transition-colors"
              title="Ansicht zurücksetzen"
            >
              {Math.round(view.zoom * 100)}%
            </button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={view.zoomIn} title="Hineinzoomen">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={view.rotateBack} title="Links drehen">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={view.rotate} title="Rechts drehen">
              <RotateCw className="h-4 w-4" />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Vollbild">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
                <div className="flex items-center gap-1 border-b border-border bg-muted/30 px-4 py-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={dialogView.zoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <button onClick={dialogView.resetView} className="text-xs text-muted-foreground w-14 text-center hover:text-foreground">
                    {Math.round(dialogView.zoom * 100)}%
                  </button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={dialogView.zoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={dialogView.rotateBack}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={dialogView.rotate}>
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  {dialogView.zoom > 1 && (
                    <span className="text-xs text-muted-foreground ml-2 flex items-center gap-1">
                      <Move className="h-3 w-3" /> Ziehen zum Bewegen
                    </span>
                  )}
                </div>
                <div
                  ref={dialogContainerRef}
                  className="relative w-full overflow-hidden flex items-center justify-center bg-muted/20"
                  style={{
                    height: '80vh',
                    cursor: dialogView.zoom > 1 ? (dialogView.isPanning ? 'grabbing' : 'grab') : 'default',
                  }}
                  onPointerDown={dialogView.onPointerDown}
                  onPointerMove={dialogView.onPointerMove}
                  onPointerUp={dialogView.onPointerUp}
                >
                  <img
                    src={imageUrl}
                    alt={fileName}
                    className="max-w-full max-h-full object-contain select-none pointer-events-none"
                    draggable={false}
                    style={{
                      transform: `translate(${dialogView.pan.x}px, ${dialogView.pan.y}px) scale(${dialogView.zoom}) rotate(${dialogView.rotation}deg)`,
                      transition: dialogView.isPanning ? 'none' : 'transform 0.15s ease-out',
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Image Container */}
      <div
        ref={containerRef}
        className="relative overflow-hidden bg-muted/20"
        style={{
          height: '400px',
          cursor: view.zoom > 1 ? (view.isPanning ? 'grabbing' : 'grab') : 'default',
        }}
        onPointerDown={view.onPointerDown}
        onPointerMove={view.onPointerMove}
        onPointerUp={view.onPointerUp}
      >
        <div
          className="absolute inset-0 flex items-center justify-center p-4"
          style={{
            backgroundImage: `
              linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%),
              linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%),
              linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)
            `,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          }}
        >
          <img
            src={imageUrl}
            alt={fileName}
            className="max-w-full max-h-full object-contain select-none pointer-events-none"
            draggable={false}
            style={{
              transform: `translate(${view.pan.x}px, ${view.pan.y}px) scale(${view.zoom}) rotate(${view.rotation}deg)`,
              transition: view.isPanning ? 'none' : 'transform 0.15s ease-out',
            }}
          />
        </div>
      </div>

      {/* Hint */}
      {view.zoom <= 1 && (
        <div className="border-t border-border bg-muted/20 px-4 py-1.5 text-center">
          <p className="text-[11px] text-muted-foreground">Mausrad zum Zoomen • Bei Zoom: Klicken & Ziehen zum Bewegen</p>
        </div>
      )}
    </div>
  );
}
