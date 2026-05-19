"use client";

import { use, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useHarvesterSession, useCommitHarvesterSession, useResumeHarvesterSession, useDeleteHarvesterSession } from "@/hooks/useHarvester";
import {
  harvesterProbeTurnStream,
  harvesterSynthesizeStream,
  type SSEEvent,
  type HarvesterMessage,
} from "@/lib/api/harvester";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    draft: "bg-yellow-100 text-yellow-800",
    committed: "bg-blue-100 text-blue-800",
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default function HarvesterSessionPage({ params }: Props) {
  const { sessionId } = use(params);
  const router = useRouter();
  const { data: session, isLoading, refetch } = useHarvesterSession(sessionId);
  const commitSession = useCommitHarvesterSession();
  const resumeSession = useResumeHarvesterSession();
  const deleteSession = useDeleteHarvesterSession();

  // Chat state
  const [messages, setMessages] = useState<HarvesterMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [synthesizing, setSynthesizing] = useState(false);
  const [draftMarkdown, setDraftMarkdown] = useState<string | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const [synthCount, setSynthCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync from loaded session on first render
  const syncedRef = useRef(false);
  if (session && !syncedRef.current) {
    syncedRef.current = true;
    setMessages(session.messages ?? []);
    setDraftMarkdown(session.draft_markdown ?? null);
    setTurnCount(session.turn_count ?? 0);
    setSynthCount(session.synthesis_count ?? 0);
  }

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  // ── Send a probe turn ────────────────────────────────────────────────────

  async function sendTurn() {
    if (!input.trim() || streaming || !session) return;
    const userMessage = input.trim();
    setInput("");

    const turnId = crypto.randomUUID();
    const userMsg: HarvesterMessage = {
      role: "user",
      content: userMessage,
      turn_id: turnId,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);
    setStreamText("");
    scrollToBottom();

    let accumulated = "";
    try {
      for await (const event of harvesterProbeTurnStream(sessionId, {
        message: userMessage,
        turn_id: turnId,
      })) {
        handleSSEEvent(event, (text) => {
          accumulated += text;
          setStreamText(accumulated);
        });
        if (event.type === "done") {
          const doneData = event.data as { turn_count?: number };
          if (doneData.turn_count !== undefined) setTurnCount(doneData.turn_count);
        }
        if (event.type === "error") break;
      }
    } finally {
      setStreaming(false);
      if (accumulated) {
        const assistantMsg: HarvesterMessage = {
          role: "assistant",
          content: accumulated,
          turn_id: turnId,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
      setStreamText("");
      scrollToBottom();
    }
  }

  // ── Synthesize ───────────────────────────────────────────────────────────

  async function handleSynthesize() {
    if (synthesizing || !session) return;
    setSynthesizing(true);
    setDraftMarkdown("");

    let accumulated = "";
    try {
      for await (const event of harvesterSynthesizeStream(sessionId)) {
        handleSSEEvent(event, (text) => {
          accumulated += text;
          setDraftMarkdown(accumulated);
        });
        if (event.type === "done") {
          const doneData = event.data as { synthesis_count?: number; markdown?: string };
          if (doneData.synthesis_count !== undefined) setSynthCount(doneData.synthesis_count);
          if (doneData.markdown) setDraftMarkdown(doneData.markdown);
          // Refresh session data
          refetch();
        }
        if (event.type === "error") break;
      }
    } finally {
      setSynthesizing(false);
    }
  }

  // ── Commit ───────────────────────────────────────────────────────────────

  async function handleCommit() {
    if (!session) return;
    try {
      await commitSession.mutateAsync(sessionId);
      router.push("/ai-brain");
    } catch {
      // Errors handled by mutation
    }
  }

  // ── Resume ───────────────────────────────────────────────────────────────

  async function handleResume() {
    if (!session) return;
    await resumeSession.mutateAsync(sessionId);
    refetch();
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!confirm("Delete this harvester session? This cannot be undone.")) return;
    await deleteSession.mutateAsync(sessionId);
    router.push("/ai-brain");
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Session not found.</p>
      </div>
    );
  }

  const isActive = session.status === "active";
  const isDraft = session.status === "draft";
  const isCommitted = session.status === "committed";
  const canSynthesize = isActive && turnCount >= 3 && synthCount < 3;

  return (
    <div className="flex-1 flex overflow-hidden h-full">
      {/* ── Left pane: chat ── */}
      <div className="flex flex-col flex-1 min-w-0 border-r border-border">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => router.push("/ai-brain")}
              className="text-muted-foreground hover:text-foreground text-sm shrink-0"
              aria-label="Back to AI Brain"
            >
              ← Back
            </button>
            <span className="text-sm font-medium text-foreground truncate">{session.topic}</span>
            <StatusBadge status={session.status} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">{turnCount}/30 turns</span>
            {isActive && (
              <button
                type="button"
                onClick={handleSynthesize}
                disabled={synthesizing || !canSynthesize}
                className="btn btn-secondary text-xs px-3 py-1 disabled:opacity-40"
                title={!canSynthesize ? "Chat more before synthesizing (min 3 turns)" : ""}
              >
                {synthesizing ? "Synthesizing..." : "Synthesize"}
              </button>
            )}
            {isDraft && (
              <button
                type="button"
                onClick={handleResume}
                disabled={resumeSession.isPending}
                className="btn btn-secondary text-xs px-3 py-1"
              >
                Keep chatting
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteSession.isPending}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              <p className="font-medium">Start sharing knowledge</p>
              <p className="mt-1">
                Tell me anything about <strong>{session.topic}</strong> and I&apos;ll ask
                follow-up questions to capture the details.
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={`${msg.turn_id}-${i}`}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {/* Streaming assistant message */}
          {streaming && streamText && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm bg-muted text-foreground">
                <p className="whitespace-pre-wrap">{streamText}</p>
                <span className="inline-block w-1.5 h-4 bg-current animate-pulse ml-0.5 align-middle" />
              </div>
            </div>
          )}
          {streaming && !streamText && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm bg-muted text-muted-foreground">
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {isActive && (
          <div className="px-4 py-3 border-t border-border shrink-0">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendTurn();
                  }
                }}
                placeholder="Share your knowledge..."
                disabled={streaming}
                rows={2}
                className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
              <button
                type="button"
                onClick={sendTurn}
                disabled={!input.trim() || streaming}
                className="btn btn-primary px-4 self-end disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* Committed state footer */}
        {isCommitted && (
          <div className="px-4 py-3 border-t border-border shrink-0 text-center">
            <p className="text-xs text-muted-foreground">
              This session has been committed to the AI Brain.{" "}
              <button
                type="button"
                onClick={() => router.push("/ai-brain")}
                className="underline hover:text-foreground"
              >
                View documents
              </button>
            </p>
          </div>
        )}
      </div>

      {/* ── Right pane: draft ── */}
      <div className="flex flex-col w-[420px] shrink-0 min-w-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h2 className="text-sm font-semibold text-foreground">Draft Knowledge</h2>
          <div className="flex items-center gap-2">
            {isDraft && draftMarkdown && (
              <>
                <span className="text-xs text-muted-foreground">v{session.draft_version}</span>
                <button
                  type="button"
                  onClick={handleCommit}
                  disabled={commitSession.isPending}
                  className="btn btn-primary text-xs px-3 py-1 disabled:opacity-40"
                >
                  {commitSession.isPending ? "Committing..." : "Commit to AI Brain"}
                </button>
              </>
            )}
            {isActive && (
              <span className="text-xs text-muted-foreground">
                {synthCount}/3 syntheses used
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {synthesizing && !draftMarkdown && (
            <div className="text-center text-sm text-muted-foreground py-8">
              <p>Generating knowledge draft...</p>
            </div>
          )}
          {draftMarkdown ? (
            <div className="prose prose-sm max-w-none text-foreground">
              <pre className="whitespace-pre-wrap text-sm font-sans">{draftMarkdown}</pre>
            </div>
          ) : (
            !synthesizing && (
              <div className="text-center text-sm text-muted-foreground py-8">
                <p>No draft yet.</p>
                {isActive && (
                  <p className="mt-1">
                    Chat for at least 3 turns, then hit <strong>Synthesize</strong>.
                  </p>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SSE event handler helper
// ---------------------------------------------------------------------------

function handleSSEEvent(event: SSEEvent, onDelta: (text: string) => void): void {
  if (event.type === "delta") {
    const delta = event.data as { text: string };
    onDelta(delta.text ?? "");
  }
}
