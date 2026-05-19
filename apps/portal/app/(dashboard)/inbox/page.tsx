"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useThreads,
  useMessages,
  useSendMessage,
  useGenerateDraft,
  useMarkRead,
  type InboxThread,
} from "@/hooks/useInbox";
import type { IntentClass } from "@/lib/api/inbox";

const INTENT_STYLE: Record<IntentClass | "unclassified", { label: string; cls: string }> = {
  interested:      { label: "Interested",      cls: "bg-teal-50 text-teal-700" },
  not_interested:  { label: "Not Interested",  cls: "bg-red-50 text-red-600" },
  out_of_office:   { label: "Out of Office",   cls: "bg-slate-100 text-slate-500" },
  question:        { label: "Question",        cls: "bg-blue-50 text-blue-600" },
  meeting_request: { label: "Meeting Request", cls: "bg-purple-50 text-purple-700" },
  unclassified:    { label: "Unclassified",    cls: "bg-slate-100 text-slate-400" },
};

const INTENT_FILTERS = ["all", "interested", "question", "meeting_request", "out_of_office", "not_interested"] as const;

function intentLabel(intent: string): string {
  return INTENT_STYLE[intent as IntentClass]?.label ?? intent;
}
function intentCls(intent: string): string {
  return INTENT_STYLE[intent as IntentClass]?.cls ?? "bg-slate-100 text-slate-400";
}

export default function InboxPage() {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [intentFilter, setIntentFilter] = useState<string>("all");
  const [reply, setReply] = useState("");
  const [aiDraftText, setAiDraftText] = useState<string | null>(null);

  const { data: threads, isLoading } = useThreads();
  const { data: messages, isLoading: msgLoading } = useMessages(activeThreadId);
  const sendMessage = useSendMessage();
  const generateDraft = useGenerateDraft();
  const markRead = useMarkRead();

  const allThreads = useMemo<InboxThread[]>(() => threads ?? [], [threads]);
  const visible = intentFilter === "all"
    ? allThreads
    : allThreads.filter((t) => t.intent_class === intentFilter);

  const thread = allThreads.find((t) => t.id === activeThreadId) ?? null;
  const unreadCount = allThreads.filter((t) => !t.is_read).length;

  // Auto-select first thread
  useEffect(() => {
    if (!activeThreadId && allThreads.length > 0) {
      setActiveThreadId(allThreads[0].id);
    }
  }, [allThreads, activeThreadId]);

  // Mark thread read when selected
  useEffect(() => {
    if (thread && !thread.is_read) {
      markRead.mutate({ threadId: thread.id, isRead: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.id]);

  function handleSend() {
    if (!activeThreadId || !reply.trim()) return;
    sendMessage.mutate(
      { threadId: activeThreadId, body: reply },
      { onSuccess: () => setReply("") }
    );
  }

  function handleAIDraft() {
    if (!activeThreadId) return;
    generateDraft.mutate(activeThreadId, {
      onSuccess: (draft) => setAiDraftText(draft.draft_body),
    });
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-14 border-b border-border shrink-0">
        <div>
          <h1 className="text-base font-bold text-foreground">Unified Inbox</h1>
          <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
        </div>
        <div className="flex gap-2">
          {INTENT_FILTERS.map((i) => (
            <button key={i} onClick={() => setIntentFilter(i)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg capitalize transition-colors hidden sm:inline-flex ${intentFilter === i ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
              {i === "all" ? "All" : intentLabel(i)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Thread list */}
        <div className="w-72 border-r border-border overflow-y-auto shrink-0">
          {isLoading && (
            <div className="p-4 text-xs text-muted-foreground">Loading…</div>
          )}
          {!isLoading && visible.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            </div>
          )}
          {visible.map((t) => (
            <button key={t.id} onClick={() => setActiveThreadId(t.id)}
              className={`w-full text-left p-4 border-b border-border transition-colors hover:bg-secondary/50 ${activeThreadId === t.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  {!t.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                  <span className={`text-sm font-medium truncate ${!t.is_read ? "text-foreground" : "text-muted-foreground"}`}>{t.from_email}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {t.last_message_at ? new Date(t.last_message_at).toLocaleDateString() : ""}
                </span>
              </div>
              <p className={`text-xs truncate ${!t.is_read ? "text-foreground" : "text-muted-foreground"}`}>{t.subject}</p>
              {t.intent_class && (
                <span className={`inline-flex mt-1.5 items-center px-1.5 py-0.5 rounded text-xs font-medium ${intentCls(t.intent_class)}`}>
                  {intentLabel(t.intent_class)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Thread detail */}
        {thread ? (
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-border shrink-0">
              <div>
                <p className="text-sm font-semibold text-foreground">{thread.subject}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-muted-foreground">{thread.from_email}</p>
                  {thread.intent_class && (
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${intentCls(thread.intent_class)}`}>
                      {intentLabel(thread.intent_class)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="btn btn-outline btn-sm">Archive</button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {msgLoading && <p className="text-xs text-muted-foreground">Loading messages…</p>}
              {!msgLoading && (messages ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">No messages in this thread.</p>
              )}
              {(messages ?? []).map((msg) => (
                <div key={msg.id} className={`flex ${msg.direction === "inbound" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-lg rounded-xl px-4 py-3 text-sm ${msg.direction === "inbound" ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground"}`}>
                    <p className="whitespace-pre-wrap">{msg.body}</p>
                    <p className={`text-xs mt-2 ${msg.direction === "inbound" ? "text-muted-foreground" : "text-primary-foreground/70"}`}>
                      {msg.sent_at ? new Date(msg.sent_at).toLocaleString() : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply composer */}
            <div className="border-t border-border p-4 shrink-0 space-y-3">
              {aiDraftText && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <p className="text-xs font-medium text-primary mb-1">AI Draft (1 credit used)</p>
                  <p className="text-xs text-foreground whitespace-pre-wrap">{aiDraftText}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => { setReply(aiDraftText); setAiDraftText(null); }} className="btn btn-primary btn-sm">Use draft</button>
                    <button onClick={() => setAiDraftText(null)} className="btn btn-outline btn-sm">Dismiss</button>
                  </div>
                </div>
              )}
              <textarea rows={3}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Type your reply…"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <button onClick={handleAIDraft} disabled={generateDraft.isPending}
                  className="btn btn-outline btn-sm gap-1.5">
                  {generateDraft.isPending ? (
                    <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  ) : (
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
                  )}
                  AI Draft (1 credit)
                </button>
                <button
                  disabled={!reply.trim() || sendMessage.isPending}
                  onClick={handleSend}
                  className="btn btn-primary btn-sm gap-1.5">
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                  {sendMessage.isPending ? "Sending…" : "Send Reply"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              {isLoading ? "Loading…" : "Select a thread to view"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
