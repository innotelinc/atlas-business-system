"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Textarea } from "@/components/ui";

export function ChecklistEditor(props: {
  id: string;
  title: string;
  description: string;
  url: string;
  urlLabel: string;
  section: string;
  sortOrder: number;
  active: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(props);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/checklist/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          url: form.url || null,
          urlLabel: form.urlLabel || null,
          section: form.section as "business" | "credit",
          sortOrder: form.sortOrder,
          active: form.active,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      router.refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Edit
      </Button>
    );
  }

  return (
    <div className="w-full space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <Label>Title</Label>
        <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>URL</Label>
          <Input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
        </div>
        <div>
          <Label>URL label</Label>
          <Input value={form.urlLabel} onChange={(e) => setForm((f) => ({ ...f, urlLabel: e.target.value }))} />
        </div>
        <div>
          <Label>Sort order</Label>
          <Input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value || "0") }))}
          />
        </div>
        <label className="flex items-end gap-2 pb-2.5 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            className="h-4 w-4 rounded border-slate-300 text-brand-700"
          />
          Active
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Button loading={saving} onClick={save}>
          Save
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>
    </div>
  );
}
