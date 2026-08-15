"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";

type Props = {
  serviceFeeCentsLLC: number;
  serviceFeeCentsForProfit: number;
  serviceFeeCentsNonProfit: number;
  competitorRetailCents: number;
  competitorName: string;
};

const dollars = (cents: number) => (cents / 100).toFixed(2);
const toCents = (s: string) => Math.round(parseFloat(s || "0") * 100);

export function PricingEditor(props: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    llc: dollars(props.serviceFeeCentsLLC),
    forProfit: dollars(props.serviceFeeCentsForProfit),
    nonProfit: dollars(props.serviceFeeCentsNonProfit),
    retail: dollars(props.competitorRetailCents),
    competitorName: props.competitorName,
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceFeeCentsLLC: toCents(form.llc),
          serviceFeeCentsForProfit: toCents(form.forProfit),
          serviceFeeCentsNonProfit: toCents(form.nonProfit),
          competitorRetailCents: toCents(form.retail),
          competitorName: form.competitorName,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not save");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-900">
          Atlas formation service fee
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Charged on top of the state filing fee. Editable per entity type.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <Label>LLC fee ($)</Label>
            <Input
              value={form.llc}
              onChange={(e) => setForm({ ...form, llc: e.target.value })}
              placeholder="49.00"
              required
            />
          </div>
          <div>
            <Label>For-profit fee ($)</Label>
            <Input
              value={form.forProfit}
              onChange={(e) => setForm({ ...form, forProfit: e.target.value })}
              placeholder="49.00"
              required
            />
          </div>
          <div>
            <Label>Non-profit fee ($)</Label>
            <Input
              value={form.nonProfit}
              onChange={(e) => setForm({ ...form, nonProfit: e.target.value })}
              placeholder="49.00"
              required
            />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-900">
          Retail price comparison
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Shown in the formation wizard as the "what you'd pay elsewhere" benchmark.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Competitor retail price ($, incl. state fee)</Label>
            <Input
              value={form.retail}
              onChange={(e) => setForm({ ...form, retail: e.target.value })}
              placeholder="199.00"
              required
            />
          </div>
          <div>
            <Label>Competitor name</Label>
            <Input
              value={form.competitorName}
              onChange={(e) => setForm({ ...form, competitorName: e.target.value })}
              required
            />
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={busy}>
          Save fees
        </Button>
        {saved && <p className="text-sm font-medium text-emerald-700">Saved — live on checkout.</p>}
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      </div>
    </form>
  );
}
