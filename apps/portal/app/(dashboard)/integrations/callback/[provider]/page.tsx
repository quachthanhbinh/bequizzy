"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { exchangeOAuthCode } from "@/lib/api/integrations";

type Status = "loading" | "success" | "error";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const provider = params.provider as string;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function handle() {
      if (errorParam) {
        setErrorMsg(errorDescription ?? errorParam);
        setStatus("error");
        return;
      }

      if (!code || !state) {
        setErrorMsg("Missing authorization code or state. Please try connecting again.");
        setStatus("error");
        return;
      }

      try {
        await exchangeOAuthCode(provider, code, state);
        setStatus("success");
        setTimeout(() => router.replace("/integrations?connected=1"), 1500);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setErrorMsg(msg);
        setStatus("error");
      }
    }

    handle();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <span className="h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        <p className="text-base font-medium text-foreground">Finishing connection…</p>
        <p className="text-sm text-muted-foreground">Exchanging authorization with {provider}</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15">
          <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="text-base font-semibold text-foreground">Connected successfully!</p>
        <p className="text-sm text-muted-foreground">Redirecting you back…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15">
        <svg className="h-7 w-7 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <p className="text-base font-semibold text-foreground">Connection failed</p>
      {errorMsg && (
        <p className="text-sm text-muted-foreground max-w-sm">{errorMsg}</p>
      )}
      <button
        type="button"
        className="btn btn-primary mt-2"
        onClick={() => router.replace("/integrations")}
      >
        Back to Integrations
      </button>
    </div>
  );
}
