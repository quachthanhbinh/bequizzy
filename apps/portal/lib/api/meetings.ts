/**
 * Meetings API client — wraps booking-service endpoints via api-gateway.
 */

import { apiFetch, getAuthContext } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MeetingType {
  id: string;
  name: string;
  slug: string;
  durationMinutes: number;
}

export type BookingStatus = "confirmed" | "cancelled" | "rescheduled" | "completed";

export interface Booking {
  id: string;
  attendeeEmail: string;
  attendeeName: string | null;
  meetingTypeId: string | null;
  status: BookingStatus;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapMeetingType(raw: Record<string, unknown>): MeetingType {
  return {
    id: raw.id as string,
    name: raw.name as string,
    slug: raw.slug as string,
    durationMinutes: (raw.duration_minutes as number) ?? 30,
  };
}

function mapBooking(raw: Record<string, unknown>): Booking {
  return {
    id: raw.id as string,
    attendeeEmail: raw.attendee_email as string,
    attendeeName: (raw.attendee_name as string | null) ?? null,
    meetingTypeId: (raw.meeting_type_id as string | null) ?? null,
    status: (raw.status as BookingStatus) ?? "confirmed",
  };
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function fetchMeetingTypes(
  opts?: { workspaceId?: string; accessToken?: string },
): Promise<MeetingType[]> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  const raw = await apiFetch<Record<string, unknown>[]>("/v1/meeting-types", {
    workspaceId,
    accessToken,
  });
  return raw.map(mapMeetingType);
}

export async function fetchBookings(
  opts?: { workspaceId?: string; accessToken?: string; page?: number },
): Promise<Booking[]> {
  const auth = getAuthContext();
  const workspaceId = opts?.workspaceId ?? auth.workspaceId ?? "";
  const accessToken = opts?.accessToken ?? auth.accessToken ?? undefined;

  const qp = new URLSearchParams();
  if (opts?.page) qp.set("page", String(opts.page));

  const raw = await apiFetch<Record<string, unknown>[]>(
    `/v1/bookings${qp.toString() ? `?${qp}` : ""}`,
    { workspaceId, accessToken },
  );
  return raw.map(mapBooking);
}
