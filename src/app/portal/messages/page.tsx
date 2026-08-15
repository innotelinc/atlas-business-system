import { requireUser } from "@/lib/auth";
import { MessagesPanel } from "@/components/portal/MessagesPanel";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const session = await requireUser();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-950">Messages</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ask our team anything about your formation, banking, or credit — we usually reply within
          one business day.
        </p>
      </div>
      <MessagesPanel userId={session.id} />
    </div>
  );
}
