"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, X, RefreshCcw, Check, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  documentName: string;
}

export function CameraCaptureModal({ isOpen, onClose, onCapture, documentName }: CameraCaptureModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    setCapturedImage(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError("Camera access denied or unavailable. Please use the file upload option instead.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start camera when modal opens
  if (isOpen && !stream && !error && !capturedImage) {
    startCamera();
  }

  // Cleanup on close
  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setError(null);
    onClose();
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setCapturedImage(dataUrl);
      stopCamera(); // stop the video stream while previewing
    }
  };

  const acceptPhoto = async () => {
    if (!capturedImage) return;
    
    // Convert base64 to File object
    const res = await fetch(capturedImage);
    const blob = await res.blob();
    const file = new File([blob], `${documentName.replace(/\\s+/g, '_')}_capture.jpg`, { type: "image/jpeg" });
    
    onCapture(file);
    handleClose();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Take Photo - {documentName}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-black/5 rounded-lg overflow-hidden relative">
          
          {error ? (
            <div className="p-6 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <label className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      onCapture(e.target.files[0]);
                      handleClose();
                    }
                  }}
                />
                <Upload className="mr-2 h-4 w-4" />
                Fallback to File Upload
              </label>
            </div>
          ) : capturedImage ? (
            <div className="w-full h-full flex flex-col">
              <img src={capturedImage} alt="Captured preview" className="w-full h-auto max-h-[60vh] object-contain" />
              <div className="flex justify-center gap-4 p-4 bg-background border-t">
                <Button variant="outline" onClick={retakePhoto}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Retake
                </Button>
                <Button onClick={acceptPhoto} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Check className="mr-2 h-4 w-4" />
                  Accept Photo
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col relative group">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-auto max-h-[60vh] object-contain bg-black"
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <Button 
                  size="lg" 
                  className="rounded-full h-16 w-16 p-0 border-4 border-white/50 bg-white/20 hover:bg-white/40 shadow-xl backdrop-blur-sm"
                  onClick={takePhoto}
                >
                  <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center">
                    <Camera className="h-6 w-6 text-black" />
                  </div>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
