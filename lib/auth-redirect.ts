const PUBLIC_APP_URL_ENV_KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_APP_URL",
] as const

function getConfiguredAppOrigin() {
  if (typeof window !== "undefined") {
    return window.location.origin
  }

  for (const key of PUBLIC_APP_URL_ENV_KEYS) {
    const value = process.env[key]

    if (!value) {
      continue
    }

    try {
      return new URL(value).origin
    } catch {
      continue
    }
  }

  if (process.env.NODE_ENV === "development") {
    const devRedirectUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL

    if (devRedirectUrl) {
      try {
        return new URL(devRedirectUrl).origin
      } catch {
        return null
      }
    }
  }

  return null
}

export function getAuthRedirectUrl(path: string) {
  const origin = getConfiguredAppOrigin()

  if (!origin) {
    return path.startsWith("/") ? path : `/${path}`
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${origin}${normalizedPath}`
}
