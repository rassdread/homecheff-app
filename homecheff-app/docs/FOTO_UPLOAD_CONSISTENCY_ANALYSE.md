# Foto Upload Componenten - Consistentie Analyse

## Overzicht van alle foto upload componenten

### 1. MultiImageUploader
**Gebruik:** Reviews (ReviewForm)
- ✅ **Moderation:** AI Image Moderation aanwezig
- ✅ **Camera:** Camera optie beschikbaar
- ✅ **Endpoint:** `/api/upload` via `uploadProductImages`
- ✅ **Validatie:** 10MB max, image type check
- ✅ **UI:** Drag & drop, camera knop, moderation status indicatoren
- ✅ **Features:** Duplicate detection, processing state management

### 2. SimpleImageUploader  
**Gebruik:** Producten (CompactChefForm, CompactGardenForm, CompactDesignerForm)
- ❌ **Moderation:** Geen AI moderation
- ✅ **Camera:** Camera optie beschikbaar
- ✅ **Endpoint:** `/api/upload` via `uploadProductImages`
- ✅ **Validatie:** 10MB max, image type check
- ✅ **UI:** Drag & drop, camera knop
- ⚠️ **Feature verschil:** Geen moderation status

### 3. ProductPhotoUpload
**Gebruik:** Producten (NewProductForm)
- ❌ **Moderation:** Geen AI moderation
- ❌ **Camera:** Geen camera optie
- ✅ **Endpoint:** `/api/upload` via `uploadFile`
- ✅ **Validatie:** 10MB max, image type check
- ✅ **UI:** Drag & drop
- ⚠️ **Feature verschil:** Geen camera, geen moderation

### 4. RecipePhotoUpload
**Gebruik:** Recepten (RecipeManager)
- ❌ **Moderation:** Geen AI moderation
- ❌ **Camera:** Geen camera optie
- ✅ **Endpoint:** `/api/profile/recipes/photo/upload` via `uploadFile`
- ⚠️ **Validatie:** 10MB max (image type check alleen in lib/upload.ts)
- ✅ **UI:** Drag & drop
- ⚠️ **Feature verschil:** Geen camera, geen moderation

### 5. GardenPhotoUpload
**Gebruik:** Tuin (GardenManager)
- ❌ **Moderation:** Geen AI moderation
- ❌ **Camera:** Geen camera optie
- ✅ **Endpoint:** `/api/profile/garden/photo/upload` via `uploadFile`
- ⚠️ **Validatie:** 10MB max (image type check alleen in lib/upload.ts)
- ✅ **UI:** Drag & drop
- ⚠️ **Feature verschil:** Geen camera, geen moderation

### 6. DesignPhotoUpload
**Gebruik:** Design (DesignManager)
- ❌ **Moderation:** Geen AI moderation
- ❌ **Camera:** Geen camera optie
- ✅ **Endpoint:** `/api/upload` via `uploadFile`
- ⚠️ **Validatie:** 10MB max (image type check alleen in lib/upload.ts)
- ✅ **UI:** Drag & drop
- ⚠️ **Feature verschil:** Geen camera, geen moderation

### 7. WorkspacePhotoUpload
**Gebruik:** Workspace (Seller instellingen)
- ❌ **Moderation:** Geen AI moderation
- ❌ **Camera:** Geen camera optie
- ✅ **Endpoint:** `/api/seller/upload-workplace-photos` (directe call)
- ✅ **Validatie:** 10MB max, image type check
- ✅ **UI:** Drag & drop
- ⚠️ **Feature verschil:** Geen camera, geen moderation, andere endpoint structuur

### 8. PhotoUploader
**Gebruik:** Profiel foto
- ❌ **Moderation:** Geen AI moderation
- ❌ **Camera:** Geen camera optie
- ✅ **Endpoint:** `/api/profile/photo/upload` via `uploadProfilePhoto`
- ⚠️ **Validatie:** Alleen in lib/upload.ts (geen expliciete size check in component)
- ⚠️ **UI:** Simpele file select (geen drag & drop)
- ⚠️ **Feature verschil:** Verschillende UI, geen drag & drop

### 9. QuickCamera
**Gebruik:** Camera capture (BottomNavigation quick add flow)
- ❌ **Moderation:** Geen (wordt later gedaan in flow)
- ✅ **Camera:** Volledige camera functionaliteit
- ✅ **Fallback:** File upload als camera niet beschikbaar
- ✅ **UI:** Camera preview, capture, retake

## Belangrijkste Inconsistenties

### 🔴 Kritieke verschillen:
1. **Moderation:** Alleen MultiImageUploader heeft AI moderation, terwijl alle user-generated content dit zou moeten hebben
2. **Camera optie:** Alleen MultiImageUploader en SimpleImageUploader hebben camera, maar QuickCamera kan overal worden gebruikt
3. **Image type validatie:** Sommige componenten checken zelf, anderen vertrouwen alleen op lib/upload.ts

### 🟡 Middelmatige verschillen:
4. **UI consistentie:** PhotoUploader heeft geen drag & drop, terwijl alle anderen dat wel hebben
5. **Endpoint variatie:** Verschillende endpoints worden gebruikt voor verschillende doeleinden (sommige logisch, anderen niet)

### 🟢 Kleine verschillen:
6. **Error handling:** Verschillende error messages en handling
7. **Loading states:** Verschillende manieren om uploading state te tonen

## Aanbevelingen voor Consistentie

### Hoge prioriteit:
1. **Camera optie toevoegen aan alle upload componenten**
   - Gebruik QuickCamera component als basis
   - Of voeg camera knop toe zoals in MultiImageUploader

2. **Moderation overwegen voor alle user-generated content**
   - Bijvoorbeeld voor product foto's, recept foto's, etc.
   - Of maak het optioneel per component

3. **Consistente validatie**
   - Zorg dat alle componenten dezelfde validatie hebben
   - Of verplaats alle validatie naar lib/upload.ts (gedeeltelijk al gedaan)

### Gemiddelde prioriteit:
4. **Drag & drop overal**
   - Voeg drag & drop toe aan PhotoUploader

5. **Consistente error handling**
   - Gebruik dezelfde error messages en notificaties

6. **Consistente loading states**
   - Zelfde loading indicators overal

### Lage prioriteit:
7. **Endpoint consolidatie**
   - Evalueer of alle verschillende endpoints nodig zijn
   - Of gebruik een uniforme upload service

## Conclusie

Er zijn **significant verschillen** tussen de foto upload componenten:
- ❌ Moderation is alleen bij reviews
- ❌ Camera optie is inconsistent
- ⚠️ Validatie is inconsistent
- ⚠️ UI/UX is verschillend

**Aanbeveling:** Maak een uniforme foto upload component of pas alle componenten aan naar een consistente set features.


















