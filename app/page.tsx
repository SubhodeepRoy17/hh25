"use client"

import  HeroSection  from "../components/hero-section"
import  Navbar  from "../components/navbar"
import  Features  from "../components/features"
import  Testimonials  from "../components/testimonials"
import  Footer  from "../components/footer"
import RealImpactStories from "@/components/real-stories"
import { useState } from "react"

export default function Page() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userType, setUserType] = useState<"donor" | "receiver" | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        isLoggedIn={isLoggedIn} 
        userType={userType} 
        setIsLoggedIn={setIsLoggedIn} 
        setUserType={setUserType} 
      />
      <HeroSection />
      <Features />
      <Testimonials />
      <RealImpactStories/>
      <Footer />
    </div>
  )
}