import { prisma } from "@/lib/prisma";
import { Badge, Card } from "@/components/ui";
import { usd } from "@/lib/format";
import { StateFeeEditor } from "@/components/admin/StateFeeEditor";
import { StateVerifyActions, VerifyAllButton } from "@/components/admin/StateVerifyActions";

export const dynamic = "force-dynamic";

export default async function StatesPage() {
  const states = await prisma.state.findMany({
    orderBy: { name: "asc" },
    include: { fees: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-950">States & filing fees</h1>
          <p className="mt-1 text-sm text-slate-600">
            Secretary of State links and per-type filing fees. All 50 states were verified on
            2026-08-15 against official SOS fee schedules — hover the source note under each fee for
            the citation. Use <span className="font-semibold">Open official sources</span> to
            re-check a state&apos;s prices, then <span className="font-semibold">Mark verified</span> to
            record it.
          </p>
        </div>
        <VerifyAllButton />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {states.map((s) => {
          const feeMap = Object.fromEntries(s.fees.map((f) => [f.type, f]));
          const allVerified = s.fees.length === 3 && s.fees.every((f) => f.verified);
          return (
            <Card key={s.code}>
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-brand-950">
                  {s.name} <span className="text-sm font-medium text-slate-400">({s.code})</span>
                </h2>
                {allVerified ? <Badge tone="green">Fees verified</Badge> : <Badge tone="amber">Needs verification</Badge>}
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <p className="flex justify-between gap-2">
                  <span className="text-slate-500">SOS site</span>
                  <a href={s.sosSiteUrl} target="_blank" rel="noopener noreferrer" className="truncate font-medium text-brand-700 hover:underline">
                    {s.sosSiteUrl}
                  </a>
                </p>
                {s.nameSearchUrl && (
                  <p className="flex justify-between gap-2">
                    <span className="text-slate-500">Name search</span>
                    <a href={s.nameSearchUrl} target="_blank" rel="noopener noreferrer" className="truncate font-medium text-brand-700 hover:underline">
                      {s.nameSearchUrl}
                    </a>
                  </p>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                {(["LLC", "FOR_PROFIT", "NON_PROFIT"] as const).map((t) => (
                  <div key={t} className="rounded-lg bg-slate-50 p-2">
                    <p className="font-semibold text-slate-500">
                      {t === "LLC" ? "LLC" : t === "FOR_PROFIT" ? "For-Profit" : "Non-Profit"}
                    </p>
                    <p className="mt-0.5 font-bold text-brand-950">
                      {feeMap[t] ? usd(feeMap[t].stateFeeCents) : "—"}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-3">
                <StateVerifyActions
                  stateCode={s.code}
                  sources={[s.sosSiteUrl, ...s.fees.map((f) => f.documentUrl).filter((u): u is string => Boolean(u))]}
                />
                <StateFeeEditor state={s} fees={s.fees} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
