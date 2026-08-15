// EIN reminder job — CLI entrypoint (also run in production by Vercel Cron via
// /api/cron/ein-reminders, see vercel.json):
//   pnpm cron:ein-reminders
//
// Emails clients whose formation is paid but who haven't recorded an EIN yet,
// at most once every 7 days per formation.

import { prisma } from "../src/lib/prisma";
import { runEinReminders } from "../src/lib/ein-reminders";

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

async function main() {
  await runEinReminders();
}
