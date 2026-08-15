"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/components/ui";

type Fee = {
  type: string;
  stateFeeCents: number;
  documentUrl: string | null;
  filingTime: string | null;
  verified: boolean;
  sourceNote: string | null;
};

export function StateFeeEditor({
  state,
  fees,
}: {
  state: { code: string; sosSiteUrl: string; nameSearchUrl: string | null };
  fees: Fee[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sosSiteUrl, setSosSiteUrl] = useState(state.sosSiteUrl);
  const [nameSearchUrl, setNameSearchUrl] = useState(state.nameSearchUrl ?? "");
  const [feeDrafts, setFeeDrafts] = useState<Record<string, Fee>>(
    Object.fromEntries(fees.map((f) => [f.type, f])),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const types = ["LLC", "FOR_PROFIT", "NON_PROFIT"] as const;

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      for (const t of types) {
        const fee = feeDrafts[t];
        if (!fee) continue;
        const res = await fetch(`/api/admin/states/${state.code}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sosSiteUrl,
            nameSearchUrl: nameSearchUrl || null,
            fee: {
              type: t,
              stateFeeCents: fee.stateFeeCents,
              documentUrl: fee.documentUrl,
              filingTime: fee.filingTime,
              verified: fee.verified,
              sourceNote: fee.sourceNote,
            },
          }),
        });
        if (!res.ok) throw new Error(`Failed to save ${t}`);
      }
      setSaved(true);
      router.refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)} className="w-full">
        Edit fees & links
      </Button>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="space-y-3">
        <div>
          <Label>SOS website</Label>
          <Input value={sosSiteUrl} onChange={(e) => setSosSiteUrl(e.target.value)} />
        </div>
        <div>
          <Label>Business name search URL</Label>
          <Input value={nameSearchUrl} onChange={(e) => setNameSearchUrl(e.target.value)} />
        </div>
      </div>
      <div className="space-y-3">
        {types.map((t) => {
          const fee = feeDrafts[t];
          if (!fee) return null;
          return (
            <div key={t} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700">
                  {t === "LLC" ? "LLC" : t === "FOR_PROFIT" ? "For-Profit" : "Non-Profit"}
                </p>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={fee.verified}
                    onChange={(e) =>
                      setFeeDrafts((d) => ({
                        ...d,
                        [t]: { ...d[t], verified: e.target.checked },
                      }))
                    }
                    className="h-3.5 w-3.5 rounded border-slate-300 text-brand-700"
                  />
                  Verified
                </label>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <div>
                  <Label>Fee ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={(fee.stateFeeCents / 100).toFixed(2)}
                    onChange={(e) =>
                      setFeeDrafts((d) => ({
                        ...d,
                        [t]: { ...d[t], stateFeeCents: Math.round(parseFloat(e.target.value || "0") * 100) },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Turnaround</Label>
                  <Input
                    value={fee.filingTime ?? ""}
                    onChange={(e) =>
                      setFeeDrafts((d) => ({ ...d, [t]: { ...d[t], filingTime: e.target.value } }))
                    }
                  />
                </div>
                <div>
                  <Label>Form PDF URL</Label>
                  <Input
                    value={fee.documentUrl ?? ""}
                    onChange={(e) =>
                      setFeeDrafts((d) => ({ ...d, [t]: { ...d[t], documentUrl: e.target.value } }))
                    }
                  />
                </div>
              </div>
              {fee.sourceNote && (
                <p className="mt-2 text-[11px] leading-snug text-slate-400">
                  {fee.verified ? "✓ " : ""}
                  {fee.sourceNote}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <Button loading={saving} onClick={save}>
          Save state
        </Button>
        {saved && <span className="text-sm font-medium text-emerald-600">Saved ✓</span>}
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>
    </div>
  );
}
