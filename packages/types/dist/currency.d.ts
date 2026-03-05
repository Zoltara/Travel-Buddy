import type { CurrencyCode } from './preferences.js';
export declare const SUPPORTED_CURRENCIES: readonly CurrencyCode[];
export declare function currencyForCountry(country?: string): CurrencyCode;
export declare function convertFromUsd(amountUsd: number, currency: CurrencyCode): number;
export declare function convertToUsd(amount: number, currency: CurrencyCode): number;
export declare function formatMoney(amount: number, currency: CurrencyCode): string;
//# sourceMappingURL=currency.d.ts.map