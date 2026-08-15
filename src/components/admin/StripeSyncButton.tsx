"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";

export function StripeSyncButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sync = async () => {
    setBusy(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/services/sync-stripe", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Sync failed");
      setResult(`Created ${json.synced} Stripe price(s) · ${json.skipped} already current.`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={sync} loading={busy} variant="secondary">
        <RefreshCw className="h-4 w-4" /> Auto-create Stripe prices
      </Button>
      {result && <p className="text-sm font-medium text-emerald-700">{result}</p>}
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
