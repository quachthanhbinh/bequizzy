"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { fetchMeetingTypes, fetchBookings } from "@/lib/api/meetings";

export type { MeetingType, Booking, BookingStatus } from "@/lib/api/meetings";

export const MEETINGS_QUERY_KEY = "meetings";

export function useMeetingTypes() {
  const { isLoading: authLoading, user } = useAuth();
  return useQuery({
    queryKey: [MEETINGS_QUERY_KEY, "types"],
    queryFn: () => fetchMeetingTypes(),
    enabled: !authLoading && !!user,
  });
}

export function useBookings() {
  const { isLoading: authLoading, user } = useAuth();
  return useQuery({
    queryKey: [MEETINGS_QUERY_KEY, "bookings"],
    queryFn: () => fetchBookings(),
    enabled: !authLoading && !!user,
  });
}
