// EIN reminder job — run daily via a scheduler (Vercel Cron, GitHub Actions, cron, etc.):
//   pnpm cron:ein-reminders
//
// Emails clients whose formation is paid but who haven't recorded an EIN yet,
// at most once every 7 days per formation.

import { prisma } from "../src/lib/prisma";
import { einReminderEmail, sendEmail } from "../src/lib/email";

const REMINDER_INTERVAL_DAYS = 7;
const cutoff = new Date(Date.now() - REMINDER_INTERVAL_DAYS * 24 * 60 * 60 * 1000);

async function main() {
  const formations = await prisma.formation.findMany({
    where: {
      paymentStatus: "paid",
      userId: { not: null },
      AND: [
        {
          // No EIN recorded: either no credentials row yet, or one with an empty EIN.
          OR: [{ credentials: { is: null } }, { credentials: { is: { OR: [{ ein: null }, { ein: "" }] } } }],
        },
        {
          // Respect the reminder interval.
          OR: [{ lastEinReminderAt: null }, { lastEinReminderAt: { lt: cutoff } }],
        },
      ],
    },
    include: { user: true },
  });

  let sent = 0;
  for (const f of formations) {
    if (!f.user?.email) continue;
    const { subject, html } = einReminderEmail({
      businessName: f.businessName ?? "your business",
    });
    const result = await sendEmail({
      to: f.user.email,
      subject,
      html,
      type: "ein_reminder",
      formationId: f.id,
    });
    if (result.ok) {
      await prisma.formation.update({
        where: { id: f.id },
        data: { einReminderCount: { increment: 1 }, lastEinReminderAt: new Date() },
      });
      sent += 1;
      console.log(`EIN reminder → ${f.user.email} (${f.businessName})`);
    } else {
      console.error(`EIN reminder failed for ${f.businessName}: ${result.error}`);
    }
  }

  console.log(`EIN reminder run complete: ${sent} sent, ${formations.length} eligible.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
