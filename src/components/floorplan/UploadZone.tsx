import { useCallback, useState } from 'react';
import { Upload, Image, FileText, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function UploadZone({ onFileSelect, isProcessing }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Nur JPG, PNG oder PDF Dateien erlaubt';
    }
    if (file.size > MAX_SIZE) {
      return 'Datei ist zu groß (max. 10MB)';
    }
    return null;
  };

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
  };

  const startAnalysis = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  return (
    <div className="w-full">
      {/* Error Display */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative rounded-xl border-2 border-dashed transition-all duration-300',
          'bg-blueprint-light/50 backdrop-blur-sm',
          isDragging
            ? 'border-copper bg-copper/10 scale-[1.02]'
            : 'border-blueprint-grid hover:border-primary hover:bg-blueprint-light',
          isProcessing && 'pointer-events-none opacity-60',
          selectedFile ? 'p-4' : 'p-8'
        )}
      >
        {/* Blueprint Grid Pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--blueprint-grid)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--blueprint-grid)) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />

        {selectedFile ? (
          /* Selected File Preview */
          <div className="relative z-10">
            <div className="flex items-start gap-4">
              {/* Thumbnail */}
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                {preview ? (
                  <img
                    src={preview}
                    alt="Vorschau"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1">
                <p className="font-medium text-foreground">{selectedFile.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={startAnalysis}
                    disabled={isProcessing}
                    className="bg-copper hover:bg-copper-dark text-accent-foreground"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Analyse starten
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearSelection}
                    disabled={isProcessing}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Abbrechen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State - Drop Zone */
          <label className="relative z-10 flex cursor-pointer flex-col items-center">
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleInputChange}
              className="sr-only"
              disabled={isProcessing}
            />
            
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <Image className="h-10 w-10 text-primary" />
            </div>
            
            <h3 className="text-lg font-semibold text-foreground">
              Grundriss hochladen
            </h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Ziehen Sie eine Datei hierher oder klicken Sie zum Auswählen
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              JPG, PNG oder PDF • Max. 10MB
            </p>

            <Button variant="outline" className="mt-4" asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" />
                Datei auswählen
              </span>
            </Button>
          </label>
        )}
      </div>
    </div>
  );
}
