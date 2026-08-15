import { Resend } from "resend";
import { prisma } from "./prisma";
import { usd, formatType } from "./format";

export type EmailType =
  | "payment_received"
  | "analyst_approved"
  | "ein_reminder"
  | "filing_filed"
  | "bank_status";

// Without RESEND_API_KEY, emails are logged to the console and recorded in the
// SentEmail table with status "logged" so the flow is testable in development.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.EMAIL_FROM ?? "Atlas Business System <no-reply@atlasbusiness.co>";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  type: EmailType;
  formationId?: string;
}): Promise<{ ok: boolean; status: string; error?: string }> {
  const { to, subject, html, type, formationId } = opts;

  if (!resend) {
    console.log(`[email:${type}] (dev, not sent) to=${to} subject="${subject}"`);
    await prisma.sentEmail.create({
      data: { to, subject, type, status: "logged", formationId: formationId ?? null },
    });
    return { ok: true, status: "logged" };
  }

  try {
    const { error } = await resend.emails.send({ from, to, subject, html });
    if (error) {
      await prisma.sentEmail.create({
        data: { to, subject, type, status: "failed", error: error.message, formationId: formationId ?? null },
      });
      console.error(`[email:${type}] failed to=${to}: ${error.message}`);
      return { ok: false, status: "failed", error: error.message };
    }
    await prisma.sentEmail.create({
      data: { to, subject, type, status: "sent", formationId: formationId ?? null },
    });
    return { ok: true, status: "sent" };
  } catch (e) {
    const message = (e as Error).message;
    await prisma.sentEmail.create({
      data: { to, subject, type, status: "failed", error: message, formationId: formationId ?? null },
    });
    console.error(`[email:${type}] exception to=${to}: ${message}`);
    return { ok: false, status: "failed", error: message };
  }
}

// ---- Templates ----

function shell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <div style="background:#0b1b3b;border-radius:12px 12px 0 0;padding:20px 28px;">
        <span style="color:#f5c542;font-weight:bold;font-size:18px;">▲ Atlas Business System</span>
      </div>
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:28px;">
        <h1 style="margin:0 0 16px;font-size:20px;color:#0b1b3b;">${title}</h1>
        ${body}
        <p style="margin-top:24px;font-size:12px;color:#94a3b8;">
          Atlas Business System · Business formation in all 50 U.S. states<br/>
          This is a transactional email from your Atlas Business System account.
        </p>
      </div>
    </div>
  </body>
</html>`;
}

export function paymentReceivedEmail(opts: {
  businessName: string;
  amountCents: number;
  stateName: string;
  type: string;
}): { subject: string; html: string } {
  const subject = `Payment received — ${opts.businessName} formation`;
  const html = shell(
    "Payment received — your formation is underway 🎉",
    `<p style="margin:0 0 12px;color:#334155;font-size:15px;line-height:1.6;">
       Thanks for forming <strong>${opts.businessName}</strong> (${formatType(opts.type)}) in
       <strong>${opts.stateName}</strong>.
     </p>
     <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;color:#334155;">
       <tr>
         <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;">Total paid</td>
         <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:bold;">${usd(opts.amountCents)}</td>
       </tr>
     </table>
     <p style="margin:0 0 12px;color:#334155;font-size:15px;line-height:1.6;">
       Our analyst reviews your filing within 24 hours — this never delays your formation. Next
       step: create your client portal to track your EIN, banking, and credit checklist.
     </p>
     <a href="${getAppUrl()}/portal" style="display:inline-block;background:#0b1b3b;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold;font-size:14px;">
       Open your client portal
     </a>`,
  );
  return { subject, html };
}

export function analystApprovedEmail(opts: {
  businessName: string;
  type: string;
  stateName: string;
}): { subject: string; html: string } {
  const subject = `Great news — ${opts.businessName} filing approved`;
  const html = shell(
    "Your analyst review is complete ✅",
    `<p style="margin:0 0 12px;color:#334155;font-size:15px;line-height:1.6;">
       Our analyst reviewed your <strong>${formatType(opts.type)}</strong> filing for
       <strong>${opts.businessName}</strong> in <strong>${opts.stateName}</strong> and
       <strong>approved it</strong>. Your documents are being prepared for submission to the
       Secretary of State.
     </p>
     <p style="margin:0 0 12px;color:#334155;font-size:15px;line-height:1.6;">
       While you wait, knock out your startup checklist — EIN, Dun &amp; Bradstreet, and business
       banking.
     </p>
     <a href="${getAppUrl()}/portal" style="display:inline-block;background:#0b1b3b;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold;font-size:14px;">
       Go to your portal
     </a>`,
  );
  return { subject, html };
}

export function filingFiledEmail(opts: {
  businessName: string;
  stateName: string;
  type: string;
  confirmationNumber: string | null;
}): { subject: string; html: string } {
  const subject = `🎉 ${opts.businessName} is officially registered in ${opts.stateName}`;
  const html = shell(
    "Your business is officially registered ✅",
    `<p style="margin:0 0 12px;color:#334155;font-size:15px;line-height:1.6;">
       Congratulations! Your <strong>${formatType(opts.type)}</strong>,
       <strong>${opts.businessName}</strong>, has been filed and approved by the
       <strong>${opts.stateName}</strong> Secretary of State.${opts.confirmationNumber ? ` Your confirmation number is <strong>${opts.confirmationNumber}</strong>.` : ""}
     </p>
     <p style="margin:0 0 12px;color:#334155;font-size:15px;line-height:1.6;">
       Your business is officially open — now knock out the startup checklist:
       EIN, Dun &amp; Bradstreet, business banking, and your first Net-30 accounts.
     </p>
     <a href="${getAppUrl()}/portal" style="display:inline-block;background:#0b1b3b;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold;font-size:14px;">
       Open your client portal
     </a>`,
  );
  return { subject, html };
}

const BANK_STATUS_CONTENT: Record<
  string,
  { title: string; subject: string; body: string }
> = {
  received: {
    title: "Your banking application was received ✅",
    subject: "Banking application received",
    body: `We received your business banking application for <strong>{business}</strong>. Our team will
       review it shortly — you'll get an update the moment it moves forward.`,
  },
  in_review: {
    title: "Your banking application is in review 🔍",
    subject: "Banking application in review",
    body: `Our team is reviewing your application for <strong>{business}</strong>. We'll let you know as
       soon as it's approved.`,
  },
  approved: {
    title: "Your banking application was approved 🎉",
    subject: "Banking application approved",
    body: `Great news — your application for <strong>{business}</strong> was approved. Our backend
       office is now setting up your account, and we'll reach out once it's ready.`,
  },
  rejected: {
    title: "Your banking application needs attention",
    subject: "Banking application needs attention",
    body: `We couldn't process your application for <strong>{business}</strong> as submitted. Log in to
       your portal and resubmit with corrected details — we'll pick it right back up.`,
  },
  completed: {
    title: "Your business bank account is ready 🎉",
    subject: "Your business bank account is set up",
    body: `Your business bank account for <strong>{business}</strong> has been set up. Check your
       portal for the details and next steps.`,
  },
};

