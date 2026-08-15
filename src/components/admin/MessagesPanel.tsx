"use client";

import { useCallback, useEffect, useState } from "react";
import { Reply } from "lucide-react";
import { Badge, Button, Card, Spinner, Textarea } from "@/components/ui";

type Message = {
  id: string;
  subject: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  senderId: string;
  recipientId: string | null;
  sender: { id: string; name: string | null; email: string; role: string };
  recipient: { id: string; name: string | null; email: string; role: string } | null;
  formation?: { id: string; businessName: string | null } | null;
};

export function AdminMessagesPanel() {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/messages");
    const json = await res.json();
    setMessages(json.messages);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (m: Message) => {
    if (!m.readAt && !m.recipientId) {
      await fetch(`/api/admin/messages/${m.id}/read`, { method: "POST" });
      await load();
    }
  };

  const reply = async (m: Message) => {
    if (!replyText.trim()) return;
    setBusyId(m.id);
    setError(null);
    setSentId(null);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inReplyTo: m.id, body: replyText }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not send reply");
      setReplyText("");
      setSentId(m.id);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const inbox = (messages ?? []).filter((m) => !m.recipientId);
  const outbox = (messages ?? []).filter((m) => m.recipientId);
  const unread = inbox.filter((m) => !m.readAt).length;

  const renderMessage = (m: Message) => {
    const inbound = !m.recipientId;
    const unreadMsg = inbound && !m.readAt;
    const client = inbound ? m.sender : m.recipient;
    return (
      <Card key={m.id} className={unreadMsg ? "border-brand-300 bg-brand-50/40" : ""}>
        <button
          onClick={() => {
            setOpenId(openId === m.id ? null : m.id);
            markRead(m);
          }}
          className="block w-full text-left"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-brand-950">
              {client?.name ?? client?.email ?? "Unknown"} — {m.subject}
              {unreadMsg && <span className="ml-2"><Badge tone="blue">New</Badge></span>}
            </p>
            <span className="text-xs text-slate-400">{new Date(m.createdAt).toLocaleString()}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {inbound ? "→ Atlas inbox" : `→ ${m.recipient?.email ?? ""}`}
            {m.formation?.businessName ? ` · ${m.formation.businessName}` : ""}
          </p>
        </button>
        {openId === m.id && (
          <div className="mt-3">
            <div className="rounded-lg bg-slate-50 p-3 text-sm whitespace-pre-wrap text-slate-700">
              {m.body}
            </div>
            {inbound && (
              <div className="mt-3">
                <Textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${client?.name ?? client?.email ?? "client"}…`}
                />
                <div className="mt-2 flex items-center gap-3">
                  <Button
                    onClick={() => reply(m)}
                    loading={busyId === m.id}
                    disabled={!replyText.trim()}
                  >
                    <Reply className="h-4 w-4" /> Send reply
                  </Button>
                  {sentId === m.id && (
                    <span className="text-xs font-medium text-emerald-700">
                      Reply sent — client notified by email.
                    </span>
                  )}
                </div>
              </div>
            )}
            {!inbound && <p className="mt-2 text-xs text-slate-500">This is a reply you sent.</p>}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-brand-950">Messages</h1>
        {unread > 0 && <Badge tone="blue">{unread} unread in inbox</Badge>}
      </div>
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      {!messages ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : messages.length === 0 ? (
        <Card>
          <p className="py-10 text-center text-sm text-slate-500">
            No messages yet. Client messages appear here and you can reply inline.
          </p>
        </Card>
      ) : (
        <>
          {inbox.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                Inbox ({inbox.length})
              </h2>
              <div className="space-y-3">{inbox.map(renderMessage)}</div>
            </div>
          )}
          {outbox.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                Sent ({outbox.length})
              </h2>
              <div className="space-y-3">{outbox.map(renderMessage)}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
