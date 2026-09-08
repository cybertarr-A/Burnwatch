import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SAMPLE_CSV } from "@/lib/burnwatch/csv";
import { useWorkspace } from "@/lib/burnwatch/store";
import type { ProviderId } from "@/lib/burnwatch/types";
import { PROVIDERS } from "@/lib/burnwatch/types";

export function SourcesView() {
  const { sources, addSource, removeSource, ingestCsv, loadDemo, clearAll, exportJson, importJson } =
    useWorkspace();
  const [provider, setProvider] = useState<ProviderId>("openai");
  const [label, setLabel] = useState("");
  const [paste, setPaste] = useState("");
  const [target, setTarget] = useState("");
  const [msg, setMsg] = useState("");

  function add() {
    const s = addSource(provider, label);
    setTarget(s.id);
    setLabel("");
    setMsg("Source added on this device. Upload or paste a CSV next.");
  }

  async function onFile(file: File, sourceId: string) {
    try {
      const text = await file.text();
      const n = ingestCsv(sourceId, text);
      setMsg(`Imported ${n} rows. They never left this device.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not parse CSV");
    }
  }

  function onPaste() {
    if (!target) return setMsg("Choose a source first.");
    try {
      const n = ingestCsv(target, paste);
      setPaste("");
      setMsg(`Imported ${n} rows from paste.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Paste failed");
    }
  }

  function downloadBackup() {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "burnwatch-local.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample-usage.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium tracking-tight">Sources</h1>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Export usage from a vendor dashboard and drop the CSV here. Parsing and cost math run in
          this tab. Vendor admin APIs are blocked by the browser without a server, so CSV is the
          honest on-device path.
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-surface p-5 md:grid-cols-[10rem_1fr_auto]">
        <select
          className="min-h-11 rounded-md border border-border bg-bg px-3 text-sm"
          value={provider}
          onChange={(e) => setProvider(e.target.value as ProviderId)}
        >
          {PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <Input placeholder="Label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <Button onClick={add}>Add source</Button>
      </div>

      {sources.length === 0 && (
        <div className="flex flex-wrap gap-3">
          <Button onClick={loadDemo}>Load sample month</Button>
          <Button variant="ghost" onClick={downloadSample}>
            Download sample CSV
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {sources.map((s) => (
          <div
            key={s.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="font-medium">
                {s.label}{" "}
                <span className="text-xs capitalize text-faint">({s.provider})</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-border px-3 text-sm hover:bg-subtle">
                Upload CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f, s.id);
                    e.target.value = "";
                  }}
                />
              </label>
              <Button variant="ghost" size="sm" onClick={() => setTarget(s.id)}>
                Paste into this
              </Button>
              <Button variant="danger" size="sm" onClick={() => removeSource(s.id)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-medium">Paste CSV</h2>
        <p className="mt-1 font-mono text-xs text-faint">
          date,model,cost_usd,input_tokens,output_tokens,requests
        </p>
        <textarea
          className="mt-3 min-h-32 w-full rounded-md border border-border bg-bg p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-accent/40"
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder="Paste exported usage here"
        />
        <div className="mt-3">
          <Button variant="ghost" onClick={onPaste} disabled={!target}>
            {target ? "Import paste" : "Select a source first"}
          </Button>
        </div>
      </div>

      {msg ? <p className="text-sm text-accent">{msg}</p> : null}

      <div className="flex flex-wrap gap-3 border-t border-border pt-5">
        <Button variant="ghost" onClick={downloadBackup}>
          Export local backup
        </Button>
        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-border px-4 text-sm hover:bg-subtle">
          Import backup
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                importJson(await f.text());
                setMsg("Backup restored on this device.");
              } catch (err) {
                setMsg(err instanceof Error ? err.message : "Import failed");
              }
              e.target.value = "";
            }}
          />
        </label>
        <Button variant="danger" onClick={clearAll}>
          Wipe this device
        </Button>
      </div>
    </div>
  );
}
