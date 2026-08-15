import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, Card } from "@/components/ui";
import { formatType } from "@/lib/format";

export const dynamic = "force-dynamic";

const FILING_STATUS_LABEL: Record<string, string> = {
  READY: "Ready",
  SUBMITTED: "Submitted",
  FILED: "Filed",
  REJECTED: "Rejected",
  NEEDS_ATTENTION: "Needs attention",
};

export default async function AdminDashboardPage() {
  const [total, pendingReview, paid, receivedBankApps, filingGroups, needsAttention] =
    await Promise.all([
      prisma.formation.count(),
      prisma.formation.count({ where: { analystReview: "PENDING" } }),
      prisma.formation.count({ where: { paymentStatus: "paid" } }),
      prisma.bankApplication.count({ where: { status: { in: ["received", "in_review"] } } }),
      prisma.filing.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.filing.findMany({
        where: { status: { in: ["NEEDS_ATTENTION", "REJECTED"] } },
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: { formation: { select: { id: true, businessName: true, type: true } }, state: true },
      }),
    ]);

  const counts = Object.fromEntries(filingGroups.map((g) => [g.status, g._count._all]));
  const openFilings = (counts.READY ?? 0) + (counts.SUBMITTED ?? 0);
  const problemFilings = (counts.NEEDS_ATTENTION ?? 0) + (counts.REJECTED ?? 0);

  const recent = await prisma.formation.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { user: true, state: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-brand-950">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total formations" value={total} href="/admin/formations" />
        <StatCard label="Pending analyst review" value={pendingReview} href="/admin/formations?review=pending" tone={pendingReview > 0 ? "amber" : "green"} />
        <StatCard label="Paid formations" value={paid} href="/admin/formations?payment=paid" />
        <StatCard label="Bank apps to review" value={receivedBankApps} href="/admin/bank-applications" tone={receivedBankApps > 0 ? "amber" : "green"} />
      </div>

      {/* Filing pipeline widget */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-brand-950">Filing pipeline</h2>
            <Link href="/admin/filings" className="text-sm font-medium text-brand-700 hover:text-brand-800">
              View all filings →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {["READY", "SUBMITTED", "FILED", "NEEDS_ATTENTION", "REJECTED"].map((s) => (
              <Link
                key={s}
                href={`/admin/filings?status=${s}`}
                className={`rounded-xl border p-3 transition hover:shadow-sm ${
                  s === "NEEDS_ATTENTION" || s === "REJECTED"
                    ? "border-red-200 bg-red-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <p className="text-2xl font-bold text-brand-950">{counts[s] ?? 0}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  {FILING_STATUS_LABEL[s] ?? s}
                </p>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {openFilings > 0
              ? `${openFilings} filing(s) actively being submitted by the operations team.`
              : "No filings currently in the submission queue."}
          </p>
        </Card>

        <Card className={problemFilings > 0 ? "border-red-200 bg-red-50/50" : ""}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-brand-950">Needs attention</h2>
            {problemFilings > 0 && <Badge tone="red">{problemFilings}</Badge>}
          </div>
          {needsAttention.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No filings need attention. 🎉</p>
          ) : (
            <div className="mt-3 divide-y divide-red-100">
              {needsAttention.map((fl) => (
                <Link
                  key={fl.id}
                  href={`/admin/filings/${fl.id}`}
                  className="block py-2.5 hover:opacity-80"
                >
                  <p className="truncate text-sm font-semibold text-brand-950">
                    {fl.formation.businessName ?? "Unnamed"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatType(fl.formation.type)} · {fl.state.name} ·{" "}
                    {fl.status === "NEEDS_ATTENTION" ? "Needs attention" : "Rejected"}
                    {fl.lastError ? ` — ${fl.lastError.slice(0, 60)}` : ""}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="font-bold text-brand-950">Recent formations</h2>
        <div className="mt-3 divide-y divide-slate-100">
          {recent.length === 0 && <p className="py-6 text-sm text-slate-500">No formations yet.</p>}
          {recent.map((f) => (
            <Link
              key={f.id}
              href={`/admin/formations/${f.id}`}
              className="flex items-center justify-between gap-4 py-3 hover:bg-slate-50"
            >
              <div>
                <p className="font-semibold text-brand-950">
                  {f.businessName ?? "Unnamed formation"}
                </p>
                <p className="text-xs text-slate-500">
                  {f.type} · {f.state?.name ?? "—"} · {f.user?.email ?? "No account yet"} ·{" "}
                  {f.createdAt.toLocaleDateString()}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                  f.analystReview === "APPROVED"
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : f.analystReview === "REJECTED"
                      ? "bg-red-50 text-red-700 ring-red-200"
                      : "bg-amber-50 text-amber-700 ring-amber-200"
                }`}
              >
                Review: {f.analystReview}
              </span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  tone = "slate",
}: {
  label: string;
  value: number;
  href: string;
  tone?: "slate" | "green" | "amber";
}) {
  const tones = {
    slate: "text-brand-950",
    green: "text-emerald-600",
    amber: "text-amber-600",
  }[tone];
  return (
    <Link href={href}>
      <Card className="transition hover:shadow-md">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className={`mt-1 text-3xl font-bold ${tones}`}>{value}</p>
      </Card>
    </Link>
  );
}
