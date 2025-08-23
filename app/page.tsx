"use client"

import { useState } from "react"
import Navbar from "../components/navbar"
import HeroSection from "../components/hero-section"
import Features from "../components/features"
import RealImpactStories from "../components/real-stories"
import Footer from "../components/footer"
import Testimonials from "@/components/testimonials"

export default function Page() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userType, setUserType] = useState<"donor" | "receiver" | null>(null)

  return (
    <div className="min-h-screen bg-white">
      <Navbar isLoggedIn={isLoggedIn} userType={userType} setIsLoggedIn={setIsLoggedIn} setUserType={setUserType} />
      <HeroSection />
      <Features />
      <Testimonials />
      <RealImpactStories />
      <Footer />
    </div>
  )
}