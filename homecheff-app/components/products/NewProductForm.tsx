
'use client';
import * as React from 'react';
import { useSession } from 'next-auth/react';
import SimpleImageUploader from './SimpleImageUploader';

type Uploaded = { 
  url: string; 
  uploading?: boolean;
  error?: string;
};

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
  const { data: session } = useSession();
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [price, setPrice] = React.useState(''); // euros as string
  const [vertical, setVertical] = React.useState('CHEFF');
  const [deliveryMode, setDeliveryMode] = React.useState('PICKUP');
  const [images, setImages] = React.useState<Uploaded[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [displayNameType, setDisplayNameType] = React.useState<'fullname' | 'username'>('fullname');
  const [isFromRecipe, setIsFromRecipe] = React.useState(false);
  
  // Toekomstige beschikbaarheid state
  const [isFutureProduct, setIsFutureProduct] = React.useState(false);
  const [availabilityDate, setAvailabilityDate] = React.useState('');

  // Function to process recipe data
  const processRecipeData = (data: any) => {
    console.log('Processing recipe data:', data);
    
    // Prefill form with recipe data
    if (data.title) {
      setTitle(data.title);
      console.log('Set title:', data.title);
    }
    
    // Build enhanced description from recipe data
    let enhancedDescription = '';
    if (data.description) {
      enhancedDescription = data.description;
    }
    
    // Add recipe details to description (simplified for product listing)
    if (data.ingredients && data.ingredients.length > 0) {
      // Extract main ingredients without quantities for cleaner look
      const mainIngredients = data.ingredients.map((ing: string) => {
        // Remove quantities (numbers with or without units) - improved regex
        return ing.replace(/^\d+\s*(g|kg|ml|cl|dl|l|stuks?|eetlepels?|theelepels?|tl|el|gram|kilo|liter|milliliter|st\.|stuk|stuks|eieren?|eier|stuks?)\s*/i, '').trim();
      }).filter(ing => ing.length > 0).slice(0, 4); // Limit to 4 main ingredients and filter empty
      
      if (mainIngredients.length > 0) {
        enhancedDescription += '\n\nIngrediënten:\n• ' + mainIngredients.join('\n• ');
      }
    }
    
    if (data.tags && data.tags.length > 0) {
      enhancedDescription += `\n\nTags: ${data.tags.join(', ')}`;
    }
    
    setDescription(enhancedDescription);
    console.log('Set enhanced description:', enhancedDescription);
    
    // Mark that this form was populated from a recipe
    setIsFromRecipe(true);
    console.log('Set isFromRecipe to true');
    
    // Auto-set category to CHEFF for recipes (recipes are always CHEFF)
    setVertical('CHEFF');
    
    // Pre-populate images from recipe photos
    if (data.photos && Array.isArray(data.photos) && data.photos.length > 0) {
      const recipeImages = data.photos.map((photo: any) => ({
        url: photo.url,
        uploading: false
      }));
      setImages(recipeImages);
      console.log('Set recipe images:', recipeImages);
    }
    
    console.log('Recipe data processed successfully');
  };

  // Load recipe data and auto-set category based on user role
  React.useEffect(() => {
    // Check if we're coming from a recipe
    let recipeData = sessionStorage.getItem('recipeToProductData');
    console.log('Checking for recipe data in sessionStorage:', recipeData);
    
    // If not found in sessionStorage, try localStorage as backup
    if (!recipeData) {
      recipeData = localStorage.getItem('recipeToProductData');
      console.log('Checking for recipe data in localStorage:', recipeData);
    }
    
    // Also check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const fromRecipe = urlParams.get('fromRecipe');
    console.log('URL parameter fromRecipe:', fromRecipe);
    
    // If we have URL parameter but no data, log the issue
    if (fromRecipe === 'true' && !recipeData) {
      console.log('fromRecipe=true but no data found in sessionStorage or localStorage');
      console.log('This indicates an issue with the RecipeManager not storing data correctly');
      console.log('Check if the handleSellRecipe function is working properly');
      // Don't load any test data - let the user see the empty form
    }
    
    if (recipeData) {
      try {
        const data = JSON.parse(recipeData);
        console.log('Successfully parsed recipe data:', data);
        processRecipeData(data);
        
        // Don't clear the session storage immediately - let user see the data first
        // sessionStorage.removeItem('recipeToProductData');
        console.log('Recipe data loaded successfully - keeping in sessionStorage for now');
      } catch (error) {
        console.error('Error parsing recipe data:', error);
        console.error('Raw recipe data:', recipeData);
      }
    } else {
      console.log('No recipe data found in sessionStorage');
      // Default to CHEFF if not from recipe
      setVertical('CHEFF');
    }
  }, [session]);

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
        ],
        futureExamples: [
          "BBQ Weekend - Extra hamburgers (reserveer vooraf)",
          "Verjaardagstaart - Te groot voor ons gezin",
          "Pasta avond - Extra porties beschikbaar",
          "Feestje - Overtollige hapjes"
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
        ],
        futureExamples: [
          "Zomer tomaten - Reserveer je portie (oogst volgende week)",
          "Basilicum oogst - Teveel voor ons gezin",
          "Aardbeien seizoen - Voorbestellen mogelijk",
          "Kruidenbundel - Overtollige oogst"
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
        ],
        futureExamples: [
          "Keramiek workshop - Reserveer je stuk",
          "Gehaakte deken - Voorbestellen mogelijk",
          "Houten meubel - Maatwerk beschikbaar"
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
    <div className="hc-tight max-w-2xl">
      {/* Debug and Recipe Indicator */}
      <div className="mb-6 space-y-4">
        {/* Debug Panel */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-800">Debug Informatie</h3>
              <p className="text-sm text-blue-700">Controleer of receptdata correct wordt geladen</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const sessionData = sessionStorage.getItem('recipeToProductData');
                  const localData = localStorage.getItem('recipeToProductData');
                  const urlParams = new URLSearchParams(window.location.search);
                  const fromRecipe = urlParams.get('fromRecipe');
                  
                  console.log('Manual check - sessionStorage data:', sessionData);
                  console.log('Manual check - localStorage data:', localData);
                  console.log('URL parameter fromRecipe:', fromRecipe);
                  
                  alert(`SessionStorage: ${sessionData || 'Geen data'}\nLocalStorage: ${localData || 'Geen data'}\nURL fromRecipe: ${fromRecipe || 'Geen parameter'}`);
                }}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Check Data
              </button>
              <button
                onClick={() => {
                  // Load test recipe data
                  const testRecipeData = {
                    title: "Pasta Carbonara",
                    description: "Klassieke Italiaanse pasta met spek en ei",
                    ingredients: [
                      "400g spaghetti",
                      "200g pancetta",
                      "4 eieren",
                      "100g Parmezaanse kaas"
                    ],
                    instructions: [
                      "Kook de spaghetti",
                      "Bak de pancetta",
                      "Meng alles door elkaar"
                    ],
                    photos: [
                      { url: "https://via.placeholder.com/400x300/10b981/ffffff?text=Test+Pasta", isMain: true }
                    ],
                    prepTime: 20,
                    servings: 4,
                    difficulty: "MEDIUM",
                    category: "Hoofdgerecht",
                    tags: ["Test", "Pasta", "Italiano"]
                  };
                  
                  sessionStorage.setItem('recipeToProductData', JSON.stringify(testRecipeData));
                  console.log('Test recipe data loaded:', testRecipeData);
                  alert('Test receptdata geladen! Herlaad de pagina om te zien of het werkt.');
                }}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Load Test Data
              </button>
              <button
                onClick={() => {
                  // Simulate coming from a recipe with URL parameter
                  const testRecipeData = {
                    title: "Pasta Carbonara",
                    description: "Klassieke Italiaanse pasta met spek en ei",
                    ingredients: [
                      "400g spaghetti",
                      "200g pancetta",
                      "4 eieren",
                      "100g Parmezaanse kaas"
                    ],
                    instructions: [
                      "Kook de spaghetti",
                      "Bak de pancetta",
                      "Meng alles door elkaar"
                    ],
                    photos: [
                      { url: "https://via.placeholder.com/400x300/10b981/ffffff?text=Test+Pasta", isMain: true }
                    ],
                    prepTime: 20,
                    servings: 4,
                    difficulty: "MEDIUM",
                    category: "Hoofdgerecht",
                    tags: ["Test", "Pasta", "Italiano"]
                  };
                  
                  // Store data first
                  sessionStorage.setItem('recipeToProductData', JSON.stringify(testRecipeData));
                  console.log('Test data stored:', testRecipeData);
                  
                  // Wait a moment then navigate
                  setTimeout(() => {
                    window.location.href = '/sell/new?fromRecipe=true';
                  }, 100);
                }}
                className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
              >
                Test Full Flow
              </button>
              <button
                onClick={() => {
                  sessionStorage.removeItem('recipeToProductData');
                  console.log('SessionStorage cleared');
                  alert('SessionStorage gecleared. Herlaad de pagina.');
                }}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>

        {/* Recipe to Product Indicator */}
        {isFromRecipe && (
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-emerald-800">Recept omgezet naar Product</h3>
                <p className="text-sm text-emerald-700">Je receptinformatie is automatisch ingevuld. Pas de details aan zoals gewenst.</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
    <form onSubmit={onSubmit}>
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

      <SimpleImageUploader 
        value={images} 
        onChange={(newImages) => setImages(newImages)} 
        category={vertical}
        productTitle={title}
      />

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
    </div>
  );
}
