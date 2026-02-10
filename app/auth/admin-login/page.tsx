"use client"

import React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Shield, Eye, EyeOff, Store, KeyRound } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const ADMIN_SECRET_KEY = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY || "panuncart-admin-2024"

export default function AdminLoginPage() {
  const [tab, setTab] = useState<"login" | "register">("login")

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
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
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="font-display text-2xl">Admin Portal</CardTitle>
            <CardDescription>Manage vendors and products on PanunCart</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Create Account</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <AdminLoginForm />
              </TabsContent>
              <TabsContent value="register">
                <AdminRegisterForm onSuccess={() => setTab("login")} />
              </TabsContent>
            </Tabs>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Are you a vendor?{" "}
              <Link href="/auth/login" className="font-medium text-primary hover:underline">
                Vendor Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AdminLoginForm() {
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
    if (role !== "admin") {
      await supabase.auth.signOut()
      toast.error("This account does not have admin privileges.")
      setLoading(false)
      return
    }

    toast.success("Welcome back, Admin!")
    router.push("/admin")
  }

  return (
    <form onSubmit={handleLogin} className="mt-4 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="admin@panuncart.in"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="login-password">Password</Label>
        <div className="relative">
          <Input
            id="login-password"
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
        {loading ? "Signing in..." : "Sign In as Admin"}
      </Button>
    </form>
  )
}

function AdminRegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    secretKey: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()

    if (form.secretKey !== ADMIN_SECRET_KEY) {
      toast.error("Invalid admin secret key. Contact the system owner.")
      return
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${window.location.origin}/admin`,
        data: {
          role: "admin",
          contact_name: form.name,
        },
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success("Admin account created! Check your email to confirm, then sign in.")
    onSuccess()
  }

  return (
    <form onSubmit={handleRegister} className="mt-4 flex flex-col gap-4">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <KeyRound className="h-4 w-4" />
          Admin Secret Key Required
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          You need the admin secret key to create an admin account. Contact the system owner if you
          {"don't"} have it.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reg-secret">Admin Secret Key *</Label>
        <div className="relative">
          <Input
            id="reg-secret"
            type={showSecret ? "text" : "password"}
            placeholder="Enter admin secret key"
            value={form.secretKey}
            onChange={(e) => updateForm("secretKey", e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showSecret ? "Hide secret" : "Show secret"}
          >
            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reg-name">Full Name *</Label>
        <Input
          id="reg-name"
          placeholder="Your name"
          value={form.name}
          onChange={(e) => updateForm("name", e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reg-email">Email *</Label>
        <Input
          id="reg-email"
          type="email"
          placeholder="admin@panuncart.in"
          value={form.email}
          onChange={(e) => updateForm("email", e.target.value)}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="reg-password">Password *</Label>
          <div className="relative">
            <Input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => updateForm("password", e.target.value)}
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
        <div className="flex flex-col gap-2">
          <Label htmlFor="reg-confirm">Confirm Password *</Label>
          <Input
            id="reg-confirm"
            type="password"
            placeholder="Repeat password"
            value={form.confirmPassword}
            onChange={(e) => updateForm("confirmPassword", e.target.value)}
            required
          />
        </div>
      </div>

      <Button type="submit" className="mt-2 h-11" disabled={loading}>
        {loading ? "Creating Account..." : "Create Admin Account"}
      </Button>
    </form>
  )
}
