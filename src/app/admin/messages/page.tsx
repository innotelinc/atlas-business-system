import { AdminMessagesPanel } from "@/components/admin/MessagesPanel";

export const dynamic = "force-dynamic";

export default function AdminMessagesPage() {
  return (
    <div className="space-y-6">
      <AdminMessagesPanel />
    </div>
  );
}
