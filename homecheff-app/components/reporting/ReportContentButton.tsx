'use client';

import React, { useState } from 'react';
import { Flag, AlertTriangle, X, Send } from 'lucide-react';

interface ReportContentButtonProps {
  entityId: string;
  entityType: 'PRODUCT' | 'USER' | 'MESSAGE';
  entityTitle?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const REPORT_REASONS = {
  PRODUCT: [
    { id: 'inappropriate_content', label: 'Ongepaste inhoud', description: 'Foto of beschrijving bevat ongepaste inhoud' },
    { id: 'misleading_info', label: 'Misleidende informatie', description: 'Productinformatie klopt niet' },
    { id: 'wrong_category', label: 'Verkeerde categorie', description: 'Product hoort niet in deze categorie' },
    { id: 'fake_product', label: 'Nep product', description: 'Product lijkt nep of scam te zijn' },
    { id: 'spam', label: 'Spam', description: 'Herhaalde of irrelevante content' },
    { id: 'other', label: 'Anders', description: 'Andere reden voor melding' }
  ],
  USER: [
    { id: 'inappropriate_behavior', label: 'Ongepast gedrag', description: 'Gebruiker gedraagt zich ongepast' },
    { id: 'harassment', label: 'Intimidatie', description: 'Gebruiker intimideert anderen' },
    { id: 'fake_account', label: 'Nep account', description: 'Account lijkt nep te zijn' },
    { id: 'spam_account', label: 'Spam account', description: 'Account gebruikt voor spam' },
    { id: 'scam', label: 'Scam', description: 'Gebruiker probeert anderen te bedriegen' },
    { id: 'other', label: 'Anders', description: 'Andere reden voor melding' }
  ],
  MESSAGE: [
    { id: 'inappropriate_content', label: 'Ongepaste inhoud', description: 'Bericht bevat ongepaste inhoud' },
    { id: 'harassment', label: 'Intimidatie', description: 'Bericht is intimiderend' },
    { id: 'spam', label: 'Spam', description: 'Ongewenst bericht' },
    { id: 'threats', label: 'Bedreigingen', description: 'Bericht bevat bedreigingen' },
    { id: 'other', label: 'Anders', description: 'Andere reden voor melding' }
  ]
};

export default function ReportContentButton({
  entityId,
  entityType,
  entityTitle,
  className = '',
  size = 'md'
}: ReportContentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reasons = REPORT_REASONS[entityType] || REPORT_REASONS.PRODUCT;

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
      alert('Selecteer een reden voor de melding');
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
        alert(error.error || 'Er is een fout opgetreden bij het melden');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Er is een fout opgetreden bij het melden');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-green-100 text-green-800 rounded-lg flex items-center gap-2`}>
        <AlertTriangle className={iconSize[size]} />
        <span>Gemeld!</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`${sizeClasses[size]} ${className} bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors flex items-center gap-2`}
        title="Rapporteer deze content"
      >
        <Flag className={iconSize[size]} />
        <span>Melden</span>
      </button>

      {/* Report Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Flag className="w-5 h-5 text-red-500" />
                  Content Melden
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
                  <p className="text-sm text-gray-600">Melding voor:</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{entityTitle}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reden voor melding *
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
                    Extra details (optioneel)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                    placeholder="Voeg extra details toe om ons te helpen de situatie beter te begrijpen..."
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {description.length}/500 karakters
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedReason || isSubmitting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Melden...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Melden</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Belangrijke informatie:</p>
                    <p className="text-blue-700 mt-1">
                      Alle meldingen worden vertrouwelijk behandeld en binnen 24 uur door ons team bekeken. 
                      Misbruik van het meldsysteem kan leiden tot account beperkingen.
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
