import { useEffect, useRef } from 'react';

/**
 * Opens edit form for a dish when owner navigates from public detail via
 * sessionStorage or Profile V2 URL (?edit=).
 */
export function useInspiratieEditDeepLink(
  isActive: boolean,
  onOpenEdit: (dishId: string) => void | Promise<void>,
) {
  const openedRef = useRef(false);

  useEffect(() => {
    if (!isActive || openedRef.current || typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const urlEditId = params.get('edit')?.trim();
    if (urlEditId) {
      openedRef.current = true;
      sessionStorage.removeItem('inspiratieEditItemId');
      void onOpenEdit(urlEditId);
      return;
    }

    const editId = sessionStorage.getItem('inspiratieEditItemId');
    if (!editId) return;
    openedRef.current = true;
    sessionStorage.removeItem('inspiratieEditItemId');
    void onOpenEdit(editId);
  }, [isActive, onOpenEdit]);
}
