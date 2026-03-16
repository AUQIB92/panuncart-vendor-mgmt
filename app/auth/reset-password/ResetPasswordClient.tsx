"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function getHashParams() {
  if (typeof window === "undefined") {
    return new URLSearchParams()
  }

  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash

  return new URLSearchParams(hash)
}

export default function ResetPasswordClient() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [errorStatus, setErrorStatus] = useState("")
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    async function handleRecoveryLink() {
      const code = searchParams.get("code")
      const tokenHash = searchParams.get("token_hash")
      const type = searchParams.get("type")
      const error = searchParams.get("error")
      const errorDescription = searchParams.get("error_description")
      const hashParams = getHashParams()
      const accessToken = hashParams.get("access_token")
      const refreshToken = hashParams.get("refresh_token")
      const hashType = hashParams.get("type")

      if (error) {
        setErrorStatus(errorDescription || "Invalid or expired password reset link.")
        return
      }

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            // In React Strict Mode, useEffect runs twice. The first exchange succeeds,
            // the second fails because the code is single-use. Check for a session first.
            const { data } = await supabase.auth.getSession()
            if (!data?.session) {
              setErrorStatus("Reset link is invalid or has expired. Please request a new one.")
              return
            }
          }

          setSessionReady(true)
          window.history.replaceState({}, document.title, window.location.pathname)
          return
        }

        if (tokenHash) {
          if (type !== "recovery") {
            setErrorStatus("Reset link format is invalid. Please request a new password reset link.")
            return
          }

          const { error } = await supabase.auth.verifyOtp({
            type: "recovery",
            token_hash: tokenHash,
          })

          if (error) {
            setErrorStatus("Reset link is invalid or has expired. Please request a new one.")
            return
          }

          setSessionReady(true)
          window.history.replaceState({}, document.title, window.location.pathname)
          return
        }

        if (accessToken && refreshToken) {
          if (hashType && hashType !== "recovery") {
            setErrorStatus("Reset link format is invalid. Please request a new password reset link.")
            return
          }

          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            setErrorStatus("Reset link is invalid or has expired. Please request a new one.")
            return
          }

          setSessionReady(true)
          window.history.replaceState({}, document.title, window.location.pathname)
          return
        }

        // Check if there's already an active session (e.g. page refresh after verification)
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          setSessionReady(true)
        } else {
          setErrorStatus("No reset token found. Please request a new password reset link.")
        }
      } catch {
        setErrorStatus("Something went wrong verifying the reset link.")
      }
    }

    handleRecoveryLink()
  }, [searchParams])

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.")
      return
    }

    if (password.length < 6) {
      setMessage("Password should be at least 6 characters.")
      return
    }

    setLoading(true)
    setMessage("")

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // Automatically redirect after a few seconds
    setTimeout(() => {
      // Sign out the user after reset so they can log in normally 
      // (as vendor/admin routing happens there)
      supabase.auth.signOut().then(() => {
        router.push("/auth/login")
      })
    }, 3000)
  }

  if (errorStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md border-0 shadow-xl shadow-foreground/5 text-center py-8">
          <CardHeader>
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <CardTitle className="text-xl text-destructive">Invalid Reset Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">{errorStatus}</p>
            <Button asChild className="w-full">
              <Link href="/auth/forgot-password">Request New Link</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
            <CardTitle className="font-display text-2xl">Set New Password</CardTitle>
            <CardDescription>
              {success ? "Your password has been successfully updated." : "Enter your new password below."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="flex flex-col items-center justify-center gap-4 py-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
                <p className="text-center text-sm text-muted-foreground">
                  You will be redirected to the login page shortly...
                </p>
                <Button asChild className="w-full mt-4">
                  <Link href="/auth/login">Return to Login</Link>
                </Button>
              </div>
            ) : !sessionReady ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Verifying reset token...</p>
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
                {message && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium border border-destructive/20 text-center">
                    {message}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="mt-4 h-11" disabled={loading}>
                  {loading ? "Updating Password..." : "Update Password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
