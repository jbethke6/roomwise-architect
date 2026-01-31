import { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Maximize2 } from 'lucide-react';
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

export function FloorplanPreview({ imageUrl, fileName }: FloorplanPreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

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
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
                <div className="relative w-full h-full min-h-[80vh] bg-muted/50 flex items-center justify-center overflow-auto">
                  <img
                    src={imageUrl}
                    alt={fileName}
                    className="max-w-full max-h-full object-contain"
                    style={{
                      transform: `rotate(${rotation}deg)`,
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
        className="relative overflow-auto bg-muted/20"
        style={{ height: '400px' }}
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
            className="max-w-full max-h-full object-contain transition-transform duration-200 shadow-lg"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
