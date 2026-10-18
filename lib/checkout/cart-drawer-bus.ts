type Listener = (open: boolean) => void;

const listeners = new Set<Listener>();

export function openCartDrawer(): void {
  listeners.forEach((listener) => listener(true));
}

export function subscribeCartDrawer(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
