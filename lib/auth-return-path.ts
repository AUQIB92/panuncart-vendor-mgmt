export const DEFAULT_AUTH_RETURN_PATH = "/auth/login"

const ALLOWED_AUTH_RETURN_PATHS = new Set([
  DEFAULT_AUTH_RETURN_PATH,
  "/auth/admin-login",
])

export function getSafeAuthReturnPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/")) {
    return DEFAULT_AUTH_RETURN_PATH
  }

  try {
    const url = new URL(value, "http://localhost")

    if (!ALLOWED_AUTH_RETURN_PATHS.has(url.pathname)) {
      return DEFAULT_AUTH_RETURN_PATH
    }

    return `${url.pathname}${url.search}`
  } catch {
    return DEFAULT_AUTH_RETURN_PATH
  }
}

export function getForgotPasswordHref(returnTo?: string | null) {
  const safeReturnTo = getSafeAuthReturnPath(returnTo)

  if (safeReturnTo === DEFAULT_AUTH_RETURN_PATH) {
    return "/auth/forgot-password"
  }

  return `/auth/forgot-password?returnTo=${encodeURIComponent(safeReturnTo)}`
}
