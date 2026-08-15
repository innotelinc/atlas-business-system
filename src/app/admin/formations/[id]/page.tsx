import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge, Card } from "@/components/ui";
import { usd, formatDate, formatType } from "@/lib/format";
import { ReviewActions } from "@/components/admin/ReviewActions";

export const dynamic = "force-dynamic";

export default async function FormationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const formation = await prisma.formation.findUnique({
    where: { id },
    include: {
      user: true,
      state: true,
      nameCheck: true,
      document: true,
      credentials: true,
      services: { include: { service: true } },
      bankApplications: true,
    },
  });
  if (!formation) notFound();

  const docData = (formation.document?.data as Record<string, unknown>) ?? {};

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/formations" className="text-sm font-medium text-brand-700 hover:text-brand-800">
          ← Back to formations
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-brand-950">
          {formation.businessName ?? "Unnamed formation"}
        </h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge tone="blue">{formatType(formation.type)}</Badge>
          <Badge>{formation.state?.name ?? "No state"}</Badge>
          {formation.paymentStatus === "paid" ? (
            <Badge tone="green">Paid</Badge>
          ) : (
            <Badge tone="amber">{formation.paymentStatus}</Badge>
          )}
          {formation.analystReview === "APPROVED" ? (
            <Badge tone="green">Analyst approved</Badge>
          ) : formation.analystReview === "REJECTED" ? (
            <Badge tone="red">Analyst rejected</Badge>
          ) : (
            <Badge tone="amber">Analyst review pending</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-bold text-brand-950">Filing details</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row k="Client" v={formation.user?.email ?? "No account yet"} />
            <Row k="Business name" v={formation.businessName ?? "—"} />
            <Row k="Entity type" v={formatType(formation.type)} />
            <Row k="State" v={formation.state?.name ?? "—"} />
            <Row k="State fee" v={usd(formation.stateFeeCents)} />
            <Row k="Service fee" v={usd(formation.serviceFeeCents)} />
            <Row k="Total" v={usd(formation.totalCents)} />
            <Row
              k="Services"
              v={formation.services.length ? formation.services.map((s) => s.service.name).join(", ") : "None"}
            />
            <Row k="Signed" v={formation.contractSignedAt ? formatDate(formation.contractSignedAt) : "Not signed"} />
            <Row k="Created" v={formatDate(formation.createdAt)} />
          </dl>
          {formation.document && (
            <a
              href={`/api/formation/${formation.id}/pdf`}
              target="_blank"
              className="mt-4 inline-flex h-10 items-center rounded-lg bg-brand-950 px-4 text-sm font-semibold text-white hover:bg-brand-800"
            >
              Download generated document (PDF)
            </a>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="font-bold text-brand-950">Name check</h2>
            {formation.nameCheck ? (
              <dl className="mt-3 space-y-2 text-sm">
                <Row k="Searched SOS database" v={formation.nameCheck.sosSearched ? "Yes" : "No"} />
                <Row k="Claimed available" v={formation.nameCheck.claimedAvailable ? "Yes" : "No"} />
                <Row k="Search notes" v={formation.nameCheck.sosResults ?? "—"} />
              </dl>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No name check recorded.</p>
            )}
          </Card>

          <Card>
            <h2 className="font-bold text-brand-950">Analyst review</h2>
            <p className="mt-2 text-sm text-slate-600">
              External 24-hour review step. Does not hold up the client&apos;s formation or portal
              access.
            </p>
            {formation.analystNotes && (
              <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                <span className="font-semibold">Previous notes:</span> {formation.analystNotes}
              </p>
            )}
            <div className="mt-4">
              <ReviewActions formationId={formation.id} current={formation.analystReview} />
            </div>
          </Card>
        </div>
      </div>

      {formation.document && (
        <Card>
          <h2 className="font-bold text-brand-950">Document data</h2>
          <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-700">
            {JSON.stringify(docData, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-right font-medium text-slate-800">{v}</dd>
    </div>
  );
}
