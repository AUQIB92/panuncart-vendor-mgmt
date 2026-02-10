"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Store, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    const role = data.user?.user_metadata?.role
    if (role === "admin") {
      router.push("/admin")
    } else {
      router.push("/vendor")
    }
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
            <CardTitle className="font-display text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to your vendor or admin account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="mt-2 h-11" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-6 flex flex-col gap-2 text-center text-sm text-muted-foreground">
              <div>
                {"Don't have an account? "}
                <Link href="/auth/register" className="font-medium text-primary hover:underline">
                  Register as Vendor
                </Link>
              </div>
              <div>
                <Link href="/auth/admin-login" className="font-medium text-muted-foreground hover:text-foreground hover:underline">
                  Admin Portal
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
