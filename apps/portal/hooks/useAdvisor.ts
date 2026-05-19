"use client";

/**
 * TanStack Query hook for AI Advisor chat.
 */

import { useMutation } from "@tanstack/react-query";
import {
  sendAdvisorMessage,
  type AdvisorChatInput,
  type AdvisorChatResponse,
} from "@/lib/api/advisor";

export function useAdvisorChat() {
  return useMutation<AdvisorChatResponse, Error, AdvisorChatInput>({
    mutationFn: (input: AdvisorChatInput) => sendAdvisorMessage(input),
  });
}
