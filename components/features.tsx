"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { type LucideIcon, MapIcon, Bell, Activity, Blocks, ChevronLeft, ChevronRight } from "lucide-react"
import type { ReactNode } from "react"
import StarBorder from "@/components/ui/star-border"
import { useState, useEffect } from "react"

export function Features() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const features = [
    {
      icon: MapIcon,
      title: "Real-Time Tracking",
      description: "Live GPS across donors, drivers, and drop-off sites to keep every rescue on schedule.",
      image: "/placeholder.svg?height=929&width=1207"
    },
    {
      icon: Bell,
      title: "Dynamic Alerts",
      description: "Instant notifications for pick-up windows, delays, and temperature thresholds.",
      image: "/placeholder.svg?height=929&width=1207"
    },
    {
      icon: Activity,
      title: "Impact Dashboard",
      description: "Track meals delivered, CO2e saved, donors engaged, and zero‑waste milestones.",
      image: "/placeholder.svg?height=929&width=1207"
    },
    {
      icon: Blocks,
      title: "Blockchain Rewards",
      description: "Transparent, tokenized incentives for verified deliveries and donor participation.",
      image: "/placeholder.svg?height=929&width=1207"
    }
  ]

  const nextFeature = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % features.length)
  }

  const prevFeature = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + features.length) % features.length)
  }

  return (
    <section className="bg-black pb-16 pt-6">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-5xl">
        <div className="mx-auto mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Platform features
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built for food rescue at scale
          </h2>
          <p className="mt-2 text-gray-300">
            Four pillars that reduce waste, increase transparency, and maximize impact.
          </p>
        </div>

        {/* Desktop Grid */}
        <div className="hidden lg:grid gap-4 lg:grid-cols-2">
          {features.map((feature, index) => (
            <FeatureCard key={index}>
              <CardHeader className="pb-3">
                <CardHeading
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              </CardHeader>
              <div className="relative mb-6 border-t border-dashed border-gray-700 sm:mb-0">
                <div className="absolute inset-0 [background:radial-gradient(125%_125%_at_50%_0%,transparent_40%,rgba(16,185,129,0.08),transparent_125%)]"></div>
                <div className="aspect-[76/59] p-1 px-6">
                  <DualModeImage
                    darkSrc={feature.image}
                    lightSrc={feature.image}
                    alt={`${feature.title} illustration`}
                    width={1207}
                    height={929}
                  />
                </div>
              </div>
            </FeatureCard>
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="lg:hidden relative">
          <div className="overflow-hidden">
            <div className="flex transition-transform duration-300" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
              {features.map((feature, index) => (
                <div key={index} className="w-full flex-shrink-0 px-2">
                  <FeatureCard>
                    <CardHeader className="pb-3">
                      <CardHeading
                        icon={feature.icon}
                        title={feature.title}
                        description={feature.description}
                      />
                    </CardHeader>
                    <div className="relative mb-6 border-t border-dashed border-gray-700 sm:mb-0">
                      <div className="absolute inset-0 [background:radial-gradient(125%_125%_at_50%_0%,transparent_40%,rgba(16,185,129,0.08),transparent_125%)]"></div>
                      <div className="aspect-[76/59] p-1 px-6">
                        <DualModeImage
                          darkSrc={feature.image}
                          lightSrc={feature.image}
                          alt={`${feature.title} illustration`}
                          width={1207}
                          height={929}
                        />
                      </div>
                    </div>
                  </FeatureCard>
                </div>
              ))}
            </div>
          </div>
          
          {/* Navigation Arrows */}
          <button 
            onClick={prevFeature}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-gray-800 rounded-full p-2 shadow-lg z-10"
            aria-label="Previous feature"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <button 
            onClick={nextFeature}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-gray-800 rounded-full p-2 shadow-lg z-10"
            aria-label="Next feature"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
          
          {/* Indicators */}
          <div className="flex justify-center mt-4 space-x-2">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 w-2 rounded-full ${currentIndex === index ? 'bg-emerald-400' : 'bg-gray-600'}`}
                aria-label={`Go to feature ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

interface FeatureCardProps {
  children: ReactNode
  className?: string
}
const FeatureCard = ({ children, className }: FeatureCardProps) => (
  <StarBorder as="div" className="block rounded-xl" color="rgba(16,185,129,0.9)" speed="6s" thickness={2}>
    <Card
      className={cn(
        "group relative rounded-xl border-gray-700 bg-gray-800 shadow-lg",
        className,
      )}
    >
      <CardDecorator />
      {children}
    </Card>
  </StarBorder>
)

const CardDecorator = () => (
  <>
    <span className="absolute -left-px -top-px block size-2 border-l-2 border-t-2 border-emerald-400"></span>
    <span className="absolute -right-px -top-px block size-2 border-r-2 border-t-2 border-emerald-400"></span>
    <span className="absolute -bottom-px -left-px block size-2 border-b-2 border-l-2 border-emerald-400"></span>
    <span className="absolute -bottom-px -right-px block size-2 border-b-2 border-r-2 border-emerald-400"></span>
  </>
)

interface CardHeadingProps {
  icon: LucideIcon
  title: string
  description: string
}
const CardHeading = ({ icon: Icon, title, description }: CardHeadingProps) => (
  <div className="p-6">
    <span className="flex items-center gap-2 text-gray-200">
      <Icon className="size-4 text-emerald-300" />
      <span>{title}</span>
    </span>
    <p className="mt-6 text-xl font-semibold text-white">{description}</p>
  </div>
)

interface DualModeImageProps {
  darkSrc: string
  lightSrc: string
  alt: string
  width: number
  height: number
  className?: string
}
const DualModeImage = ({ darkSrc, lightSrc, alt, width, height, className }: DualModeImageProps) => (
  <>
    <img
      src={darkSrc || "/placeholder.svg"}
      className={cn("w-full", className)}
      alt={`${alt} dark`}
      width={width}
      height={height}
    />
  </>
)