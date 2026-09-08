import type { Budget, Source, UsageRow } from "./types";
import { addDays, estimateCost, isoDate, monthStart } from "./pricing";

const MODELS = [
  { provider: "openai" as const, model: "gpt-4o", weight: 0.28 },
  { provider: "openai" as const, model: "gpt-4o-mini", weight: 0.22 },
  { provider: "anthropic" as const, model: "claude-sonnet-4", weight: 0.24 },
  { provider: "anthropic" as const, model: "claude-haiku-4", weight: 0.08 },
  { provider: "groq" as const, model: "llama-3.3-70b-versatile", weight: 0.1 },
  { provider: "gemini" as const, model: "gemini-2.5-flash", weight: 0.08 },
];

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export function buildDemo() {
  const now = new Date().toISOString();
  const sources: Source[] = [
    { id: "src_openai", provider: "openai", label: "OpenAI production", createdAt: now },
    { id: "src_anthropic", provider: "anthropic", label: "Anthropic production", createdAt: now },
    { id: "src_groq", provider: "groq", label: "Groq production", createdAt: now },
    { id: "src_gemini", provider: "gemini", label: "Gemini production", createdAt: now },
  ];

  const today = isoDate();
  const start = addDays(monthStart(), -20);
  const rand = rng(42);
  const usage: UsageRow[] = [];

  for (let i = 0; i < 50; i++) {
    const date = addDays(start, i);
    if (date > today) break;
    const weekend = new Date(`${date}T00:00:00Z`).getUTCDay() % 6 === 0;
    const spike = date === addDays(today, -2);
    for (const m of MODELS) {
      const base = weekend ? 0.35 : 1;
      const mult = spike && m.provider === "openai" ? 3.4 : 1;
      const req = Math.round((80 + rand() * 220) * m.weight * base * mult);
      const inputTokens = Math.round(req * (400 + rand() * 900));
      const outputTokens = Math.round(req * (180 + rand() * 500));
      const costUsd = estimateCost(m.model, inputTokens, outputTokens) * (0.9 + rand() * 0.2);
      usage.push({
        id: `u_${date}_${m.model}_${i}`,
        sourceId: `src_${m.provider}`,
        provider: m.provider,
        date,
        model: m.model,
        inputTokens,
        outputTokens,
        requests: req,
        costUsd: Number(costUsd.toFixed(4)),
      });
    }
  }

  const budgets: Budget[] = [
    {
      id: "bud_demo",
      name: "Company monthly cap",
      monthlyLimitUsd: 2500,
      warnPct: 80,
      providers: "all",
      createdAt: now,
    },
  ];

  return { sources, usage, budgets };
}
