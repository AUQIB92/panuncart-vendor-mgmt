"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Mail } from "lucide-react"
import { toast } from "sonner"
import { DEFAULT_AUTH_RETURN_PATH, getSafeAuthReturnPath } from "@/lib/auth-return-path"
import { createClient } from "@/lib/supabase/client"
import { getAuthRedirectUrl } from "@/lib/auth-redirect"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ForgotPasswordClient({ initialReturnTo }: { initialReturnTo?: string | null }) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()
  const returnTo = getSafeAuthReturnPath(initialReturnTo)
  const isAdminFlow = returnTo === "/auth/admin-login"
  const loginLinkLabel = isAdminFlow ? "admin login" : "login"

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const resetPasswordPath =
      returnTo === DEFAULT_AUTH_RETURN_PATH
        ? "/auth/reset-password"
        : `/auth/reset-password?returnTo=${encodeURIComponent(returnTo)}`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthRedirectUrl(
        `/auth/callback?next=${encodeURIComponent(resetPasswordPath)}`
      ),
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-primary transition-all duration-300 hover:bg-primary/90 hover:scale-105">
              <div className="absolute inset-0 rounded-lg bg-white/20 opacity-0 transition-opacity duration-300 hover:opacity-100"></div>
              <img 
                src="/icon.jpeg" 
                alt="PanunCart Icon" 
                className="h-5 w-5 object-contain transition-transform duration-300 hover:scale-110 rounded-md"
              />
              <div className="absolute -inset-1 rounded-lg bg-primary/20 blur-sm opacity-0 transition-opacity duration-300 hover:opacity-70"></div>
            </div>
            <span className="font-display text-2xl font-bold text-foreground">PanunCart</span>
          </Link>
        </div>

        <Card className="border-0 shadow-xl shadow-foreground/5">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">Reset Password</CardTitle>
            <CardDescription>
              {submitted 
                ? "Check your email for a reset link" 
                : "Enter your email address and we'll send you a link to reset your password."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="flex flex-col items-center justify-center gap-6 py-4">
                <div className="rounded-full bg-primary/10 p-4 shrink-0">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  <p>We've sent an email to <span className="font-medium text-foreground">{email}</span> with instructions to reset your password.</p>
                  <p className="mt-2">Be sure to check your spam filter if you don't see it within a few minutes.</p>
                </div>
                <Button asChild variant="outline" className="w-full mt-2">
                  <Link href={returnTo}>
                    {`Return to ${loginLinkLabel}`}
                  </Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="mt-2 h-11" disabled={loading}>
                  {loading ? "Sending reset link..." : "Send Reset Link"}
                </Button>
                <div className="mt-4 text-center">
                  <Link
                    href={returnTo}
                    className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {`Back to ${loginLinkLabel}`}
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
