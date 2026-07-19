export type TutorialAction =
  | 'view-metrics'
  | 'search'
  | 'filter-niche'
  | 'filter-country'
  | 'filter-status'
  | 'clear-filters'
  | 'export-csv'
  | 'open-maps'
  | 'toggle-vector'
  | 'open-vector-node';

const EVENT_NAME = 'outreachos:tutorial-action';

export function emitTutorialAction(action: TutorialAction): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(
    new CustomEvent(EVENT_NAME, {
      detail: { action },
    })
  );
}

export function subscribeTutorialAction(
  handler: (action: TutorialAction) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const listener = (event: Event) => {
    const custom = event as CustomEvent<{ action?: TutorialAction }>;
    const action = custom.detail?.action;
    if (action) {
      handler(action);
    }
  };

  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
