import { prisma } from "@/lib/prisma";
import { Badge, Card } from "@/components/ui";
import { BankAppActions } from "@/components/admin/BankAppActions";

export const dynamic = "force-dynamic";

export default async function BankApplicationsPage() {
  const apps = await prisma.bankApplication.findMany({
    orderBy: { createdAt: "desc" },
    include: { formation: true },
  });

  const statusTone = (s: string) =>
    s === "completed" ? "green" : s === "forwarded" ? "blue" : "amber";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-950">Relay bank applications</h1>
        <p className="mt-1 text-sm text-slate-600">
          Applications submitted by clients. Forward to Relay for account setup, then mark complete.
        </p>
      </div>

      <div className="space-y-4">
        {apps.length === 0 && (
          <Card>
            <p className="text-sm text-slate-500">No applications yet.</p>
          </Card>
        )}
        {apps.map((app) => (
          <Card key={app.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-brand-950">{app.businessName}</p>
                  <Badge tone={statusTone(app.status) as "green" | "blue" | "amber"}>{app.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {app.legalName} · {app.email} · {app.phone} · Submitted{" "}
                  {app.createdAt.toLocaleString()}
                </p>
                {app.formation && (
                  <p className="mt-1 text-xs text-slate-500">
                    Formation: {app.formation.businessName ?? app.formation.id}
                  </p>
                )}
              </div>
              <BankAppActions id={app.id} status={app.status} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
