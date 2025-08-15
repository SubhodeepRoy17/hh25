"use client"

import type React from "react"
import { useEffect, useRef, useState, Suspense, lazy } from "react"
import { ChevronDown, Menu, X, Play, Sun, Moon } from "lucide-react"
import { useTheme } from "./theme-context"
import { Navbar } from "./navbar"

// Lazy-load Spline (3D background)
const Spline = lazy(() => import("@splinetool/react-spline"))

function HeroSplineBackground({ isDark }: { isDark: boolean }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        pointerEvents: "auto",
        overflow: "hidden",
      }}
      aria-hidden
    >
      <Suspense
        fallback={
          <div className={`w-full h-[100vh] ${isDark ? 
            "bg-[radial-gradient(1200px_circle_at_20%_20%,rgba(16,185,129,0.15),transparent_40%),radial-gradient(1200px_circle_at_80%_30%,rgba(34,197,94,0.12),transparent_35%),#0a0a0f]" : 
            "bg-[radial-gradient(1200px_circle_at_20%_20%,rgba(16,185,129,0.08),transparent_40%),radial-gradient(1200px_circle_at_80%_30%,rgba(34,197,94,0.06),transparent_35%),#f8fafc]"}`} />
        }
      >
        <Spline
          style={{
            width: "100%",
            height: "100vh",
            pointerEvents: "auto",
          }}
          scene="https://prod.spline.design/us3ALejTXl6usHZ7/scene.splinecode"
        />
      </Suspense>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isDark ? `
            linear-gradient(to right, rgba(0, 0, 0, 0.85), transparent 30%, transparent 70%, rgba(0, 0, 0, 0.85)),
            linear-gradient(to bottom, transparent 55%, rgba(0, 0, 0, 0.92))
          ` : `
            linear-gradient(to right, rgba(255, 255, 255, 0.85), transparent 30%, transparent 70%, rgba(255, 255, 255, 0.85)),
            linear-gradient(to bottom, transparent 55%, rgba(255, 255, 255, 0.92))
          `,
          pointerEvents: "none",
        }}
      />
      {/* Subtle brand tint */}
      <div className={`pointer-events-none absolute inset-0 ${isDark ? 
        "bg-[radial-gradient(900px_600px_at_10%_20%,rgba(16,185,129,0.08),transparent_60%)]" : 
        "bg-[radial-gradient(900px_600px_at_10%_20%,rgba(16,185,129,0.04),transparent_60%)]"}`} />
    </div>
  )
}

function ScreenshotSection({
  screenshotRef,
  isDark
}: {
  screenshotRef: React.RefObject<HTMLDivElement | null>
  isDark: boolean
}) {
  return (
    <section
      aria-label="Product preview"
      className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 mt-11 md:mt-12"
    >
      <div
        ref={screenshotRef as React.RefObject<HTMLDivElement>}
        className={`${isDark ? "bg-gray-900 border-gray-700/50" : "bg-gray-50 border-gray-300/50"} rounded-xl overflow-hidden shadow-2xl border w-full md:w-[80%] lg:w-[70%] mx-auto`}
      >
        <div>
          <img
            src="https://cdn.sanity.io/images/s6lu43cv/production-v4/13b6177b537aee0fc311a867ea938f16416e8670-3840x2160.jpg?w=3840&h=2160&q=10&auto=format&fm=jpg"
            alt="Dashboard preview showing food pickups and deliveries"
            className="w-full h-auto block"
          />
        </div>
      </div>
    </section>
  )
}

function HeroContent({ isDark }: { isDark: boolean }) {
  return (
    <div className={`text-left ${isDark ? "text-white" : "text-gray-900"} pt-16 sm:pt-24 md:pt-32 px-4 max-w-3xl`}>
      <div className={`inline-flex items-center gap-2 rounded-full border ${isDark ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100" : "border-emerald-400/30 bg-emerald-500/20 text-emerald-800"} px-3 py-1 mb-4`}>
        <span className={`h-2 w-2 rounded-full ${isDark ? "bg-emerald-400" : "bg-emerald-500"}`} />
        Live food rescue platform
      </div>

      <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 leading-tight tracking-wide">
        Rescue surplus food. Feed more people.
      </h1>
      <p className={`text-base sm:text-lg md:text-xl mb-6 sm:mb-8 ${isDark ? "opacity-85" : "opacity-90"} max-w-xl`}>
        Connect restaurants, grocers, and nonprofits to redistribute surplus food in real‑time. Reduce waste, cut
        emissions, and turn excess into impact.
      </p>

      <div className="flex pointer-events-auto flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-3">
        <a
          href="#"
          className={`${isDark ? "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-50 border-emerald-400/40" : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 border-emerald-500/30"} font-semibold py-2 sm:py-3 px-6 sm:px-8 rounded-full transition duration-300 w-full sm:w-auto border`}
          style={{ backdropFilter: "blur(8px)" }}
        >
          Start your pilot
        </a>

        <a
          href="#"
          className={`pointer-events-auto ${isDark ? "bg-[#0009] border-gray-600 hover:border-gray-400 text-gray-200 hover:text-white" : "bg-white/80 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900"} font-medium py-2 sm:py-3 px-6 sm:px-8 rounded-full transition duration-300 flex items-center justify-center w-full sm:w-auto`}
          aria-label="Watch the demo video"
        >
          <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Watch the demo
        </a>
      </div>

      <p className={`mt-4 text-sm ${isDark ? "text-gray-300" : "text-gray-500"}`}>Trusted by community kitchens, city programs, and local food banks.</p>
    </div>
  )
}

export const HeroSection = () => {
  const { isDark } = useTheme()
  const screenshotRef = useRef<HTMLDivElement>(null)
  const heroContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (screenshotRef.current && heroContentRef.current) {
        requestAnimationFrame(() => {
          const scrollPosition = window.pageYOffset
          screenshotRef.current!.style.transform = `translateY(-${scrollPosition * 0.5}px)`
          const maxScroll = 400
          const opacity = 1 - Math.min(scrollPosition / maxScroll, 1)
          heroContentRef.current!.style.opacity = opacity.toString()
        })
      }
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className={`relative ${isDark ? "dark" : ""}`}>      
      <div className="relative min-h-screen">
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <HeroSplineBackground isDark={isDark} />
        </div>
        <div
          ref={heroContentRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          <div className="container mx-auto">
            <HeroContent isDark={isDark} />
          </div>
        </div>
      </div>

      <div className={`${isDark ? "bg-black" : "bg-white"} relative z-10`} style={{ marginTop: "-10vh" }}>
        <ScreenshotSection screenshotRef={screenshotRef} isDark={isDark} />
      </div>
    </div>
  )
}