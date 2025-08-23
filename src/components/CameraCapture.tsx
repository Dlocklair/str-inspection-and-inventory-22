import React, { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose, isOpen }) => {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, [webcamRef]);

  const retake = () => {
    setCapturedImage(null);
  };

  const acceptImage = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      setCapturedImage(null);
      onClose();
    }
  };

  const handleClose = () => {
    setCapturedImage(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Take Photo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {capturedImage ? (
            <div className="space-y-4">
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="w-full rounded-lg border"
              />
              <div className="flex gap-2 justify-center">
                <Button onClick={retake} variant="outline" className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Retake
                </Button>
                <Button onClick={acceptImage} className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Accept
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-full rounded-lg"
                videoConstraints={{
                  width: 640,
                  height: 480,
                  facingMode: "environment" // Use rear camera on mobile
                }}
              />
              <div className="flex gap-2 justify-center">
                <Button onClick={capture} className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Capture
                </Button>
                <Button onClick={handleClose} variant="outline" className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CameraCapture;