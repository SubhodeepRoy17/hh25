"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useTheme } from "./theme-context"
import { ChevronDown, Menu, X, Sun, Moon } from "lucide-react"

export function Navbar() {
  const [hoveredNavItem, setHoveredNavItem] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isDark, toggleTheme } = useTheme()

  const [mobileDropdowns, setMobileDropdowns] = useState({
    features: false,
    programs: false,
    resources: false,
  })

  const handleMouseEnterNavItem = (item: string) => setHoveredNavItem(item)
  const handleMouseLeaveNavItem = () => setHoveredNavItem(null)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
    if (isMobileMenuOpen) {
      setMobileDropdowns({ features: false, programs: false, resources: false })
    }
  }

  const toggleMobileDropdown = (key: keyof typeof mobileDropdowns) => {
    setMobileDropdowns((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const navLinkClass = (itemName: string, extraClasses = "") => {
    const isCurrentItemHovered = hoveredNavItem === itemName
    const isAnotherItemHovered = hoveredNavItem !== null && !isCurrentItemHovered
    const colorClass = isCurrentItemHovered ? "text-white" : isAnotherItemHovered ? "text-gray-500" : "text-gray-300"

    return `text-sm transition duration-150 ${colorClass} ${extraClasses}`
  }

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
        setMobileDropdowns({
          features: false,
          programs: false,
          resources: false,
        })
      }
    }
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [isMobileMenuOpen])

  return (
    <nav
      className="fixed top-4 left-4 right-4 z-20"
      style={{
        backgroundColor: "rgba(10, 14, 12, 0.35)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderRadius: "9999px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
      aria-label="Primary"
    >
      <div className="container mx-auto px-4 py-3 md:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-6 lg:space-x-8">
          <a href="#" className="flex items-center gap-2 text-white">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="sr-only">Smart Surplus</span>
              <div className="w-2 h-2 rounded-full bg-emerald-300" />
            </div>
            <span className="font-semibold tracking-wide">Smart Surplus</span>
          </a>

          <div className="hidden lg:flex items-center space-x-6">
            <div
              className="relative group"
              onMouseEnter={() => handleMouseEnterNavItem("features")}
              onMouseLeave={handleMouseLeaveNavItem}
            >
              <a href="#" className={navLinkClass("features", "flex items-center")}>
                Features
                <ChevronDown className="ml-1 w-3 h-3 group-hover:rotate-180 transition-transform duration-200" />
              </a>
              <div
                className="absolute left-0 mt-2 w-56 bg-black/60 rounded-md shadow-lg py-2 border border-gray-700/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30"
                style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
              >
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-800/30 transition duration-150"
                >
                  Real-time Matching
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-800/30 transition duration-150"
                >
                  Route Optimization
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-800/30 transition duration-150"
                >
                  Impact Analytics
                </a>
              </div>
            </div>

            <div
              className="relative group"
              onMouseEnter={() => handleMouseEnterNavItem("programs")}
              onMouseLeave={handleMouseLeaveNavItem}
            >
              <a href="#" className={navLinkClass("programs", "flex items-center")}>
                Programs
                <ChevronDown className="ml-1 w-3 h-3 group-hover:rotate-180 transition-transform duration-200" />
              </a>
              <div
                className="absolute left-0 mt-2 w-56 bg-black/60 rounded-md shadow-lg py-2 border border-gray-700/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30"
                style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
              >
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-800/30 transition duration-150"
                >
                  Donor Onboarding
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-800/30 transition duration-150"
                >
                  Nonprofit Network
                </a>
              </div>
            </div>

            <div
              className="relative group"
              onMouseEnter={() => handleMouseEnterNavItem("resources")}
              onMouseLeave={handleMouseLeaveNavItem}
            >
              <a href="#" className={navLinkClass("resources", "flex items-center")}>
                Resources
                <ChevronDown className="ml-1 w-3 h-3 group-hover:rotate-180 transition-transform duration-200" />
              </a>
              <div
                className="absolute left-0 mt-2 w-56 bg-black/60 rounded-md shadow-lg py-2 border border-gray-700/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30"
                style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
              >
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-800/30 transition duration-150"
                >
                  Blog
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-800/30 transition duration-150"
                >
                  Docs
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-800/30 transition duration-150"
                >
                  Support
                </a>
              </div>
            </div>

            <a
              href="#"
              className={navLinkClass("pricing")}
              onMouseEnter={() => handleMouseEnterNavItem("pricing")}
              onMouseLeave={handleMouseLeaveNavItem}
            >
              Pricing
            </a>
          </div>
        </div>

        <div className="flex items-center space-x-4 md:space-x-6">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${
            isDark ? "bg-gray-800 text-amber-300" : "bg-amber-100 text-amber-600"
            }`}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <a href="#" className="hidden md:block text-gray-300 hover:text-white text-sm">
            Contact Sales
          </a>
          <a href="/auth/login" className="hidden sm:block text-gray-300 hover:text-white text-sm">
            Sign In
          </a>
          <a
            href="#"
            className="bg-emerald-500/15 hover:bg-emerald-500/25 text-white font-semibold py-2 px-5 rounded-full text-sm md:text-base border border-emerald-400/40"
            style={{ backdropFilter: "blur(8px)" }}
          >
            Start Free Pilot
          </a>
          <button
            className="lg:hidden text-white p-2"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
            aria-controls="primary-mobile-menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div
        id="primary-mobile-menu"
        className={`lg:hidden bg-black/60 border-t border-gray-700/30 absolute top-full left-0 right-0 z-30
          overflow-hidden transition-all duration-300 ease-in-out
          ${isMobileMenuOpen ? "max-h-screen opacity-100 pointer-events-auto" : "max-h-0 opacity-0 pointer-events-none"}
        `}
        style={{ 
          backdropFilter: "blur(8px)", 
          WebkitBackdropFilter: "blur(8px)",
          borderRadius: "0 0 20px 20px",
          marginLeft: "16px",
          marginRight: "16px",
          width: "calc(100% - 32px)"
        }}
      >
        <div className="px-4 py-6 flex flex-col space-y-4">
          <div className="relative">
            <button
              className="text-gray-300 hover:text-gray-100 flex items-center justify-between w-full text-left text-sm py-2"
              onClick={() => toggleMobileDropdown("features")}
              aria-expanded={mobileDropdowns.features}
            >
              Features
              <ChevronDown
                className={`ml-2 w-3 h-3 transition-transform duration-200 ${
                  mobileDropdowns.features ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`pl-4 space-y-2 mt-2 overflow-hidden transition-all duration-300 ease-in-out ${
                mobileDropdowns.features
                  ? "max-h-[220px] opacity-100 pointer-events-auto"
                  : "max-h-0 opacity-0 pointer-events-none"
              }`}
            >
              <a href="#" className="block text-gray-300 hover:text-gray-100 text-sm py-1 transition">
                Real-time Matching
              </a>
              <a href="#" className="block text-gray-300 hover:text-gray-100 text-sm py-1 transition">
                Route Optimization
              </a>
              <a href="#" className="block text-gray-300 hover:text-gray-100 text-sm py-1 transition">
                Impact Analytics
              </a>
            </div>
          </div>

          <div className="relative">
            <button
              className="text-gray-300 hover:text-gray-100 flex items-center justify-between w-full text-left text-sm py-2"
              onClick={() => toggleMobileDropdown("programs")}
              aria-expanded={mobileDropdowns.programs}
            >
              Programs
              <ChevronDown
                className={`ml-2 w-3 h-3 transition-transform duration-200 ${
                  mobileDropdowns.programs ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`pl-4 space-y-2 mt-2 overflow-hidden transition-all duration-300 ease-in-out ${
                mobileDropdowns.programs
                  ? "max-h-[200px] opacity-100 pointer-events-auto"
                  : "max-h-0 opacity-0 pointer-events-none"
              }`}
            >
              <a href="#" className="block text-gray-300 hover:text-gray-100 text-sm py-1 transition">
                Donor Onboarding
              </a>
              <a href="#" className="block text-gray-300 hover:text-gray-100 text-sm py-1 transition">
                Nonprofit Network
              </a>
            </div>
          </div>

          <div className="relative">
            <button
              className="text-gray-300 hover:text-gray-100 flex items-center justify-between w-full text-left text-sm py-2"
              onClick={() => toggleMobileDropdown("resources")}
              aria-expanded={mobileDropdowns.resources}
            >
              Resources
              <ChevronDown
                className={`ml-2 w-3 h-3 transition-transform duration-200 ${
                  mobileDropdowns.resources ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`pl-4 space-y-2 mt-2 overflow-hidden transition-all duration-300 ease-in-out ${
                mobileDropdowns.resources
                  ? "max-h-[250px] opacity-100 pointer-events-auto"
                  : "max-h-0 opacity-0 pointer-events-none"
              }`}
            >
              <a href="#" className="block text-gray-300 hover:text-gray-100 text-sm py-1 transition">
                Blog
              </a>
              <a href="#" className="block text-gray-300 hover:text-gray-100 text-sm py-1 transition">
                Docs
              </a>
              <a href="#" className="block text-gray-300 hover:text-gray-100 text-sm py-1 transition">
                Support
              </a>
            </div>
          </div>

          <a href="#" className="text-gray-300 hover:text-gray-100 text-sm py-2 transition">
            Pricing
          </a>
          <a href="#" className="text-gray-300 hover:text-gray-100 text-sm py-2 transition">
            Contact Sales
          </a>
          <a href="/auth/login" className="text-gray-300 hover:text-gray-100 text-sm py-2 transition">
            Sign In
          </a>
        </div>
      </div>
    </nav>
  )
}