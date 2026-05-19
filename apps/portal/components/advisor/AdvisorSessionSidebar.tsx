"use client";

import { useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import type { AdvisorSession } from "@/lib/api/advisor";
import {
  useAdvisorSessions,
  useCreateAdvisorSession,
  useUpdateAdvisorSession,
  useDeleteAdvisorSession,
} from "@/hooks/useAdvisorSessions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  activeSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: (sessionId: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function SessionSkeleton() {
  return (
    <div className="space-y-1 px-2 py-1">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg px-2 py-2.5 space-y-1.5 animate-pulse">
          <div className="h-3 bg-muted rounded w-3/4" />
          <div className="h-2.5 bg-muted rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Session row
// ---------------------------------------------------------------------------

function SessionRow({
  session,
  isActive,
  onSelect,
  onRename,
  onArchive,
}: {
  session: AdvisorSession;
  isActive: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onArchive: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [titleInput, setTitleInput] = useState(session.title ?? "");

  const handleRenameSubmit = () => {
    if (titleInput.trim()) {
      onRename(titleInput.trim());
    }
    setRenaming(false);
    setMenuOpen(false);
  };

  return (
    <div
      className={`group relative rounded-lg px-2 py-2 cursor-pointer transition-colors ${
        isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted/50"
      }`}
      onClick={() => {
        if (!renaming) onSelect();
      }}
    >
      {renaming ? (
        <input
          autoFocus
          className="w-full text-sm bg-background border border-border rounded px-1.5 py-0.5 outline-none"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRenameSubmit();
            if (e.key === "Escape") {
              setRenaming(false);
              setMenuOpen(false);
            }
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <p className="text-sm font-medium leading-snug truncate pr-6">
          {session.title ?? `Chat on ${new Date(session.created_at).toLocaleDateString()}`}
        </p>
      )}
      <p className="text-[10px] text-muted-foreground mt-0.5">
        {relativeTime(session.updated_at ?? session.created_at)}
        {" · "}
        {session.message_count} {session.message_count === 1 ? "message" : "messages"}
      </p>

      {/* Context menu button */}
      {!renaming && (
        <button
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded transition-opacity ${
            menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          } hover:bg-muted text-muted-foreground`}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="8" cy="13" r="1.5" />
          </svg>
        </button>
      )}

      {/* Dropdown menu */}
      {menuOpen && !renaming && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-popover border border-border rounded-lg shadow-md py-1 min-w-[120px]">
            <button
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setRenaming(true);
                setMenuOpen(false);
              }}
            >
              Rename
            </button>
            <button
              className="w-full text-left px-3 py-1.5 text-xs text-destructive hover:bg-muted transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onArchive();
                setMenuOpen(false);
              }}
            >
              Archive
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AdvisorSessionSidebar({ activeSessionId, onSessionSelect, onNewChat }: Props) {
  const { data: sessionsData, isLoading } = useAdvisorSessions("active");
  const { data: archivedData } = useAdvisorSessions("archived");
  const createSession = useCreateAdvisorSession();
  const updateSession = useUpdateAdvisorSession();
  const deleteSession = useDeleteAdvisorSession();
  const [archivedOpen, setArchivedOpen] = useState(false);

  const handleNewChat = useCallback(async () => {
    const result = await createSession.mutateAsync();
    onNewChat(result.id);
  }, [createSession, onNewChat]);

  const handleRename = useCallback(
    (id: string, title: string) => {
      updateSession.mutate({ id, title });
    },
    [updateSession],
  );

  const handleArchive = useCallback(
    (id: string) => {
      deleteSession.mutate(id);
      // If archived session was active, clear it
      if (id === activeSessionId) {
        onNewChat("");
      }
    },
    [deleteSession, activeSessionId, onNewChat],
  );

  const sessions = sessionsData?.sessions ?? [];
  const archivedSessions = archivedData?.sessions ?? [];

  return (
    <aside className="flex flex-col h-full w-60 shrink-0 border-r border-border bg-background">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border">
        <button
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          onClick={handleNewChat}
          disabled={createSession.isPending}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 2v12M2 8h12" strokeLinecap="round" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Active sessions list */}
      <div className="flex-1 overflow-y-auto py-1">
        {isLoading ? (
          <SessionSkeleton />
        ) : sessions.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">No previous chats</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Start a conversation above</p>
          </div>
        ) : (
          <div className="px-2 space-y-0.5">
            {sessions.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                isActive={s.id === activeSessionId}
                onSelect={() => onSessionSelect(s.id)}
                onRename={(title) => handleRename(s.id, title)}
                onArchive={() => handleArchive(s.id)}
              />
            ))}
          </div>
        )}

        {/* Archived section */}
        {archivedSessions.length > 0 && (
          <div className="mt-2 px-2">
            <button
              className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setArchivedOpen((v) => !v)}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="currentColor"
                className={`transition-transform ${archivedOpen ? "rotate-90" : ""}`}
              >
                <path d="M3 2l4 3-4 3V2z" />
              </svg>
              Archived ({archivedSessions.length})
            </button>
            {archivedOpen && (
              <div className="mt-0.5 space-y-0.5">
                {archivedSessions.map((s) => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    isActive={s.id === activeSessionId}
                    onSelect={() => onSessionSelect(s.id)}
                    onRename={(title) => handleRename(s.id, title)}
                    onArchive={() => handleArchive(s.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
