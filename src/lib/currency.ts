// ─────────────────────────────────────────────────────────────────────────────
// FomKart Currency utilities
// Prices are always stored as USD in the database.
// Everything here is about DISPLAY conversion only (buyer & seller view).
// ─────────────────────────────────────────────────────────────────────────────

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  /** Currencies where decimals make no sense (JPY, IDR, etc.) */
  noDecimals?: boolean;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$',   name: 'US Dollar',            locale: 'en-US' },
  { code: 'EUR', symbol: '€',   name: 'Euro',                 locale: 'de-DE' },
  { code: 'GBP', symbol: '£',   name: 'British Pound',        locale: 'en-GB' },
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee',         locale: 'en-IN' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar',      locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar',    locale: 'en-AU' },
  { code: 'SGD', symbol: 'S$',  name: 'Singapore Dollar',     locale: 'en-SG' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham',           locale: 'ar-AE' },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen',         locale: 'ja-JP', noDecimals: true },
  { code: 'BRL', symbol: 'R$',  name: 'Brazilian Real',       locale: 'pt-BR' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso',         locale: 'es-MX' },
  { code: 'PKR', symbol: '₨',   name: 'Pakistani Rupee',      locale: 'ur-PK' },
  { code: 'BDT', symbol: '৳',   name: 'Bangladeshi Taka',     locale: 'bn-BD' },
  { code: 'NGN', symbol: '₦',   name: 'Nigerian Naira',       locale: 'en-NG' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling',      locale: 'sw-KE' },
  { code: 'ZAR', symbol: 'R',   name: 'South African Rand',   locale: 'en-ZA' },
  { code: 'IDR', symbol: 'Rp',  name: 'Indonesian Rupiah',    locale: 'id-ID', noDecimals: true },
  { code: 'PHP', symbol: '₱',   name: 'Philippine Peso',      locale: 'en-PH' },
  { code: 'MYR', symbol: 'RM',  name: 'Malaysian Ringgit',    locale: 'ms-MY' },
  { code: 'THB', symbol: '฿',   name: 'Thai Baht',            locale: 'th-TH' },
  { code: 'TRY', symbol: '₺',   name: 'Turkish Lira',         locale: 'tr-TR' },
  { code: 'SAR', symbol: 'SR',  name: 'Saudi Riyal',          locale: 'ar-SA' },
  { code: 'EGP', symbol: 'E£',  name: 'Egyptian Pound',       locale: 'ar-EG' },
  { code: 'QAR', symbol: 'QR',  name: 'Qatari Riyal',         locale: 'ar-QA' },
  { code: 'KWD', symbol: 'KD',  name: 'Kuwaiti Dinar',        locale: 'ar-KW' },
  { code: 'CHF', symbol: 'Fr',  name: 'Swiss Franc',          locale: 'de-CH' },
  { code: 'SEK', symbol: 'kr',  name: 'Swedish Krona',        locale: 'sv-SE' },
  { code: 'NOK', symbol: 'kr',  name: 'Norwegian Krone',      locale: 'nb-NO' },
  { code: 'DKK', symbol: 'kr',  name: 'Danish Krone',         locale: 'da-DK' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar',   locale: 'en-NZ' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar',     locale: 'zh-HK' },
];

// Static approximate rates vs USD (refreshed periodically – close enough for display)
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  INR: 84.5,
  CAD: 1.37,
  AUD: 1.55,
  SGD: 1.34,
  AED: 3.67,
  JPY: 150.5,
  BRL: 4.97,
  MXN: 17.2,
  PKR: 278,
  BDT: 110,
  NGN: 1590,
  KES: 130,
  ZAR: 18.5,
  IDR: 15700,
  PHP: 56.5,
  MYR: 4.7,
  THB: 35.5,
  TRY: 32.5,
  SAR: 3.75,
  EGP: 30.9,
  QAR: 3.64,
  KWD: 0.308,
  CHF: 0.89,
  SEK: 10.4,
  NOK: 10.5,
  DKK: 6.87,
  NZD: 1.63,
  HKD: 7.82,
};

// Country → default currency code
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: 'USD', CA: 'CAD', GB: 'GBP', AU: 'AUD', NZ: 'NZD',
  IN: 'INR', PK: 'PKR', BD: 'BDT', LK: 'USD', NP: 'USD',
  SG: 'SGD', MY: 'MYR', TH: 'THB', PH: 'PHP', ID: 'IDR',
  JP: 'JPY', CN: 'USD', KR: 'USD', HK: 'HKD', TW: 'USD',
  AE: 'AED', SA: 'SAR', QA: 'QAR', KW: 'KWD', BH: 'USD',
  OM: 'USD', JO: 'USD', EG: 'EGP', NG: 'NGN', KE: 'KES',
  ZA: 'ZAR', GH: 'USD', RW: 'USD', TZ: 'USD', UG: 'USD',
  BR: 'BRL', MX: 'MXN', AR: 'USD', CO: 'USD', CL: 'USD',
  TR: 'TRY', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR',
  NL: 'EUR', BE: 'EUR', PT: 'EUR', AT: 'EUR', IE: 'EUR',
  FI: 'EUR', GR: 'EUR', CH: 'CHF', SE: 'SEK', NO: 'NOK',
  DK: 'DKK', PL: 'USD', CZ: 'USD', HU: 'USD', RU: 'USD',
};

/** Convert a USD amount to the target currency for display */
export function convertFromUSD(amountUSD: number, toCurrency: string): number {
  const rate = EXCHANGE_RATES[toCurrency] ?? 1;
  return amountUSD * rate;
}

/**
 * Convert an amount entered in any currency BACK to USD for storage.
 * sellers enter prices in their selected currency; we store as USD.
 */
export function convertToUSD(amount: number, fromCurrency: string): number {
  const rate = EXCHANGE_RATES[fromCurrency] ?? 1;
  return amount / rate;
}

/** Format a USD price for display in the target currency */
export function formatCurrencyAmount(amountUSD: number, currencyCode: string): string {
  const curr = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) ?? SUPPORTED_CURRENCIES[0];
  const converted = convertFromUSD(amountUSD, currencyCode);
  const digits = curr.noDecimals ? 0 : 2;

  try {
    return new Intl.NumberFormat(curr.locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(converted);
  } catch {
    return `${curr.symbol}${converted.toFixed(digits)}`;
  }
}

/** Detect the user's country via ipapi.co (cached in sessionStorage) */
export async function detectGeoCountry(): Promise<string> {
  if (typeof window === 'undefined') return 'US';
  try {
    const cached = sessionStorage.getItem('fomkart_geo_country');
    if (cached) return cached;
    const res = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data: { country_code?: string } = await res.json();
      const country = data.country_code ?? 'US';
      sessionStorage.setItem('fomkart_geo_country', country);
      return country;
    }
  } catch {
    // silently fall back
  }
  return 'US';
}

/** Derive a default currency from a country code */
export function currencyForCountry(countryCode: string): string {
  return COUNTRY_TO_CURRENCY[countryCode] ?? 'USD';
}
