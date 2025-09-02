'use client';
import React, { useState } from "react";

interface ProductFormProps {
  market: "HomeCheff" | "HomeGarden" | "HomeDesigner";
}

const marketConfig = {
  HomeCheff: {
    title: "HomeCheff – Nieuw product plaatsen",
    categories: ["Keukenstijl / type product", "Dieet / voorkeuren", "Levering: Afhalen / Bezorgen", "Prijs: € ___ per eenheid"],
    descriptionLabel: "Vrij tekstveld voor beschrijving van het product...",
    photoLabel: "Voeg foto’s toe (max 5)",
    instructions: "Let op: Vul alle velden zo volledig mogelijk in voor een optimale presentatie van je product.",
  },
  HomeGarden: {
    title: "HomeGarden – Nieuw product plaatsen",
    categories: ["Type plant", "Standplaats", "Waterbehoefte", "Prijs"],
    descriptionLabel: "Vrij tekstveld voor beschrijving van het product...",
    photoLabel: "Voeg foto’s toe (max 5)",
    instructions: "Let op: Vul alle velden zo volledig mogelijk in voor een optimale presentatie van je product.",
  },
  HomeDesigner: {
    title: "HomeDesigner – Nieuw product plaatsen",
    categories: ["Type product", "Stijl", "Materiaal", "Prijs"],
    descriptionLabel: "Vrij tekstveld voor beschrijving van het product...",
    photoLabel: "Voeg foto’s toe (max 5)",
    instructions: "Let op: Vul alle velden zo volledig mogelijk in voor een optimale presentatie van je product.",
  },
};

export default function ProductForm({ market }: ProductFormProps) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [posted, setPosted] = useState(false);
  const [productUrl, setProductUrl] = useState<string>("");

  const config = marketConfig[market];

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>, idx: number) {
    if (e.target.files && e.target.files[0]) {
      const newPhotos = [...photos];
      newPhotos[idx] = e.target.files[0];
      setPhotos(newPhotos.slice(0, 5));
    }
  }

  function handleFavorite() {
    setIsFavorite((v) => !v);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Simuleer product aanmaken en url genereren
    const fakeId = Math.random().toString(36).substring(2, 8);
    setProductUrl(`http://localhost:3000/products/${fakeId}`);
    setPosted(true);
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ url: productUrl });
    } else {
      navigator.clipboard.writeText(productUrl);
      alert("Link gekopieerd!");
    }
  }

  function handleWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(productUrl)}`);
  }

  return (
    <form className="max-w-2xl mx-auto p-6" onSubmit={handleSubmit}>
  <h1 className="text-2xl font-bold mb-6 text-primary font-montserrat">{config.title}</h1>
      <div className="mb-4 text-sm text-gray-600 bg-yellow-50 border-l-4" style={{ borderColor: "var(--accent)" }}>
        {config.instructions}
      </div>
      <div className="bg-white rounded-xl p-4 mb-6">
  <div className="font-semibold mb-2 text-primary font-montserrat">{config.photoLabel}</div>
        <div className="flex gap-4">
          {[...Array(5)].map((_, idx) => (
            <label key={idx} className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center cursor-pointer" style={{ border: isFavorite ? "2px solid var(--accent)" : undefined }}>
              {photos[idx] ? (
                <img src={URL.createObjectURL(photos[idx])} alt="Foto" className="w-full h-full object-cover rounded" />
              ) : (
                <span className="text-2xl text-gray-400">+</span>
              )}
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoChange(e, idx)} />
            </label>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 mb-6">
  <div className="font-semibold mb-2 text-primary font-montserrat">Beschrijving</div>
        <textarea
          className="w-full h-24 p-2 border rounded"
          placeholder={config.descriptionLabel}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="bg-white rounded-xl p-4 mb-6">
  <div className="font-semibold mb-2 text-primary font-montserrat">Categorie & filters</div>
        <ul className="list-disc pl-6">
          {config.categories.map((cat) => (
            <li key={cat}>{cat}</li>
          ))}
        </ul>
      </div>
      <div className="flex gap-4 mb-6">
  <button type="button" className={`px-4 py-2 rounded text-black ${isFavorite ? 'bg-green-500' : 'bg-secondary'}`} onClick={handleFavorite}>
          {isFavorite ? 'Verwijderd uit favorieten' : 'Opslaan als favoriet'}
        </button>
      </div>
  <button type="submit" className="w-full px-4 py-3 rounded font-semibold bg-primary text-white font-montserrat">
        Product plaatsen
      </button>
      {posted && (
        <div className="mt-8 bg-white rounded-xl p-4 border flex items-center justify-between" style={{ borderColor: "var(--accent)" }}>
          <div>
            <div className="font-semibold mb-2" style={{ color: "var(--success)" }}>Product succesvol geplaatst!</div>
            <a href={productUrl} className="text-blue-600 underline text-sm">Bekijk product</a>
          </div>
          <div className="flex gap-2">
            <button type="button" className="px-3 py-1 rounded text-white text-sm bg-secondary font-montserrat" onClick={handleShare}>
              Delen
            </button>
            <button type="button" className="px-3 py-1 rounded text-white text-sm" style={{ background: "var(--success)" }} onClick={handleWhatsApp}>
              WhatsApp
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
