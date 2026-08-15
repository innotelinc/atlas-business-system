"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";

export function CredentialsForm({
  businessName,
  credentials,
}: {
  businessName: string;
  credentials: {
    ein: string;
    establishedDate: string;
    officers: { name: string; title: string }[];
    address: string;
    phone: string;
    email: string;
    website: string;
  };
}) {
  const [form, setForm] = useState(credentials);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/portal/credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          establishedDate: form.establishedDate ? new Date(form.establishedDate).toISOString() : null,
          officers: form.officers.filter((o) => o.name.trim()),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Save failed");
      }
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Business name</Label>
          <Input value={businessName} readOnly className="bg-slate-50 text-slate-500" />
        </div>
        <div>
          <Label>EIN</Label>
          <Input
            value={form.ein}
            onChange={(e) => set("ein", e.target.value)}
            placeholder="XX-XXXXXXX"
          />
        </div>
        <div>
          <Label>Established date (state filing date)</Label>
          <Input
            type="date"
            value={form.establishedDate}
            onChange={(e) => set("establishedDate", e.target.value)}
          />
        </div>
        <div>
          <Label>Phone number</Label>
          <Input
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="hello@yourbusiness.com"
          />
        </div>
        <div>
          <Label>Website</Label>
          <Input
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            placeholder="https://yourbusiness.com"
          />
        </div>
      </div>
      <div>
        <Label>Business address</Label>
        <Input
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
          placeholder="Street, City, State ZIP"
        />
      </div>

      <div>
        <Label>Officers / members</Label>
        <div className="space-y-2">
          {form.officers.map((o, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={o.name}
                placeholder="Full name"
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    officers: f.officers.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                  }))
                }
              />
              <Input
                value={o.title}
                placeholder="Title (e.g. Member, President)"
                className="w-56"
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    officers: f.officers.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)),
                  }))
                }
              />
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, officers: f.officers.filter((_, j) => j !== i) }))
                }
                className="shrink-0 rounded-lg border border-slate-300 p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, officers: [...f.officers, { name: "", title: "" }] }))}
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          <Plus className="h-4 w-4" /> Add officer
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={saving}>
          Save credentials
        </Button>
        {saved && <span className="text-sm font-medium text-emerald-600">Saved ✓</span>}
        {error && <span className="text-sm font-medium text-red-600">{error}</span>}
      </div>
    </form>
  );
}
