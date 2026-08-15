import Link from "next/link";
import { FilingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Badge, Card } from "@/components/ui";
import { usd, formatType, formatDateShort } from "@/lib/format";
import { FILING_STATUS_LABEL } from "@/lib/filings";

export const dynamic = "force-dynamic";

export default async function FilingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const where: Prisma.FilingWhereInput = status ? { status: status as FilingStatus } : {};

  const [filings, counts] = await Promise.all([
    prisma.filing.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: { formation: { include: { user: true } }, state: true },
    }),
    prisma.filing.groupBy({ by: ["status"], _count: true }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]));

  const filters = [
    { key: "ALL", label: "All", href: "/admin/filings", count: Object.values(countMap).reduce((a, b) => a + b, 0) },
    { key: "READY", label: "Ready", href: "/admin/filings?status=READY", count: countMap.READY ?? 0 },
    { key: "SUBMITTED", label: "Submitted", href: "/admin/filings?status=SUBMITTED", count: countMap.SUBMITTED ?? 0 },
    { key: "FILED", label: "Filed", href: "/admin/filings?status=FILED", count: countMap.FILED ?? 0 },
    { key: "NEEDS_ATTENTION", label: "Needs attention", href: "/admin/filings?status=NEEDS_ATTENTION", count: countMap.NEEDS_ATTENTION ?? 0 },
    { key: "REJECTED", label: "Rejected", href: "/admin/filings?status=REJECTED", count: countMap.REJECTED ?? 0 },
  ];

  const tone = (s: string) =>
    s === "FILED" ? "green" : s === "SUBMITTED" ? "blue" : s === "REJECTED" ? "red" : s === "NEEDS_ATTENTION" ? "amber" : "slate";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-950">Filing queue</h1>
        <p className="mt-1 text-sm text-slate-600">
          Paid formations queued for submission to each state&apos;s online filing system. Open a
          filing, download the submission package, submit via the state portal, then mark it filed.
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={f.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              (status ?? "ALL") === f.key
                ? "bg-brand-950 text-white"
                : "bg-white text-slate-600 shadow-sm hover:bg-slate-50"
            }`}
          >
            {f.label} <span className="opacity-60">({f.count})</span>
          </Link>
        ))}
      </div>

      <Card className="p-0">
        <div className="divide-y divide-slate-100">
          {filings.length === 0 && (
            <p className="px-6 py-10 text-sm text-slate-500">No filings in this view.</p>
          )}
          {filings.map((f) => (
            <Link
              key={f.id}
              href={`/admin/filings/${f.id}`}
              className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="font-semibold text-brand-950">
                  {f.formation.businessName ?? "Unnamed formation"}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {formatType(f.type)} · {f.state.name} ({f.state.code}) ·{" "}
                  {f.formation.user?.email ?? "No account"} · Queued {formatDateShort(f.createdAt)}
                  {f.confirmationNumber ? ` · Conf# ${f.confirmationNumber}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {f.formation.paymentStatus !== "paid" && <Badge tone="amber">Unpaid</Badge>}
                <Badge tone={tone(f.status) as "green" | "blue" | "red" | "amber" | "slate"}>
                  {FILING_STATUS_LABEL[f.status]}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </Card>
      <p className="text-xs text-slate-500">
        Total charged to clients: {usd(filings.reduce((sum, f) => sum + f.formation.totalCents, 0))}
      </p>
    </div>
  );
}
