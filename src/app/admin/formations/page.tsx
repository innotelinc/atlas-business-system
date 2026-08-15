import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Badge, Card } from "@/components/ui";
import { usd, formatType } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FormationsPage({
  searchParams,
}: {
  searchParams: Promise<{ review?: string; payment?: string }>;
}) {
  const { review, payment } = await searchParams;

  const where: Prisma.FormationWhereInput = {};
  if (review === "pending") where.analystReview = "PENDING";
  if (review === "approved") where.analystReview = "APPROVED";
  if (review === "rejected") where.analystReview = "REJECTED";
  if (payment === "paid") where.paymentStatus = "paid";
  if (payment === "unpaid") where.paymentStatus = { not: "paid" };

  const formations = await prisma.formation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { user: true, state: true },
  });

  const filters = [
    { label: "All", href: "/admin/formations" },
    { label: "Pending review", href: "/admin/formations?review=pending" },
    { label: "Approved", href: "/admin/formations?review=approved" },
    { label: "Rejected", href: "/admin/formations?review=rejected" },
    { label: "Paid", href: "/admin/formations?payment=paid" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-brand-950">Formations</h1>
        <div className="flex flex-wrap gap-1">
          {filters.map((f) => (
            <Link
              key={f.label}
              href={f.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-white hover:shadow-sm"
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      <Card className="p-0">
        <div className="divide-y divide-slate-100">
          {formations.length === 0 && (
            <p className="px-6 py-10 text-sm text-slate-500">No formations match this filter.</p>
          )}
          {formations.map((f) => (
            <Link
              key={f.id}
              href={`/admin/formations/${f.id}`}
              className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="font-semibold text-brand-950">
                  {f.businessName ?? "Unnamed formation"}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {formatType(f.type)} · {f.state?.name ?? "No state"} ·{" "}
                  {f.user?.email ?? "No account"} · Created {f.createdAt.toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {f.paymentStatus === "paid" ? (
                  <Badge tone="green">Paid · {usd(f.totalCents)}</Badge>
                ) : (
                  <Badge tone="amber">{f.paymentStatus}</Badge>
                )}
                {f.analystReview === "APPROVED" ? (
                  <Badge tone="green">Approved</Badge>
                ) : f.analystReview === "REJECTED" ? (
                  <Badge tone="red">Rejected</Badge>
                ) : (
                  <Badge tone="amber">Review pending</Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
