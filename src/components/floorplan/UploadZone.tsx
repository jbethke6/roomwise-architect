import { useState, useCallback } from 'react';
import { Upload, Image, FileText, X, AlertCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ExtractedPage } from '@/types/floorplan';
import { extractPdfPages, imageFileToBase64 } from '@/lib/pdf-utils';

interface UploadZoneProps {
  onPagesReady: (pages: ExtractedPage[]) => void;
  isProcessing: boolean;
  existingPages: ExtractedPage[];
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export function UploadZone({ onPagesReady, isProcessing, existingPages }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState('');

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Nur JPG, PNG oder PDF Dateien erlaubt';
    }
    if (file.size > MAX_SIZE) {
      return 'Datei ist zu groß (max. 50MB)';
    }
    return null;
  };

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newPages: ExtractedPage[] = [];
    setError(null);
    setExtracting(true);

    try {
      let globalPageNum = existingPages.length;

      for (const file of fileArray) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          continue;
        }

        if (file.type === 'application/pdf') {
          setExtractionProgress(`PDF wird verarbeitet: ${file.name}...`);
          const pdfPages = await extractPdfPages(file, (current, total) => {
            setExtractionProgress(`${file.name}: Seite ${current}/${total}...`);
          });

          for (const pdfPage of pdfPages) {
            globalPageNum++;
            newPages.push({
              id: crypto.randomUUID(),
              pageNumber: globalPageNum,
              fileName: file.name,
              imageBase64: pdfPage.imageBase64,
              thumbnailUrl: pdfPage.thumbnailUrl,
            });
          }
        } else {
          // Image file
          setExtractionProgress(`Bild wird geladen: ${file.name}...`);
          const base64 = await imageFileToBase64(file);
          globalPageNum++;
          newPages.push({
            id: crypto.randomUUID(),
            pageNumber: globalPageNum,
            fileName: file.name,
            imageBase64: base64,
            thumbnailUrl: base64,
          });
        }
      }

      if (newPages.length > 0) {
        onPagesReady([...existingPages, ...newPages]);
      }
    } catch (err: any) {
      setError(`Fehler beim Verarbeiten: ${err.message}`);
    } finally {
      setExtracting(false);
      setExtractionProgress('');
    }
  }, [existingPages, onPagesReady]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  const disabled = isProcessing || extracting;

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

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
          disabled && 'pointer-events-none opacity-60',
          'p-8',
        )}
      >
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

        <label className="relative z-10 flex cursor-pointer flex-col items-center">
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            multiple
            onChange={handleInputChange}
            className="sr-only"
            disabled={disabled}
          />

          {extracting ? (
            <>
              <div className="mb-4 rounded-full bg-copper/10 p-4 animate-pulse">
                <FileText className="h-10 w-10 text-copper" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Seiten werden extrahiert...</h3>
              <p className="mt-2 text-sm text-muted-foreground">{extractionProgress}</p>
            </>
          ) : (
            <>
              <div className="mb-4 rounded-full bg-primary/10 p-4">
                {existingPages.length > 0 ? (
                  <Plus className="h-10 w-10 text-primary" />
                ) : (
                  <Image className="h-10 w-10 text-primary" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {existingPages.length > 0 ? 'Weitere Dateien hinzufügen' : 'Grundrisse hochladen'}
              </h3>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Ziehen Sie Dateien hierher oder klicken Sie zum Auswählen
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                JPG, PNG oder PDF • Mehrere Dateien & mehrseitige PDFs • Max. 50MB
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Dateien auswählen
                </span>
              </Button>
            </>
          )}
        </label>
      </div>
    </div>
  );
}
