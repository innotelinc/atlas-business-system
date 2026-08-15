import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge, Card } from "@/components/ui";
import { usd, formatDate, formatType } from "@/lib/format";
import { FILING_STATUS_LABEL, type FilingHistoryEntry } from "@/lib/filings";
import { FilingActions } from "@/components/admin/FilingActions";

export const dynamic = "force-dynamic";

export default async function FilingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const filing = await prisma.filing.findUnique({
    where: { id },
    include: {
      formation: {
        include: { user: true, state: true, document: true, nameCheck: true },
      },
      state: true,
    },
  });
  if (!filing) notFound();

  const history = (filing.history as unknown as FilingHistoryEntry[]) ?? [];
  const tone = (s: string) =>
    s === "FILED" ? "green" : s === "SUBMITTED" ? "blue" : s === "REJECTED" ? "red" : s === "NEEDS_ATTENTION" ? "amber" : "slate";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/filings" className="text-sm font-medium text-brand-700 hover:text-brand-800">
          ← Back to filing queue
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-brand-950">
            {filing.formation.businessName ?? "Unnamed formation"}
          </h1>
          <Badge tone={tone(filing.status) as "green" | "blue" | "red" | "amber" | "slate"}>
            {FILING_STATUS_LABEL[filing.status]}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {formatType(filing.type)} · {filing.state.name} ({filing.state.code}) · Provider:{" "}
          {filing.provider} · Queued {formatDate(filing.createdAt)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-bold text-brand-950">Submission package</h2>
          <p className="mt-2 text-sm text-slate-600">
            One PDF with the operator cover sheet and the signed Articles. Submit it through the
            state portal, then record the result below.
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">State filing fee</span>
              <span className="font-semibold">{usd(filing.formation.stateFeeCents)}</span>
            </p>
            <p className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Confirmation number</span>
              <span className="font-semibold">{filing.confirmationNumber ?? "—"}</span>
            </p>
            <p className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Submitted</span>
              <span className="font-semibold">
                {filing.submittedAt ? `${formatDate(filing.submittedAt)} by ${filing.submittedBy ?? "—"}` : "Not yet"}
              </span>
            </p>
            <p className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Filed</span>
              <span className="font-semibold">{filing.filedAt ? formatDate(filing.filedAt) : "—"}</span>
            </p>
            <p className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Attempts</span>
              <span className="font-semibold">{filing.attempts}</span>
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {filing.formation.document ? (
              <a
                href={`/api/filings/${filing.id}/package`}
                target="_blank"
                className="inline-flex h-10 items-center rounded-lg bg-brand-950 px-4 text-sm font-semibold text-white hover:bg-brand-800"
              >
                Download submission package (PDF)
              </a>
            ) : (
              <span className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                Document not built yet — client must complete the document step first.
              </span>
            )}
            <a
              href={filing.state.sosSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Open {filing.state.name} SOS portal ↗
            </a>
            {filing.state.nameSearchUrl && (
              <a
                href={filing.state.nameSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Name search ↗
              </a>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="font-bold text-brand-950">Update filing status</h2>
            <FilingActions
              filingId={filing.id}
              status={filing.status}
              confirmationNumber={filing.confirmationNumber ?? ""}
            />
          </Card>

          <Card>
            <h2 className="font-bold text-brand-950">Status history</h2>
            {history.length === 0 && (
              <p className="mt-3 text-sm text-slate-500">No activity yet — filing is queued.</p>
            )}
            <ol className="mt-3 space-y-3">
              {[
                { from: "Created", to: "READY", at: filing.createdAt.toISOString(), by: "system", note: null },
                ...history,
              ].map((h, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="mt-1 flex h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" />
                  <div>
                    <p className="font-medium text-slate-800">
                      {h.from === "Created" ? "Filing queued" : `${h.from} → ${FILING_STATUS_LABEL[h.to as keyof typeof FILING_STATUS_LABEL] ?? h.to}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(h.at).toLocaleString()} · {h.by}
                      {h.note ? ` · “${h.note}”` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      <Card>
        <h2 className="font-bold text-brand-950">Client & formation</h2>
        <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-500">Client</dt>
            <dd className="mt-1">{filing.formation.user?.email ?? "No account yet"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-500">Payment</dt>
            <dd className="mt-1">
              {filing.formation.paymentStatus === "paid"
                ? `Paid · ${usd(filing.formation.totalCents)}`
                : filing.formation.paymentStatus}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-500">Analyst review</dt>
            <dd className="mt-1">{filing.formation.analystReview}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-500">Name check</dt>
            <dd className="mt-1">
              {filing.formation.nameCheck?.claimedAvailable ? "Claimed available" : "Not confirmed"}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
