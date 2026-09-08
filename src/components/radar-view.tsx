import { useMemo } from "react";
import { Link } from "@/nav";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import {
  anomalies,
  budgetStatus,
  groupByDay,
  groupByModel,
  groupByProvider,
  monthToDate,
  previousMonth,
  sum,
} from "@/lib/burnwatch/analytics";
import { addDays, isoDate, money } from "@/lib/burnwatch/pricing";
import { useWorkspace } from "@/lib/burnwatch/store";
import { providerLabel } from "@/lib/burnwatch/types";

const PROVIDER_FILL: Record<string, string> = {
  openai: "#c8ccd4",
  anthropic: "#9aa3ad",
  groq: "#6e7884",
  gemini: "#b7bec6",
  other: "#71717a",
};

export function RadarView() {
  const { usage, budgets, alerts, loadDemo, sources, currency } = useWorkspace();

  const stats = useMemo(() => {
    const mtd = monthToDate(usage);
    const prev = previousMonth(usage);
    const mtdSpend = sum(mtd);
    const prevSpend = sum(prev);
    const from = addDays(isoDate(), -29);
    return {
      mtdSpend,
      prevSpend,
      deltaPct: prevSpend ? ((mtdSpend - prevSpend) / prevSpend) * 100 : 0,
      requests: mtd.reduce((a, r) => a + r.requests, 0),
      tokens: mtd.reduce((a, r) => a + r.inputTokens + r.outputTokens, 0),
      byDay: groupByDay(usage.filter((r) => r.date >= from)),
      byProvider: groupByProvider(mtd),
      byModel: groupByModel(mtd).slice(0, 10),
      spikes: anomalies(usage),
    };
  }, [usage]);

  if (!usage.length) {
    return (
      <div className="mx-auto max-w-lg py-10">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-faint">On-device</p>
        <h1 className="mt-3 text-4xl font-medium tracking-tight">Nothing leaves this browser.</h1>
        <p className="mt-4 text-muted leading-relaxed">
          Drop a usage CSV from OpenAI, Anthropic, Groq, or Gemini. Totals, models, and budget
          alerts are computed here. No account. No server.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={loadDemo}>Load a sample month</Button>
          <Link
            to="/sources"
            className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm hover:bg-subtle"
          >
            Upload CSV
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Radar</h1>
          <p className="mt-1 text-sm text-muted">
            {sources.length} source{sources.length === 1 ? "" : "s"} stored in this browser.
          </p>
        </div>
        <Link
          to="/sources"
          className="inline-flex min-h-9 items-center rounded-sm border border-border px-3 text-sm hover:bg-subtle"
        >
          Add CSV
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Month to date"
          value={money(stats.mtdSpend, currency)}
          hint={`${stats.deltaPct >= 0 ? "+" : ""}${stats.deltaPct.toFixed(0)}% vs last month`}
        />
        <Kpi label="Last month" value={money(stats.prevSpend, currency)} />
        <Kpi label="Requests" value={stats.requests.toLocaleString()} />
        <Kpi
          label="Tokens"
          value={Intl.NumberFormat("en", { notation: "compact" }).format(stats.tokens)}
        />
      </div>

      {budgets.map((b) => {
        const st = budgetStatus(b, usage);
        const tone = st.level === "ok" ? "bg-ok" : st.level === "warn" ? "bg-warn" : "bg-bad";
        return (
          <div key={b.id} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span>{b.name}</span>
              <span className="font-mono text-muted">
                {st.pct.toFixed(0)}% · {money(st.spend, currency)} /{" "}
                {money(b.monthlyLimitUsd, currency)}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg">
              <div
                className={`h-full rounded-full ${tone}`}
                style={{ width: `${Math.min(100, st.pct)}%` }}
              />
            </div>
          </div>
        );
      })}

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-medium">Daily burn</h2>
        <div className="mt-4 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.byDay} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{
                  background: "#121214",
                  border: "1px solid #2a2a2e",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v) => money(Number(v), currency)}
              />
              <Bar dataKey="costUsd" fill="#c8ccd4" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-medium">Providers</h2>
          <ul className="mt-4 space-y-3">
            {stats.byProvider.map((p) => {
              const total = stats.byProvider.reduce((a, x) => a + x.costUsd, 0) || 1;
              return (
                <li key={p.provider}>
                  <div className="flex justify-between text-sm">
                    <span>{providerLabel(p.provider)}</span>
                    <span className="font-mono">{money(p.costUsd, currency)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-bg">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(p.costUsd / total) * 100}%`,
                        background: PROVIDER_FILL[p.provider],
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-medium">Spikes</h2>
          {stats.spikes.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No day exceeded 2.2× the prior 7-day average.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {stats.spikes.map((a) => (
                <li key={a.date} className="flex justify-between gap-3">
                  <span className="font-mono text-muted">{a.date}</span>
                  <span className="text-bad">
                    {money(a.costUsd, currency)} vs {money(a.baseline, currency)} avg
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-3 text-sm font-medium">Models this month</div>
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead className="text-faint">
            <tr>
              <th className="px-5 py-2 font-normal">Model</th>
              <th className="px-5 py-2 font-normal">Provider</th>
              <th className="px-5 py-2 font-normal">Requests</th>
              <th className="px-5 py-2 font-normal">Spend</th>
            </tr>
          </thead>
          <tbody>
            {stats.byModel.map((m) => (
              <tr key={m.model} className="border-t border-border">
                <td className="px-5 py-2 font-mono text-xs md:text-sm">{m.model}</td>
                <td className="px-5 py-2">{providerLabel(m.provider)}</td>
                <td className="px-5 py-2 tabular-nums">{m.requests.toLocaleString()}</td>
                <td className="px-5 py-2 tabular-nums">{money(m.costUsd, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {alerts.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-medium">Local alerts</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {alerts
              .slice(-8)
              .reverse()
              .map((a) => {
                const budget = budgets.find((b) => b.id === a.budgetId);
                const detail = budget
                  ? a.kind === "critical"
                    ? `${budget.name} is over budget: ${money(a.spendUsd, currency)} / ${money(a.limitUsd, currency)}`
                    : `${budget.name} hit ${((a.spendUsd / a.limitUsd) * 100).toFixed(0)}% of ${money(a.limitUsd, currency)}`
                  : a.message;
                return (
                  <li key={a.id}>
                    <span className={a.kind === "critical" ? "text-bad" : "text-warn"}>{a.kind}</span>
                    {" · "}
                    {detail}
                  </li>
                );
              })}
          </ul>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-xs uppercase tracking-widest text-faint">{label}</div>
      <div className="mt-2 text-2xl font-medium tabular-nums">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted">{hint}</div> : null}
    </div>
  );
}
