const RATES: Record<string, { inn: number; out: number }> = {
  "gpt-4o": { inn: 2.5, out: 10 },
  "gpt-4o-mini": { inn: 0.15, out: 0.6 },
  "gpt-4.1": { inn: 2, out: 8 },
  "gpt-5": { inn: 1.25, out: 10 },
  "gpt-5-mini": { inn: 0.25, out: 2 },
  "o4-mini": { inn: 1.1, out: 4.4 },
  "claude-sonnet-4": { inn: 3, out: 15 },
  "claude-opus-4": { inn: 15, out: 75 },
  "claude-haiku-4": { inn: 0.8, out: 4 },
  "claude-3-5-sonnet": { inn: 3, out: 15 },
  "llama-3.3-70b": { inn: 0.59, out: 0.79 },
  "llama-3.1-8b": { inn: 0.05, out: 0.08 },
  "gemini-2.5-pro": { inn: 1.25, out: 10 },
  "gemini-2.5-flash": { inn: 0.15, out: 0.6 },
};

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const key = Object.keys(RATES).find((k) => model.toLowerCase().includes(k));
  const rate = key ? RATES[key] : { inn: 1, out: 3 };
  return (inputTokens / 1_000_000) * rate.inn + (outputTokens / 1_000_000) * rate.out;
}

export function isoDate(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function monthStart(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export type CurrencyCode = "USD" | "INR" | "EUR" | "GBP" | "JPY" | "AED" | "SGD" | "AUD";

type Currency = {
  code: CurrencyCode;
  label: string;
  locale: string;
  perUsd: number;
};

export const CURRENCIES: readonly Currency[] = [
  { code: "USD", label: "US Dollar", locale: "en-US", perUsd: 1 },
  { code: "INR", label: "Indian Rupee", locale: "en-IN", perUsd: 83.5 },
  { code: "EUR", label: "Euro", locale: "de-DE", perUsd: 0.92 },
  { code: "GBP", label: "British Pound", locale: "en-GB", perUsd: 0.79 },
  { code: "JPY", label: "Japanese Yen", locale: "ja-JP", perUsd: 150 },
  { code: "AED", label: "UAE Dirham", locale: "en-AE", perUsd: 3.67 },
  { code: "SGD", label: "Singapore Dollar", locale: "en-SG", perUsd: 1.34 },
  { code: "AUD", label: "Australian Dollar", locale: "en-AU", perUsd: 1.52 },
];

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && CURRENCIES.some((currency) => currency.code === value);
}

function currencyFor(code: CurrencyCode): Currency {
  return CURRENCIES.find((currency) => currency.code === code) ?? CURRENCIES[0];
}

export function toCurrency(usd: number, currency: CurrencyCode): number {
  return usd * currencyFor(currency).perUsd;
}

export function fromCurrency(amount: number, currency: CurrencyCode): number {
  return amount / currencyFor(currency).perUsd;
}

export function money(usd: number, currency: CurrencyCode = "USD"): string {
  const { locale } = currencyFor(currency);
  return toCurrency(usd, currency).toLocaleString(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  });
}
