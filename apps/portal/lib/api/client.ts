/**
 * API client for RevLooper portal.
 *
 * All requests go through the api-gateway at NEXT_PUBLIC_API_URL.
 * Auth headers are injected from Supabase session (JWT + workspace ID).
 *
 * Response envelope: { data, error, meta }
 */

const API_BASE = "https://api.revlooper.com";

export interface ApiResponse<T> {
  data: T;
  error: null;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  data: null;
  error: { code: string; message: string };
  meta?: Record<string, unknown>;
}

export class ApiRequestError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

/**
 * Core fetch wrapper. Automatically attaches auth headers from sessionStorage.
 * Throws ApiRequestError on non-2xx responses.
 */
export async function apiFetch<T>(
  path: string,
  options?: RequestInit & {
    workspaceId?: string;
    accessToken?: string;
  },
): Promise<T> {
  const { workspaceId, accessToken, ...fetchOptions } = options ?? {};

  const headers = new Headers(fetchOptions.headers);
  headers.set("Content-Type", "application/json");

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (workspaceId) {
    headers.set("X-Workspace-ID", workspaceId);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    let errorBody: { error?: string; message?: string; detail?: string } = {};
    try {
      errorBody = await response.json();
    } catch {
      // Ignore parse errors
    }
    const message =
      errorBody.message ?? errorBody.detail ?? `HTTP ${response.status}`;
    const code = errorBody.error ?? "API_ERROR";
    throw new ApiRequestError(code, message, response.status);
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/** Get auth headers from localStorage (set during Supabase session init) */
export function getAuthContext(): {
  accessToken: string | null;
  workspaceId: string | null;
} {
  if (typeof window === "undefined") {
    return { accessToken: null, workspaceId: null };
  }
  return {
    accessToken: sessionStorage.getItem("revlooper_access_token"),
    workspaceId: sessionStorage.getItem("revlooper_workspace_id"),
  };
}
