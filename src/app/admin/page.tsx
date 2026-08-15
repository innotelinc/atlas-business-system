import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [total, pendingReview, paid, receivedBankApps] = await Promise.all([
    prisma.formation.count(),
    prisma.formation.count({ where: { analystReview: "PENDING" } }),
    prisma.formation.count({ where: { paymentStatus: "paid" } }),
    prisma.bankApplication.count({ where: { status: "received" } }),
  ]);

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
        <StatCard label="Bank apps to forward" value={receivedBankApps} href="/admin/bank-applications" tone={receivedBankApps > 0 ? "amber" : "green"} />
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
