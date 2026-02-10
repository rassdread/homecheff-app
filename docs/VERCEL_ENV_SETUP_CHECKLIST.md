# ✅ Vercel Environment Variables Setup Checklist

## 🔑 Wat je moet hebben in Vercel

### Environment Variables:

1. **`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`** (client-side)
   - Waarde: "API key 2" key (de key met HTTP referrers, 5 APIs)
   - Dit is de key voor browser/kaarten/autocomplete

2. **`GOOGLE_MAPS_API_KEY`** (server-side)
   - Waarde: "Maps Platform API Key" key (de key met 32 APIs)
   - Dit is de key voor server/geocoding/distance matrix

### Check:

- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` staat in Vercel
- [ ] `GOOGLE_MAPS_API_KEY` staat in Vercel
- [ ] Beide hebben de juiste key waarden
- [ ] Beide zijn geselecteerd voor:
  - ✅ Production
  - ✅ Preview
  - ✅ Development

---

## 🚀 Na toevoegen in Vercel

1. **Deploy opnieuw** naar productie: `vercel --prod`
2. **Test** dat alles werkt:
   - Places Autocomplete werkt
   - Admin Live Location Map werkt
   - Geocoding werkt

---

## ⚠️ Belangrijk

- `NEXT_PUBLIC_` prefix betekent dat de key **zichtbaar is in de browser**
- Daarom moet `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` **HTTP referrer restrictions** hebben
- `GOOGLE_MAPS_API_KEY` (zonder prefix) is alleen voor server-side









