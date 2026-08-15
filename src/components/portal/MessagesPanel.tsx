"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, Send } from "lucide-react";
import { Badge, Button, Card, Input, Label, Textarea, Spinner } from "@/components/ui";

type Message = {
  id: string;
  subject: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  senderId: string;
  recipientId: string | null;
  sender: { id: string; name: string | null; email: string; role: string };
  formation?: { id: string; businessName: string | null } | null;
};

export function MessagesPanel({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/portal/messages");
    const json = await res.json();
    setMessages(json.messages);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (m: Message) => {
    if (!m.readAt && m.recipientId === userId) {
      await fetch(`/api/portal/messages/${m.id}/read`, { method: "POST" });
      await load();
    }
  };

  const compose = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSent(false);
    try {
      const res = await fetch("/api/portal/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not send message");
      setSubject("");
      setBody("");
      setSent(true);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const unread = (messages ?? []).filter((m) => m.recipientId === userId && !m.readAt).length;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Inbox / sent */}
      <Card className="lg:col-span-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand-900">Messages</h2>
          {unread > 0 && <Badge tone="blue">{unread} unread</Badge>}
        </div>
        {!messages ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No messages yet. Send us a note below and we&apos;ll get back to you.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {messages.map((m) => {
              const inbound = m.recipientId === userId;
              const unreadMsg = inbound && !m.readAt;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setOpenId(openId === m.id ? null : m.id);
                    markRead(m);
                  }}
                  className={`block w-full rounded-xl border p-4 text-left transition ${
                    unreadMsg
                      ? "border-brand-200 bg-brand-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-brand-950">
                      {inbound ? "Atlas support" : "You"} — {m.subject}
                    </p>
                    <span className="shrink-0 text-xs text-slate-400">
                      {new Date(m.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">{m.body}</p>
                  {unreadMsg && <span className="mt-2 block"><Badge tone="blue">New</Badge></span>}
                  {openId === m.id && (
                    <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm whitespace-pre-wrap text-slate-700">
                      {m.body}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Compose */}
      <Card className="lg:col-span-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-900">
          Send a message to Atlas
        </h2>
        <form onSubmit={compose} className="mt-4 space-y-4">
          <div>
            <Label>Subject *</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Question about my EIN"
              required
              maxLength={120}
            />
          </div>
          <div>
            <Label>Message *</Label>
            <Textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="How can we help?"
              required
            />
          </div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          {sent && (
            <p className="text-sm font-medium text-emerald-700">
              Message sent — we&apos;ll reply here and by email.
            </p>
          )}
          <Button type="submit" loading={busy} className="w-full">
            <Send className="h-4 w-4" /> Send message
          </Button>
        </form>
      </Card>
    </div>
  );
}
