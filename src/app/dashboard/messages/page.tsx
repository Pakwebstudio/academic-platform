"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { SkeletonBar } from "@/components/ui/feedback";

type Conversation = {
  id: string;
  otherUser: { id: string; name: string; avatarUrl: string | null } | null;
  lastMessage: { content: string; createdAt: string } | null;
};

type MessageItem = {
  id: string; senderId: string; content: string; createdAt: string;
};

type MessageDetail = {
  id: string;
  members: { user: { id: string; name: string; avatarUrl: string | null } }[];
  messages: MessageItem[];
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MessageDetail | null>(null);
  const [text, setText] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setMyId(d.user?.id));
    fetch("/api/messages")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setConversations(d.data.conversations);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    fetch(`/api/messages/${activeId}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled && d.success) setDetail(d.data.conversation); })
      .catch(() => { if (!cancelled) setDetail(null); });
    return () => { cancelled = true; };
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail?.messages.length]);

  const send = async () => {
    if (!text.trim() || !activeId) return;
    await fetch(`/api/messages/${activeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    setText("");
    const res = await fetch(`/api/messages/${activeId}`);
    const d = await res.json();
    if (d.success) setDetail(d.data.conversation);
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="text-sm text-slate-500 mt-1">Communicate with researchers and collaborators</p>
      </div>

      {loading ? (
        <SkeletonBar className="h-96 w-full" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Conversation list */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-card overflow-hidden">
            <div className="p-3 border-b border-slate-100 text-sm font-medium text-slate-700">Conversations</div>
            {conversations.length === 0 ? (
              <p className="p-6 text-sm text-slate-500 text-center">No conversations yet.</p>
            ) : (
              <div className="max-h-[70vh] overflow-y-auto">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setActiveId(c.id); setDetail(null); }}
                    className={`w-full flex items-center gap-3 p-3 text-left border-b border-slate-50 hover:bg-slate-50 transition ${
                      activeId === c.id ? "bg-indigo-50" : ""
                    }`}
                  >
                    <Avatar name={c.otherUser?.name || "?"} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{c.otherUser?.name || "Unknown"}</p>
                      {c.lastMessage && (
                        <p className="text-xs text-slate-500 truncate">{c.lastMessage.content}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Thread */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-card flex flex-col h-[70vh]">
            {!detail ? (
              <div className="flex items-center justify-center h-full text-sm text-slate-400">
                Select a conversation to read messages
              </div>
            ) : (
              <>
                <div className="p-3 border-b border-slate-100 font-medium text-slate-900">
                  {detail.members.find((m) => m.user.id !== myId)?.user.name || "Conversation"}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {detail.messages.map((m) => {
                    const mine = m.senderId === myId;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                          mine ? "bg-primary text-white rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm"
                        }`}>
                          {m.content}
                          <div className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-slate-400"}`}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
                <div className="p-3 border-t border-slate-100 flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                  />
                  <Button onClick={send}>Send</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
