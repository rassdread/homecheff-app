'use client';

import React, { useState } from 'react';
import { Flag, AlertTriangle, X, Send } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface ReportContentButtonProps {
  entityId: string;
  entityType: 'PRODUCT' | 'USER' | 'MESSAGE';
  entityTitle?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// REPORT_REASONS are now generated dynamically using translations

export default function ReportContentButton({
  entityId,
  entityType,
  entityTitle,
  className = '',
  size = 'md'
}: ReportContentButtonProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Generate reasons dynamically using translations
  const getReasons = () => {
    const baseReasons = {
      PRODUCT: [
        { id: 'inappropriate_content', labelKey: 'reporting.product.inappropriateContent', descriptionKey: 'reporting.product.inappropriateContentDesc' },
        { id: 'misleading_info', labelKey: 'reporting.product.misleadingInfo', descriptionKey: 'reporting.product.misleadingInfoDesc' },
        { id: 'wrong_category', labelKey: 'reporting.product.wrongCategory', descriptionKey: 'reporting.product.wrongCategoryDesc' },
        { id: 'fake_product', labelKey: 'reporting.product.fakeProduct', descriptionKey: 'reporting.product.fakeProductDesc' },
        { id: 'spam', labelKey: 'reporting.product.spam', descriptionKey: 'reporting.product.spamDesc' },
        { id: 'other', labelKey: 'reporting.product.other', descriptionKey: 'reporting.product.otherDesc' }
      ],
      USER: [
        { id: 'inappropriate_behavior', labelKey: 'reporting.user.inappropriateBehavior', descriptionKey: 'reporting.user.inappropriateBehaviorDesc' },
        { id: 'harassment', labelKey: 'reporting.user.harassment', descriptionKey: 'reporting.user.harassmentDesc' },
        { id: 'fake_account', labelKey: 'reporting.user.fakeAccount', descriptionKey: 'reporting.user.fakeAccountDesc' },
        { id: 'spam_account', labelKey: 'reporting.user.spamAccount', descriptionKey: 'reporting.user.spamAccountDesc' },
        { id: 'scam', labelKey: 'reporting.user.scam', descriptionKey: 'reporting.user.scamDesc' },
        { id: 'other', labelKey: 'reporting.user.other', descriptionKey: 'reporting.user.otherDesc' }
      ],
      MESSAGE: [
        { id: 'inappropriate_content', labelKey: 'reporting.message.inappropriateContent', descriptionKey: 'reporting.message.inappropriateContentDesc' },
        { id: 'harassment', labelKey: 'reporting.message.harassment', descriptionKey: 'reporting.message.harassmentDesc' },
        { id: 'spam', labelKey: 'reporting.message.spam', descriptionKey: 'reporting.message.spamDesc' },
        { id: 'threats', labelKey: 'reporting.message.threats', descriptionKey: 'reporting.message.threatsDesc' },
        { id: 'other', labelKey: 'reporting.message.other', descriptionKey: 'reporting.message.otherDesc' }
      ]
    };
    
    const reasonsList = baseReasons[entityType] || baseReasons.PRODUCT;
    return reasonsList.map(r => ({
      id: r.id,
      label: t(r.labelKey),
      description: t(r.descriptionKey)
    }));
  };
  
  const reasons = getReasons();

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReason) {
      alert(t('reporting.selectReason'));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reports/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityId,
          entityType,
          reason: selectedReason,
          description: description.trim(),
          entityTitle
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
          setSubmitted(false);
          setSelectedReason('');
          setDescription('');
        }, 2000);
      } else {
        const error = await response.json();
        alert(error.error || t('reporting.submitError'));
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert(t('reporting.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-green-100 text-green-800 rounded-lg flex items-center gap-2`}>
        <AlertTriangle className={iconSize[size]} />
        <span>{t('reporting.reported')}</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`${className} flex items-center gap-2 transition-colors`}
        title={t('reporting.reportContent')}
      >
        <Flag className="w-4 h-4" />
        <span>{t('reporting.report')}</span>
      </button>

      {/* Report Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Flag className="w-5 h-5 text-red-500" />
                  {t('reporting.reportContent')}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {entityTitle && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{t('reporting.reportFor')}:</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{entityTitle}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('reporting.reason')} *
                  </label>
                  <div className="space-y-2">
                    {reasons.map((reason) => (
                      <label key={reason.id} className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="reason"
                          value={reason.id}
                          checked={selectedReason === reason.id}
                          onChange={(e) => setSelectedReason(e.target.value)}
                          className="mt-1 text-red-600 focus:ring-red-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{reason.label}</p>
                          <p className="text-xs text-gray-500">{reason.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('reporting.extraDetails')}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                    placeholder={t('reporting.extraDetailsPlaceholder')}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {description.length}/500 {t('reporting.characters')}
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t('buttons.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedReason || isSubmitting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{t('reporting.reporting')}...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{t('reporting.report')}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">{t('reporting.importantInfo')}:</p>
                    <p className="text-blue-700 mt-1">
                      {t('reporting.importantInfoText')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
