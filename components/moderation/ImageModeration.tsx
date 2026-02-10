'use client';

import React, { useState, useRef } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Upload, RefreshCw, Eye } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';

interface ModerationResult {
  isAppropriate: boolean;
  confidence: number;
  categories: string[];
  violations: string[];
  suggestions: string[];
  categoryMatch: boolean;
  recommendedCategory?: string;
  isValidForCategory: boolean;
  detectedObjects: string[];
}

interface ImageModerationProps {
  imageFile: File;
  category: string;
  productTitle?: string;
  onModerationComplete: (result: ModerationResult) => void;
  onModerationError: (error: string) => void;
  className?: string;
}

export default function ImageModeration({
  imageFile,
  category,
  productTitle,
  onModerationComplete,
  onModerationError,
  className = ''
}: ImageModerationProps) {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [moderationResult, setModerationResult] = useState<ModerationResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzedFileId = React.useRef<string | null>(null);
  
  const analyzeImage = React.useCallback(async () => {
    if (!session?.user) {
      onModerationError(t('moderation.mustBeLoggedIn'));
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Convert file to base64
      const base64 = await fileToBase64(imageFile);
      
      const response = await fetch('/api/moderation/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64,
          category,
          productTitle
        })
      });

      if (!response.ok) {
        throw new Error(t('moderation.analysisFailed'));
      }

      const result: ModerationResult = await response.json();
      setModerationResult(result);
      onModerationComplete(result);

    } catch (error) {
      console.error('Image moderation error:', error);
      onModerationError(t('moderation.analysisError'));
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageFile, category, productTitle, session?.user, onModerationComplete, onModerationError]);
  
  React.useEffect(() => {
    if (imageFile) {
      // Create unique identifier for this file
      const fileId = `${imageFile.name}-${imageFile.size}-${imageFile.lastModified}`;
      
      // Only analyze if this is a different file
      if (analyzedFileId.current !== fileId) {
        analyzedFileId.current = fileId;
        setIsAnalyzing(false);
        setModerationResult(null);
        analyzeImage();
      }
      
      // Create preview URL
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [imageFile, analyzeImage]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const getStatusIcon = () => {
    if (isAnalyzing) {
      return <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />;
    }
    
    if (!moderationResult) {
      return <Upload className="w-5 h-5 text-gray-400" />;
    }

    if (!moderationResult.isAppropriate) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }

    if (!moderationResult.isValidForCategory) {
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }

    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  const getStatusMessage = () => {
    if (isAnalyzing) {
      return t('moderation.analyzing');
    }

    if (!moderationResult) {
      return t('moderation.clickToAnalyze');
    }

    if (!moderationResult.isAppropriate) {
      return t('moderation.inappropriateContent');
    }

    if (!moderationResult.isValidForCategory) {
      return t('moderation.categoryMismatchStatus').replace('{category}', category);
    }

    return t('moderation.approvedStatus');
  };

  const getStatusColor = () => {
    if (isAnalyzing) return 'border-blue-200 bg-blue-50';
    if (!moderationResult) return 'border-gray-200 bg-gray-50';
    if (!moderationResult?.isAppropriate) return 'border-red-200 bg-red-50';
    if (!moderationResult?.isValidForCategory) return 'border-yellow-200 bg-yellow-50';
    return 'border-green-200 bg-green-50';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Image Preview */}
      <div className="relative">
        <div className={`border-2 border-dashed rounded-lg p-4 ${getStatusColor()} transition-colors`}>
          <div className="flex items-center justify-center space-x-3">
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusMessage()}</span>
          </div>
          
          {previewUrl && (
            <div className="mt-3 flex justify-center">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-48 rounded-lg shadow-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Moderation Results */}
      {moderationResult && (
        <div className="space-y-3">
          {/* Confidence Score */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Vertrouwen:</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    moderationResult.confidence > 0.8 ? 'bg-green-500' :
                    moderationResult.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${moderationResult.confidence * 100}%` }}
                />
              </div>
              <span className="text-gray-900 font-medium">
                {Math.round(moderationResult.confidence * 100)}%
              </span>
            </div>
          </div>

          {/* Detected Objects */}
          {moderationResult.detectedObjects.length > 0 && (
            <div>
              <span className="text-sm text-gray-600">{t('moderation.detectedObjects')}</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {moderationResult.detectedObjects.map((object, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                  >
                    {object}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Violations */}
          {moderationResult.violations.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">{t('moderation.problemsFound')}</span>
              </div>
              <ul className="mt-2 space-y-1">
                {moderationResult.violations.map((violation, index) => (
                  <li key={index} className="text-sm text-red-700">
                    • {getViolationMessage(violation, t)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Category Mismatch */}
          {!moderationResult.isValidForCategory && moderationResult.recommendedCategory && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-yellow-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">{t('moderation.categoryWarning')}</span>
              </div>
              <p className="mt-1 text-sm text-yellow-700">
                {t('moderation.categoryMismatchText').replace('{recommended}', moderationResult.recommendedCategory).replace('{current}', category)}
              </p>
            </div>
          )}

          {/* Suggestions */}
          {moderationResult.suggestions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-blue-800">
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">{t('moderation.suggestions')}</span>
              </div>
              <ul className="mt-2 space-y-1">
                {moderationResult.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-blue-700">
                    • {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Success Message */}
          {moderationResult.isAppropriate && moderationResult.isValidForCategory && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-green-800">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{t('moderation.approved')}</span>
              </div>
              <p className="mt-1 text-sm text-green-700">
                {t('moderation.approvedText').replace('{category}', category)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          onClick={analyzeImage}
          disabled={isAnalyzing}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{t('moderation.reanalyze')}</span>
        </button>
        
        {fileInputRef && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                // Handle new file selection
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

function getViolationMessage(violation: string, t: (key: string) => string): string {
  const messages: { [key: string]: string } = {
    'adult_content': t('moderation.violations.adultContent'),
    'violence': t('moderation.violations.violence'),
    'racy_content': t('moderation.violations.racyContent'),
    'category_mismatch': t('moderation.violations.categoryMismatch'),
    'manual_review_required': t('moderation.violations.manualReviewRequired')
  };
  
  return messages[violation] || t('moderation.violations.generic').replace('{violation}', violation);
}
