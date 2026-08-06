# Dialog / sheet focus review

## Library

Custom sheet — **not** Radix/Vaul Dialog. `FeedMobileFilterSheet` is a fixed inset `role="dialog"` `aria-modal="true"` overlay.

## Checks

| Check | Result |
|---|---|
| Modal content inert | No — panel is interactive |
| Input inside dialog | Yes — `#feed-mobile-place-input` |
| Parent aria-hidden | Not set on sheet ancestors by this component |
| Nested modal conflict | No second location modal; sheet is sole mobile filter dialog |
| onOpenAutoFocus | Custom timeout focus; no library preventDefault on open |
| onCloseAutoFocus | Restore `previousFocus` only when `open` flips false (fixed) |
| pointer-down-outside | Backdrop click closes only if `target === currentTarget`; panel `stopPropagation` |
| Escape | Closes via `onCloseRef` |
| Body pointer-events | Not set to none by sheet |
| Scroll lock | Overflow scroll on panel only; no touch suppression |

## Prior bug

Effect cleanup restored focus on **every** `onClose` identity change while sheet stayed open → looked like a focus-trap conflict but was React effect churn.
