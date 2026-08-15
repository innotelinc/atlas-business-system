import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { usd } from "@/lib/format";
import { ServiceEditor } from "@/components/admin/ServiceEditor";
import { StripeSyncButton } from "@/components/admin/StripeSyncButton";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const services = await prisma.service.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-brand-950">Value-added services</h1>
        <StripeSyncButton />
      </div>
      <div className="space-y-4">
        {services.map((s) => (
          <Card key={s.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-brand-950">{s.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {s.recurring ? `Subscription · ${usd(s.priceCents)} / ${s.interval}` : `One-time · ${usd(s.priceCents)}`}
                </p>
              </div>
              <ServiceEditor
                id={s.id}
                name={s.name}
                description={s.description ?? ""}
                priceCents={s.priceCents}
                recurring={s.recurring}
                interval={s.interval ?? ""}
                active={s.active}
                stripePriceId={s.stripePriceId ?? ""}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
