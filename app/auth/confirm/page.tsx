"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, AlertCircle, Mail, RotateCw } from "lucide-react"
// import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ConfirmEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    async function confirmEmail() {
      // Check for error parameters first
      const error = searchParams.get('error')
      const errorCode = searchParams.get('error_code')
      const errorDescription = searchParams.get('error_description')
      
      if (error || errorCode) {
        setStatus('error')
        if (errorCode === 'otp_expired') {
          setMessage('Confirmation link has expired. Please register again to get a new link.')
        } else {
          setMessage(errorDescription || 'Invalid confirmation link. Please try registering again.')
        }
        return
      }

      const token_hash = searchParams.get('token_hash')
      const type = searchParams.get('type')
      const next = searchParams.get('next') ?? '/'

      // Validate required parameters
      if (!token_hash) {
        setStatus('error')
        setMessage('Confirmation link is missing required information. Please register again.')
        return
      }
      
      if (type !== 'email') {
        setStatus('error')
        setMessage('Invalid confirmation link format. Please register again.')
        return
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          type: 'email',
          token_hash,
        })
        
        if (error) {
          setStatus('error')
          if (error.message.includes('invalid') || error.message.includes('expired')) {
            setMessage('Confirmation link is invalid or has expired. Please register again.')
          } else {
            setMessage('Invalid or expired confirmation link. Please try registering again.')
          }
          return
        }
        
        setStatus('success')
        setMessage('Your email has been confirmed successfully!')
        // toast.success('Email confirmed! You can now sign in.')
        
        // Redirect after 3 seconds
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      } catch (error) {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      }
    }

    confirmEmail()
  }, [searchParams, router, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Mail className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-bold text-foreground">PanunCart</span>
          </Link>
        </div>

        <Card className="border-0 shadow-xl shadow-foreground/5">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">
              {status === 'loading' && 'Confirming Email'}
              {status === 'success' && 'Email Confirmed!'}
              {status === 'error' && 'Confirmation Failed'}
            </CardTitle>
            <CardDescription>
              {status === 'loading' && 'Please wait while we confirm your email address...'}
              {status === 'success' && 'Your account is ready to use'}
              {status === 'error' && 'We could not confirm your email'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {status === 'loading' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <RotateCw className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Processing confirmation...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <CheckCircle className="h-16 w-16 text-success" />
                <p className="text-lg text-foreground">{message}</p>
                <p className="text-sm text-muted-foreground">
                  Redirecting to login in 3 seconds...
                </p>
                <Button asChild className="mt-4">
                  <Link href="/auth/login">Sign In Now</Link>
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <AlertCircle className="h-16 w-16 text-destructive" />
                <div className="text-center max-w-md">
                  <p className="text-lg text-foreground mb-2">{message}</p>
                  {message.includes('expired') && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Links expire after 24 hours for security reasons.
                    </p>
                  )}
                  {message.includes('missing') && (
                    <p className="text-sm text-muted-foreground mt-2">
                      The confirmation link appears to be incomplete or corrupted.
                    </p>
                  )}
                  {message.includes('format') && (
                    <p className="text-sm text-muted-foreground mt-2">
                      The link format is not recognized. Please request a new confirmation email.
                    </p>
                  )}
                </div>
                <div className="flex gap-3 mt-4">
                  <Button variant="outline" asChild>
                    <Link href="/auth/register">Register Again</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
