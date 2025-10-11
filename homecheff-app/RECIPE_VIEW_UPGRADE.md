# Recepten Kookboek - Professionele Upgrade 👨‍🍳

## Overzicht
De "Mijn Keuken" tab voor recepten heeft dezelfde professionele upgrade gekregen als de Tuin tab! Recepten worden nu weergegeven in een prachtig vintage kookboek stijl die perfect printbaar is en die mensen echt willen bewaren en verzamelen.

## ✅ Wat is er verbeterd?

### 1. **Vintage Culinary/Cookbook Design**
- 👨‍🍳 Klassieke kookboek stijl met elegante typografie (Georgia/Garamond)
- 🍳 Decoratieve hoeken en dubbele borders (amber/orange tinten)
- 📖 Vintage paper texture effecten
- 🔥 Warme kleurenpalet met amber, orange, en yellow tones
- 🎭 Serif fonts voor klassieke kookboek uitstraling

### 2. **Professionele Header Kaart**
- Grote, opvallende recepttitel met cookbook styling
- Categorie weergegeven als subtitle
- Decoratieve dividers met chef iconen
- Metadata cards (bereidingstijd, porties, moeilijkheidsgraad)
- Vintage borders met amberkleurige accenten
- Chef info onderaan

### 3. **Featured Image met Culinary Frame**
- Culin

aire frame met decoratieve hoeken
- Vintage foto label overlay met receptnaam
- Professionele aspect ratio (16:9)
- Border styling die past bij het kookboek thema

### 4. **Ingrediënten & Bereidingswijze Cards**
**Ingrediënten:**
- Genummerde lijst met ronde badges
- Gradient background (amber/orange)
- Hover effecten voor interactiviteit
- Overzichtelijke layout

**Bereidingswijze:**
- Genummerde stappen met gradient badges
- Stap-voor-stap foto's bij elke stap
- Hover effecten en shadows
- Duidelijke visuele hiërarchie

### 5. **Side-by-Side Layout**
- Desktop: Ingrediënten links, bereidingswijze rechts
- Mobile: Gestapeld voor leesbaarheid
- Perfect voor printen
- Overzichtelijk en professioneel

### 6. **Step Photos**
- Foto's worden getoond per stap
- Grid layout (2 kolommen)
- Border styling met amber accenten
- Hover zoom effecten

### 7. **Tags & Kenmerken**
- Tag badges met emoji's (📌)
- Gradient backgrounds (amber/orange)
- Hover effecten met scale
- Gecentreerde layout
- Bold borders

### 8. **Print Optimalisatie** 🖨️

#### CSS Print Media Queries:
```css
@page {
  size: A4;
  margin: 15mm;
}
```

#### Print-specific Features:
- `-webkit-print-color-adjust: exact` voor kleur behoud
- `.culinary-border` class voor print borders
- `print-page-break` voor lange recepten
- `print-avoid-break` voor content cohesie
- `.no-print` class voor UI elementen

#### Wat wordt verborgen bij printen:
- Navigation header met buttons
- Hover effecten
- Interactive elements

#### Wat wordt geoptimaliseerd:
- Culinary borders worden double borders
- Sectie margins aangepast
- Step-by-step photos blijven intact
- Alle kleuren behouden (amber/orange)
- Foto's op correcte grootte

### 9. **Recipe Card Navigation**
- Klik op receptkaart → ga naar detail view
- Edit button (stopPropagation om card click te voorkomen)
- Delete button (stopPropagation)
- Sell button voor producten (stopPropagation)
- Duidelijke hover states

### 10. **Footer Signature**
- Culinary iconen (Utensils, ChefHat)
- Elegante ondertekening
- HomeCheff Keuken branding
- Subtiel en professioneel

## 🎯 Design Principes

### Verzamelwaardigheid
Het design is specifiek gemaakt zodat:
- ✅ Mensen het willen printen voor hun receptenmap
- ✅ Het er professioneel uitziet op papier
- ✅ Het geschikt is voor een fysiek kookboek
- ✅ Het vintage/heritage gevoel heeft
- ✅ Het als referentie kan dienen tijdens koken

### Cohesie Upload ↔ Weergave
- Upload interface is functioneel en clean (RecipeManager)
- Weergave transformeert data naar kookboek pagina
- Alle geüploade data komt mooi tot zijn recht
- Foto's, ingrediënten en stappen vormen één geheel

### Typografie
- **Cookbook Title**: Georgia/Garamond, uppercase, letter-spacing
- **Cookbook Subtitle**: Italic, serif, eleganter
- **Body**: Mix van sans-serif en serif
- **Hierarchy**: Duidelijk onderscheid tussen secties

