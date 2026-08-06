# Rollback plan

1. Revert commit(s) on `fix/location-input-repair` that touch:
   - `components/feed/FeedMobileFilterSheet.tsx`
   - `components/feed/GeoFeed.tsx`
   - `components/feed/FeedSidebarFilters.tsx`
   - `android/app/src/main/AndroidManifest.xml`
   - related validators / evidence
2. Rebuild Android if manifest was shipped in an APK.
3. No DB migration to roll back.
4. Feature flag: none — code revert is sufficient.
