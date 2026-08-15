import { prisma } from "@/lib/prisma";
import { Badge, Card } from "@/components/ui";
import { BankAppActions, type BankAppStatus } from "@/components/admin/BankAppActions";

export const dynamic = "force-dynamic";

const FLOW: { key: BankAppStatus; label: string }[] = [
  { key: "received", label: "Received" },
  { key: "in_review", label: "Analyst review" },
  { key: "approved", label: "Approved for setup" },
  { key: "entered", label: "Data entered" },
  { key: "completed", label: "Account set up" },
];

const STATUS_LABEL: Record<string, string> = {
  received: "Received",
  in_review: "In review",
  approved: "Approved",
  entered: "Data entered",
  rejected: "Rejected",
  completed: "Completed",
};

const statusTone = (s: string): "green" | "blue" | "amber" | "red" | "slate" =>
  s === "completed" ? "green" : s === "approved" ? "blue" : s === "in_review" || s === "entered" ? "amber" : s === "rejected" ? "red" : "slate";

function Stepper({ status }: { status: string }) {
  if (status === "rejected") {
    return <Badge tone="red">Rejected — returned to client queue</Badge>;
  }
  const idx = FLOW.findIndex((f) => f.key === status);
  return (
    <ol className="mt-3 flex flex-wrap items-center gap-1 text-xs">
      {FLOW.map((f, i) => {
        const done = i <= idx;
        const active = i === idx;
        return (
          <li key={f.key} className="flex items-center gap-1">
            <span
              className={`rounded-full px-2.5 py-1 font-semibold ${
                active
                  ? "bg-brand-900 text-white"
                  : done
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {f.label}
            </span>
            {i < FLOW.length - 1 && <span className="text-slate-300">→</span>}
          </li>
        );
      })}
    </ol>
  );
}

export default async function BankApplicationsPage() {
  const apps = await prisma.bankApplication.findMany({
    orderBy: { createdAt: "desc" },
    include: { formation: true },
  });

  const counts = apps.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-950">Bank applications</h1>
        <p className="mt-1 text-sm text-slate-600">
          Business banking applications submitted by clients. Reviewed by an analyst, then set up
          manually by our backend office — nothing is forwarded to a third party.
        </p>
      </div>

      {/* Flow explainer */}
      <Card className="border-brand-100 bg-brand-50/40">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-900">Application flow</h2>
        <ol className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-5">
          {FLOW.map((f, i) => (
            <li key={f.key} className="rounded-lg bg-white p-3 shadow-sm">
              <span className="font-bold text-brand-700">Step {i + 1}</span>
              <p className="mt-0.5 font-semibold">{f.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {f.key === "received" && "Client submits the application from their portal."}
                {f.key === "in_review" && "An analyst reviews the details and verifies identity info."}
                {f.key === "approved" && "Approved for setup by the backend office."}
                {f.key === "entered" && "Details are entered into the banking system."}
                {f.key === "completed" && "Account is opened; the client is notified."}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-slate-500">
          Applications can be rejected at the review or setup stage — rejected applications return
          to the client queue and can be restarted.
        </p>
      </Card>

      {/* Status counts */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(counts).length === 0 && <p className="text-sm text-slate-500">No applications yet.</p>}
        {Object.entries(counts).map(([s, n]) => (
          <span
            key={s}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
          >
            {STATUS_LABEL[s] ?? s}: <span className="text-brand-900">{n}</span>
          </span>
        ))}
      </div>

      <div className="space-y-4">
        {apps.map((app) => (
          <Card key={app.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-brand-950">{app.businessName}</p>
                  <Badge tone={statusTone(app.status) as "green" | "blue" | "amber" | "red" | "slate"}>
                    {STATUS_LABEL[app.status] ?? app.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {app.legalName} · {app.email} · {app.phone} · Submitted {app.createdAt.toLocaleString()}
                </p>
                {app.formation && (
                  <p className="mt-1 text-xs text-slate-500">
                    Formation: {app.formation.businessName ?? app.formation.id}
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {app.detailsVerified ? (
                    <Badge tone="green">Info verified</Badge>
                  ) : (
                    <Badge tone="slate">Info not yet verified</Badge>
                  )}
                  {app.enteredAt && <Badge tone="blue">Entered</Badge>}
                </div>
                <Stepper status={app.status} />
              </div>
              <BankAppActions app={app} />
            </div>
            {(app.dob || app.ssn || app.address || app.notes) && (
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                {app.dob && <p>DOB: {app.dob}</p>}
                {app.ssn && <p>SSN (last 4): ••••{app.ssn}</p>}
                {app.address && <p>Address: {app.address}</p>}
                {app.notes && <p>Notes: {app.notes}</p>}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
