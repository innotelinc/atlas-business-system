"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui";

export type BankAppStatus = "received" | "in_review" | "approved" | "entered" | "rejected" | "completed";

export type BankAppSummary = {
  id: string;
  status: string;
  detailsVerified: boolean;
  businessName: string;
  legalName: string;
  email: string;
  phone: string;
  dob: string | null;
  ssn: string | null;
  address: string | null;
  notes: string | null;
  enteredAt: Date | null;
  detailsVerifiedAt: Date | null;
};

const ACTION_LABELS: Record<BankAppStatus, { next: BankAppStatus; label: string; variant?: "secondary" | "primary" | "danger" }[]> = {
  received: [{ next: "in_review", label: "Start review", variant: "secondary" }],
  in_review: [
    { next: "approved", label: "Approve for setup", variant: "primary" },
    { next: "rejected", label: "Reject", variant: "danger" },
  ],
  approved: [
    { next: "entered", label: "Mark data entered", variant: "primary" },
    { next: "rejected", label: "Reject", variant: "danger" },
  ],
  entered: [
    { next: "completed", label: "Account set up", variant: "primary" },
    { next: "rejected", label: "Reject", variant: "danger" },
  ],
  rejected: [{ next: "in_review", label: "Restart review", variant: "secondary" }],
  completed: [],
};

export function BankAppActions({ app }: { app: BankAppSummary }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const setStatus = async (s: BankAppStatus) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/bank-applications/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: s }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const setVerified = async (v: boolean) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/bank-applications/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ detailsVerified: v }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const copyDetails = async () => {
    const lines = [
      `BUSINESS: ${app.businessName}`,
      `LEGAL NAME: ${app.legalName}`,
      `EMAIL: ${app.email}`,
      `PHONE: ${app.phone}`,
      `DOB: ${app.dob ?? "—"}`,
      `SSN LAST 4: ${app.ssn ? `••••${app.ssn}` : "—"}`,
      `ADDRESS: ${app.address ?? "—"}`,
      `NOTES: ${app.notes ?? "—"}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (non-secure context) — fall back to selection.
      setCopied(false);
    }
  };

  const actions = ACTION_LABELS[(app.status as BankAppStatus) ?? "received"] ?? [];

  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      <Button variant="secondary" onClick={copyDetails}>
        {copied ? <CheckCheck className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy details"}
      </Button>
      <Button
        variant="secondary"
        loading={busy}
        onClick={() => setVerified(!app.detailsVerified)}
      >
        {app.detailsVerified ? "✓ Info verified" : "Mark info verified"}
      </Button>
      {actions.map((a) => (
        <Button
          key={a.next}
          variant={a.variant === "danger" ? "danger" : a.variant === "primary" ? "primary" : "secondary"}
          loading={busy}
          onClick={() => setStatus(a.next)}
        >
          {a.label}
        </Button>
      ))}
    </div>
  );
}
