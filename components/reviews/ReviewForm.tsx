'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, X, Loader2 } from 'lucide-react';
import StarRating from './StarRating';

interface ReviewFormProps {
  productId: string;
  onSubmit: (reviewData: ReviewData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface ReviewData {
  rating: number;
  title: string;
  comment: string;
  images?: string[];
}

const MAX_PHOTOS = 5;

export default function ReviewForm({
  productId: _productId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const remaining = MAX_PHOTOS - imageUrls.length;
    if (remaining <= 0) return;

    setUploading(true);
    setErrors((e) => ({ ...e, images: '' }));
    try {
      const next: string[] = [];
      for (const file of Array.from(files).slice(0, remaining)) {
        if (!file.type.startsWith('image/')) continue;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'review');
        formData.append('uploadContext', 'product-review');
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Upload mislukt');
        }
        const data = await res.json();
        if (data.url) next.push(String(data.url));
      }
      if (next.length) setImageUrls((prev) => [...prev, ...next].slice(0, MAX_PHOTOS));
    } catch (err) {
      setErrors((e) => ({
        ...e,
        images: err instanceof Error ? err.message : 'Upload mislukt',
      }));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (rating === 0) newErrors.rating = 'Selecteer een beoordeling';
    // Text is optional (stars-only reviews allowed)
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit({
        rating,
        title: title.trim(),
        comment: comment.trim(),
        images: imageUrls,
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      setErrors((e) => ({
        ...e,
        form: 'Beoordeling kon niet worden opgeslagen. Probeer opnieuw.',
      }));
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Schrijf een beoordeling</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Beoordeling *</label>
          <StarRating
            rating={rating}
            onRatingChange={setRating}
            interactive={true}
            size="lg"
            showNumber={true}
          />
          {errors.rating ? <p className="mt-1 text-sm text-red-600">{errors.rating}</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Titel (optioneel)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bijv. 'Geweldig product!'"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            maxLength={100}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Je beoordeling (optioneel)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Vertel anderen over je ervaring met dit product..."
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            maxLength={1000}
          />
          <div className="mt-1 text-right text-sm text-gray-500">{comment.length}/1000</div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Foto&apos;s (optioneel, max {MAX_PHOTOS})
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="sr-only"
            onChange={(e) => void handleUpload(e.target.files)}
          />
          <button
            type="button"
            disabled={uploading || imageUrls.length >= MAX_PHOTOS || isSubmitting}
            onClick={() => fileRef.current?.click()}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            Foto&apos;s toevoegen
          </button>
          {errors.images ? <p className="mt-1 text-sm text-red-600">{errors.images}</p> : null}

          {imageUrls.length > 0 ? (
            <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {imageUrls.map((url) => (
                <li key={url} className="relative aspect-square overflow-hidden rounded-lg border">
                  <Image src={url} alt="Preview" fill className="object-cover" sizes="96px" />
                  <button
                    type="button"
                    aria-label="Foto verwijderen"
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                    onClick={() => setImageUrls((prev) => prev.filter((u) => u !== url))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {errors.form ? <p className="text-sm text-red-600">{errors.form}</p> : null}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || uploading}
            className="min-h-[44px] flex-1 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {isSubmitting ? 'Bezig…' : 'Beoordeling plaatsen'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="min-h-[44px] rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
          >
            Annuleren
          </button>
        </div>
      </form>
    </div>
  );
}
