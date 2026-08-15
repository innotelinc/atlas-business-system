"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function BankAppActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const setStatus = async (s: "received" | "forwarded" | "completed") => {
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

  return (
    <div className="flex shrink-0 gap-2">
      {status !== "forwarded" && (
        <Button variant="secondary" loading={busy} onClick={() => setStatus("forwarded")}>
          Forward to Relay
        </Button>
      )}
      {status !== "completed" && (
        <Button loading={busy} onClick={() => setStatus("completed")}>
          Mark complete
        </Button>
      )}
    </div>
  );
}
