import type { Source, UsageRow } from "./types";
import { estimateCost } from "./pricing";

function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      q = !q;
      continue;
    }
    if (c === "," && !q) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}

export function parseCsv(text: string, source: Source): UsageRow[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV needs a header row plus data.");
  const header = splitCsv(lines[0]).map((h) => h.trim().toLowerCase());
  const col = (...names: string[]) =>
    header.findIndex((h) => names.some((n) => h === n || h.includes(n)));

  const dateI = col("date", "day", "timestamp", "start");
  const modelI = col("model", "line_item", "line item", "description");
  const costI = col("cost", "amount", "usd", "spend");
  const inI = col("input_tokens", "prompt_tokens", "input");
  const outI = col("output_tokens", "completion_tokens", "output");
  const reqI = col("requests", "n_requests", "count");

  if (dateI < 0) throw new Error("CSV must include a date column (YYYY-MM-DD).");

  const rows: UsageRow[] = [];
  for (const line of lines.slice(1)) {
    const cells = splitCsv(line);
    const dateRaw = cells[dateI] || "";
    const date = dateRaw.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}/.test(date)) continue;
    const model = (modelI >= 0 ? cells[modelI] : source.provider) || source.provider;
    const inputTokens = inI >= 0 ? Number(cells[inI] || 0) : 0;
    const outputTokens = outI >= 0 ? Number(cells[outI] || 0) : 0;
    let costUsd = costI >= 0 ? Number(cells[costI] || 0) : 0;
    if (!costUsd && (inputTokens || outputTokens)) {
      costUsd = estimateCost(model, inputTokens, outputTokens);
    }
    rows.push({
      id: crypto.randomUUID(),
      sourceId: source.id,
      provider: source.provider,
      date,
      model,
      inputTokens,
      outputTokens,
      requests: reqI >= 0 ? Number(cells[reqI] || 0) : 0,
      costUsd: Number(costUsd.toFixed(4)),
    });
  }
  if (!rows.length) throw new Error("No valid rows. Dates must be YYYY-MM-DD.");
  return rows;
}

export const SAMPLE_CSV = `date,model,cost_usd,input_tokens,output_tokens,requests
2026-08-20,gpt-4o,42.10,2100000,840000,410
2026-08-20,claude-sonnet-4,31.40,1500000,620000,280
2026-08-21,gpt-4o,38.22,1900000,780000,390
2026-08-21,llama-3.3-70b-versatile,4.18,2200000,900000,510
2026-08-22,gemini-2.5-flash,6.40,1800000,700000,360
2026-08-22,gpt-4o-mini,9.15,3100000,1400000,820
`;
