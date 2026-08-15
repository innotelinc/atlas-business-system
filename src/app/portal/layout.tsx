import Link from "next/link";
import { LayoutDashboard, KeyRound, ListChecks, CreditCard, Landmark, MessageSquare } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateShort, formatType } from "@/lib/format";
import { Badge } from "@/components/ui";
import { LogoutButton } from "@/components/portal/LogoutButton";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();
  const formation = await prisma.formation.findFirst({
    where: { userId: session.id, archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: { credentials: true, state: true },
  });

  const businessName = formation?.businessName ?? "Your business";
  const establishedDate = formation?.credentials?.establishedDate ?? formation?.createdAt ?? null;

  const nav = [
    { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
    { href: "/portal/credentials", label: "Credentials", icon: KeyRound },
    { href: "/portal/checklist", label: "Business checklist", icon: ListChecks },
    { href: "/portal/credit", label: "Business credit", icon: CreditCard },
    { href: "/portal/bank", label: "Business banking", icon: Landmark },
    { href: "/portal/messages", label: "Messages", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header — business name + established date top left */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-950 text-sm font-bold text-gold-400">
              A
            </Link>
            <div className="leading-tight">
              <p className="text-base font-bold text-brand-950">{businessName}</p>
              <p className="text-xs text-slate-500">
                {formation ? `${formatType(formation.type)} · ${formation.state?.code ?? ""}` : ""}
                {establishedDate ? ` · Established ${formatDateShort(establishedDate)}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {formation && (
              <>
                {formation.analystReview === "APPROVED" ? (
                  <Badge tone="green">Analyst approved</Badge>
                ) : formation.analystReview === "REJECTED" ? (
                  <Badge tone="red">Needs attention</Badge>
                ) : (
                  <Badge tone="amber">Analyst review pending (24h)</Badge>
                )}
              </>
            )}
            <span className="hidden text-sm text-slate-600 sm:block">{session.name ?? session.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        {/* Sidebar */}
        <aside className="shrink-0 lg:w-56">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-1">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-brand-800 hover:shadow-sm"
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
