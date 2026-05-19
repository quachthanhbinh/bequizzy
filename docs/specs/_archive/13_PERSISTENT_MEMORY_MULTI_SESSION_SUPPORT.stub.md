# Spec: Persistent Conversation Memory and Multi-Session Support

## Problem Statement
The AI Advisor currently lacks the ability to:
1. Persist conversation context across sessions, leading to loss of valuable insights.
2. Support parallel processing of multiple conversations, limiting scalability and user experience.

These limitations hinder user productivity and the platform's ability to scale to 100 workspaces × 100k leads × 1M messages/month.

## Goals
1. Implement persistent conversation memory to store and retrieve context seamlessly.
2. Enable multi-session support with real-time updates and strict session isolation.

## Non-Goals
- Implementing advanced analytics on conversation history.
- Supporting non-SEA data privacy regulations.

## Functional Requirements
1. **Persistent Memory**:
   - Store conversation history in PostgreSQL JSONB.
   - Ensure data privacy and compliance with SEA regulations.
2. **Multi-Session Support**:
   - Allow parallel processing of multiple sessions.
   - Provide real-time updates to session context.
   - Ensure strict isolation between sessions.

## Non-Functional Requirements
- **Scalability**: Support 100 workspaces × 100k leads × 1M messages/month.
- **Performance**: Ensure Redis latency < 10ms for hot session data.
- **Security**: Enforce `workspace_id` and `user_id` scoping.

## Architecture Overview
### Persistent Memory
- **Storage**: PostgreSQL JSONB for conversation history.
- **Caching**: Redis for hot session data with a write-through strategy.

### Multi-Session Support
- **Real-Time Updates**: Redis streams for low-latency updates.
- **Session Metadata**: Add `session_name`, `status`, and `updated_at` fields to `ai_advisor_sessions`.

## Data Model Changes
Extend `ai_advisor_sessions` table:
```sql
ALTER TABLE ai_advisor_sessions
ADD COLUMN session_name TEXT,
ADD COLUMN status TEXT DEFAULT 'active',
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
```

## API Changes
1. **Create Session**:
   - Endpoint: `POST /api/advisor/sessions`
   - Request: `{ "workspace_id": "...", "user_id": "...", "session_name": "..." }`
   - Response: `{ "session_id": "..." }`
2. **Update Session Context**:
   - Endpoint: `PATCH /api/advisor/sessions/{session_id}`
   - Request: `{ "context": { ... } }`
   - Response: `{ "success": true }`
3. **List Sessions**:
   - Endpoint: `GET /api/advisor/sessions`
   - Response: `{ "sessions": [ ... ] }`

## Risks and Mitigations
1. **Redis Performance**:
   - Mitigation: Use clustering and proper configuration.
2. **Data Privacy**:
   - Mitigation: Enforce SEA regulations and validate `workspace_id`.

## Open Questions
1. Should we support session expiration policies?
2. How do we handle session conflicts in real-time updates?

---

**Next Steps**:
- Review and approve the spec.
- Plan implementation tasks.