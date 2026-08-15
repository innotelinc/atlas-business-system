import Link from "next/link";
import { Building2, DollarSign, FileCheck2, LayoutDashboard, ListChecks, Landmark, Mail, MessageSquare, ShieldCheck, Tags, FileText } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { LogoutButton } from "@/components/portal/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  const nav = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/formations", label: "Formations", icon: FileText },
    { href: "/admin/filings", label: "Filings", icon: FileCheck2 },
    { href: "/admin/bank-applications", label: "Bank applications", icon: Landmark },
    { href: "/admin/states", label: "States & fees", icon: Building2 },
    { href: "/admin/pricing", label: "Pricing & fees", icon: DollarSign },
    { href: "/admin/services", label: "Services", icon: Tags },
    { href: "/admin/checklist", label: "Checklist", icon: ListChecks },
    { href: "/admin/emails", label: "Email log", icon: Mail },
    { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-brand-950 text-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gold-400" />
            <span className="font-bold">Atlas Admin</span>
          </div>
          <LogoutButton />
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        <aside className="shrink-0 lg:w-52">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white hover:shadow-sm"
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
