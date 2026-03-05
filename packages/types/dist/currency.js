export const SUPPORTED_CURRENCIES = [
    'USD',
    'EUR',
    'GBP',
    'THB',
    'IDR',
    'MXN',
    'AED',
    'TZS',
    'FJD',
    'MVR',
];
const USD_TO_CURRENCY_RATE = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.78,
    THB: 35.9,
    IDR: 15700,
    MXN: 17.1,
    AED: 3.67,
    TZS: 2570,
    FJD: 2.24,
    MVR: 15.42,
};
const COUNTRY_TO_CURRENCY = {
    thailand: 'THB',
    indonesia: 'IDR',
    maldives: 'MVR',
    mexico: 'MXN',
    greece: 'EUR',
    italy: 'EUR',
    france: 'EUR',
    spain: 'EUR',
    portugal: 'EUR',
    germany: 'EUR',
    ireland: 'EUR',
    uk: 'GBP',
    'united kingdom': 'GBP',
    england: 'GBP',
    scotland: 'GBP',
    uae: 'AED',
    'united arab emirates': 'AED',
    tanzania: 'TZS',
    fiji: 'FJD',
    usa: 'USD',
    'united states': 'USD',
};
export function currencyForCountry(country) {
    if (!country)
        return 'USD';
    return COUNTRY_TO_CURRENCY[country.trim().toLowerCase()] ?? 'USD';
}
export function convertFromUsd(amountUsd, currency) {
    return amountUsd * (USD_TO_CURRENCY_RATE[currency] ?? 1);
}
export function convertToUsd(amount, currency) {
    return amount / (USD_TO_CURRENCY_RATE[currency] ?? 1);
}
export function formatMoney(amount, currency) {
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(amount);
}
//# sourceMappingURL=currency.js.map