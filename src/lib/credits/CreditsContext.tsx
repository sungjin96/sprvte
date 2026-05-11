'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface CreditsContextValue {
  credits: number;
  /** Try to charge `amount`. Returns true on success, false on insufficient. */
  charge: (amount: number) => boolean;
  /** Refund `amount` (e.g. on API failure after a successful charge). */
  refund: (amount: number) => void;
  /** Replace credits — for SSR sync or live ledger updates. */
  setCredits: (n: number) => void;
}

const CreditsContext = createContext<CreditsContextValue | null>(null);

export function CreditsProvider({
  initial,
  children,
}: {
  initial: number;
  children: ReactNode;
}) {
  const [credits, setCreditsState] = useState(initial);

  const charge = useCallback((amount: number) => {
    if (amount <= 0) return true;
    let success = false;
    setCreditsState((c) => {
      if (c < amount) { success = false; return c; }
      success = true;
      return c - amount;
    });
    return success;
  }, []);

  const refund = useCallback((amount: number) => {
    setCreditsState((c) => c + Math.max(0, amount));
  }, []);

  return (
    <CreditsContext.Provider value={{ credits, charge, refund, setCredits: setCreditsState }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits(): CreditsContextValue {
  const ctx = useContext(CreditsContext);
  if (!ctx) {
    throw new Error('useCredits must be used inside <CreditsProvider>');
  }
  return ctx;
}
