import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const DEFAULT_REDIRECT_PATH = "/"
const ALLOWED_REDIRECT_PATHS = new Set([
  "/",
  "/auth/confirm",
  "/auth/reset-password",
  "/auth/login",
  "/vendor",
  "/admin",
])

function getSafeRedirectPath(nextParam: string | null) {
  if (!nextParam) {
    return DEFAULT_REDIRECT_PATH
  }

  if (!nextParam.startsWith("/")) {
    return DEFAULT_REDIRECT_PATH
  }

  const nextUrl = new URL(nextParam, "http://localhost")
  if (!ALLOWED_REDIRECT_PATHS.has(nextUrl.pathname)) {
    return DEFAULT_REDIRECT_PATH
  }

  return `${nextUrl.pathname}${nextUrl.search}`
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"))
  const origin = requestUrl.origin

  if (!code) {
    const fallbackPath =
      next === "/auth/reset-password"
        ? "/auth/forgot-password?error=invalid_or_expired_link"
        : "/auth/login?error=auth_callback_failed"

    return NextResponse.redirect(new URL(fallbackPath, origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const fallbackPath =
      next === "/auth/reset-password"
        ? "/auth/forgot-password?error=invalid_or_expired_link"
        : "/auth/login?error=auth_callback_failed"

    return NextResponse.redirect(new URL(fallbackPath, origin))
  }

  return NextResponse.redirect(new URL(next, origin))
}
