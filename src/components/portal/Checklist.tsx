"use client";

import { useState } from "react";
import { Check, ExternalLink } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";

type Item = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  urlLabel: string | null;
  entry: { completed: boolean; value: string | null } | null;
  hasValue: boolean; // e.g. the EIN box
};

export function Checklist({ items, intro }: { items: Item[]; intro?: string }) {
  const [list, setList] = useState(items);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.filter((i) => i.hasValue).map((i) => [i.id, i.entry?.value ?? ""])),
  );

  const update = async (itemId: string, patch: { completed?: boolean; value?: string }) => {
    setSavingId(itemId);
    try {
      const res = await fetch(`/api/portal/checklist/${itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Update failed");
      const json = await res.json();
      const entry = json.entry;
      setList((l) =>
        l.map((i) =>
          i.id === itemId
            ? { ...i, entry: { completed: entry.completed, value: entry.value ?? null } }
            : i,
        ),
      );
    } catch {
      // surface silently — state re-syncs on next load
    } finally {
      setSavingId(null);
    }
  };

  const doneCount = list.filter((i) => i.entry?.completed).length;

  return (
    <div className="space-y-4">
      {intro && <p className="text-sm text-slate-600">{intro}</p>}
      <p className="text-sm font-semibold text-slate-700">
        {doneCount} of {list.length} complete
      </p>
      {list.map((item) => (
        <Card key={item.id} className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <button
                onClick={() => update(item.id, { completed: !item.entry?.completed })}
                disabled={savingId === item.id}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
                  item.entry?.completed
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-300 bg-white hover:border-emerald-400"
                }`}
                aria-label={item.entry?.completed ? "Mark incomplete" : "Mark complete"}
              >
                {item.entry?.completed && <Check className="h-3.5 w-3.5" />}
              </button>
              <div>
                <p
                  className={`font-semibold ${
                    item.entry?.completed ? "text-slate-400 line-through" : "text-brand-950"
                  }`}
                >
                  {item.title}
                </p>
                {item.description && (
                  <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
                )}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
                  >
                    {item.urlLabel ?? item.url} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
            {item.hasValue && (
              <div className="flex shrink-0 items-center gap-2 sm:pt-0.5">
                <Input
                  className="w-36"
                  placeholder="EIN #"
                  value={drafts[item.id] ?? ""}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [item.id]: e.target.value }))
                  }
                />
                <Button
                  variant="secondary"
                  className="h-10"
                  loading={savingId === item.id}
                  onClick={() =>
                    update(item.id, { value: drafts[item.id] ?? "", completed: true })
                  }
                >
                  Save
                </Button>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
