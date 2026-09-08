import type { Budget, ProviderId, UsageRow } from "./types";
import { isoDate, monthStart } from "./pricing";

export function sum(rows: UsageRow[]): number {
  return rows.reduce((a, r) => a + r.costUsd, 0);
}

export function inRange(rows: UsageRow[], from: string, to: string) {
  return rows.filter((r) => r.date >= from && r.date <= to);
}

export function groupByDay(rows: UsageRow[]) {
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.date, (map.get(r.date) || 0) + r.costUsd);
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, costUsd]) => ({ date, costUsd }));
}

export function groupByProvider(rows: UsageRow[]) {
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.provider, (map.get(r.provider) || 0) + r.costUsd);
  return [...map.entries()]
    .map(([provider, costUsd]) => ({ provider: provider as ProviderId, costUsd }))
    .sort((a, b) => b.costUsd - a.costUsd);
}

export function groupByModel(rows: UsageRow[]) {
  const map = new Map<
    string,
    { provider: ProviderId; costUsd: number; requests: number; tokens: number }
  >();
  for (const r of rows) {
    const cur = map.get(r.model) || {
      provider: r.provider,
      costUsd: 0,
      requests: 0,
      tokens: 0,
    };
    cur.costUsd += r.costUsd;
    cur.requests += r.requests;
    cur.tokens += r.inputTokens + r.outputTokens;
    map.set(r.model, cur);
  }
  return [...map.entries()]
    .map(([model, v]) => ({ model, ...v }))
    .sort((a, b) => b.costUsd - a.costUsd);
}

export function monthToDate(rows: UsageRow[], now = new Date()) {
  return inRange(rows, monthStart(now), isoDate(now));
}

export function previousMonth(rows: UsageRow[], now = new Date()) {
  const startThis = new Date(`${monthStart(now)}T00:00:00Z`);
  const prev = new Date(Date.UTC(startThis.getUTCFullYear(), startThis.getUTCMonth() - 1, 1));
  const prevEnd = new Date(Date.UTC(startThis.getUTCFullYear(), startThis.getUTCMonth(), 0));
  return inRange(rows, prev.toISOString().slice(0, 10), prevEnd.toISOString().slice(0, 10));
}

export function anomalies(rows: UsageRow[]) {
  const days = groupByDay(rows);
  if (days.length < 8) return [];
  const flagged: { date: string; costUsd: number; baseline: number }[] = [];
  for (let i = 7; i < days.length; i++) {
    const window = days.slice(i - 7, i);
    const baseline = window.reduce((a, d) => a + d.costUsd, 0) / 7;
    if (baseline > 1 && days[i].costUsd > baseline * 2.25) {
      flagged.push({ date: days[i].date, costUsd: days[i].costUsd, baseline });
    }
  }
  return flagged.slice(-5);
}

export function budgetStatus(budget: Budget, rows: UsageRow[]) {
  const scoped =
    budget.providers === "all"
      ? rows
      : rows.filter((r) => budget.providers.includes(r.provider));
  const spend = sum(monthToDate(scoped));
  const pct = budget.monthlyLimitUsd > 0 ? (spend / budget.monthlyLimitUsd) * 100 : 0;
  const level = pct >= 100 ? "critical" : pct >= budget.warnPct ? "warn" : "ok";
  return { spend, pct, level, remaining: budget.monthlyLimitUsd - spend };
}

export function evaluateAlerts(
  budgets: Budget[],
  usage: UsageRow[],
  existing: { budgetId: string; kind: string; createdAt: string }[],
) {
  const today = isoDate();
  const created: {
    budgetId: string;
    kind: "warn" | "critical";
    message: string;
    spendUsd: number;
    limitUsd: number;
  }[] = [];
  for (const b of budgets) {
    const st = budgetStatus(b, usage);
    if (st.level === "ok") continue;
    const kind = st.level === "critical" ? "critical" : "warn";
    const already = existing.some(
      (a) => a.budgetId === b.id && a.kind === kind && a.createdAt.slice(0, 10) === today,
    );
    if (already) continue;
    created.push({
      budgetId: b.id,
      kind,
      spendUsd: st.spend,
      limitUsd: b.monthlyLimitUsd,
      message:
        kind === "critical"
          ? `${b.name} is over budget: $${st.spend.toFixed(2)} / $${b.monthlyLimitUsd.toFixed(0)}`
          : `${b.name} hit ${st.pct.toFixed(0)}% of $${b.monthlyLimitUsd.toFixed(0)}`,
    });
  }
  return created;
}
