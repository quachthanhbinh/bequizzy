import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(new URL(next, origin));
      // Keep the existing middleware cookie in sync
      response.cookies.set("rl-auth", "1", {
        path: "/",
        maxAge: 86400,
        sameSite: "lax",
      });
      return response;
    }
  }

  return NextResponse.redirect(
    new URL("/sign-in?error=auth_callback_failed", origin),
  );
}
