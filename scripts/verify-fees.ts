// Applies the verified 50-state filing fee data (see prisma/seed-data/verified-states.ts)
// to the database: updates cents, document URLs, filing times, source notes, and flips
// `verified` to true. Run with `pnpm db:verify-fees`.
import { PrismaClient } from "@prisma/client";
import { VERIFIED_STATES, VERIFIED_DATE } from "../prisma/seed-data/verified-states";

const prisma = new PrismaClient();

const TYPES = ["LLC", "FOR_PROFIT", "NON_PROFIT"] as const;

async function main() {
  let updated = 0;
  for (const s of VERIFIED_STATES) {
    if (s.notes) {
      await prisma.state.update({
        where: { code: s.code },
        data: { notes: s.notes },
      });
    }
    for (const type of TYPES) {
      const fee = s.fees[type];
      await prisma.stateFee.upsert({
        where: { stateCode_type: { stateCode: s.code, type } },
        update: {
          stateFeeCents: fee.cents,
          documentUrl: fee.docUrl,
          filingTime: fee.time,
          verified: true,
          sourceNote: `${fee.note} — Verified ${VERIFIED_DATE} against official state source.`,
        },
        create: {
          stateCode: s.code,
          type,
          stateFeeCents: fee.cents,
          documentUrl: fee.docUrl,
          filingTime: fee.time,
          verified: true,
          sourceNote: `${fee.note} — Verified ${VERIFIED_DATE} against official state source.`,
        },
      });
      updated++;
    }
  }

  const total = await prisma.stateFee.count();
  const verifiedCount = await prisma.stateFee.count({ where: { verified: true } });
  console.log(`Applied verified fees for ${VERIFIED_STATES.length} states (${updated} fee rows).`);
  console.log(`StateFee rows: ${total} total, ${verifiedCount} verified.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
