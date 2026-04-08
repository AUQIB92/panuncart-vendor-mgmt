type AuthErrorLike = {
  name?: string
  status?: number
  code?: string
  message?: string
  __isAuthError?: boolean
  cause?: { code?: string; message?: string }
}

export function isRetryableAuthFetchError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false

  const e = error as AuthErrorLike
  const message = (e.message || "").toLowerCase()
  const causeMessage = (e.cause?.message || "").toLowerCase()

  return Boolean(
    e.name === "AuthRetryableFetchError" ||
      e.status === 0 ||
      e.code === "UND_ERR_CONNECT_TIMEOUT" ||
      e.cause?.code === "UND_ERR_CONNECT_TIMEOUT" ||
      message.includes("fetch failed") ||
      causeMessage.includes("connect timeout"),
  )
}

export async function safeGetUser(supabase: {
  auth: { getUser: () => Promise<{ data: { user: any | null }; error: unknown }> }
}): Promise<{
  user: any | null
  error: unknown
  isRetryable: boolean
}> {
  try {
    const { data, error } = await supabase.auth.getUser()
    return { user: data.user, error, isRetryable: false }
  } catch (error) {
    if (isRetryableAuthFetchError(error)) {
      console.warn("Retryable auth getUser fetch failure:", error)
      return { user: null, error: null, isRetryable: true }
    }

    throw error
  }
}
