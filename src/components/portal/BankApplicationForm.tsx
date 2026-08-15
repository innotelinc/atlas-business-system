"use client";

import { useState } from "react";
import { Button, Input, Label, Textarea } from "@/components/ui";

export function BankApplicationForm({
  businessName,
  email,
}: {
  businessName: string;
  email: string;
}) {
  const [form, setForm] = useState({
    businessName,
    legalName: "",
    email,
    phone: "",
    dob: "",
    ssn: "",
    address: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/bank-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Submission failed");
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="py-8 text-center">
        <p className="text-2xl">🎉</p>
        <h2 className="mt-3 text-lg font-bold text-brand-950">Application submitted</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          We&apos;ve received your application. Our team will review it and our backend office will
          set up your account once your business formation is complete. You can track its status
          here.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Business name *</Label>
          <Input
            value={form.businessName}
            onChange={(e) => set("businessName", e.target.value)}
            required
          />
        </div>
        <div>
          <Label>Your full legal name *</Label>
          <Input
            value={form.legalName}
            onChange={(e) => set("legalName", e.target.value)}
            placeholder="As shown on your ID"
            required
          />
        </div>
        <div>
          <Label>Email *</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            required
          />
        </div>
        <div>
          <Label>Phone *</Label>
          <Input
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="(555) 123-4567"
            required
          />
        </div>
        <div>
          <Label>Date of birth</Label>
          <Input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
        </div>
        <div>
          <Label>Social Security Number (last 4)</Label>
          <Input
            value={form.ssn}
            onChange={(e) => set("ssn", e.target.value)}
            placeholder="••••"
            maxLength={4}
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
        <Label>Anything we should know? (optional)</Label>
        <Textarea
          rows={2}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="e.g. expected monthly volume, industry"
        />
      </div>
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      <Button type="submit" loading={submitting}>
        Submit application
      </Button>
    </form>
  );
}
