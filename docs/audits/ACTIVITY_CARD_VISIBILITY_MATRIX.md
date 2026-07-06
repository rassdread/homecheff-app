# Activity Card Visibility Matrix

**Phase:** 3A  
**Rule:** All activity cards are **private** — authenticated viewer only. **No SEO.**

---

## Surface matrix

| Surface | Auth required | Max visible | Public / SEO | Notes |
|---------|---------------|-------------|--------------|-------|
| `home_feed` | Yes | 2 | No | Inline bands in GeoFeed after discovery sections |
| `feed_mobile_insert` | Yes | 1 | No | Dedicated insert slots (index 5, 13, 21) |
| `desktop_sidebar` | Yes | 3 | No | Below FeedSidebarFilters (future stack) |
| `profile_owner` | Yes | 4 | No | Owner sidepanel companion |
| `profile_visitor` | Yes | **0** | No | No cards on visitor view — self-actions only |
| `messages_inbox` | Yes | 1 | No | Conversation starters |
| `messages_thread` | Yes | 1 | No | Post-deal review prompts |

---

## Desktop vs mobile

| Concern | Desktop | Mobile |
|---------|---------|--------|
| Primary surface | `desktop_sidebar` + sparse `home_feed` | `feed_mobile_insert` + `home_feed` |
| Density | Up to 3 stacked in sidebar | Max 1 per insert band |
| Discovery sections | Sections lead; cards after item 4+ | Same; cadence 8 items between card bands |
| Guest users | **No cards anywhere** | **No cards** |

---

## Profile pages

- **Owner:** Profile completion + trust + marketplace cards allowed
- **Visitor:** Zero cards — prevents public indexing of prompts and avoids confusing other users

---

## Messages

- Inbox: `start_conversation`, unread follow-ups
- Thread: `leave_review_after_deal` contextual to order

---

## SEO / public visibility

```typescript
ACTIVITY_CARDS_PUBLIC_VISIBILITY === false
```

- No `/activity-cards` routes
- No structured data
- No sitemap entries
- `robots`: N/A — content only in authenticated client renders
