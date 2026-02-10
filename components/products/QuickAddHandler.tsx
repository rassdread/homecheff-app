'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CategoryFormSelector from './CategoryFormSelector';
import InspiratieFormHandler from './InspiratieFormHandler';
import { useTranslation } from '@/hooks/useTranslation';

interface QuickAddHandlerProps {
  platform: 'dorpsplein' | 'inspiratie';
  category?: string;
  location?: string;
  photo?: string;
  onClose: () => void;
}

export default function QuickAddHandler({ 
  platform, 
  category, 
  location, 
  photo,
  onClose 
}: QuickAddHandlerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  // Always start with form - camera is optional via button in form
  const [step, setStep] = useState<'camera' | 'form'>('form');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(photo || null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Gebruik achtercamera op mobiel
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      // Fallback naar bestand upload
      setStep('form');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsCapturing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0);
    
    // Convert to blob and create URL
    canvas.toBlob((blob) => {
      if (blob) {
        const photoUrl = URL.createObjectURL(blob);
        setCapturedPhoto(photoUrl);
        stopCamera();
        setStep('form');
      }
      setIsCapturing(false);
    }, 'image/jpeg', 0.8);
  };

  // Handle form save
  const handleFormSave = (product: any) => {
    onClose();
    // Optioneel: navigeer naar het nieuwe product
    if (product?.id) {
      router.push(`/product/${product.id}`);
    }
  };

  // Start camera when component mounts
  React.useEffect(() => {
    if (step === 'camera') {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [step]);

  if (step === 'camera') {
    return (
      <div className="fixed inset-0 z-[110] bg-black">
        {/* Camera Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            
            <div className="text-center">
              <h2 className="font-semibold">
                {platform === 'dorpsplein' ? '🏪 Dorpsplein' : '✨ Inspiratie'}
              </h2>
              <p className="text-sm opacity-80">
                {category && platform === 'dorpsplein' 
                  ? `${category === 'CHEFF' ? '🍳 Chef' : category === 'GARDEN' ? '🌱 Garden' : '🎨 Designer'} Product`
                  : location && platform === 'inspiratie'
                  ? `📍 ${location.charAt(0).toUpperCase() + location.slice(1)}`
                  : 'Neem een foto'
                }
              </p>
            </div>
            
            <button
              onClick={() => setStep('form')}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title={t('common.skipToForm')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Camera View */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Camera Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-8">
          <div className="flex items-center justify-center">
            <button
              onClick={capturePhoto}
              disabled={isCapturing}
              className={`w-20 h-20 bg-white rounded-full border-4 border-white shadow-2xl transition-all ${
                isCapturing 
                  ? 'scale-95 opacity-50' 
                  : 'hover:scale-110 active:scale-95'
              }`}
            >
              {isCapturing ? (
                <div className="w-full h-full bg-gray-300 rounded-full animate-pulse" />
              ) : (
                <div className="w-full h-full bg-white rounded-full" />
              )}
            </button>
          </div>
          
          <p className="text-white text-center mt-4 text-sm opacity-80">
            Tap om foto te maken
          </p>
        </div>

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  if (step === 'form') {
    return (
      <div className="fixed inset-0 z-[110] bg-white overflow-y-auto" data-quickadd-form>
        <div className="min-h-full">
          {/* Form Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {platform === 'dorpsplein' ? 'Product Toevoegen' : 'Inspiratie Delen'}
                </h2>
                <p className="text-sm text-gray-600">
                  {category && platform === 'dorpsplein' 
                    ? `${category === 'CHEFF' ? '🍳 Chef' : category === 'GARDEN' ? '🌱 Garden' : '🎨 Designer'} categorie`
                    : location && platform === 'inspiratie'
                    ? `📍 ${location.charAt(0).toUpperCase() + location.slice(1)} locatie`
                    : 'Vul de details in'
                  }
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-4">
            {platform === 'dorpsplein' && category && (category === 'CHEFF' || category === 'GARDEN' || category === 'DESIGNER') ? (
              // Dorpsplein: Use new compact forms
              <CategoryFormSelector
                category={category as 'CHEFF' | 'GARDEN' | 'DESIGNER'}
                initialPhoto={capturedPhoto || undefined}
                platform={platform}
                onSave={handleFormSave}
                onCancel={onClose}
              />
            ) : platform === 'inspiratie' && location ? (
              // Inspiratie: Show form directly in modal
              <InspiratieFormHandler
                location={location}
                initialPhoto={capturedPhoto || undefined}
                onSave={() => handleFormSave(null)}
                onCancel={onClose}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Ongeldige configuratie</p>
                <p className="text-sm text-gray-500 mt-2">
                  Platform: {platform}, Category: {category}, Location: {location}
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg"
                >
                  Sluiten
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}















