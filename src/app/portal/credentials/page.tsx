import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { CredentialsForm } from "@/components/portal/CredentialsForm";

export const dynamic = "force-dynamic";

export default async function CredentialsPage() {
  const session = await requireUser();
  const formation = await prisma.formation.findFirst({
    where: { userId: session.id, archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: { credentials: true },
  });

  const credentials = formation?.credentials ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-950">Business credentials</h1>
        <p className="mt-1 text-sm text-slate-600">
          The official details of your business — keep them up to date.
        </p>
      </div>

      <Card>
        <CredentialsForm
          businessName={formation?.businessName ?? ""}
          credentials={{
            ein: credentials?.ein ?? "",
            establishedDate: credentials?.establishedDate
              ? credentials.establishedDate.toISOString().slice(0, 10)
              : "",
            officers: (credentials?.officers as unknown as { name: string; title: string }[] | null) ?? [],
            address: credentials?.address ?? "",
            phone: credentials?.phone ?? "",
            email: credentials?.email ?? "",
            website: credentials?.website ?? "",
          }}
        />
      </Card>
    </div>
  );
}
