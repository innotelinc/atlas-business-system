import { PrismaClient, FormationType, Role, ReviewStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { STATES } from "./seed-data/states";

const prisma = new PrismaClient();

const FORMATION_TYPES: FormationType[] = ["LLC", "FOR_PROFIT", "NON_PROFIT"];

async function main() {
  // ---- Pricing config (our service fee + retail comparison) ----
  await prisma.pricingConfig.upsert({
    where: { id: "single" },
    update: {},
    create: {
      id: "single",
      serviceFeeCents: 4900, // our $49 formation service fee
      competitorRetailCents: 19900, // typical online retail (e.g. $199 incl. state fee)
      competitorName: "leading online formation services (e.g., ZenBusiness, LegalZoom)",
    },
  });

  // ---- States + filing fees ----
  for (const s of STATES) {
    await prisma.state.upsert({
      where: { code: s.code },
      update: {
        name: s.name,
        sosSiteUrl: s.sos,
        nameSearchUrl: s.search,
        notes: s.notes,
      },
      create: {
        code: s.code,
        name: s.name,
        sosSiteUrl: s.sos,
        nameSearchUrl: s.search,
        notes: s.notes,
      },
    });
    for (const type of FORMATION_TYPES) {
      const fee = s.fees[type];
      // Never clobber rows that have been verified (see scripts/verify-fees.ts).
      const existing = await prisma.stateFee.findUnique({
        where: { stateCode_type: { stateCode: s.code, type } },
      });
      if (existing?.verified) continue;
      await prisma.stateFee.upsert({
        where: { stateCode_type: { stateCode: s.code, type } },
        update: {
          stateFeeCents: fee.cents,
          filingTime: fee.time,
          documentUrl: fee.docUrl,
          verified: false,
          sourceNote: "Best-effort starting value — verify against the state SOS fee schedule in the admin UI.",
        },
        create: {
          stateCode: s.code,
          type,
          stateFeeCents: fee.cents,
          filingTime: fee.time,
          documentUrl: fee.docUrl,
          verified: false,
          sourceNote: "Best-effort starting value — verify against the state SOS fee schedule in the admin UI.",
        },
      });
    }
  }
  console.log(`Seeded ${STATES.length} states with filing fees.`);

  // ---- Value-added services ----
  const services = [
    { key: "registered_agent", name: "Registered Agent Service", description: "We act as your registered agent in your formation state for a full year, receive service of process, and keep your address off public records.", priceCents: 9900, recurring: true, interval: "year", sortOrder: 1 },
    { key: "ein_filing", name: "EIN (Federal Tax ID) Filing", description: "We prepare and submit your IRS Form SS-4 and deliver your Employer Identification Number.", priceCents: 4900, recurring: false, interval: null, sortOrder: 2 },
    { key: "operating_agreement", name: "Operating Agreement / Bylaws", description: "A customized operating agreement (LLC) or corporate bylaws (corporation) drafted for your business.", priceCents: 2900, recurring: false, interval: null, sortOrder: 3 },
    { key: "dnb", name: "Dun & Bradstreet D-U-N-S Number", description: "We register your business with Dun & Bradstreet so you can start building business credit.", priceCents: 4900, recurring: false, interval: null, sortOrder: 4 },
    { key: "annual_report", name: "Annual Report Filing Service", description: "We track your state's annual report due date and file it for you every year.", priceCents: 4900, recurring: true, interval: "year", sortOrder: 5 },
    { key: "virtual_address", name: "Virtual Business Address", description: "A professional business mailing address for your LLC or corporation, with mail forwarding.", priceCents: 9900, recurring: true, interval: "year", sortOrder: 6 },
    { key: "website", name: "Business Website + Domain", description: "A simple, professional website and custom domain so your new business is online from day one.", priceCents: 14900, recurring: true, interval: "year", sortOrder: 7 },
  ] as const;

  for (const svc of services) {
    await prisma.service.upsert({
      where: { key: svc.key },
      update: { name: svc.name, description: svc.description, priceCents: svc.priceCents, recurring: svc.recurring, interval: svc.interval ?? null, sortOrder: svc.sortOrder, active: true },
      create: { key: svc.key, name: svc.name, description: svc.description, priceCents: svc.priceCents, recurring: svc.recurring, interval: svc.interval ?? null, sortOrder: svc.sortOrder, active: true },
    });
  }
  console.log(`Seeded ${services.length} services.`);

  // ---- Client portal checklists ----
  const checklistItems = [
    // Business startup checklist
    { section: "business", title: "Obtain your EIN (Employer Identification Number)", description: "Get your federal tax ID from the IRS. It's free and takes about 10 minutes online.", url: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online", urlLabel: "IRS EIN application", sortOrder: 1 },
    { section: "business", title: "Register with Dun & Bradstreet (D-U-N-S)", description: "Get a free D-U-N-S number to start building your business credit profile.", url: "https://www.dnb.com/duns-number/get-a-duns.html", urlLabel: "D&B D-U-N-S registration", sortOrder: 2 },
    { section: "business", title: "Open a business bank account", description: "Apply with our partner Relay for a business checking account — apply here and we'll forward your application to Relay for account setup.", url: "https://relayfi.com", urlLabel: "Relay — business banking", sortOrder: 3 },
    { section: "business", title: "Check state tax and permit requirements", description: "Register for state taxes and check for local licenses and permits your business may need.", url: "https://www.sba.gov/business-guide/launch-your-business/apply-licenses-permits", urlLabel: "SBA licenses & permits guide", sortOrder: 4 },
    { section: "business", title: "Get business insurance", description: "Protect your business with general liability or professional liability insurance.", url: "https://www.sba.gov/business-guide/manage-your-business/business-insurance", urlLabel: "SBA insurance guide", sortOrder: 5 },

    // Business credit checklist
    { section: "credit", title: "Uline", description: "Shipping, packaging & office supplies. Net-30 terms available for new businesses.", url: "https://www.uline.com", urlLabel: "uline.com", sortOrder: 1 },
    { section: "credit", title: "Grainger", description: "Industrial & MRO supplies. Business account with Net-30 terms.", url: "https://www.grainger.com", urlLabel: "grainger.com", sortOrder: 2 },
    { section: "credit", title: "Quill", description: "Office supplies with easy Net-30 business credit for new companies.", url: "https://www.quill.com", urlLabel: "quill.com", sortOrder: 3 },
    { section: "credit", title: "Summa Office Supplies", description: "Office supplies that report to business credit bureaus — a favorite starter trade line.", url: "https://www.summaofficesupplies.com", urlLabel: "summaofficesupplies.com", sortOrder: 4 },
    { section: "credit", title: "Home Depot Pro Business Account", description: "Home improvement & supplies with business credit terms.", url: "https://www.homedepot.com/c/Pro", urlLabel: "Home Depot Pro", sortOrder: 5 },
    { section: "credit", title: "Lowe's for Business", description: "Lowe's business account with Net-30 terms.", url: "https://www.lowes.com/l/business-accounts.html", urlLabel: "Lowe's for Business", sortOrder: 6 },
    { section: "credit", title: "Office Depot Business Credit", description: "Office supplies with business credit account.", url: "https://www.officedepot.com/business-credit", urlLabel: "Office Depot", sortOrder: 7 },
    { section: "credit", title: "Staples Business Advantage", description: "Business-to-business office supplies program.", url: "https://www.staplesadvantage.com", urlLabel: "Staples Advantage", sortOrder: 8 },
    { section: "credit", title: "Fastenal", description: "Industrial supplies with Net-30 terms for business accounts.", url: "https://www.fastenal.com", urlLabel: "fastenal.com", sortOrder: 9 },
    { section: "credit", title: "Ferguson", description: "Plumbing & HVAC supplies with business credit.", url: "https://www.ferguson.com", urlLabel: "ferguson.com", sortOrder: 10 },
  ];

  for (const item of checklistItems) {
    await prisma.checklistItem.upsert({
      where: { id: `seed-${item.section}-${item.sortOrder}` },
      update: { section: item.section, title: item.title, description: item.description, url: item.url, urlLabel: item.urlLabel, sortOrder: item.sortOrder, active: true },
      create: { id: `seed-${item.section}-${item.sortOrder}`, section: item.section, title: item.title, description: item.description, url: item.url, urlLabel: item.urlLabel, sortOrder: item.sortOrder, active: true },
    });
  }
  console.log(`Seeded ${checklistItems.length} checklist items.`);

  // ---- Admin user ----
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@atlasbusiness.co";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin1234!";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.ADMIN },
    create: { email: adminEmail, passwordHash: await bcrypt.hash(adminPassword, 10), name: "Atlas Admin", role: Role.ADMIN },
  });
  console.log(`Admin ready: ${adminEmail}`);

  // ---- Demo client + sample formation (so the portal and admin are explorable) ----
  const demoEmail = "demo@atlasbusiness.co";
  const demoPassword = "Demo1234!";
  const demoUser = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: { email: demoEmail, passwordHash: await bcrypt.hash(demoPassword, 10), name: "Demo Client" },
  });

  const existing = await prisma.formation.findFirst({ where: { userId: demoUser.id } });
  if (!existing) {
    const demoState = "DE";
    const stateFee = await prisma.stateFee.findUnique({ where: { stateCode_type: { stateCode: demoState, type: "LLC" } } });
    const ra = await prisma.service.findUnique({ where: { key: "registered_agent" } });
    const servicesTotal = ra ? ra.priceCents : 0;
    const serviceFee = 4900;
    const formation = await prisma.formation.create({
      data: {
        userId: demoUser.id,
        type: "LLC",
        stateCode: demoState,
        businessName: "Atlas Demo Ventures LLC",
        status: "PAID",
        paymentStatus: "paid",
        contractSignedAt: new Date(),
        signature: "Demo Client",
        analystReview: ReviewStatus.APPROVED,
        analystReviewedAt: new Date(),
        analystNotes: "Name check passed. Documents complete. Approved.",
        portalAccess: true,
        stateFeeCents: stateFee?.stateFeeCents ?? 9000,
        serviceFeeCents: serviceFee,
        totalCents: (stateFee?.stateFeeCents ?? 9000) + serviceFee + servicesTotal,
        nameCheck: { create: { sosSearched: true, claimedAvailable: true, checkedAt: new Date(), sosResults: "No conflicting names found in Delaware SOS database." } },
        document: {
          create: {
            data: {
              businessName: "Atlas Demo Ventures LLC",
              registeredAgent: { name: "Registered Agents Inc.", address: "8 The Green, Dover, DE 19901" },
              members: [{ name: "Demo Client", title: "Member/Manager" }],
              address: "100 Main Street, Suite 200, Dover, DE 19901",
              purpose: "General business purposes.",
              management: "Manager-managed",
            },
          },
        },
        credentials: {
          create: {
            ein: "12-3456789",
            establishedDate: new Date(),
            officers: [{ name: "Demo Client", title: "Member" }],
            address: "100 Main Street, Suite 200, Dover, DE 19901",
            phone: "(302) 555-0100",
            email: demoEmail,
            website: "https://atlasdemo.example",
          },
        },
        services: ra ? { create: [{ serviceId: ra.id, quantity: 1 }] } : undefined,
      },
    });

    // mark a couple checklist items complete for the demo
    const items = await prisma.checklistItem.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
    if (items[0]) {
      await prisma.checklistEntry.upsert({
        where: { formationId_itemId: { formationId: formation.id, itemId: items[0].id } },
        update: {},
        create: { formationId: formation.id, itemId: items[0].id, completed: true, completedAt: new Date(), value: "12-3456789" },
      });
    }
    console.log("Demo client + sample formation created.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
