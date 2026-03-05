'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  SUPPORTED_CURRENCIES,
  currencyForCountry,
  detectGeoCountry,
  formatCurrencyAmount,
} from '@/lib/currency';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CurrencyContextValue {
  /** Currently selected currency code, e.g. "INR" */
  currency: string;
  /** All currencies available for selection */
  currencies: typeof SUPPORTED_CURRENCIES;
  /** Update the selected currency (persisted to localStorage) */
  setCurrency: (code: string) => void;
  /**
   * Format a USD amount for display in the current currency.
   * e.g. formatPrice(9.99) => "₹844.55"
   */
  formatPrice: (usdAmount: number | undefined | null) => string;
  /** true while geo-detection is in progress */
  detecting: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: 'USD',
  currencies: SUPPORTED_CURRENCIES,
  setCurrency: () => {},
  formatPrice: (v) => `$${(v ?? 0).toFixed(2)}`,
  detecting: false,
});

const LS_KEY = 'fomkart_currency';

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<string>('USD');
  const [detecting, setDetecting] = useState(true);

  // On mount: 1) check localStorage preference, 2) fallback to geo-detection
  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored && SUPPORTED_CURRENCIES.some(c => c.code === stored)) {
      setCurrencyState(stored);
      setDetecting(false);
      return;
    }

    // No stored preference → detect by geo
    setDetecting(true);
    detectGeoCountry()
      .then(country => {
        const geoCode = currencyForCountry(country);
        // Only apply geo currency if it's in our supported list
        const supported = SUPPORTED_CURRENCIES.some(c => c.code === geoCode);
        setCurrencyState(supported ? geoCode : 'USD');
      })
      .catch(() => setCurrencyState('USD'))
      .finally(() => setDetecting(false));
  }, []);

  const setCurrency = useCallback((code: string) => {
    if (!SUPPORTED_CURRENCIES.some(c => c.code === code)) return;
    setCurrencyState(code);
    localStorage.setItem(LS_KEY, code);
  }, []);

  const formatPrice = useCallback(
    (usdAmount: number | undefined | null): string => {
      const amount = typeof usdAmount === 'number' && Number.isFinite(usdAmount) ? usdAmount : 0;
      return formatCurrencyAmount(amount, currency);
    },
    [currency],
  );

  const value = useMemo(
    () => ({ currency, currencies: SUPPORTED_CURRENCIES, setCurrency, formatPrice, detecting }),
    [currency, setCurrency, formatPrice, detecting],
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCurrency() {
  return useContext(CurrencyContext);
}
