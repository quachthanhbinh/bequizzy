"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  fetchIntegrations,
  connectIntegration,
  connectIntegrationWithCredentials,
  disconnectIntegration,
  getOAuthUrl,
} from "@/lib/api/integrations";

export type { LiveIntegration, OAuthAuthorizeResult } from "@/lib/api/integrations";

const INTEGRATIONS_KEY = "integrations";

export function useIntegrations() {
  const { isLoading: authLoading, user } = useAuth();
  return useQuery({
    queryKey: [INTEGRATIONS_KEY],
    queryFn: () => fetchIntegrations(),
    enabled: !authLoading && !!user,
  });
}

export function useConnectIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: string) => connectIntegration(provider),
    onSuccess: () => qc.invalidateQueries({ queryKey: [INTEGRATIONS_KEY] }),
  });
}

export function useConnectWithCredentials() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ provider, credentials }: { provider: string; credentials: Record<string, string> }) =>
      connectIntegrationWithCredentials(provider, credentials),
    onSuccess: () => qc.invalidateQueries({ queryKey: [INTEGRATIONS_KEY] }),
  });
}

export function useDisconnectIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => disconnectIntegration(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [INTEGRATIONS_KEY] }),
  });
}

export function useOAuthUrl() {
  const [isLoading, setIsLoading] = useState(false);

  const fetchOAuthUrl = useCallback(async (provider: string) => {
    setIsLoading(true);
    try {
      return await getOAuthUrl(provider);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchOAuthUrl, isLoading };
}
