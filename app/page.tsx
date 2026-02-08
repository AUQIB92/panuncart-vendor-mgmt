import Link from "next/link"
import { ArrowRight, Store, ShieldCheck, Package, TrendingUp, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Store className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">PanunCart</span>
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/register">
              Become a Vendor
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 py-24 lg:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(25_95%_50%/0.08),transparent_60%)]" />
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground">
          <Zap className="h-3.5 w-3.5 text-primary" />
          Trusted by vendors across India
        </div>
        <h1 className="font-display text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Sell Your Products on{" "}
          <span className="text-primary">PanunCart</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          Register as a vendor, list your products, and reach thousands of customers 
          through our Shopify-powered marketplace. Simple approval process, powerful tools.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" className="h-12 px-8 text-base" asChild>
            <Link href="/auth/register">
              Start Selling Today
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-transparent" asChild>
            <Link href="/auth/login">Vendor Login</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      icon: Package,
      title: "Easy Product Listing",
      description: "Add products with images, pricing, inventory, and descriptions. Our intuitive form makes it quick and simple.",
    },
    {
      icon: ShieldCheck,
      title: "Quality Assurance",
      description: "Every product is reviewed by our admin team before going live, ensuring top quality for customers.",
    },
    {
      icon: TrendingUp,
      title: "Shopify Integration",
      description: "Approved products are automatically published to our Shopify store, reaching a wide audience instantly.",
    },
    {
      icon: Users,
      title: "Vendor Dashboard",
      description: "Track your products, view approval status, and manage your entire catalog from one beautiful dashboard.",
    },
  ]

  return (
    <section className="border-t bg-muted/50 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-foreground">How It Works</h2>
          <p className="mt-3 text-muted-foreground">Simple steps to start selling on PanunCart</p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <div key={i} className="group rounded-xl border bg-card p-6 transition-all hover:shadow-lg hover:shadow-primary/5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function StepsSection() {
  const steps = [
    { step: "01", title: "Register", description: "Create your vendor account with business details" },
    { step: "02", title: "List Products", description: "Add your products with images and pricing" },
    { step: "03", title: "Get Approved", description: "Admin reviews and approves your products" },
    { step: "04", title: "Start Selling", description: "Products go live on panuncart.in Shopify store" },
  ]

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-foreground">Your Journey to Sales</h2>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item, i) => (
            <div key={i} className="relative flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                {item.step}
              </div>
              {i < steps.length - 1 && (
                <div className="absolute left-[calc(50%+2rem)] top-7 hidden h-px w-[calc(100%-4rem)] bg-border lg:block" />
              )}
              <h3 className="font-display text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t bg-card px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Store className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-foreground">PanunCart</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            Vendor Management Portal for{" "}
            <a href="https://www.panuncart.in" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              panuncart.in
            </a>
          </span>
          <span className="text-border">|</span>
          <Link href="/auth/admin-login" className="hover:text-foreground hover:underline">
            Admin Portal
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <StepsSection />
      </main>
      <Footer />
    </div>
  )
}
