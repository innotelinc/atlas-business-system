import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Checklist } from "@/components/portal/Checklist";

export const dynamic = "force-dynamic";

export default async function ChecklistPage() {
  const session = await requireUser();
  const formation = await prisma.formation.findFirst({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });

  const items = await prisma.checklistItem.findMany({
    where: { active: true, section: "business" },
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
    hasValue: item.title.toLowerCase().includes("ein"),
    entry: entryMap.get(item.id)
      ? { completed: entryMap.get(item.id)!.completed, value: entryMap.get(item.id)!.value }
      : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-950">Business checklist</h1>
        <p className="mt-1 text-sm text-slate-600">
          The most important steps to get your new business running. Check them off as you go.
        </p>
      </div>

      <Checklist
        intro="Work through these in order — EIN first, then D&B, then banking."
        items={rows}
      />

      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
        <p className="text-sm font-semibold text-brand-900">
          Need a business bank account?
        </p>
        <p className="mt-1 text-sm text-brand-800">
          Apply for a business checking account through Atlas. Our team reviews your application
          and our backend office sets up your account once your formation is complete.
        </p>
        <Link
          href="/portal/bank"
          className="mt-3 inline-flex h-10 items-center rounded-lg bg-brand-950 px-4 text-sm font-semibold text-white hover:bg-brand-800"
        >
          Apply for business banking →
        </Link>
      </div>
    </div>
  );
}
