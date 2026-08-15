"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Textarea } from "@/components/ui";

const NEXT_ACTIONS: Record<string, string[]> = {
  READY: ["SUBMITTED", "NEEDS_ATTENTION", "REJECTED"],
  SUBMITTED: ["FILED", "NEEDS_ATTENTION", "REJECTED"],
  NEEDS_ATTENTION: ["SUBMITTED", "REJECTED"],
  REJECTED: ["SUBMITTED"],
  FILED: [],
};

const ACTION_LABEL: Record<string, string> = {
  SUBMITTED: "Mark submitted to state",
  FILED: "Mark filed (registered)",
  NEEDS_ATTENTION: "Needs attention",
  REJECTED: "Rejected by state",
};

export function FilingActions({
  filingId,
  status,
  confirmationNumber,
}: {
  filingId: string;
  status: string;
  confirmationNumber: string;
}) {
  const router = useRouter();
  const [conf, setConf] = useState(confirmationNumber);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = async (to: string) => {
    setBusy(to);
    setError(null);
    try {
      const res = await fetch(`/api/admin/filings/${filingId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          confirmationNumber: to === "FILED" ? conf || null : undefined,
          notes: notes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Update failed");
      router.refresh();
      setNotes("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const next = NEXT_ACTIONS[status] ?? [];
  if (status === "FILED") {
    return (
      <p className="text-sm font-semibold text-emerald-700">
        ✓ Filed — this formation is registered. Confirmation #:{" "}
        {confirmationNumber || "—"}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {status !== "FILED" && next.includes("FILED") && (
        <div>
          <Label>Confirmation / reference number from the state</Label>
          <Input
            value={conf}
            onChange={(e) => setConf(e.target.value)}
            placeholder="e.g. 2026-123456"
          />
        </div>
      )}
      <div>
        <Label>Notes (optional)</Label>
        <Textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. filed via Texas SOS portal, paid with company card"
        />
      </div>
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {next.map((a) => (
          <Button
            key={a}
            variant={a === "FILED" ? "primary" : a === "REJECTED" ? "danger" : "secondary"}
            loading={busy === a}
            onClick={() => act(a)}
          >
            {ACTION_LABEL[a]}
          </Button>
        ))}
      </div>
    </div>
  );
}
