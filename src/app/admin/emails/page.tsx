import { prisma } from "@/lib/prisma";
import { Badge, Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EmailsPage() {
  const emails = await prisma.sentEmail.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { formation: true },
  });

  const typeLabel = (t: string) =>
    t === "payment_received"
      ? "Payment received"
      : t === "analyst_approved"
        ? "Analyst approved"
        : t === "ein_reminder"
          ? "EIN reminder"
          : t;

  const statusTone = (s: string) =>
    s === "sent" ? "green" : s === "logged" ? "amber" : "red";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-950">Email log</h1>
        <p className="mt-1 text-sm text-slate-600">
          Recently sent client notifications. In development without a Resend key, emails are
          logged here with status “logged” instead of being delivered.
        </p>
      </div>

      <Card className="p-0">
        <div className="divide-y divide-slate-100">
          {emails.length === 0 && (
            <p className="px-6 py-10 text-sm text-slate-500">No emails recorded yet.</p>
          )}
          {emails.map((e) => (
            <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-brand-950">{e.subject}</p>
                <p className="truncate text-xs text-slate-500">
                  To {e.to} · {e.createdAt.toLocaleString()}
                  {e.formation?.businessName ? ` · ${e.formation.businessName}` : ""}
                </p>
                {e.error && <p className="truncate text-xs text-red-600">{e.error}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone="blue">{typeLabel(e.type)}</Badge>
                <Badge tone={statusTone(e.status) as "green" | "amber" | "red"}>{e.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
