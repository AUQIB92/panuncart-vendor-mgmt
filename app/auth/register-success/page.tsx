import Link from "next/link"
import { Store, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RegisterSuccessPage() {
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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <MailCheck className="h-8 w-8 text-success" />
            </div>
            <CardTitle className="font-display text-2xl">Check Your Email</CardTitle>
            <CardDescription className="text-base">
              We sent you a confirmation link. Please check your email and click the link to activate your vendor account.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6 text-sm text-muted-foreground">
              After confirming your email, you can sign in and start listing products. Our admin team will review your account shortly.
            </p>
            <Button asChild className="h-11 w-full">
              <Link href="/auth/login">Go to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
