import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AlertEvent, Budget, ProviderId, Source, UsageRow } from "./types";
import { parseCsv } from "./csv";
import { buildDemo } from "./demo";
import { evaluateAlerts } from "./analytics";
import { isCurrencyCode, type CurrencyCode } from "./pricing";

interface Workspace {
  sources: Source[];
  usage: UsageRow[];
  budgets: Budget[];
  alerts: AlertEvent[];
  currency: CurrencyCode;
  seeded: boolean;
  setCurrency: (currency: CurrencyCode) => void;
  loadDemo: () => void;
  clearAll: () => void;
  addSource: (provider: ProviderId, label: string) => Source;
  removeSource: (id: string) => void;
  ingestCsv: (sourceId: string, text: string) => number;
  addBudget: (b: Omit<Budget, "id" | "createdAt">) => void;
  removeBudget: (id: string) => void;
  exportJson: () => string;
  importJson: (raw: string) => void;
}

function refreshAlerts(state: {
  budgets: Budget[];
  usage: UsageRow[];
  alerts: AlertEvent[];
}): AlertEvent[] {
  const fresh = evaluateAlerts(state.budgets, state.usage, state.alerts);
  if (!fresh.length) return state.alerts;
  return [
    ...state.alerts,
    ...fresh.map((a) => ({
      ...a,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    })),
  ];
}

export const useWorkspace = create<Workspace>()(
  persist(
    (set, get) => ({
      sources: [],
      usage: [],
      budgets: [],
      alerts: [],
      currency: "USD",
      seeded: false,
      setCurrency: (currency) => set({ currency }),
      loadDemo: () => {
        const demo = buildDemo();
        set({
          sources: demo.sources,
          usage: demo.usage,
          budgets: demo.budgets,
          alerts: [],
          seeded: true,
        });
        set((s) => ({ alerts: refreshAlerts(s) }));
      },
      clearAll: () => set({ sources: [], usage: [], budgets: [], alerts: [], seeded: false }),
      addSource: (provider, label) => {
        const source: Source = {
          id: crypto.randomUUID(),
          provider,
          label: label || `${provider} export`,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ sources: [...s.sources, source] }));
        return source;
      },
      removeSource: (id) =>
        set((s) => ({
          sources: s.sources.filter((x) => x.id !== id),
          usage: s.usage.filter((x) => x.sourceId !== id),
        })),
      ingestCsv: (sourceId, text) => {
        const source = get().sources.find((s) => s.id === sourceId);
        if (!source) throw new Error("Source not found.");
        const rows = parseCsv(text, source);
        set((s) => {
          const usage = [...s.usage.filter((u) => u.sourceId !== sourceId), ...rows];
          const next = { ...s, usage };
          return { usage, alerts: refreshAlerts(next) };
        });
        return rows.length;
      },
      addBudget: (b) =>
        set((s) => {
          const budgets = [
            ...s.budgets,
            { ...b, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
          ];
          const next = { ...s, budgets };
          return { budgets, alerts: refreshAlerts(next) };
        }),
      removeBudget: (id) =>
        set((s) => ({
          budgets: s.budgets.filter((b) => b.id !== id),
          alerts: s.alerts.filter((a) => a.budgetId !== id),
        })),
      exportJson: () => {
        const { sources, usage, budgets, alerts, currency } = get();
        return JSON.stringify({ sources, usage, budgets, alerts, currency }, null, 2);
      },
      importJson: (raw) => {
        const data = JSON.parse(raw) as Partial<Workspace>;
        if (!Array.isArray(data.usage)) throw new Error("Invalid backup file.");
        set({
          sources: data.sources ?? [],
          usage: data.usage ?? [],
          budgets: data.budgets ?? [],
          alerts: data.alerts ?? [],
          currency: isCurrencyCode(data.currency) ? data.currency : "USD",
          seeded: true,
        });
      },
    }),
    { name: "burnwatch-workspace" },
  ),
);
