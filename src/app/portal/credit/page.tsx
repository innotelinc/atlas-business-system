import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Checklist } from "@/components/portal/Checklist";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CreditPage() {
  const session = await requireUser();
  const formation = await prisma.formation.findFirst({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });

  const items = await prisma.checklistItem.findMany({
    where: { active: true, section: "credit" },
    orderBy: { sortOrder: "asc" },
  });

  const entries = formation
    ? await prisma.checklistEntry.findMany({ where: { formationId: formation.id } })
    : [];
  const entryMap = new Map(entries.map((e) => [e.itemId, e]));

  const rows = items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    url: item.url,
    urlLabel: item.urlLabel,
    hasValue: false,
    entry: entryMap.get(item.id)
      ? { completed: entryMap.get(item.id)!.completed, value: entryMap.get(item.id)!.value }
      : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-950">Business credit</h1>
        <p className="mt-1 text-sm text-slate-600">
          Net-30 vendors and starter accounts that approve new businesses and help you build a
          business credit profile.
        </p>
      </div>

      <Card className="border-brand-200 bg-brand-50">
        <h2 className="font-bold text-brand-950">How to build business credit</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
          <li>Get your EIN from the IRS (see Business checklist).</li>
          <li>Register for a D-U-N-S number with Dun &amp; Bradstreet.</li>
          <li>Open a business bank account (we can help — see Banking).</li>
          <li>Open Net-30 accounts with the vendors below and pay on time.</li>
          <li>Some vendors report to business credit bureaus (D&amp;B, Experian, Equifax) — that&apos;s what builds your score.</li>
        </ol>
      </Card>

      <Checklist
        intro="Starter accounts — apply and make small purchases, then pay within the Net-30 window."
        items={rows}
      />
    </div>
  );
}
