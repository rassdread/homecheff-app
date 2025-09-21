'use client';

import { useState } from 'react';
import { Star, Camera, X } from 'lucide-react';
import StarRating from './StarRating';
import MultiImageUploader from '../products/MultiImageUploader';

interface ReviewFormProps {
  productId: string;
  onSubmit: (reviewData: ReviewData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface ReviewData {
  rating: number;
  title: string;
  comment: string;
  images: string[];
}

export default function ReviewForm({ productId, onSubmit, onCancel, isSubmitting = false }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<{ url: string }[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validatie
    const newErrors: { [key: string]: string } = {};
    
    if (rating === 0) {
      newErrors.rating = 'Selecteer een beoordeling';
    }
    
    if (!comment.trim()) {
      newErrors.comment = 'Schrijf een beoordeling';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit({
        rating,
        title: title.trim(),
        comment: comment.trim(),
        images: images.map(img => img.url)
      });
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Schrijf een beoordeling
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Beoordeling *
          </label>
          <StarRating
            rating={rating}
            onRatingChange={setRating}
            interactive={true}
            size="lg"
            showNumber={true}
          />
          {errors.rating && (
            <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Titel (optioneel)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bijv. 'Geweldig product!'"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={100}
          />
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Je beoordeling *
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Vertel anderen over je ervaring met dit product..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={1000}
          />
          <div className="mt-1 text-sm text-gray-500 text-right">
            {comment.length}/1000
          </div>
          {errors.comment && (
            <p className="mt-1 text-sm text-red-600">{errors.comment}</p>
          )}
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Foto's toevoegen (optioneel)
          </label>
          <MultiImageUploader
            value={images}
            onChange={setImages}
          />
          <p className="mt-1 text-sm text-gray-500">
            Voeg foto's toe om je beoordeling te versterken
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || rating === 0 || !comment.trim()}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Beoordeling plaatsen...' : 'Beoordeling plaatsen'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Annuleren
          </button>
        </div>
      </form>
    </div>
  );
}



