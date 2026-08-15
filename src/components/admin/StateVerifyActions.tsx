"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui";

/** Per-state: open the official fee sources for review, then mark the state's fees verified. */
export function StateVerifyActions({ stateCode, sources }: { stateCode: string; sources: string[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const openSources = () => {
    const unique = [...new Set(sources.filter(Boolean))];
    // Opening the SOS site + the three fee pages is enough for a manual check.
    unique.slice(0, 4).forEach((url) => window.open(url, "_blank", "noopener"));
  };

  const markVerified = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/states/${stateCode}/verify`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to mark verified");
      router.refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={openSources}>
        <ExternalLink className="h-4 w-4" /> Open official sources
      </Button>
      <Button loading={busy} onClick={markVerified}>
        <BadgeCheck className="h-4 w-4" /> Mark verified
      </Button>
    </div>
  );
}

/** Bulk: mark every state's fees verified in one action. */
export function VerifyAllButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const doIt = async () => {
    if (!window.confirm("Mark ALL fees for all 50 states as verified? Only do this after a full review pass.")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/states/verify-all", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="secondary" loading={busy} onClick={doIt}>
      <BadgeCheck className="h-4 w-4" /> Mark all states verified
    </Button>
  );
}
