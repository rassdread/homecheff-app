
'use client';
import * as React from 'react';
import MultiImageUploader from './MultiImageUploader';

type Uploaded = { url: string };

const VERTICALS = [
  { label: 'Cheff', value: 'CHEFF' },
  { label: 'Garden', value: 'GARDEN' },
  { label: 'Designer', value: 'DESIGNER' },
];

const DELIVERY = [
  { label: 'Afhalen', value: 'PICKUP' },
  { label: 'Bezorgen', value: 'DELIVERY' },
  { label: 'Beide', value: 'BOTH' },
];

export default function NewProductForm() {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [price, setPrice] = React.useState(''); // euros as string
  const [vertical, setVertical] = React.useState('CHEFF');
  const [deliveryMode, setDeliveryMode] = React.useState('PICKUP');
  const [images, setImages] = React.useState<Uploaded[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [displayNameType, setDisplayNameType] = React.useState<'fullname' | 'username'>('fullname');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const priceNumber = Number(price.replace(',', '.'));
    if (!title || !description || !Number.isFinite(priceNumber)) {
      setMessage('Vul titel, beschrijving en geldige prijs in.');
      return;
    }
    if (images.length === 0) {
      setMessage('Minstens 1 foto toevoegen.');
      return;
    }
    const priceCents = Math.round(priceNumber * 100);

    setSubmitting(true);
    try {
      const res = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          priceCents,
          category: vertical,
          deliveryMode,
          images: images.map(i => i.url),
          isPublic: true,
          displayNameType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Opslaan mislukte');
      setMessage('Opgeslagen! Je item staat (als public) klaar voor de feed.');
      setTitle('');
      setDescription('');
      setPrice('');
      setImages([]);
    } catch (err: any) {
      setMessage(err?.message || 'Er ging iets mis.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="hc-tight max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="hc-tight">
          <label className="hc-label">Titel</label>
          <input
            className="w-full rounded-md border p-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bijv. Lasagne Bolognese"
          />
        </div>
        <div className="hc-tight">
          <label className="hc-label">Prijs (€)</label>
          <input
            className="w-full rounded-md border p-2"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="12,50"
            inputMode="decimal"
          />
        </div>
      </div>

      <div className="hc-tight">
        <label className="hc-label">Beschrijving</label>
        <textarea
          className="w-full rounded-md border p-2 min-h-28"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Korte smakelijke beschrijving..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="hc-tight">
          <label className="hc-label">Vertical</label>
          <select
            className="w-full rounded-md border p-2"
            value={vertical}
            onChange={(e) => setVertical(e.target.value)}
          >
            {VERTICALS.map(v => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>
        <div className="hc-tight">
          <label className="hc-label">Afhalen / Bezorgen</label>
          <select
            className="w-full rounded-md border p-2"
            value={deliveryMode}
            onChange={(e) => setDeliveryMode(e.target.value)}
          >
            {DELIVERY.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>

      <MultiImageUploader value={images} onChange={setImages} />

      {/* Naamweergave keuze */}
      <div className="hc-tight">
        <label className="hc-label">Naamweergave bij product</label>
        <select
          className="w-full rounded-md border p-2"
          value={displayNameType}
          onChange={(e) => setDisplayNameType(e.target.value as 'fullname' | 'username')}
        >
          <option value="fullname">Voor- en achternaam</option>
          <option value="username">Gebruikersnaam</option>
        </select>
        <p className="text-sm text-gray-500 mt-1">
          Kies hoe je naam wordt weergegeven bij dit product
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-md px-4 py-2 border bg-black text-white disabled:opacity-50"
          disabled={submitting}
        >
          {submitting ? 'Opslaan…' : 'Opslaan'}
        </button>
        {message && <span className="hc-muted">{message}</span>}
      </div>
    </form>
  );
}
