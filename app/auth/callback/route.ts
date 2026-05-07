import { NextRequest, NextResponse } from "next/server"
import { DEFAULT_AUTH_RETURN_PATH, getSafeAuthReturnPath } from "@/lib/auth-return-path"
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

function getResetPasswordFallbackPath(next: string) {
  const nextUrl = new URL(next, "http://localhost")
  const returnTo = getSafeAuthReturnPath(nextUrl.searchParams.get("returnTo"))
  const params = new URLSearchParams({
    error: "invalid_or_expired_link",
  })

  if (returnTo !== DEFAULT_AUTH_RETURN_PATH) {
    params.set("returnTo", returnTo)
  }

  return `/auth/forgot-password?${params.toString()}`
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
        : next.startsWith("/auth/reset-password")
          ? getResetPasswordFallbackPath(next)
        : "/auth/login?error=auth_callback_failed"

    return NextResponse.redirect(new URL(fallbackPath, origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const fallbackPath =
      next === "/auth/reset-password"
        ? "/auth/forgot-password?error=invalid_or_expired_link"
        : next.startsWith("/auth/reset-password")
          ? getResetPasswordFallbackPath(next)
        : "/auth/login?error=auth_callback_failed"

    return NextResponse.redirect(new URL(fallbackPath, origin))
  }

  return NextResponse.redirect(new URL(next, origin))
}
