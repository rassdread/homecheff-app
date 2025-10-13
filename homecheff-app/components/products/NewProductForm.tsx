
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
  const [displayNameType, setDisplayNameType] = React.useState<'fullname' | 'firstname' | 'lastname' | 'username'>('fullname');
  const [isFromRecipe, setIsFromRecipe] = React.useState(false);
  
  // Toekomstige beschikbaarheid state
  const [isFutureProduct, setIsFutureProduct] = React.useState(false);
  const [availabilityDate, setAvailabilityDate] = React.useState('');

  // Function to process recipe data
  const processRecipeData = (data: any) => {
    console.log('Processing recipe data:', data);
    
    // Set category to CHEFF for recipes
    setVertical('CHEFF');
    console.log('Set vertical to CHEFF');
    
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

  // Process garden project data from sessionStorage
  const processGardenData = (data: any) => {
    console.log('Processing garden data:', data);
    
    // Set category to GARDEN (will be mapped to GROWN in API)
    setVertical('GARDEN');
    console.log('Set vertical to GARDEN');
    
    // Set title and description
    if (data.title) {
      setTitle(data.title);
      console.log('Set title:', data.title);
    }
    
    if (data.description) {
      setDescription(data.description);
      console.log('Set description:', data.description);
    }
    
    // Add garden-specific info to description
    let enhancedDescription = data.description || '';
    if (data.plantType) enhancedDescription += `\n\nPlant type: ${data.plantType}`;
    if (data.sunlight) enhancedDescription += `\nZonlicht: ${data.sunlight}`;
    if (data.waterNeeds) enhancedDescription += `\nWater: ${data.waterNeeds}`;
    if (data.location) enhancedDescription += `\nLocatie: ${data.location}`;
    if (data.soilType) enhancedDescription += `\nGrondsoort: ${data.soilType}`;
    if (data.plantDistance) enhancedDescription += `\nPlantafstand: ${data.plantDistance}`;
    if (data.notes) enhancedDescription += `\n\nNotities: ${data.notes}`;
    
    setDescription(enhancedDescription.trim());
    console.log('Set enhanced description with garden details');
    
    // Activate pre-order if harvest date is available
    if (data.harvestDate) {
      setIsFutureProduct(true);
      setAvailabilityDate(data.harvestDate);
      console.log('Set pre-order with harvest date:', data.harvestDate);
    }
    
    // Load photos if available
    if (data.photos && data.photos.length > 0) {
      const gardenImages = data.photos.map((photo: any, index: number) => ({
        url: photo.url,
        file: null,
        preview: photo.url,
        isMain: photo.isMain || index === 0
      }));
      setImages(gardenImages);
      console.log('Set garden images:', gardenImages);
    }
    
    console.log('Garden data processed successfully');
  };

  // Process design data from sessionStorage
  const processDesignData = (data: any) => {
    console.log('Processing design data:', data);
    
    // Set category to DESIGNER
    setVertical('DESIGNER');
    console.log('Set vertical to DESIGNER');
    
    // Set title and description
    if (data.title) {
      setTitle(data.title);
      console.log('Set title:', data.title);
    }
    
    if (data.description) {
      setDescription(data.description);
      console.log('Set description:', data.description);
    }
    
    // Add design-specific info to description
    let enhancedDescription = data.description || '';
    if (data.materials && data.materials.length > 0) {
      enhancedDescription += `\n\nMateriaal: ${data.materials.join(', ')}`;
    }
    if (data.dimensions) {
      enhancedDescription += `\nAfmetingen: ${data.dimensions}`;
    }
    if (data.category) {
      enhancedDescription += `\nCategorie: ${data.category}`;
    }
    if (data.notes) {
      enhancedDescription += `\n\nNotities: ${data.notes}`;
    }
    
    setDescription(enhancedDescription.trim());
    console.log('Set enhanced description with design details');
    
    // Load photos if available
    if (data.photos && data.photos.length > 0) {
      const designImages = data.photos.map((photo: any, index: number) => ({
        url: photo.url,
        file: null,
        preview: photo.url,
        isMain: photo.isMain || index === 0
      }));
      setImages(designImages);
      console.log('Set design images:', designImages);
    }
    
    console.log('Design data processed successfully');
  };

  // Load recipe, garden, or design data and auto-set category
  React.useEffect(() => {
    // First, clear any stale data from previous sessions
    console.log('🧹 Checking for stale product data to clear...');
    
    // Check URL parameters to see what type we're loading
    const urlParams = new URLSearchParams(window.location.search);
    const fromRecipe = urlParams.get('fromRecipe');
    const fromGarden = urlParams.get('fromGarden');
    const fromDesign = urlParams.get('fromDesign');
    
    console.log('URL parameters:', { fromRecipe, fromGarden, fromDesign });
    
    // Get all data from storage
    let recipeData = sessionStorage.getItem('recipeToProductData') || localStorage.getItem('recipeToProductData');
    let gardenData = sessionStorage.getItem('gardenToProductData') || localStorage.getItem('gardenToProductData');
    let designData = sessionStorage.getItem('designToProductData') || localStorage.getItem('designToProductData');
    
    console.log('Found data in storage:', { 
      hasRecipe: !!recipeData, 
      hasGarden: !!gardenData,
      hasDesign: !!designData
    });
    
    // Clear data that doesn't match the URL parameter
    if (fromDesign === 'true') {
      // We're loading a design - clear other data
      if (recipeData) {
        console.log('🗑️ Clearing stale recipe data');
        sessionStorage.removeItem('recipeToProductData');
        localStorage.removeItem('recipeToProductData');
        recipeData = null;
      }
      if (gardenData) {
        console.log('🗑️ Clearing stale garden data');
        sessionStorage.removeItem('gardenToProductData');
        localStorage.removeItem('gardenToProductData');
        gardenData = null;
      }
    } else if (fromGarden === 'true') {
      // We're loading a garden - clear other data
      if (recipeData) {
        console.log('🗑️ Clearing stale recipe data');
        sessionStorage.removeItem('recipeToProductData');
        localStorage.removeItem('recipeToProductData');
        recipeData = null;
      }
      if (designData) {
        console.log('🗑️ Clearing stale design data');
        sessionStorage.removeItem('designToProductData');
        localStorage.removeItem('designToProductData');
        designData = null;
      }
    } else if (fromRecipe === 'true') {
      // We're loading a recipe - clear other data
      if (gardenData) {
        console.log('🗑️ Clearing stale garden data');
        sessionStorage.removeItem('gardenToProductData');
        localStorage.removeItem('gardenToProductData');
        gardenData = null;
      }
      if (designData) {
        console.log('🗑️ Clearing stale design data');
        sessionStorage.removeItem('designToProductData');
        localStorage.removeItem('designToProductData');
        designData = null;
      }
    }
    
    // Process the correct data based on priority: design > garden > recipe
    if (designData) {
      try {
        const data = JSON.parse(designData);
        console.log('✅ Successfully parsed design data:', data);
        processDesignData(data);
        console.log('Design data loaded successfully');
      } catch (error) {
        console.error('❌ Error parsing design data:', error);
        console.error('Raw design data:', designData);
      }
    } else if (gardenData) {
      try {
        const data = JSON.parse(gardenData);
        console.log('✅ Successfully parsed garden data:', data);
        processGardenData(data);
        console.log('Garden data loaded successfully');
      } catch (error) {
        console.error('❌ Error parsing garden data:', error);
        console.error('Raw garden data:', gardenData);
      }
    } else if (recipeData) {
      try {
        const data = JSON.parse(recipeData);
        console.log('✅ Successfully parsed recipe data:', data);
        processRecipeData(data);
        console.log('Recipe data loaded successfully');
      } catch (error) {
        console.error('❌ Error parsing recipe data:', error);
        console.error('Raw recipe data:', recipeData);
      }
    } else {
      console.log('ℹ️ No product data found - showing empty form');
      // Default to CHEFF if not from any source
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
      const imageUrls = images.map(i => i.url);
      console.log('Creating product with images:', imageUrls);
      
      const res = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          priceCents,
          category: vertical,
          deliveryMode,
          images: imageUrls,
          isPublic: true,
          displayNameType,
          // Pre-order fields
          isFutureProduct,
          availabilityDate: isFutureProduct && availabilityDate ? availabilityDate : null,
        }),
      });
      const data = await res.json();
      console.log('Product creation response:', data);
      
      if (!res.ok) throw new Error(data?.error || 'Opslaan mislukte');
      
      console.log('Product created successfully:', data);
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
      {/* Categorie Selector - PROMINENT BOVENAAN */}
      <div className="mb-8">
        <label className="block text-lg font-bold text-gray-900 mb-4">
          1️⃣ Kies je Categorie
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {VERTICALS.map(v => (
            <button
              key={v.value}
              type="button"
              onClick={() => setVertical(v.value)}
              className={`p-6 rounded-2xl border-4 transition-all transform hover:scale-105 ${
                vertical === v.value
                  ? 'border-primary-brand bg-gradient-to-br from-primary-50 to-primary-100 shadow-xl ring-4 ring-primary-200'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
              }`}
            >
              <div className="text-center">
                <div className="text-5xl mb-3">{v.label.split(' ')[0]}</div>
                <div className={`text-xl font-bold ${
                  vertical === v.value ? 'text-primary-brand' : 'text-gray-900'
                }`}>
                  {v.label.split(' ')[1]}
                </div>
                {vertical === v.value && (
                  <div className="mt-3 text-sm font-medium text-primary-brand flex items-center justify-center gap-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Geselecteerd
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Basis Informatie */}
      <div className="mb-6">
        <label className="block text-lg font-bold text-gray-900 mb-4">
          2️⃣ Product Informatie
        </label>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="hc-label">Titel</label>
              <input
                className="w-full rounded-md border p-3 focus:ring-2 focus:ring-primary-brand focus:border-primary-brand transition-colors text-lg"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={currentExamples.titlePlaceholder}
              />
            </div>
            <div>
              <label className="hc-label">Prijs (€)</label>
              <input
                className="w-full rounded-md border p-3 focus:ring-2 focus:ring-primary-brand focus:border-primary-brand transition-colors text-lg"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="12,50"
                inputMode="decimal"
              />
            </div>
          </div>

          <div>
            <label className="hc-label">Beschrijving</label>
            <textarea
              className="w-full rounded-md border p-3 min-h-32 focus:ring-2 focus:ring-primary-brand focus:border-primary-brand transition-colors"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={currentExamples.descriptionPlaceholder}
            />
          </div>

          <div>
            <label className="hc-label">Afhalen / Bezorgen</label>
            <div className="grid grid-cols-3 gap-3">
              {DELIVERY.map(d => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDeliveryMode(d.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    deliveryMode === d.value
                      ? 'border-primary-brand bg-primary-50 text-primary-brand font-bold'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Inspiratie sectie met dynamische voorbeelden */}
      <div className="mb-6">
        <label className="block text-lg font-bold text-gray-900 mb-4">
          💡 Inspiratie voor {vertical === 'CHEFF' ? '🍳 Chef' : vertical === 'GARDEN' ? '🌱 Garden' : '🎨 Designer'} producten
        </label>
        <div className={`rounded-2xl p-6 border-2 ${
          vertical === 'CHEFF' ? 'bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 border-orange-200' :
          vertical === 'GARDEN' ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-green-200' :
          'bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 border-purple-200'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className={`text-sm font-bold mb-3 flex items-center gap-2 ${
                vertical === 'CHEFF' ? 'text-orange-900' :
                vertical === 'GARDEN' ? 'text-green-900' :
                'text-purple-900'
              }`}>
                <span className="text-xl">{vertical === 'CHEFF' ? '🍳' : vertical === 'GARDEN' ? '🌱' : '🎨'}</span>
                Titel voorbeelden
              </h4>
              <div className="space-y-2">
                {currentExamples.titleExamples.slice(0, 3).map((example, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setTitle(example)}
                    className={`w-full text-left text-sm px-4 py-2 rounded-lg transition-all hover:scale-105 ${
                      vertical === 'CHEFF' ? 'bg-white hover:bg-orange-100 border border-orange-200 text-orange-900' :
                      vertical === 'GARDEN' ? 'bg-white hover:bg-green-100 border border-green-200 text-green-900' :
                      'bg-white hover:bg-purple-100 border border-purple-200 text-purple-900'
                    }`}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className={`text-sm font-bold mb-3 flex items-center gap-2 ${
                vertical === 'CHEFF' ? 'text-orange-900' :
                vertical === 'GARDEN' ? 'text-green-900' :
                'text-purple-900'
              }`}>
                <span className="text-xl">📝</span>
                Beschrijving voorbeelden
              </h4>
              <div className="space-y-2">
                {currentExamples.descriptionExamples.slice(0, 2).map((example, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setDescription(example)}
                    className={`w-full text-left text-xs px-4 py-3 rounded-lg transition-all hover:scale-105 ${
                      vertical === 'CHEFF' ? 'bg-white hover:bg-orange-100 border border-orange-200 text-orange-800' :
                      vertical === 'GARDEN' ? 'bg-white hover:bg-green-100 border border-green-200 text-green-800' :
                      'bg-white hover:bg-purple-100 border border-purple-200 text-purple-800'
                    }`}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Foto's Upload */}
      <div className="mb-6">
        <label className="block text-lg font-bold text-gray-900 mb-4">
          3️⃣ Foto's Toevoegen
        </label>
          <      SimpleImageUploader 
          value={images} 
          onChange={(newImages) => setImages(newImages)} 
          category={vertical}
          productTitle={title}
        />
      </div>

      {/* Pre-order / Beschikbaarheidsdatum - specifiek voor Garden producten */}
      {vertical === 'GARDEN' && (
        <div className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-full flex items-center justify-center shadow-md">
              📅
            </div>
            <div className="flex-1">
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={isFutureProduct}
                  onChange={(e) => setIsFutureProduct(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="font-semibold text-gray-900">Pre-Order: Beschikbaar vanaf een bepaalde datum</span>
              </label>
              <p className="text-sm text-gray-600 mb-3">
                🌱 Perfect voor producten die nog groeien! Klanten kunnen alvast bestellen en betalen. Het product wordt beschikbaar op de ingestelde oogstdatum.
              </p>
              
              {isFutureProduct && (
                <div className="space-y-3 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🌱 Oogst/Beschikbaar vanaf:
                    </label>
                    <input
                      type="date"
                      value={availabilityDate}
                      onChange={(e) => setAvailabilityDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                      required={isFutureProduct}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      📦 De datum waarop je kweek klaar is voor afhaal/bezorging
                    </p>
                  </div>
                  
                  {availabilityDate && (
                    <div className="bg-white border-2 border-emerald-400 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                          ✓
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-emerald-800 mb-1">
                            🎯 Pre-Order Geactiveerd
                          </p>
                          <p className="text-xs text-gray-700 mb-2">
                            Klanten kunnen nu alvast bestellen en betalen voor dit product.
                          </p>
                          <div className="bg-emerald-50 border border-emerald-200 rounded-md p-2">
                            <p className="text-xs font-medium text-emerald-900">
                              📅 Beschikbaar vanaf: <span className="font-bold">{new Date(availabilityDate).toLocaleDateString('nl-NL', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}</span>
                            </p>
                          </div>
                          <div className="mt-2 flex items-start gap-2 text-xs text-gray-600">
                            <span>💡</span>
                            <span>Het bedrag wordt direct afgerekend, maar het product wordt pas op de oogstdatum geleverd/opgehaald.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Naamweergave keuze */}
      <div className="mb-6">
        <label className="block text-lg font-bold text-gray-900 mb-4">
          4️⃣ Privacy Instellingen
        </label>
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Naamweergave bij product</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: 'fullname', label: 'Voor- en achternaam', icon: '👤' },
              { value: 'firstname', label: 'Alleen voornaam', icon: '😊' },
              { value: 'lastname', label: 'Alleen achternaam', icon: '🎭' },
              { value: 'username', label: 'Gebruikersnaam', icon: '@' }
            ].map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDisplayNameType(option.value as any)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  displayNameType === option.value
                    ? 'border-primary-brand bg-primary-50 text-primary-brand font-bold'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{option.icon}</div>
                <div className="text-xs">{option.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex flex-col gap-4">
        <button
          type="submit"
          disabled={submitting}
          className={`w-full rounded-2xl px-8 py-5 text-white font-bold shadow-2xl transition-all duration-200 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed text-xl ${
            vertical === 'CHEFF' ? 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:shadow-orange-500/50' :
            vertical === 'GARDEN' ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:shadow-green-500/50' :
            'bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 hover:shadow-purple-500/50'
          }`}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              Opslaan...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              {vertical === 'CHEFF' ? '🍳 Voeg Chef Product Toe' : 
               vertical === 'GARDEN' ? '🌱 Voeg Garden Product Toe' : 
               '🎨 Voeg Designer Product Toe'}
            </span>
          )}
        </button>
        
        {message && (
          <div className={`p-4 rounded-xl text-center font-medium text-lg ${
            message.includes('Opgeslagen') 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-2 border-green-200' 
              : 'bg-gradient-to-r from-red-50 to-orange-50 text-red-800 border-2 border-red-200'
          }`}>
            {message.includes('Opgeslagen') ? '✅ ' : '❌ '}
            {message}
          </div>
        )}
      </div>
    </form>
    </div>
  );
}
