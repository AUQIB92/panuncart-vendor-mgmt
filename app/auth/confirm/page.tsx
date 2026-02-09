import { Suspense } from "react"
import ConfirmEmailClient from "./ConfirmEmailClient"

export const dynamic = "force-dynamic"

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ConfirmEmailClient />
    </Suspense>
  )
}

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <p className="text-muted-foreground">Confirming your email…</p>
    </div>
  )
}
