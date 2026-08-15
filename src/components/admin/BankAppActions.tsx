"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export type BankAppStatus = "received" | "in_review" | "approved" | "rejected" | "completed";

const ACTION_LABELS: Record<BankAppStatus, { next: BankAppStatus; label: string; variant?: "secondary" | "primary" | "danger" }[]> = {
  received: [{ next: "in_review", label: "Start review", variant: "secondary" }],
  in_review: [
    { next: "approved", label: "Approve for setup", variant: "primary" },
    { next: "rejected", label: "Reject", variant: "danger" },
  ],
  approved: [
    { next: "completed", label: "Account set up", variant: "primary" },
    { next: "rejected", label: "Reject", variant: "danger" },
  ],
  rejected: [{ next: "in_review", label: "Restart review", variant: "secondary" }],
  completed: [],
};

export function BankAppActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const setStatus = async (s: BankAppStatus) => {
    setBusy(true);
    try {
      await fetch(`/api/admin/bank-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: s }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const actions = ACTION_LABELS[(status as BankAppStatus) ?? "received"] ?? [];

  return (
    <div className="flex shrink-0 flex-wrap gap-2">
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