export function bankStatusEmail(opts: {
  businessName: string;
  status: string;
}): { subject: string; html: string } {
  const content = BANK_STATUS_CONTENT[opts.status] ?? BANK_STATUS_CONTENT.received;
  const subject = `${content.subject} — ${opts.businessName}`;
  const html = shell(
    content.title,
    `<p style="margin:0 0 12px;color:#334155;font-size:15px;line-height:1.6;">
       ${content.body.replace("{business}", opts.businessName)}
     </p>
     <a href="${getAppUrl()}/portal/bank" style="display:inline-block;background:#0b1b3b;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold;font-size:14px;">
       View application status
     </a>`,
  );
  return { subject, html };
}

export function einReminderEmail(opts: { businessName: string }): { subject: string; html: string } {
  const subject = `Reminder: get your EIN for ${opts.businessName}`;
  const html = shell(
    "Your EIN is the key to everything 🔑",
    `<p style="margin:0 0 12px;color:#334155;font-size:15px;line-height:1.6;">
       Hi there! A quick reminder that <strong>${opts.businessName}</strong> still needs its
       Employer Identification Number (EIN). You'll need it to open a business bank account, apply
       for credit, and hire employees.
     </p>
     <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
       Getting it from the IRS is free and takes about 10 minutes.
     </p>
     <a href="https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online"
        style="display:inline-block;background:#0b1b3b;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold;font-size:14px;">
       Apply for your EIN on the IRS site
     </a>
     <p style="margin-top:16px;color:#334155;font-size:15px;line-height:1.6;">
       Record your EIN in your portal once you have it.
     </p>
     <a href="${getAppUrl()}/portal/checklist" style="color:#254fde;font-size:14px;">Open your checklist →</a>`,
  );
  return { subject, html };
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

// ---- Notification helpers ----

export async function maybeSendBankStatus(opts: {
  to: string;
  businessName: string;
  status: string;
  formationId?: string | null;
}) {
  const { subject, html } = bankStatusEmail({
    businessName: opts.businessName,
    status: opts.status,
  });
  return sendEmail({
    to: opts.to,
    subject,
    html,
    type: "bank_status",
    formationId: opts.formationId ?? undefined,
  });
}

// ---- Notification helpers (idempotent: send once per formation) ----

export async function maybeSendPaymentReceived(formationId: string) {
  const formation = await prisma.formation.findUnique({
    where: { id: formationId },
    include: { user: true, state: true },
  });
  if (!formation || formation.paymentStatus !== "paid" || formation.paymentEmailSent) return;
  if (!formation.user?.email) return; // no account yet — will be caught up on claim

  const { subject, html } = paymentReceivedEmail({
    businessName: formation.businessName ?? "your business",
    amountCents: formation.totalCents,
    stateName: formation.state?.name ?? "your state",
    type: formation.type,
  });
  await sendEmail({ to: formation.user.email, subject, html, type: "payment_received", formationId });
  await prisma.formation.update({ where: { id: formationId }, data: { paymentEmailSent: true } });
}

export async function maybeSendAnalystApproved(formationId: string) {
  const formation = await prisma.formation.findUnique({
    where: { id: formationId },
    include: { user: true, state: true },
  });
  if (!formation || formation.analystReview !== "APPROVED" || formation.analystEmailSent) return;
  if (!formation.user?.email) return; // no account yet — will be caught up on claim

  const { subject, html } = analystApprovedEmail({
    businessName: formation.businessName ?? "your business",
    type: formation.type,
    stateName: formation.state?.name ?? "your state",
  });
  await sendEmail({ to: formation.user.email, subject, html, type: "analyst_approved", formationId });
  await prisma.formation.update({ where: { id: formationId }, data: { analystEmailSent: true } });
}

export async function maybeSendFilingFiled(formationId: string, confirmationNumber: string | null) {
  const formation = await prisma.formation.findUnique({
    where: { id: formationId },
    include: { user: true, state: true },
  });
  if (!formation || !formation.user?.email) return; // no account yet — will be caught up on claim

  const { subject, html } = filingFiledEmail({
    businessName: formation.businessName ?? "your business",
    type: formation.type,
    stateName: formation.state?.name ?? "your state",
    confirmationNumber,
  });
  await sendEmail({ to: formation.user.email, subject, html, type: "filing_filed", formationId });
}
