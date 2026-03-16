import { Suspense } from "react"
import ResetPasswordClient from "./ResetPasswordClient"

export const dynamic = "force-dynamic"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ResetPasswordClient />
    </Suspense>
  )
}

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <p className="text-muted-foreground">Loading password reset…</p>
    </div>
  )
}
