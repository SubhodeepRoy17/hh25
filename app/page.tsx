import { HeroSection } from "@/components/hero-section"
import { Navbar } from "@/components/navbar"
import { Features } from "@/components/features"
import { StaggerTestimonials } from "@/components/testimonials"
import { CTA } from "@/components/ui/call-to-action"
import { ThemeProvider } from "../components/theme-context"
import { Footer } from "@/components/footer"

export default function Page() {
  return (
    <main className="bg-black text-white">
      <ThemeProvider>
      <Navbar/>
      <HeroSection />

      {/* Features */}
      <Features />

      {/* CTA after Features: Join Now */}
      <CTA
        badge="Join the network"
        title="Help rescue surplus food in your city"
        description="Get started with a pilot program and connect local donors to nonprofits in minutes."
        secondaryLabel="Talk to our team"
        primaryLabel="Join Now"
      />

      {/* Testimonials */}
      <section className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 py-20">
        <div className="mx-auto max-w-3xl text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            What partners are saying
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Impact felt in every community</h2>
          <p className="mt-2 text-gray-300">
            Students, nonprofits, and city programs use Smart Surplus to turn excess into meals.
          </p>
        </div>
        <StaggerTestimonials />
      </section>

      {/* CTA after Testimonials: See Demo */}
      <CTA
        badge="See it in action"
        title="Experience Smart Surplus live"
        description="Watch a quick walkthrough of real‑time matching and routing in the platform."
        secondaryLabel="Book a call"
        primaryLabel="See Demo"
      />

      {/* Footer */}
      <Footer />
      </ThemeProvider>
    </main>
  )
}
