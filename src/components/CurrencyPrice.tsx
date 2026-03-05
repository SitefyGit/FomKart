'use client';

import { useCurrency } from '@/contexts/CurrencyContext';

interface CurrencyPriceProps {
  /** Amount in USD */
  usdAmount: number;
  className?: string;
  /** Optional prefix like "From " */
  prefix?: string;
}

/**
 * Renders a USD price converted to the user's selected currency.
 * Works inside server-component trees because it's a leaf client component.
 */
export function CurrencyPrice({ usdAmount, className, prefix }: CurrencyPriceProps) {
  const { formatPrice } = useCurrency();
  return (
    <span className={className}>
      {prefix}{formatPrice(usdAmount)}
    </span>
  );
}
