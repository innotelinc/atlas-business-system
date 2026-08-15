import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { BankApplicationForm } from "@/components/portal/BankApplicationForm";

export const dynamic = "force-dynamic";

export default async function BankPage() {
  const session = await requireUser();
  const formation = await prisma.formation.findFirst({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });
  const existing = await prisma.bankApplication.findFirst({
    where: { formationId: formation?.id ?? "__none__" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-950">Business banking</h1>
        <p className="mt-1 text-sm text-slate-600">
          Open a business checking account through our partner{" "}
          <a
            href="https://relayfi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-700 hover:text-brand-800"
          >
            Relay
          </a>
          . Submit your application here and we&apos;ll forward it to Relay for account setup after
          your business formation is complete.
        </p>
      </div>

      {existing && existing.status !== "completed" && (
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-sm font-medium text-emerald-800">
            Your application is <span className="font-bold">{existing.status}</span>. We&apos;ll
            reach out once your account is set up. 
            {existing.status === "received" && " Typically 1–2 business days after your formation is filed."}
          </p>
        </Card>
      )}

      <Card>
        <BankApplicationForm
          businessName={formation?.businessName ?? ""}
          email={session.email}
        />
      </Card>

      <p className="text-xs text-slate-500">
        Relay is a business banking platform (member FDIC through partner banks). Application details
        are used only to open your account and are handled securely.
      </p>
    </div>
  );
}
