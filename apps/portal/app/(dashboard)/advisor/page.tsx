"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useBrainDocuments } from "@/hooks/useBrain";
import { useAdvisorChat } from "@/hooks/useAdvisor";
import { useAdvisorSession } from "@/hooks/useAdvisorSessions";
import { AdvisorSessionSidebar } from "@/components/advisor/AdvisorSessionSidebar";
import { ApiRequestError } from "@/lib/api/client";
import type { AdvisorAction } from "@/lib/api/advisor";
import { ActionCard } from "@/components/advisor/ActionCard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  action?: AdvisorAction;
  actionDone?: boolean;
}

// ---------------------------------------------------------------------------
// Suggested starter questions
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  "How should I position against competitors when pricing comes up?",
  "Write a cold email opener for my ideal customer",
  "What objections should I prepare for?",
  "Suggest a 5-step outreach sequence for my product",
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-end gap-2">
        <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-[11px] shrink-0">
          💡
        </div>
        <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
          <div className="flex gap-1 items-center h-4">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  onActionExecuted,
  onActionCancelled,
}: {
  msg: Message;
  onActionExecuted?: (result: string) => void;
  onActionCancelled?: () => void;
}) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex flex-col gap-1.5 ${isUser ? "items-end max-w-[65%]" : "items-start max-w-[80%]"}`}>
        {!isUser && (
          <div className="flex items-center gap-1.5 ml-0.5">
            <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-[10px]">
              💡
            </div>
            <span className="text-xs font-medium text-muted-foreground">AI Advisor</span>
          </div>
        )}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed break-words ${
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm whitespace-pre-wrap"
              : "bg-card border border-border text-foreground rounded-tl-sm"
          }`}
        >
          {isUser ? (
            msg.content
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                pre: ({ children }) => (
                  <pre className="mt-1 mb-2 p-3 rounded-lg bg-muted overflow-x-auto">{children}</pre>
                ),
                code: ({ className, children }) =>
                  className ? (
                    <code className={`font-mono text-xs ${className}`}>{children}</code>
                  ) : (
                    <code className="px-1 py-0.5 rounded bg-muted font-mono text-xs">{children}</code>
                  ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-border pl-3 my-2 text-muted-foreground italic">{children}</blockquote>
                ),
                h1: ({ children }) => <h1 className="text-base font-bold mb-1 mt-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold mb-1 mt-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-1">{children}</h3>,
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="underline text-primary hover:opacity-80">{children}</a>
                ),
              }}
            >
              {msg.content}
            </ReactMarkdown>
          )}
        </div>
        {/* Sources */}
        {!isUser && msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-wrap gap-1 ml-0.5">
            {msg.sources.map((src) => (
              <span
                key={src}
                className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground"
              >
                📄 {src}
              </span>
            ))}
          </div>
        )}
        {/* Action confirmation card */}
        {!isUser && msg.action && !msg.actionDone && onActionExecuted && onActionCancelled && (
          <ActionCard
            action={msg.action}
            onExecuted={onActionExecuted}
            onCancelled={onActionCancelled}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: docs, isLoading: docsLoading } = useBrainDocuments();
  const chat = useAdvisorChat();
  // Load session history when user switches sessions
  const {
    data: sessionData,
    isLoading: sessionLoading,
    isError: sessionLoadError,
  } = useAdvisorSession(sessionId);

  const hasBrain = (docs?.length ?? 0) > 0;

  // When sessionData loads after a session switch, populate messages
  useEffect(() => {
    if (!sessionData) return;
    const loaded: Message[] = (sessionData.messages ?? []).map((m) => ({
      role: m.role,
      content: m.content,
      sources: m.sources,
      action: m.action ?? undefined,
    }));
    setMessages(loaded);
  }, [sessionData?.id]); // only re-populate when session ID changes

  // If a session id can't be loaded (e.g. ephemeral/fallback session), keep UI usable.
  useEffect(() => {
    if (!sessionLoadError) return;
    setErrorMsg("This chat session could not be loaded from history. You can continue in a new chat.");
  }, [sessionLoadError]);

  // Dismiss action card and append a system note about the result
  const makeActionHandlers = useCallback(
    (msgIndex: number) => ({
      onActionExecuted: (result: string) => {
        setMessages((prev) =>
          prev.map((m, i) => (i === msgIndex ? { ...m, actionDone: true } : m)),
        );
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `✅ ${result}` },
        ]);
      },
      onActionCancelled: () => {
        setMessages((prev) =>
          prev.map((m, i) => (i === msgIndex ? { ...m, actionDone: true } : m)),
        );
      },
    }),
    [],
  );

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chat.isPending]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || chat.isPending) return;

      setInput("");
      setErrorMsg(null);
      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);

      try {
        const res = await chat.mutateAsync({ message: trimmed, session_id: sessionId });
        setSessionId(res.session_id);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: res.response,
            sources: res.sources,
            action: res.action ?? undefined,
          },
        ]);
      } catch (err: unknown) {
        const e = err as ApiRequestError;
        if (e?.status === 402) {
          setErrorMsg("Not enough credits. Please upgrade your plan to continue.");
        } else if (e?.status === 501) {
          setErrorMsg("AI Advisor is not enabled for this workspace.");
        } else {
          setErrorMsg(e?.message ?? "Something went wrong. Please try again.");
        }
        // Remove the optimistic user message on failure
        setMessages((prev) => prev.slice(0, -1));
      }

      // Restore focus to input
      textareaRef.current?.focus();
    },
    [chat, sessionId],
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const handleSessionSelect = useCallback((id: string) => {
    setSessionId(id);
    setMessages([]); // will repopulate via useAdvisorSession
    setErrorMsg(null);
    setSidebarOpen(false);
  }, []);

  const handleNewChat = useCallback((id: string) => {
    setSessionId(id || null);
    setMessages([]);
    setErrorMsg(null);
    setSidebarOpen(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (docsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="spinner" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Session sidebar — hidden on mobile unless open */}
      <div
        className={`fixed inset-y-0 left-0 z-30 md:relative md:z-auto transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <AdvisorSessionSidebar
          activeSessionId={sessionId}
          onSessionSelect={handleSessionSelect}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Chat column */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="px-4 md:px-6 py-4 border-b border-border flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile sidebar toggle */}
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sessions"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M2 4h14M2 9h14M2 14h14" strokeLinecap="round" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">AI Advisor</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ask anything about your sales strategy, objections, or outreach
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {hasBrain ? (
              <span className="badge badge-success text-xs">Brain ready</span>
            ) : (
              <Link href="/ai-brain" className="btn btn-sm btn-primary">
                Set Up AI Brain
              </Link>
            )}
          </div>
        </div>

        {/* Brain-not-set-up banner */}
        {!hasBrain && (
          <div className="mx-4 md:mx-6 mt-4 px-4 py-3 rounded-lg border border-border bg-muted/50 text-sm text-muted-foreground flex items-start gap-2 shrink-0">
            <span className="shrink-0">⚠️</span>
            <span>
              Your AI Brain has no knowledge yet — the Advisor will give generic answers.{" "}
              <Link href="/ai-brain" className="underline text-foreground font-medium">
                Set it up in 3 minutes
              </Link>{" "}
              for personalised advice.
            </span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-5">
          {sessionLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="space-y-3 w-full max-w-lg">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                    <div className={`rounded-2xl px-4 py-3 animate-pulse bg-muted ${i % 2 === 0 ? "w-2/3" : "w-3/4"}`}>
                      <div className="h-3 bg-muted-foreground/20 rounded w-full" />
                      <div className="h-3 bg-muted-foreground/20 rounded w-4/5 mt-1.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : messages.length === 0 ? (
            /* Empty state with suggestions */
            <div className="h-full flex flex-col items-center justify-center gap-6 text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">
                💡
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Ask your AI Advisor</h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Get personalised sales advice grounded in your AI Brain knowledge
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    disabled={chat.isPending}
                    className="text-left text-xs p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <MessageBubble
                  key={i}
                  msg={msg}
                  {...makeActionHandlers(i)}
                />
              ))}
              {chat.isPending && <TypingIndicator />}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Error banner */}
        {errorMsg && (
          <div className="mx-4 md:mx-6 mb-3 px-4 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-center justify-between gap-2 shrink-0">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* Input */}
        <div className="px-4 md:px-6 pb-6 shrink-0">
          <div className="flex items-end gap-2 bg-card border border-border rounded-xl p-3 focus-within:border-primary/60 transition-colors shadow-sm">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={chat.isPending}
              placeholder="Ask anything about your sales strategy…"
              className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50 max-h-32 overflow-y-auto"
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
            <button
              type="button"
              onClick={() => send(input)}
              disabled={!input.trim() || chat.isPending}
              className="btn btn-primary btn-sm shrink-0 self-end disabled:opacity-40"
              aria-label="Send message"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
