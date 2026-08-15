import { prisma } from "@/lib/prisma";
import { PricingEditor } from "@/components/admin/PricingEditor";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const config =
    (await prisma.pricingConfig.findUnique({ where: { id: "single" } })) ?? {
      serviceFeeCentsLLC: 4900,
      serviceFeeCentsForProfit: 4900,
      serviceFeeCentsNonProfit: 4900,
      competitorRetailCents: 19900,
      competitorName: "leading online formation services",
    };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-950">Pricing & fees</h1>
        <p className="mt-1 text-sm text-slate-600">
          Edit the Atlas formation service fee per entity type and the retail comparison shown to
          clients. State filing fees are edited per state on the States &amp; fees page.
        </p>
      </div>
      <PricingEditor
        serviceFeeCentsLLC={config.serviceFeeCentsLLC}
        serviceFeeCentsForProfit={config.serviceFeeCentsForProfit}
        serviceFeeCentsNonProfit={config.serviceFeeCentsNonProfit}
        competitorRetailCents={config.competitorRetailCents}
        competitorName={config.competitorName}
      />
    </div>
  );
}
