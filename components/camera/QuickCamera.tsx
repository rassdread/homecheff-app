'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface QuickCameraProps {
  onCapture: (photoUrl: string) => void;
  onClose: () => void;
  onBack: () => void;
}

export default function QuickCamera({ onCapture, onClose, onBack }: QuickCameraProps) {
  const { t } = useTranslation();
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'requesting' | 'granted' | 'denied' | 'unavailable'>('requesting');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Request camera permission and start stream
  const requestCameraAccess = useCallback(async () => {
    try {
      setPermissionStatus('requesting');
      setCameraError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      setCameraStream(stream);
      setPermissionStatus('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error: any) {
      console.error('Camera access error:', error);
      setPermissionStatus('denied');
      
      let errorMessage = t('camera.errors.default');
      
      if (error.name === 'NotAllowedError') {
        errorMessage = t('camera.errors.notAllowed');
      } else if (error.name === 'NotFoundError') {
        errorMessage = t('camera.errors.notFound');
      } else if (error.name === 'NotReadableError') {
        errorMessage = t('camera.errors.notReadable');
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = t('camera.errors.overconstrained');
      } else if (error.name === 'SecurityError') {
        errorMessage = t('camera.errors.security');
      }
      
      setCameraError(errorMessage);
    }
  }, [t]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  // Take photo from video stream
  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(photoDataUrl);
    stopCamera();
  }, [stopCamera]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCapturedImage(result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Initialize camera on mount
  useEffect(() => {
    const hasCamera = typeof navigator !== 'undefined' && 
                     navigator.mediaDevices && 
                     'getUserMedia' in navigator.mediaDevices;
    
    if (hasCamera) {
      requestCameraAccess();
    } else {
      setPermissionStatus('unavailable');
      setCameraError(t('camera.errors.notFound'));
    }

    return () => {
      stopCamera();
    };
  }, [requestCameraAccess, stopCamera, t]);

  const handleRetake = () => {
    setCapturedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (permissionStatus === 'granted') {
      requestCameraAccess();
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black text-white">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        
        <h2 className="text-lg font-semibold">{t('camera.takePhoto')}</h2>
        
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 flex items-center justify-center bg-gray-900 relative">
        {!capturedImage ? (
          <div className="w-full h-full flex items-center justify-center">
            {permissionStatus === 'granted' && cameraStream ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                  <button
                    onClick={takePhoto}
                    className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-16 h-16 bg-gray-800 rounded-full"></div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center px-4">
                <div className="w-64 h-64 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 border-4 border-dashed border-gray-600 mx-auto">
                  {permissionStatus === 'requesting' ? (
                    <div className="text-center">
                      <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
                      <p className="text-gray-400 text-sm">{t('camera.loading')}</p>
                    </div>
                  ) : (
                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  )}
                </div>
                
                {cameraError && (
                  <div className="bg-yellow-900 text-yellow-200 p-4 rounded-xl mb-6 max-w-md mx-auto">
                    <p className="text-sm">{cameraError}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {(permissionStatus === 'denied' || permissionStatus === 'unavailable') && (
                    <button
                      onClick={handleFileUpload}
                      className="bg-white text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors"
                    >
                      📁 {t('camera.uploadPhoto')}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center max-w-md mx-auto p-4 pb-20">
            <div className="mb-8">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full max-w-sm mx-auto rounded-2xl shadow-2xl"
              />
            </div>
            
            <div className="flex gap-4 justify-center fixed bottom-8 left-1/2 transform -translate-x-1/2 z-10">
              <button
                onClick={handleRetake}
                className="flex items-center gap-2 bg-gray-700 text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-600 transition-colors text-lg shadow-lg"
              >
                <RotateCcw className="w-6 h-6" />
                {t('camera.retake')}
              </button>
              
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-emerald-700 transition-colors text-lg shadow-lg"
              >
                <Check className="w-6 h-6" />
                {t('camera.usePhoto')}
              </button>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,video/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <canvas
        ref={canvasRef}
        className="hidden"
      />
    </div>
  );
}
