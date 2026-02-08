# AI Content Moderation Setup

HomeCheff heeft nu een complete AI-powered content moderation systeem geïmplementeerd dat automatisch foto's analyseert op ongepaste inhoud en categorie-overeenkomst.

## 🚀 Features

### ✅ Geïmplementeerde Features
- **AI-powered foto filtering** - Automatische detectie van ongepaste inhoud
- **Categorie validatie** - Controleert of foto's passen bij de gekozen categorie
- **Multi-service fallback** - Gebruikt meerdere AI services voor betrouwbaarheid
- **Real-time moderatie** - Analyseert foto's tijdens upload
- **Admin dashboard** - Overzicht van alle moderatie activiteit
- **User reporting** - Gebruikers kunnen ongepaste content melden
- **Handmatige review** - Admins kunnen AI beslissingen overrulen

### 🔍 Detectie Capabilities
- **NSFW Content** - Adult, violence, racy content detectie
- **Categorie Mismatch** - Controleert of foto past bij CHEFF/GROWN/DESIGNER
- **Object Detection** - Herkent objecten in foto's voor betere categorisering
- **Confidence Scoring** - Vertrouwensscore voor elke analyse

## 🛠️ Setup Instructies

### 1. Environment Variabelen
Voeg deze toe aan je `.env` bestand:

```env
# Google Cloud Vision API (Primary)
GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key

# Azure Content Moderator (Backup)
AZURE_MODERATOR_ENDPOINT=https://your-region.api.cognitive.microsoft.com
AZURE_MODERATOR_KEY=your_azure_moderator_key

# Hugging Face API (Fallback)
HUGGINGFACE_API_TOKEN=your_huggingface_token
```

### 2. Google Cloud Vision API Setup
1. Ga naar [Google Cloud Console](https://console.cloud.google.com/)
2. Maak een nieuw project of selecteer bestaand project
3. Enable de "Cloud Vision API"
4. Maak een API key aan
5. Voeg de key toe aan je environment variabelen

### 3. Azure Content Moderator Setup
1. Ga naar [Azure Portal](https://portal.azure.com/)
2. Maak een nieuwe "Content Moderator" resource
3. Kopieer de endpoint en subscription key
4. Voeg toe aan je environment variabelen

### 4. Hugging Face API Setup (Optioneel)
1. Ga naar [Hugging Face](https://huggingface.co/)
2. Maak een account en genereer een API token
3. Voeg toe aan je environment variabelen

## 📊 Admin Dashboard

### Content Moderation Tab
- **Overzicht statistieken** - Totaal geanalyseerd, goedgekeurd, afgewezen
- **Moderatie logs** - Alle AI analyses met details
- **Handmatige reviews** - Overrule AI beslissingen
- **Filtering opties** - Zoek op status, categorie, overtreding type

### Features
- Real-time updates van moderatie activiteit
- Bulk acties voor handmatige reviews
- Export mogelijkheden voor rapporten
- Detailed violation breakdown

## 🔧 Technical Details

### AI Services Integration
```typescript
// Multi-service fallback systeem
const MODERATION_SERVICES = {
  googleVision: { /* Primary service */ },
  azure: { /* Backup service */ },
  huggingFace: { /* Fallback service */ }
};
```

### Moderation Flow
1. **Upload** - Gebruiker selecteert foto
2. **Analysis** - AI analyseert foto op inhoud en categorie
3. **Decision** - Systeem bepaalt goedkeuring/afwijzing
4. **Upload** - Alleen goedgekeurde foto's worden geüpload
5. **Logging** - Alle analyses worden gelogd voor admin review

### Database Schema
```sql
-- AnalyticsEvent tabel gebruikt voor moderatie logs
CREATE TABLE AnalyticsEvent (
  id STRING PRIMARY KEY,
  eventType STRING, -- 'CONTENT_MODERATION'
  entityType STRING, -- 'IMAGE'
  entityId STRING,
  userId STRING,
  metadata JSON, -- Moderatie resultaten
  createdAt DATETIME
);
```

## 🎯 Category Validation Rules

### CHEFF (Food)
- **Allowed**: food, dish, meal, plate, bowl, cup, drink, kitchen, cooking
- **Detected Objects**: pasta, pizza, soup, salad, dessert, ingredients

### GROWN (Garden)
- **Allowed**: plant, vegetable, fruit, herb, garden, seed, flower, tree
- **Detected Objects**: tomatoes, herbs, flowers, vegetables, plants

### DESIGNER (Handmade)
- **Allowed**: art, craft, design, handmade, jewelry, furniture, textile
- **Detected Objects**: pottery, paintings, clothing, accessories, furniture

## 🚨 Content Violations

### Automatic Rejection
- **Adult Content** - NSFW images, sexual content
- **Violence** - Violent or graphic content
- **Racy Content** - Suggestive or inappropriate content

### Warning Flags
- **Category Mismatch** - Foto past niet bij categorie
- **Low Confidence** - AI is niet zeker van analyse
- **Manual Review Required** - Complexe gevallen

## 📱 User Experience

### Upload Process
1. Gebruiker selecteert foto's
2. AI analyseert elke foto in real-time
3. Toont moderatie resultaten met feedback
4. Alleen goedgekeurde foto's worden geüpload
5. Gebruiker krijgt duidelijke feedback

### Visual Feedback
- ✅ **Groen** - Foto goedgekeurd
- ⚠️ **Geel** - Categorie waarschuwing
- ❌ **Rood** - Foto afgewezen
- 🔄 **Blauw** - Analyse bezig

## 🔒 Privacy & Security

### Data Protection
- Foto's worden alleen geanalyseerd, niet opgeslagen
- Moderatie logs bevatten geen persoonlijke data
- AI services krijgen minimale toegang tot data

### User Rights
- Gebruikers kunnen ongepaste content melden
- Transparante moderatie process
- Mogelijkheid tot beroep tegen beslissingen

## 📈 Monitoring & Analytics

### Key Metrics
- **Approval Rate** - Percentage goedgekeurde foto's
- **False Positive Rate** - Onterechte afwijzingen
- **Category Accuracy** - Juistheid van categorie detectie
- **Response Time** - Snelheid van AI analyse

### Reporting
- Dagelijkse moderatie rapporten
- Trend analyse van content kwaliteit
- Performance metrics per AI service

## 🚀 Deployment

### Production Setup
1. Configureer alle environment variabelen
2. Test AI services met sample images
3. Monitor moderatie performance
4. Stel admin alerts in voor problemen

### Monitoring
- Set up alerts voor AI service failures
- Monitor API rate limits
- Track moderatie accuracy over tijd

## 🔧 Troubleshooting

### Common Issues
- **AI Service Down** - Systeem valt terug op backup services
- **Rate Limits** - Implementeer caching en retry logic
- **False Positives** - Admin kan handmatig overrulen
- **Slow Performance** - Optimaliseer image sizes

### Support
Voor vragen over de AI moderation setup, check:
1. AI service API status
2. Environment variabelen configuratie
3. Database connectivity
4. Admin dashboard toegang

---

**Status**: ✅ Volledig geïmplementeerd en klaar voor productie gebruik!

De AI content moderation zorgt ervoor dat alleen geschikte, categorie-specifieke foto's op het platform verschijnen, wat de kwaliteit en veiligheid van HomeCheff aanzienlijk verbetert.
