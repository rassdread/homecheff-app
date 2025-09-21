'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface ReviewResponseFormProps {
  reviewId: string;
  onSubmit: (comment: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function ReviewResponseForm({ 
  reviewId, 
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}: ReviewResponseFormProps) {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      setError('Voer een reactie in');
      return;
    }

    try {
      await onSubmit(comment.trim());
      setComment('');
      setError('');
    } catch (error) {
      console.error('Error submitting response:', error);
      setError('Er is een fout opgetreden bij het plaatsen van je reactie');
    }
  };

  return (
    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-blue-900">Reageer als verkoper</h4>
        <button
          onClick={onCancel}
          className="text-blue-600 hover:text-blue-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Bedank de klant voor hun feedback of beantwoord hun vragen..."
            rows={3}
            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={500}
          />
          <div className="mt-1 text-sm text-blue-600 text-right">
            {comment.length}/500
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting || !comment.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Plaatsen...' : 'Reactie plaatsen'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Annuleren
          </button>
        </div>
      </form>
    </div>
  );
}



