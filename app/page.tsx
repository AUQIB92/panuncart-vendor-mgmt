"use client"

import Link from "next/link"
import { ArrowRight, Store, ShieldCheck, Package, TrendingUp, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useIsMobile } from "@/hooks/use-mobile"

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 p-1 shadow-lg ring-1 ring-primary/20 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:ring-primary/30 group-hover:rotate-3 group-hover:shadow-primary/20 sm:h-12 sm:w-12">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            <img 
              src="/icon.jpeg" 
              alt="PanunCart Icon" 
              className="h-6 w-6 object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110 rounded-lg sm:h-10 sm:w-10"
            />
            <div className="absolute -inset-1 rounded-xl bg-primary/10 blur-sm opacity-0 transition-opacity duration-300 group-hover:opacity-70"></div>
          </div>
          <span className="font-display text-lg font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent transition-all duration-300 group-hover:from-primary group-hover:to-primary/80 sm:text-xl">
            PanunCart
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" asChild className="text-sm sm:text-base">
            <Link href="/auth/login">Sign In</Link>
          </Button>
          <Button size="sm" asChild className="text-sm sm:text-base">
            <Link href="/auth/register">
              Become a Vendor
              <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(25_95%_50%/0.08),transparent_60%)]" />
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-8">

        </div>
        <div className="mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs sm:px-4 sm:py-1.5 sm:text-sm text-muted-foreground">
          <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
          Trusted by vendors across India
        </div>
        <h1 className="font-display text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
          Sell Your Products on{" "}
          <span className="text-primary">PanunCart</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
          Register as a vendor, list your products, and reach thousands of customers 
          through our powerful marketplace. Simple approval process, powerful tools.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4">
          <Button size="lg" className="h-11 w-full px-6 text-base sm:h-12 sm:w-auto sm:px-8" asChild>
            <Link href="/auth/register">
              Start Selling Today
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-11 w-full px-6 text-base sm:h-12 sm:w-auto sm:px-8 bg-transparent" asChild>
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
      title: "Global Reach",
      description: "Approved products are automatically published to our online marketplace, reaching customers worldwide instantly.",
    },
    {
      icon: Users,
      title: "Vendor Dashboard",
      description: "Track your products, view approval status, and manage your entire catalog from one beautiful dashboard.",
    },
  ]

  const isMobile = useIsMobile()
  const [currentIndex, setCurrentIndex] = useState(0)

  // Auto-advance carousel on mobile
  useEffect(() => {
    if (isMobile) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % features.length)
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [isMobile, features.length])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % features.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + features.length) % features.length)
  }

  return (
    <section className="border-t bg-muted/50 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">How It Works</h2>
          <p className="mt-2 text-muted-foreground sm:mt-3">Simple steps to start selling on PanunCart</p>
        </div>
        
        {/* Desktop Grid View */}
        {!isMobile ? (
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <div key={i} className="group rounded-xl border bg-card p-5 transition-all hover:shadow-lg hover:shadow-primary/5 sm:p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20 sm:mb-4 sm:h-11 sm:w-11">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-base font-semibold text-foreground sm:text-lg">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        ) : (
          /* Mobile Carousel View */
          <div className="relative">
            <div className="overflow-hidden rounded-xl">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {features.map((feature, i) => (
                  <div key={i} className="w-full flex-shrink-0 px-2">
                    <div className="group rounded-xl border bg-card p-6 transition-all hover:shadow-lg hover:shadow-primary/5">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-display text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Carousel Indicators */}
            <div className="flex justify-center mt-6 space-x-2">
              {features.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    i === currentIndex 
                      ? 'bg-primary w-6' 
                      : 'bg-muted hover:bg-muted-foreground/30'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
            
            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-lg hover:bg-muted transition-colors md:hidden"
              aria-label="Previous slide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-lg hover:bg-muted transition-colors md:hidden"
              aria-label="Next slide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function StepsSection() {
  const steps = [
    { step: "01", title: "Register", description: "Create your vendor account with business details" },
    { step: "02", title: "List Products", description: "Add your products with images and pricing" },
    { step: "03", title: "Get Approved", description: "Admin reviews and approves your products" },
    { step: "04", title: "Start Selling", description: "Products go live on our online marketplace" },
  ]

  const isMobile = useIsMobile()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // Auto-advance steps carousel on mobile
  useEffect(() => {
    if (isMobile) {
      const interval = setInterval(() => {
        setCurrentStepIndex((prev) => (prev + 1) % steps.length)
      }, 3500)
      return () => clearInterval(interval)
    }
  }, [isMobile, steps.length])

  const nextStep = () => {
    setCurrentStepIndex((prev) => (prev + 1) % steps.length)
  }

  const prevStep = () => {
    setCurrentStepIndex((prev) => (prev - 1 + steps.length) % steps.length)
  }

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Your Journey to Sales</h2>
        </div>
        
        {/* Desktop Grid View */}
        {!isMobile ? (
          <div className="grid gap-6 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((item, i) => (
              <div key={i} className="relative flex flex-col items-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground sm:mb-4 sm:h-14 sm:w-14 sm:text-xl">
                  {item.step}
                </div>
                {i < steps.length - 1 && (
                  <div className="absolute left-[calc(50%+1.5rem)] top-6 hidden h-px w-[calc(100%-3rem)] bg-border md:left-[calc(50%+2rem)] md:top-7 md:block md:w-[calc(100%-4rem)]" />
                )}
                <h3 className="font-display text-base font-semibold text-foreground sm:text-lg">{item.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground sm:mt-1 sm:text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        ) : (
          /* Mobile Carousel View */
          <div className="relative">
            <div className="overflow-hidden rounded-xl">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentStepIndex * 100}%)` }}
              >
                {steps.map((item, i) => (
                  <div key={i} className="w-full flex-shrink-0 px-4">
                    <div className="flex flex-col items-center text-center py-4">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                        {item.step}
                      </div>
                      <h3 className="font-display text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                      <p className="text-base text-muted-foreground text-center">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Steps Carousel Indicators */}
            <div className="flex justify-center mt-6 space-x-2">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStepIndex(i)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    i === currentStepIndex 
                      ? 'bg-primary w-6' 
                      : 'bg-muted hover:bg-muted-foreground/30'
                  }`}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>
            
            {/* Steps Navigation Arrows */}
            <button
              onClick={prevStep}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-lg hover:bg-muted transition-colors md:hidden"
              aria-label="Previous step"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            
            <button
              onClick={nextStep}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-lg hover:bg-muted transition-colors md:hidden"
              aria-label="Next step"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t bg-card px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex items-center justify-center gap-2 sm:justify-start">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary transition-all duration-300 group-hover:bg-primary/90 group-hover:scale-105">
            <div className="absolute inset-0 rounded-lg bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            <img 
              src="/icon.jpeg" 
              alt="PanunCart Icon" 
              className="h-5 w-5 object-contain transition-transform duration-300 group-hover:scale-110 rounded-md"
            />
            <div className="absolute -inset-1 rounded-lg bg-primary/20 blur-sm opacity-0 transition-opacity duration-300 group-hover:opacity-70"></div>
          </div>
          <span className="font-display font-bold text-foreground">PanunCart</span>
        </div>
        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground sm:flex-row sm:gap-4">
          <span className="text-center sm:text-left">
            Vendor Management Portal for{" "}
            <a href="https://www.panuncart.in" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              panuncart.in
            </a>
          </span>
          <span className="hidden text-border sm:block">|</span>
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
