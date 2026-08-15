import Link from "next/link";
import { ArrowRight, Building2, CreditCard, KeyRound, ListChecks, FileCheck2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card } from "@/components/ui";
import { usd, formatType, formatDateShort } from "@/lib/format";
import { FILING_STATUS_LABEL } from "@/lib/filings";

export const dynamic = "force-dynamic";

export default async function PortalDashboardPage() {
  const session = await requireUser();
  const formation = await prisma.formation.findFirst({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    include: { credentials: true, services: { include: { service: true } }, nameCheck: true, state: true },
  });
  if (!formation) {
    return (
      <Card className="text-center">
        <h2 className="text-lg font-bold text-brand-950">No formation yet</h2>
        <p className="mt-2 text-sm text-slate-600">
          Start a business formation to unlock your client portal.
        </p>
        <Link href="/formation" className="mt-4 inline-block font-semibold text-brand-700">
          Start formation →
        </Link>
      </Card>
    );
  }

  const checklistCount = await prisma.checklistEntry.count({
    where: { formationId: formation.id, completed: true },
  });
  const checklistTotal = await prisma.checklistItem.count({ where: { active: true } });
  const latestFiling = await prisma.filing.findFirst({
    where: { formationId: formation.id },
    orderBy: { createdAt: "desc" },
    include: { state: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-950">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            {formation.businessName} · {formatType(formation.type)} ·{" "}
            {formation.state?.name ?? "State pending"}
          </p>
        </div>
        <div className="flex gap-2">
          {formation.paymentStatus === "paid" ? (
            <Badge tone="green">Paid</Badge>
          ) : (
            <Badge tone="amber">Payment {formation.paymentStatus}</Badge>
          )}
          {formation.analystReview === "APPROVED" ? (
            <Badge tone="green">Analyst approved</Badge>
          ) : formation.analystReview === "REJECTED" ? (
            <Badge tone="red">Analyst rejected</Badge>
          ) : (
            <Badge tone="amber">Analyst review pending (24h)</Badge>
          )}
        </div>
      </div>

      {latestFiling && (
        <Card className="border-brand-200 bg-brand-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileCheck2 className="h-6 w-6 text-brand-700" />
              <div>
                <p className="font-bold text-brand-950">
                  State filing · {latestFiling.state.name}
                </p>
                <p className="text-sm text-slate-600">
                  Status:{" "}
                  <span className="font-semibold">
                    {FILING_STATUS_LABEL[latestFiling.status]}
                  </span>
                  {latestFiling.confirmationNumber
                    ? ` · Confirmation #${latestFiling.confirmationNumber}`
                    : ""}
                </p>
              </div>
            </div>
            {latestFiling.status === "FILED" ? (
              <Badge tone="green">Officially registered 🎉</Badge>
            ) : latestFiling.status === "NEEDS_ATTENTION" || latestFiling.status === "REJECTED" ? (
              <Badge tone="red">We&apos;re on it</Badge>
            ) : (
              <Badge tone="amber">Being filed — typically 1–3 business days</Badge>
            )}
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <KeyRound className="h-6 w-6 text-brand-700" />
          <p className="mt-3 text-sm font-medium text-slate-500">EIN</p>
          <p className="text-lg font-bold text-brand-950">
            {formation.credentials?.ein ?? "Not obtained yet"}
          </p>
          <Link href="/portal/checklist" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
            Get your EIN <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
        <Card>
          <ListChecks className="h-6 w-6 text-brand-700" />
          <p className="mt-3 text-sm font-medium text-slate-500">Startup checklist</p>
          <p className="text-lg font-bold text-brand-950">
            {checklistCount}/{checklistTotal} complete
          </p>
          <Link href="/portal/checklist" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
            View checklist <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
        <Card>
          <CreditCard className="h-6 w-6 text-brand-700" />
          <p className="mt-3 text-sm font-medium text-slate-500">Formation total</p>
          <p className="text-lg font-bold text-brand-950">{usd(formation.totalCents)}</p>
          <p className="mt-2 text-xs text-slate-500">
            {formation.services.length > 0
              ? `Includes: ${formation.services.map((s) => s.service.name).join(", ")}`
              : "State fee + Atlas formation fee"}
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="font-bold text-brand-950">Formation timeline</h2>
        <ol className="mt-4 space-y-3">
          {[
            { label: "Formation type & state selected", done: Boolean(formation.stateCode) },
            { label: "Name check completed", done: formation.nameCheck?.claimedAvailable ?? false },
            { label: "Incorporation document signed", done: Boolean(formation.contractSignedAt) },
            { label: "Payment received", done: formation.paymentStatus === "paid" },
            { label: "Analyst review (external, within 24h)", done: formation.analystReview === "APPROVED" },
            { label: "Filed with Secretary of State", done: formation.status === "FILED" || formation.status === "COMPLETED" },
          ].map((s) => (
            <li key={s.label} className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  s.done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                }`}
              >
                {s.done ? "✓" : ""}
              </span>
              <span className={s.done ? "text-slate-800" : "text-slate-500"}>{s.label}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-slate-500">
          Established {formatDateShort(formation.credentials?.establishedDate ?? formation.createdAt)} ·{" "}
          <Building2 className="inline h-3 w-3" /> {formation.state?.name ?? ""}
        </p>
      </Card>
    </div>
  );
}
