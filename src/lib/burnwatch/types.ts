export type ProviderId = "openai" | "anthropic" | "groq" | "gemini" | "other";

export interface Source {
  id: string;
  provider: ProviderId;
  label: string;
  createdAt: string;
}

export interface UsageRow {
  id: string;
  sourceId: string;
  provider: ProviderId;
  date: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  requests: number;
  costUsd: number;
}

export interface Budget {
  id: string;
  name: string;
  monthlyLimitUsd: number;
  warnPct: number;
  providers: ProviderId[] | "all";
  createdAt: string;
}

export interface AlertEvent {
  id: string;
  budgetId: string;
  createdAt: string;
  kind: "warn" | "critical" | "anomaly";
  message: string;
  spendUsd: number;
  limitUsd: number;
}

export const PROVIDERS: { id: ProviderId; label: string }[] = [
  { id: "openai", label: "OpenAI" },
  { id: "anthropic", label: "Anthropic" },
  { id: "groq", label: "Groq" },
  { id: "gemini", label: "Gemini" },
  { id: "other", label: "Other" },
];

export function providerLabel(id: string): string {
  return PROVIDERS.find((p) => p.id === id)?.label ?? id;
}
