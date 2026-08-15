"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Textarea } from "@/components/ui";

export function ServiceEditor(props: {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  recurring: boolean;
  interval: string;
  active: boolean;
  stripePriceId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(props);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/services/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          priceCents: form.priceCents,
          recurring: form.recurring,
          interval: form.interval || null,
          active: form.active,
          stripePriceId: form.stripePriceId || null,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
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
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <Label>Price ($)</Label>
          <Input
            type="number"
            step="0.01"
            value={(form.priceCents / 100).toFixed(2)}
            onChange={(e) =>
              setForm((f) => ({ ...f, priceCents: Math.round(parseFloat(e.target.value || "0") * 100) }))
            }
          />
        </div>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          rows={2}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={form.recurring}
            onChange={(e) => setForm((f) => ({ ...f, recurring: e.target.checked }))}
            className="h-4 w-4 rounded border-slate-300 text-brand-700"
          />
          Recurring subscription
        </label>
        {form.recurring && (
          <Input
            className="w-32"
            value={form.interval}
            onChange={(e) => setForm((f) => ({ ...f, interval: e.target.value }))}
            placeholder="year"
          />
        )}
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            className="h-4 w-4 rounded border-slate-300 text-brand-700"
          />
          Active
        </label>
        <div>
          <Label>Stripe price ID</Label>
          <Input
            className="w-56"
            value={form.stripePriceId}
            onChange={(e) => setForm((f) => ({ ...f, stripePriceId: e.target.value }))}
            placeholder="price_xxx"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button loading={saving} onClick={save}>
          Save
        </Button>
        {saved && <span className="text-sm font-medium text-emerald-600">Saved ✓</span>}
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>
    </div>
  );
}
