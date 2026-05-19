"use client";

import { useState } from "react";
import { useMeetingTypes, useBookings } from "@/hooks/useMeetings";
import type { BookingStatus } from "@/lib/api/meetings";

const BOOKING_STYLE: Record<BookingStatus, string> = {
  confirmed:   "bg-teal-50 text-teal-700",
  cancelled:   "bg-red-50 text-red-600",
  rescheduled: "bg-amber-50 text-amber-700",
  completed:   "bg-slate-100 text-slate-500",
};

export default function MeetingsPage() {
  const [tab, setTab] = useState<"overview" | "types" | "bookings">("overview");
  const { data: meetingTypes = [], isLoading: typesLoading } = useMeetingTypes();
  const { data: bookings = [], isLoading: bookingsLoading } = useBookings();

  const isLoading = typesLoading || bookingsLoading;
  const upcomingCount = bookings.filter((b) => b.status === "confirmed").length;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meetings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Booking pages and scheduled meetings from your campaigns
            </p>
          </div>
          <button type="button" className="btn btn-primary shrink-0">
            + New Meeting Type
          </button>
        </div>

        {isLoading ? (
          <div className="card p-10 text-center">
            <p className="text-sm text-muted-foreground">Loadingâ€¦</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="card p-4 space-y-1">
                <p className="text-xs text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold text-foreground">{bookings.length}</p>
              </div>
              <div className="card p-4 space-y-1">
                <p className="text-xs text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold text-foreground">{upcomingCount}</p>
              </div>
              <div className="card p-4 space-y-1">
                <p className="text-xs text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold text-foreground">—</p>
              </div>
              <div className="card p-4 space-y-1">
                <p className="text-xs text-muted-foreground">Meeting Types</p>
                <p className="text-2xl font-bold text-foreground">{meetingTypes.length}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-border">
              {(["overview", "types", "bookings"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                    tab === t
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "types" ? "Meeting Types" : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Overview tab */}
            {tab === "overview" && (
              <div>
                {bookings.filter((b) => b.status === "confirmed").length === 0 ? (
                  <div className="card p-10 text-center">
                    <h2 className="text-lg font-semibold text-foreground mb-2">No upcoming bookings</h2>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Bookings will appear here once leads schedule meetings through your booking links.
                    </p>
                  </div>
                ) : (
                  <div className="card divide-y divide-border">
                    {bookings
                      .filter((b) => b.status === "confirmed")
                      .map((b) => (
                        <div key={b.id} className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {b.attendeeName ?? b.attendeeEmail}
                            </p>
                            <p className="text-xs text-muted-foreground">{b.attendeeEmail}</p>
                          </div>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${BOOKING_STYLE[b.status]}`}
                          >
                            {b.status}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Meeting Types tab */}
            {tab === "types" && (
              <div className="space-y-3">
                {meetingTypes.length === 0 ? (
                  <div className="card p-10 text-center">
                    <h2 className="text-lg font-semibold text-foreground mb-2">No meeting types yet</h2>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                      Create meeting types to generate booking links you can share with leads.
                    </p>
                    <button type="button" className="btn btn-secondary">
                      + Create Meeting Type
                    </button>
                  </div>
                ) : (
                  meetingTypes.map((mt) => (
                    <div key={mt.id} className="card p-4 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{mt.name}</p>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            {mt.durationMinutes} min
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{mt.slug}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" className="btn btn-ghost text-xs">Copy Link</button>
                        <button type="button" className="btn btn-ghost text-xs">Edit</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Bookings tab */}
            {tab === "bookings" && (
              <div className="card overflow-hidden">
                {bookings.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="text-sm text-muted-foreground">No bookings yet.</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Attendee</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">{b.attendeeName ?? b.attendeeEmail}</p>
                            <p className="text-xs text-muted-foreground">{b.attendeeEmail}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${BOOKING_STYLE[b.status]}`}
                            >
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
