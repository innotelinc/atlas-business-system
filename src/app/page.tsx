import Link from "next/link";
import {
  ArrowRight,
  Building2,
  HeartHandshake,
  Landmark,
  FileSignature,
  Search,
  CreditCard,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";

const formationTypes = [
  {
    icon: Building2,
    title: "LLC",
    subtitle: "Limited Liability Company",
    description:
      "The most popular choice for small businesses. Personal asset protection with flexible management and pass-through taxation.",
    popular: true,
  },
  {
    icon: Landmark,
    title: "For-Profit",
    subtitle: "C Corporation",
    description:
      "A traditional corporation with shareholders, directors, and officers. Ideal for raising capital, investors, and scaling.",
  },
  {
    icon: HeartHandshake,
    title: "Non-Profit",
    subtitle: "Non-Profit Corporation",
    description:
      "A tax-exempt organization for charitable, religious, or educational missions. Includes 501(c)(3) intent guidance.",
  },
];

const steps = [
  { n: "1", icon: Building2, title: "Pick a formation type", text: "LLC, for-profit corporation, or non-profit corporation." },
  { n: "2", icon: Landmark, title: "Pick your state", text: "All 50 states. See exact Secretary of State filing fees up front." },
  { n: "2a", icon: ShieldCheck, title: "Fees & savings", text: "State fees, our service fee, value-added services, and a retail price comparison so you know what you save." },
  { n: "3", icon: Search, title: "Name check", text: "Search your state's Secretary of State business database for duplicate or similar names before you file." },
  { n: "4", icon: FileSignature, title: "Build & sign your document", text: "Fill out your Articles of Organization or Incorporation, review, and sign — we generate the document for you." },
  { n: "5", icon: CreditCard, title: "Contract & payment", text: "Secure Stripe checkout with optional subscription services. Our analyst reviews your filing within 24 hours without slowing you down." },
  { n: "6", icon: LayoutDashboard, title: "Client portal", text: "Track credentials, your EIN, D&B registration, business banking, and credit-building checklist — all in one place." },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const [stateCount, services] = await Promise.all([
    prisma.state.count(),
    prisma.service.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-brand-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-gold-400 ring-1 ring-white/20">
              Business formation in all {stateCount} U.S. states
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Start your business the right way —{" "}
              <span className="text-gold-400">any state, any structure.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-300">
              Atlas Business System walks you through formation end to end: choose your entity, see
              real state filing fees, check your business name, build your incorporation document,
              and pay securely. Then keep running your business from your client portal.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/formation"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gold-400 px-6 text-base font-bold text-brand-950 transition hover:bg-gold-500"
              >
                Form your business <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/25 px-6 text-base font-semibold text-white transition hover:bg-white/10"
              >
                See how it works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Formation types */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-brand-950">
          Choose your business structure
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
          Three ways to form. Every option is available in all 50 states with the correct state
          filing documents and fees.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {formationTypes.map((t) => (
            <Card key={t.title} className="relative flex flex-col">
              {t.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-gold-400 px-3 py-0.5 text-xs font-bold text-brand-950">
                  Most popular
                </span>
              )}
              <t.icon className="h-9 w-9 text-brand-700" />
              <h3 className="mt-4 text-xl font-bold text-brand-950">{t.title}</h3>
              <p className="text-sm font-medium text-brand-600">{t.subtitle}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{t.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-brand-950">
            From idea to incorporation in six steps
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-950 text-sm font-bold text-gold-400">
                    {s.n}
                  </span>
                  <s.icon className="h-5 w-5 text-brand-700" />
                </div>
                <h3 className="mt-3 font-bold text-brand-950">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-brand-950">
          Value-added services
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
          Add what you need during checkout — or skip everything and pay only the state fee plus our
          flat formation fee.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.id} className="flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-brand-950">{s.name}</h3>
                <span className="text-sm font-bold text-brand-700">
                  ${(s.priceCents / 100).toFixed(2)}
                  {s.recurring ? <span className="text-xs font-medium text-slate-500"> / {s.interval}</span> : null}
                </span>
              </div>
              <p className="mt-2 flex-1 text-sm text-slate-600">{s.description}</p>
            </Card>
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Link
            href="/formation"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-950 px-8 text-base font-bold text-white transition hover:bg-brand-800"
          >
            Start formation <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
