import { FilingStatus, Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { maybeSendFilingFiled } from "./email";

// Allowed status transitions for the ops-assisted filing pipeline.
export const FILING_TRANSITIONS: Record<FilingStatus, FilingStatus[]> = {
  READY: ["SUBMITTED", "NEEDS_ATTENTION", "REJECTED"],
  SUBMITTED: ["FILED", "NEEDS_ATTENTION", "REJECTED"],
  NEEDS_ATTENTION: ["SUBMITTED", "REJECTED"],
  REJECTED: ["SUBMITTED"], // refile
  FILED: [],
};

export const FILING_STATUS_LABEL: Record<FilingStatus, string> = {
  READY: "Ready to file",
  SUBMITTED: "Submitted to state",
  FILED: "Filed — registered",
  REJECTED: "Rejected by state",
  NEEDS_ATTENTION: "Needs attention",
};

export type FilingHistoryEntry = {
  from: string;
  to: string;
  at: string;
  by: string;
  note: string | null;
};

/**
 * Create a READY filing for a paid formation once its document is built.
 * Idempotent — returns the existing filing if one already exists.
 */
export async function ensureFilingForFormation(formationId: string) {
  const formation = await prisma.formation.findUnique({
    where: { id: formationId },
    include: { document: true },
  });
  if (!formation || !formation.stateCode || !formation.document) return null;

  const existing = await prisma.filing.findFirst({ where: { formationId } });
  if (existing) return existing;

  return prisma.filing.create({
    data: {
      formationId,
      stateCode: formation.stateCode,
      type: formation.type,
      provider: "ops",
    },
  });
}

/** Transition a filing to a new status, enforcing the workflow and running side effects. */
export async function transitionFiling(opts: {
  filingId: string;
  to: FilingStatus;
  by: string;
  confirmationNumber?: string;
  notes?: string;
}) {
  const filing = await prisma.filing.findUnique({ where: { id: opts.filingId } });
  if (!filing) throw new Error("Filing not found");

  const allowed = FILING_TRANSITIONS[filing.status];
  if (!allowed.includes(opts.to)) {
    throw new Error(`Cannot move filing from ${filing.status} to ${opts.to}`);
  }

  const history = (filing.history as unknown as FilingHistoryEntry[]) ?? [];
  const entry: FilingHistoryEntry = {
    from: filing.status,
    to: opts.to,
    at: new Date().toISOString(),
    by: opts.by,
    note: opts.notes ?? null,
  };

  const data: Prisma.FilingUpdateInput = {
    status: opts.to,
    notes: opts.notes ?? undefined,
    history: [...history, entry],
    attempts: opts.to === "SUBMITTED" ? { increment: 1 } : undefined,
  };
  if (opts.to === "SUBMITTED") {
    data.submittedAt = new Date();
    data.submittedBy = opts.by;
  }
  if (opts.to === "FILED") {
    data.confirmationNumber = opts.confirmationNumber ?? undefined;
    data.filedAt = new Date();
  }

  const updated = await prisma.filing.update({ where: { id: opts.filingId }, data });

  if (opts.to === "FILED") {
    // Formation is now registered.
    await prisma.formation.update({
      where: { id: filing.formationId },
      data: { status: "FILED", filedAt: new Date() },
    });
    // Set the established date (state filing date) if it hasn't been recorded yet.
    const creds = await prisma.credentials.findUnique({
      where: { formationId: filing.formationId },
    });
    if (!creds) {
      await prisma.credentials.create({
        data: { formationId: filing.formationId, establishedDate: new Date() },
      });
    } else if (!creds.establishedDate) {
      await prisma.credentials.update({
        where: { id: creds.id },
        data: { establishedDate: new Date() },
      });
    }
    // Notify the client.
    await maybeSendFilingFiled(filing.formationId, updated.confirmationNumber ?? null);
  }

  return updated;
}
