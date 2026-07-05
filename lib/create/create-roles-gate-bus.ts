/** Lets BottomNavigation trigger the roles gate modal owned by CreateFlowProvider. */

type GateHandler = () => void;

let onShowGate: GateHandler | null = null;

export function registerCreateRolesGate(handler: GateHandler): () => void {
  onShowGate = handler;
  return () => {
    if (onShowGate === handler) onShowGate = null;
  };
}

export function showCreateRolesGate(): void {
  onShowGate?.();
}
