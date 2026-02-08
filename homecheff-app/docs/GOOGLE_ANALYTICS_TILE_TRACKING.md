# Google Analytics Tile Tracking

## Overzicht

Deze documentatie beschrijft hoe views en clicks worden getrackt op dashboard tegels en data visualisaties.

## Huidige Status

### ✅ Al Geïmplementeerd:
- Basis Google Analytics 4 (GA4) tracking
- Automatische page views
- User type tracking
- E-commerce events (view_item, add_to_cart, purchase)

### ❌ Nog Te Implementeren:
- View tracking op dashboard tegels (wanneer tegels zichtbaar zijn)
- Click tracking op interactieve tegels
- Tracking op analytics dashboard componenten
- Tracking op data visualisaties

## Implementatie Plan

### 1. Helper Hook voor Tile Tracking

```typescript
// hooks/useTileTracking.ts
import { useEffect, useRef } from 'react';
import { trackEvent } from '@/components/GoogleAnalytics';

export function useTileTracking(tileId: string, tileName: string, data?: Record<string, any>) {
  const hasTrackedView = useRef(false);

  // Track view when tile becomes visible
  useEffect(() => {
    if (hasTrackedView.current) return;
    
    // Track tile view
    trackEvent('tile_view', {
      tile_id: tileId,
      tile_name: tileName,
      ...data,
    });
    
    hasTrackedView.current = true;
  }, [tileId, tileName]);

  // Track click handler
  const trackClick = (action?: string) => {
    trackEvent('tile_click', {
      tile_id: tileId,
      tile_name: tileName,
      action: action || 'click',
      ...data,
    });
  };

  return { trackClick };
}
```

### 2. Toepassing op Dashboard Tegels

Voorbeeld voor een stat tile:

```typescript
import { useTileTracking } from '@/hooks/useTileTracking';

function StatTile({ metric, value, ...props }) {
  const { trackClick } = useTileTracking(`stat-${metric}`, `Stat: ${metric}`, {
    metric,
    value,
  });

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border p-6"
      onClick={() => trackClick('stat_view')}
    >
      {/* Tile content */}
    </div>
  );
}
```

### 3. Tiles die Getrackt Moeten Worden

#### Admin Dashboard:
- Revenue tiles
- User count tiles
- Product count tiles
- Order count tiles
- Delivery stats tiles

#### Analytics Dashboard:
- Metric cards
- Chart components
- Data tables
- Filter interactions

#### Financial Dashboard:
- Revenue overview tiles
- Subscription stats
- Payout stats
- Monthly stats

## Event Namen

- `tile_view` - Wanneer een tile zichtbaar wordt
- `tile_click` - Wanneer gebruiker op tile klikt
- `dashboard_view` - Wanneer dashboard wordt bekeken
- `data_export` - Wanneer data wordt geëxporteerd
- `filter_change` - Wanneer filters worden gewijzigd

## Data Parameters

Alle events bevatten:
- `tile_id` - Unieke ID van de tile
- `tile_name` - Menselijke naam van de tile
- `dashboard` - Dashboard naam (admin, analytics, financial, etc.)
- Optionele context data (metrics, values, etc.)




