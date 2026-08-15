import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card } from "@/components/ui";
import { BankApplicationForm } from "@/components/portal/BankApplicationForm";
import { BankStatusTimeline } from "@/components/portal/BankStatusTimeline";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  received: "Received",
  in_review: "In review",
  approved: "Approved — account setup in progress",
  entered: "Data entered — account setup in progress",
  rejected: "Needs attention",
  completed: "Completed",
};

const STATUS_TONE: Record<string, "green" | "amber" | "blue" | "red" | "slate"> = {
  received: "slate",
  in_review: "amber",
  approved: "blue",
  entered: "blue",
  rejected: "red",
  completed: "green",
};

export default async function BankPage() {
  const session = await requireUser();
  const formation = await prisma.formation.findFirst({
    where: { userId: session.id, archivedAt: null },
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
          Open a business checking account through Atlas. Submit your application and our team will
          review it — our backend office will then set up your account manually once your business
          formation is complete.
        </p>
      </div>

      {existing && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wide text-brand-900">
              Application status
            </h2>
            <Badge tone={STATUS_TONE[existing.status] ?? "slate"}>
              {STATUS_LABEL[existing.status] ?? existing.status}
            </Badge>
          </div>
          <div className="mt-5">
            <BankStatusTimeline status={existing.status} />
          </div>
        </Card>
      )}

      {existing?.status === "completed" && (
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-sm font-medium text-emerald-800">
            🎉 Your business bank account has been set up. Check your email for the account details
            and next steps.
          </p>
        </Card>
      )}

      {(!existing || existing.status === "rejected") && (
        <Card>
          <BankApplicationForm
            businessName={formation?.businessName ?? ""}
            email={session.email}
          />
        </Card>
      )}

      <p className="text-xs text-slate-500">
        Your application details are used only to set up your business bank account and are handled
        securely by our team. Nothing is shared with third parties.
      </p>
    </div>
  );
}
