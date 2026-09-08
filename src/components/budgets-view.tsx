import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { budgetStatus } from "@/lib/burnwatch/analytics";
import { fromCurrency, money, toCurrency } from "@/lib/burnwatch/pricing";
import { useWorkspace } from "@/lib/burnwatch/store";

export function BudgetsView() {
  const { budgets, usage, addBudget, removeBudget, currency } = useWorkspace();
  const [name, setName] = useState("Monthly cap");
  const [limit, setLimit] = useState("2500");
  const [warn, setWarn] = useState("80");
  const previousCurrency = useRef(currency);

  useEffect(() => {
    if (previousCurrency.current === currency) return;
    setLimit((current) => {
      const amount = Number(current);
      return Number.isFinite(amount)
        ? String(
            Number(toCurrency(fromCurrency(amount, previousCurrency.current), currency).toFixed(2)),
          )
        : current;
    });
    previousCurrency.current = currency;
  }, [currency]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium tracking-tight">Budgets</h1>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Caps are checked in this browser after every import. Alerts stay on-device — this app
          cannot reach Slack without a server.
        </p>
      </div>

      <form
        className="grid gap-3 rounded-xl border border-border bg-surface p-5 md:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          addBudget({
            name,
            monthlyLimitUsd: fromCurrency(Number(limit) || 0, currency),
            warnPct: Number(warn) || 80,
            providers: "all",
          });
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <Input
          type="number"
          min="0"
          step="any"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          placeholder={`Monthly ${currency}`}
          aria-label={`Monthly limit in ${currency}`}
        />
        <Input value={warn} onChange={(e) => setWarn(e.target.value)} placeholder="Warn %" />
        <Button className="md:col-span-3" type="submit">
          Save budget
        </Button>
      </form>

      <div className="space-y-3">
        {budgets.map((b) => {
          const st = budgetStatus(b, usage);
          return (
            <div
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-5"
            >
              <div>
                <div className="font-medium">{b.name}</div>
                <div className="text-sm text-muted">
                  {money(b.monthlyLimitUsd, currency)} · warn {b.warnPct}% · now {st.pct.toFixed(0)}
                  % ({st.level})
                </div>
              </div>
              <Button variant="danger" size="sm" onClick={() => removeBudget(b.id)}>
                Delete
              </Button>
            </div>
          );
        })}
        {budgets.length === 0 && <p className="text-sm text-muted">No budgets yet.</p>}
      </div>
    </div>
  );
}
