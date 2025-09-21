
'use client';
import * as React from 'react';
import MultiImageUploader from './MultiImageUploader';

type Uploaded = { url: string };

const VERTICALS = [
  { label: '🍳 Chef', value: 'CHEFF' },
  { label: '🌱 Garden', value: 'GARDEN' },
  { label: '🎨 Designer', value: 'DESIGNER' },
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

  // Dynamische voorbeeldtekst op basis van categorie
  const getDynamicExamples = (category: string) => {
    const examples = {
      CHEFF: {
        titlePlaceholder: "Bijv. Lasagne Bolognese, Tiramisu, Homemade Pizza",
        descriptionPlaceholder: "Beschrijf je gerecht: ingrediënten, bereidingswijze, bijzondere smaken...",
        titleExamples: [
          "Pasta Carbonara",
          "Chocolate Chip Cookies", 
          "Vegetarische Curry",
          "Homemade Bread",
          "Tiramisu"
        ],
        descriptionExamples: [
          "Verse pasta met room, spek en Parmezaanse kaas. Traditioneel recept uit Rome.",
          "Zelfgebakken koekjes met pure chocolade. Perfect voor bij de koffie.",
          "Kruidige curry met verse groenten en kokosmelk. Vegetarisch en glutenvrij."
        ]
      },
      GARDEN: {
        titlePlaceholder: "Bijv. Verse Tomaten, Kruidenmix, Zelfgekweekte Aardbeien",
        descriptionPlaceholder: "Beschrijf je producten: teeltwijze, seizoen, gebruik...",
        titleExamples: [
          "Verse Cherry Tomaten",
          "Biologische Kruidenmix",
          "Zelfgekweekte Aardbeien",
          "Verse Salade Groenten",
          "Honing van Eigen Bijen"
        ],
        descriptionExamples: [
          "Zoete cherry tomaten uit eigen tuin. Geen pesticiden, 100% biologisch.",
          "Verse kruidenmix van basilicum, oregano en tijm. Perfect voor Italiaanse gerechten.",
          "Honing van eigen bijenvolk. Rauw en ongefilterd voor maximale smaak."
        ]
      },
      DESIGNER: {
        titlePlaceholder: "Bijv. Handgemaakte Keramiek, Gehaakte Dekens, Houten Snijplank",
        descriptionPlaceholder: "Beschrijf je creatie: materiaal, techniek, unieke eigenschappen...",
        titleExamples: [
          "Handgemaakte Keramiek Schaal",
          "Gehaakte Baby Dekentje",
          "Houten Snijplank Set",
          "Vintage Style Lamp",
          "Leather Handbag"
        ],
        descriptionExamples: [
          "Unieke keramiek schaal gemaakt van lokale klei. Elk stuk is handgemaakt en uniek.",
          "Zacht gehaakte deken van 100% katoen. Perfect voor baby's en kinderen.",
          "Snijplank set van duurzaam hardhout. Met natuurlijke olie afgewerkt."
        ]
      }
    };
    return examples[category as keyof typeof examples] || examples.CHEFF;
  };

  const currentExamples = getDynamicExamples(vertical);

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
            className="w-full rounded-md border p-2 focus:ring-2 focus:ring-primary-brand focus:border-primary-brand transition-colors"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={currentExamples.titlePlaceholder}
          />
        </div>
        <div className="hc-tight">
          <label className="hc-label">Prijs (€)</label>
          <input
            className="w-full rounded-md border p-2 focus:ring-2 focus:ring-primary-brand focus:border-primary-brand transition-colors"
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
          className="w-full rounded-md border p-2 min-h-28 focus:ring-2 focus:ring-primary-brand focus:border-primary-brand transition-colors"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={currentExamples.descriptionPlaceholder}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="hc-tight">
          <label className="hc-label">Categorie</label>
          <select
            className="w-full rounded-md border p-2 focus:ring-2 focus:ring-primary-brand focus:border-primary-brand transition-colors"
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
            className="w-full rounded-md border p-2 focus:ring-2 focus:ring-primary-brand focus:border-primary-brand transition-colors"
            value={deliveryMode}
            onChange={(e) => setDeliveryMode(e.target.value)}
          >
            {DELIVERY.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Inspiratie sectie met dynamische voorbeelden */}
      <div className="hc-tight">
        <label className="hc-label flex items-center gap-2">
          <span>💡</span>
          Inspiratie voor {vertical === 'CHEFF' ? '🍳 Chef' : vertical === 'GARDEN' ? '🌱 Garden' : '🎨 Designer'} producten
        </label>
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-4 border border-primary-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Titel voorbeelden:</h4>
              <div className="space-y-1">
                {currentExamples.titleExamples.slice(0, 3).map((example, index) => (
                  <div key={index} className="text-xs text-gray-600 bg-white px-2 py-1 rounded border border-gray-200">
                    {example}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Beschrijving voorbeelden:</h4>
              <div className="space-y-1">
                {currentExamples.descriptionExamples.slice(0, 2).map((example, index) => (
                  <div key={index} className="text-xs text-gray-600 bg-white px-2 py-1 rounded border border-gray-200">
                    {example}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <MultiImageUploader value={images} onChange={setImages} />

      {/* Naamweergave keuze */}
      <div className="hc-tight">
        <label className="hc-label">Naamweergave bij product</label>
        <select
          className="w-full rounded-md border p-2 focus:ring-2 focus:ring-primary-brand focus:border-primary-brand transition-colors"
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
          className="rounded-xl px-6 py-3 bg-primary-brand text-white font-medium shadow-lg hover:bg-primary-700 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5"
          disabled={submitting}
        >
          {submitting ? 'Opslaan…' : 'Product Toevoegen'}
        </button>
        {message && (
          <span className={`px-4 py-2 rounded-lg text-sm font-medium ${
            message.includes('Opgeslagen') 
              ? 'bg-success-100 text-success-800 border border-success-200' 
              : 'bg-error-100 text-error-800 border border-error-200'
          }`}>
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
