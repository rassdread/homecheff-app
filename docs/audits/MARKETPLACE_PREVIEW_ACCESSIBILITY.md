# Marketplace Preview Accessibility

**Status:** Complete  
**Last updated:** 2026-07-06  
**Phase:** T3

---

## Keyboard

| Interaction | Behavior |
|-------------|----------|
| Tab to tile shell | Opens preview after 300ms focus (desktop) |
| Tab away | Closes when focus leaves shell + preview |
| Escape | Closes hover preview and bottom sheet |
| Actions in preview | Standard tab order: view link → message → favorite |

---

## Screen readers

| Element | Role / label |
|---------|----------------|
| Preview shell | Focusable (`tabIndex={0}`) |
| Hover panel | `role="dialog"` + `aria-label` (`marketplace.preview.ariaLabel`) |
| Bottom sheet | `role="dialog"` + `aria-modal="true"` |
| Close button | `aria-label` from `buttons.close` |
| Fulfillment row | `aria-label` on list (`marketplace.preview.sections.fulfillment`) |
| Fulfillment icons | `aria-hidden` on decorative icons |

---

## Pointer / touch parity

| Input | Desktop | Mobile |
|-------|---------|--------|
| Open | Hover 300ms | Long press 500ms |
| Close | Mouse leave | Swipe down, backdrop tap, close button |
| Favorite | Ignored for preview trigger | Same (`data-preview-ignore`) |

Long-press suppresses the subsequent click to avoid accidental navigation.

---

## Motion

- Hover: `fade-in` + `zoom-in-95` (150ms)
- Sheet: `slide-in-from-bottom` (200ms)
- Respects reduced-motion via Tailwind `animate-in` utilities (project default)

---

## Focus management

- Preview does not trap focus (lightweight secondary layer)
- Escape always dismisses without navigating
- Message action opens existing chat modal (inherits `StartChatButton` dialog semantics)

---

## Known limitations

- Hover preview is mouse-primary on desktop; keyboard users get focus-triggered preview
- Touch devices below lg breakpoint do not get hover preview (long press only)
- No `aria-describedby` link from tile to preview ID (future enhancement)

---

## Test checklist

- [ ] Tab to feed tile → preview opens → Escape closes
- [ ] Hover tile 300ms → preview appears → move to preview → stays open → leave → closes
- [ ] Long press mobile tile 500ms → sheet opens → swipe down closes
- [ ] Tap backdrop closes sheet
- [ ] Favorite button does not open preview on long press
- [ ] Screen reader announces dialog label on open
