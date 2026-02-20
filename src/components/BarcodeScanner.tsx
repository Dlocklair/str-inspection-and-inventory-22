import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export const BarcodeScanner = ({ isOpen, onClose, onScan }: BarcodeScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const scanner = new Html5Qrcode('barcode-reader');
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 150 } },
      (decodedText) => {
        onScan(decodedText);
        scanner.stop().catch(() => {});
        onClose();
      },
      () => {} // ignore scan failures
    ).catch(err => {
      setError('Camera access denied or unavailable. Please allow camera permissions.');
      console.error('Scanner error:', err);
    });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [isOpen]);

  const handleClose = () => {
    scannerRef.current?.stop().catch(() => {});
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Barcode / QR Code</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div id="barcode-reader" className="w-full rounded-lg overflow-hidden" />
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          <p className="text-xs text-muted-foreground text-center">
            Point your camera at a barcode or QR code
          </p>
          <Button variant="outline" onClick={handleClose} className="w-full gap-2">
            <X className="h-4 w-4" /> Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
