# Recirculation / Duplicate Policy

## Product clarification

Controlled recirculation is **allowed and intentional** for HomeCheff’s infinite scroll.

Goal: maximise unique relevant content first; recirculate only after the unique pool is reasonably exhausted.

## Stages

1. Unique nearby / exact eligible content  
2. Progressive local-first widening when local supply is insufficient  
3. Inspiration / discovery mix (existing stride rules)  
4. Controlled recirculation after unique-pool exhaustion

## Acceptable (not bugs)

- Listings / Inspiration returning later after long scroll  
- Popular items recycling once unique supply is limited  
- Feed staying alive via spaced recirculation batches  

## Still bugs

- Immediate consecutive identical cards  
- Merge / pagination / cursor / API duplicate payloads  
- Recirculation before unique candidates are exhausted  
- Inspiration flooding while unseen marketplace items remain  

## Runtime alignment (verified)

- `markMarketplacePageResult` sets `stage: 'recirculation'` only when marketplace page is exhausted  
- `buildRecirculationBatch` avoids consecutive same-id when alternatives exist (`FEED_RECIRC_MIN_SPACING`)  
- `composedFeedCanContinue` allows recirculation with ≥1 seed after marketplace exhaustion  
