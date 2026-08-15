"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Plus, Trash2, X } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";

export function AddFormationForm({
  states,
}: {
  states: { code: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    businessName: "",
    type: "LLC",
    stateCode: states[0]?.code ?? "",
    email: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/formations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.businessName,
          type: form.type,
          stateCode: form.stateCode,
          email: form.email || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not create formation");
      setOpen(false);
      setForm({ businessName: "", type: "LLC", stateCode: states[0]?.code ?? "", email: "" });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Add formation
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-brand-950">Add a formation</h3>
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <Label>Business name *</Label>
            <Input
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              placeholder="e.g. Acme Holdings LLC"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Entity type</Label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="LLC">LLC</option>
                <option value="FOR_PROFIT">For-Profit</option>
                <option value="NON_PROFIT">Non-Profit</option>
              </select>
            </div>
            <div>
              <Label>State</Label>
              <select
                value={form.stateCode}
                onChange={(e) => setForm({ ...form, stateCode: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                {states.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label>Client email (optional)</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Link to an existing client account"
            />
          </div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              Create formation
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export function FormationRowActions({
  id,
  archived,
}: {
  id: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const act = async (action: "archive" | "restore" | "delete") => {
    if (action === "delete" && !confirm("Permanently delete this formation? This cannot be undone.")) return;
    setBusy(true);
    try {
      if (action === "delete") {
        await fetch(`/api/admin/formations/${id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/admin/formations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ archived: action === "archive" }),
        });
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
      {archived ? (
        <button
          onClick={() => act("restore")}
          disabled={busy}
          title="Restore"
          className="rounded-lg border border-slate-300 p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
        >
          <ArchiveRestore className="h-4 w-4" />
        </button>
      ) : (
        <button
          onClick={() => act("archive")}
          disabled={busy}
          title="Archive"
          className="rounded-lg border border-slate-300 p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700"
        >
          <Archive className="h-4 w-4" />
        </button>
      )}
      <button
        onClick={() => act("delete")}
        disabled={busy}
        title="Delete permanently"
        className="rounded-lg border border-slate-300 p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
