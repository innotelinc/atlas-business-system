"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Textarea } from "@/components/ui";

export function ReviewActions({
  formationId,
  current,
}: {
  formationId: string;
  current: string;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decide = async (decision: "APPROVED" | "REJECTED") => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/formations/${formationId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, notes }),
      });
      if (!res.ok) throw new Error("Update failed");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (current === "APPROVED" || current === "REJECTED") {
    return (
      <div>
        <p className="text-sm font-semibold text-slate-700">
          Current status: <span className="uppercase">{current}</span>
        </p>
        <Button variant="secondary" className="mt-3" onClick={() => decide(current === "APPROVED" ? "REJECTED" : "APPROVED")}>
          Change decision
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Textarea
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Review notes (optional) — e.g. name availability findings, document issues…"
      />
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button variant="secondary" loading={busy} onClick={() => decide("APPROVED")}>
          Approve
        </Button>
        <Button variant="danger" loading={busy} onClick={() => decide("REJECTED")}>
          Reject
        </Button>
      </div>
    </div>
  );
}