### Kleuren
- **Primair**: Amber/Orange tinten (#92400e, #c2410c)
- **Secundair**: Yellow voor highlights
- **Borders**: Double lines, warm earth tones
- **Backgrounds**: Subtle gradients, vintage paper texture

## 📁 Nieuwe Bestanden

### `components/recipes/RecipeView.tsx`
**Nieuwe component met:**
- Vintage culinary styling
- Print CSS optimization
- Featured image met frame
- Side-by-side ingredients/instructions
- Step photos integration
- Footer signature

### `app/recipe/[id]/page.tsx`
**Dedicated recipe page:**
- Server-side rendering
- Recipe data fetching from Prisma
- Access control (private/public)
- Metadata generation voor SEO
- Loading states

## 🔄 Gewijzigde Bestanden

### `components/profile/RecipeManager.tsx`
**Updates:**
- Recipe card krijgt `onClick` naar `/recipe/[id]`
- Edit/Delete/Sell buttons krijgen `stopPropagation`
- Cursor pointer toegevoegd
- Better UX voor card interactions

## 🚀 Hoe Te Gebruiken

### Voor Gebruikers:
1. Ga naar je profiel → "Mijn Keuken" tab  
2. Klik op een recept
3. Bekijk het nieuwe kookboek design
4. Klik op "Printen" voor een printbare versie (of Ctrl/Cmd + P)
5. Of gebruik "Delen" om de link te kopiëren

### Voor Developers:
```tsx
import RecipeView from '@/components/recipes/RecipeView';

<RecipeView 
  recipe={recipeData} 
  isOwner={isUserOwner}
/>
```

## 📱 Responsive Breakpoints

- **Mobile** (< 768px): Single column, stacked layout
- **Tablet** (768px - 1024px): 2 column grids for steps
- **Desktop** (> 1024px): Side-by-side ingredients/instructions

## 🎨 Print Preview Tips

### In Chrome:
1. Open een recept
2. Druk op `Ctrl/Cmd + P`
3. Kies "Save as PDF" of print
4. Controleer "Background graphics" optie
5. Print of save!

### Optimaal Resultaat:
- A4 formaat
- Marges: 15mm
- Kleur printen (indien mogelijk)
- Portret oriëntatie

## ✨ Features Overzicht

### Recipe View Features:
- ✅ **Vintage kookboek styling** - authentiek vintage gevoel
- ✅ **Print-geoptimaliseerd** - A4 perfect formaat
- ✅ **Step photos** - visuele instructies
- ✅ **Side-by-side layout** - ingrediënten + bereidingswijze
- ✅ **Chef info** - wie heeft het gemaakt
- ✅ **Tags & categorieën** - overzichtelijk gelabeld
- ✅ **Share functie** - deel via native share
- ✅ **Edit optie** - voor eigenaars
- ✅ **Responsive** - werkt op alle devices
- ✅ **SEO optimized** - metadata voor social sharing

### Vergelijking Met Oude View:

#### ❌ Oude Modal View:
- Klein popup venster
- Niet printbaar
- Geen vintage styling
- Beperkte ruimte
- Geen dedicated URL
- Niet deelbaar

#### ✅ Nieuwe Recipe View:
- Full-page dedicated view
- Perfect printbaar
- Vintage kookboek stijl
- Alle ruimte voor content
- Dedicated URL (`/recipe/[id]`)
- Makkelijk deelbaar
- Professional uitstraling

## 🔮 Toekomstige Verbeteringen

Mogelijke uitbreidingen:
- [ ] PDF export direct in de browser
- [ ] Meerdere design themes (modern, minimaal, vintage)
- [ ] Nutritional information display
- [ ] Shopping list generator
- [ ] Print multiple recipes at once
- [ ] QR code voor sharing
- [ ] Recipe collections (kookboek view)
- [ ] Custom border/decoration options

## 🎓 Design Inspiratie

Dit design is geïnspireerd op:
- Vintage kookboeken (jaren '50-'70)
- Handgeschreven receptenkaarten
- Heritage family cookbooks
- Culinary school handbooks
- Artisanal food magazines

## 📊 Technische Details

### Route Info:
```
/recipe/[id] → 4.09 kB, 101 kB First Load JS
```

### Components Hierarchy:
```
app/recipe/[id]/page.tsx
└── RecipeView.tsx
    ├── Header (no-print)
    ├── Vintage Header Card
    ├── Featured Image
    ├── Description
    ├── Ingredients & Instructions (side-by-side)
    ├── Step Photos
    ├── Tags
    └── Footer Signature
```

### Data Flow:
```
Prisma DB → app/recipe/[id]/page.tsx → RecipeView.tsx
          ↓
     includes photos & stepPhotos
```

## 📞 Support

Bij vragen of problemen:
- Check de console voor errors
- Controleer of alle fields aanwezig zijn
- Test in verschillende browsers
- Probeer print preview

## 🎉 Resultaat

Je recepten zijn nu:
- ✅ **Professioneel** - kunnen geprint en gebundeld worden
- ✅ **Verzamelwaardig** - mensen willen dit echt bewaren
- ✅ **Printbaar** - perfect voor fysieke receptenmappen
- ✅ **Overzichtelijk** - side-by-side layout is duidelijk
- ✅ **Samenhangend** - upload en weergave vormen één geheel

De upload blijft simpel en functioneel (RecipeManager), maar de **weergave is nu een echt kookboek** dat mensen willen printen en in hun keuken gebruiken! 👨‍🍳📖✨

---

**Gemaakt met** 🧡 **voor de HomeCheff community**

*Laat je recepten stralen met dit prachtige kookboek design!*

