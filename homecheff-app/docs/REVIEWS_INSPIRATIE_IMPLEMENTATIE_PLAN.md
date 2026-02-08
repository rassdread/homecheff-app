# 📋 Reviews voor Inspiratie Items - Implementatie Plan

## 🎯 Doel
Reviews toevoegen aan inspiratie items met verschillende regels per pagina:
- **Inspiratie pagina**: Iedereen kan reviews posten
- **Dorpsplein**: Alleen gebruikers die een item hebben gekocht kunnen reviews posten

## 📝 Stappenplan

### **STAP 1: Database Schema** ✅
- [ ] Nieuw model `DishReview` toevoegen aan Prisma schema
  - Velden: `id`, `dishId`, `reviewerId`, `orderId?`, `rating`, `title?`, `comment`, `isVerified`, `createdAt`, `updatedAt`
  - Relaties: `Dish`, `User` (reviewer)
  - Unique constraint: `dishId_reviewerId` (één review per gebruiker per dish)
  - Indexes: `dishId`, `reviewerId`
- [ ] Model `DishReviewImage` toevoegen (optioneel, voor review foto's)
- [ ] Prisma migratie uitvoeren

### **STAP 2: API Endpoints** ✅
- [ ] `GET /api/inspiratie/[id]/reviews` - Haal reviews op voor inspiratie item
- [ ] `POST /api/inspiratie/[id]/reviews` - Maak nieuwe review (inspiratie - iedereen)
- [ ] `GET /api/dorpsplein/products/[id]/reviews` - Haal reviews op voor product
- [ ] `POST /api/dorpsplein/products/[id]/reviews` - Maak review (alleen voor kopers)
- [ ] `GET /api/inspiratie/[id]/reviews/count` - Review count voor inspiratie item
- [ ] `GET /api/profile/items-with-reviews` - Items met reviews voor profiel tab

### **STAP 3: Inspiratie Pagina** ✅
- [ ] Review component toevoegen aan `InspiratieDetail`
- [ ] Review lijst weergeven
- [ ] Review form toevoegen (iedereen kan posten)
- [ ] Review count weergeven
- [ ] Gemiddelde rating berekenen en tonen

### **STAP 4: Dorpsplein** ✅
- [ ] Review component toevoegen aan product cards
- [ ] Review lijst weergeven
- [ ] Review form toevoegen (alleen voor kopers)
- [ ] Validatie: check of gebruiker item heeft gekocht
- [ ] Review count weergeven
- [ ] Gemiddelde rating berekenen en tonen

### **STAP 5: Profiel Pagina** ✅
- [ ] Nieuwe tab "Reviews" toevoegen aan profiel
- [ ] API endpoint voor items met reviews
- [ ] Component om items met reviews weer te geven
- [ ] Filter/sort opties (nieuwste, hoogste rating, etc.)

### **STAP 6: Review Count** ✅
- [ ] Review count bijhouden in database queries
- [ ] Review count weergeven op inspiratie items
- [ ] Review count weergeven op dorpsplein producten
- [ ] Review count in profiel tab

## 🔧 Technische Details

### Database Model
```prisma
model DishReview {
  id          String   @id @default(uuid())
  dishId      String
  reviewerId  String
  orderId     String?  // Optioneel - voor verified reviews
  rating      Int      // 1-5
  title       String?
  comment     String
  isVerified  Boolean  @default(false) // true als orderId bestaat
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  dish        Dish     @relation(fields: [dishId], references: [id], onDelete: Cascade)
  reviewer    User     @relation("DishReviewReviewer", fields: [reviewerId], references: [id], onDelete: Cascade)
  order       Order?   @relation(fields: [orderId], references: [id])
  images      DishReviewImage[]
  
  @@unique([dishId, reviewerId])
  @@index([dishId])
  @@index([reviewerId])
}

model DishReviewImage {
  id         String     @id @default(uuid())
  reviewId   String
  url        String
  sortOrder  Int        @default(0)
  review     DishReview @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  
  @@index([reviewId])
}
```

### API Validatie (Dorpsplein)
```typescript
// Check of gebruiker product heeft gekocht
const hasPurchased = await prisma.order.findFirst({
  where: {
    userId: user.id,
    items: {
      some: {
        productId: productId
      }
    },
    stripeSessionId: { not: null } // Alleen betaalde orders
  }
});

if (!hasPurchased) {
  return NextResponse.json({ error: 'Je moet dit item eerst kopen voordat je een review kunt plaatsen' }, { status: 403 });
}
```

### Review Count Query
```typescript
const reviewCount = await prisma.dishReview.count({
  where: { dishId: dishId }
});

const averageRating = await prisma.dishReview.aggregate({
  where: { dishId: dishId },
  _avg: { rating: true }
});
```

## 📊 Component Structuur

### Inspiratie Detail Page
```
InspiratieDetail
├── Item Info
├── Photos
├── Reviews Section (NIEUW)
│   ├── Review Count & Average Rating
│   ├── Review List
│   └── Review Form (iedereen kan posten)
└── Related Items
```

### Dorpsplein Product Card
```
ProductCard
├── Product Info
├── Reviews Badge (NIEUW)
│   └── Review Count & Rating
└── Actions
```

### Profiel Page
```
ProfileClient
├── Overview Tab
├── Products Tab
├── Reviews Tab (NIEUW)
│   ├── Items with Reviews List
│   └── Review Details
└── Other Tabs
```

## ✅ Checklist

### Database
- [ ] DishReview model toegevoegd
- [ ] DishReviewImage model toegevoegd
- [ ] Migratie uitgevoerd
- [ ] Prisma client gegenereerd

### API
- [ ] GET /api/inspiratie/[id]/reviews
- [ ] POST /api/inspiratie/[id]/reviews
- [ ] GET /api/dorpsplein/products/[id]/reviews
- [ ] POST /api/dorpsplein/products/[id]/reviews (met purchase check)
- [ ] GET /api/inspiratie/[id]/reviews/count
- [ ] GET /api/profile/items-with-reviews

### Frontend
- [ ] Review component voor inspiratie
- [ ] Review component voor dorpsplein
- [ ] Review form component
- [ ] Review list component
- [ ] Review count display
- [ ] Average rating display
- [ ] Profiel tab "Reviews"

### Testing
- [ ] Test review posten op inspiratie (zonder purchase)
- [ ] Test review posten op dorpsplein (met purchase)
- [ ] Test review posten op dorpsplein (zonder purchase - moet falen)
- [ ] Test review count update
- [ ] Test profiel tab met reviews

## 🚀 Volgorde van Implementatie

1. **Database Schema** - Basis voor alles
2. **API Endpoints** - Backend functionaliteit
3. **Inspiratie Reviews** - Eenvoudigste (iedereen kan posten)
4. **Dorpsplein Reviews** - Complexer (purchase check)
5. **Profiel Tab** - Laatste stap
6. **Review Count** - Overal integreren

## 📝 Notities

- **Geen bestaande functionaliteiten verliezen**: Alle huidige features blijven werken
- **Review count**: Wordt real-time berekend, geen cached count
- **Verified reviews**: Reviews met orderId zijn "verified" (alleen dorpsplein)
- **Review images**: Optioneel, maar model is klaar voor toekomstige uitbreiding






















