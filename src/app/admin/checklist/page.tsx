import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { ChecklistEditor } from "@/components/admin/ChecklistEditor";

export const dynamic = "force-dynamic";

export default async function ChecklistPage() {
  const items = await prisma.checklistItem.findMany({ orderBy: [{ section: "asc" }, { sortOrder: "asc" }] });
  const business = items.filter((i) => i.section === "business");
  const credit = items.filter((i) => i.section === "credit");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-brand-950">Client checklist items</h1>
      <p className="text-sm text-slate-600">
        Items shown in the client portal&apos;s Business checklist and Business credit sections.
      </p>
      <Section title="Business checklist" items={business} />
      <Section title="Business credit" items={credit} />
    </div>
  );
}

function Section({
  title,
  items,
}: {
  title: string;
  items: Awaited<ReturnType<typeof prisma.checklistItem.findMany>>;
}) {
  return (
    <div>
      <h2 className="mb-3 font-bold text-brand-950">{title}</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-brand-950">{item.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {item.url ? item.url : "No link"} · Order {item.sortOrder} ·{" "}
                  {item.active ? "Active" : "Hidden"}
                </p>
              </div>
              <ChecklistEditor
                id={item.id}
                title={item.title}
                description={item.description ?? ""}
                url={item.url ?? ""}
                urlLabel={item.urlLabel ?? ""}
                section={item.section}
                sortOrder={item.sortOrder}
                active={item.active}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
