"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

export default function RealImpactStories() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (!containerRef.current || isPaused) return

    const container = containerRef.current
    const scrollWidth = container.scrollWidth
    const clientWidth = container.clientWidth
    let scrollPosition = 0

    const scroll = () => {
      if (isPaused) return

      scrollPosition += 1
      if (scrollPosition >= scrollWidth - clientWidth) {
        scrollPosition = 0
      }
      container.scrollTo({ left: scrollPosition, behavior: "auto" })
    }

    const interval = setInterval(scroll, 30)
    return () => clearInterval(interval)
  }, [isPaused])

  return (
    <div className="py-12 sm:py-16 lg:py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-green-100 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 mb-4 sm:mb-6">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs sm:text-sm font-medium text-green-700">Community Impact</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Real Impact Stories
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto px-4">
            See how Smart Surplus connects surplus food with families in need, creating meaningful change in our
            community.
          </p>
        </div>

        <div className="relative">
          <div
            ref={containerRef}
            className="h-60 sm:h-72 md:h-80 overflow-hidden rounded-xl sm:rounded-2xl bg-green-50 shadow-lg border-2 border-green-100"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="flex gap-2 sm:gap-4 h-full">
              {/* First set of images */}
              {[
                {
                  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20250525_164312.jpg-MJFVa01rTB8mymNZCsKI4FtgBajwiJ.jpeg",
                  alt: "Community food distribution",
                  title: "Community Distribution",
                },
                {
                  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-08-20%20at%2013.41.14_55426202.jpg-9PxEaKjKVoXaTCd4kAhM2Z9QasEjoI.jpeg",
                  alt: "Children receiving food packages",
                  title: "Supporting Children",
                },
                {
                  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-08-20%20at%2013.41.13_2b7569ca.jpg-9t2y6dAexfWdPmVvIKGD3C6aO9v7h8.jpeg",
                  alt: "Food sharing between community members",
                  title: "Sharing Together",
                },
                {
                  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20250525_164334.jpg-TzSVkmHRDmVl2Gr4ZtQyquSXw3np6Z.jpeg",
                  alt: "Food distribution to elderly",
                  title: "Caring for Elders",
                },
                {
                  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-08-20%20at%2013.41.11_d9861415.jpg-ppOKa8KOVFJrqHE6M4LXbkCkxU6do5.jpeg",
                  alt: "Happy child with food package",
                  title: "Bringing Joy",
                },
                {
                  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-08-20%20at%2013.41.16_467c9f6d.jpg-701GTrmNpuBzeiOMeiwhnPE98PlKap.jpeg",
                  alt: "Children holding food packages",
                  title: "Bright Futures",
                },
                {
                  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20250525_164512.jpg-JWLQVt58RbpV5DYcPdFWnKfen8t5pl.jpeg",
                  alt: "Boy with food package",
                  title: "Creating Change",
                },
                {
                  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-08-20%20at%2013.41.15_cdf5fd9b.jpg-Hxvbn45u0EUf8uX9PdeAaavPrkvKiy.jpeg",
                  alt: "Group of children with food",
                  title: "Strong Communities",
                },
                {
                  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1.jpg-EmjCRjRwPR0CHL8dymRa6jv6zaKLrR.jpeg",
                  alt: "Food distribution in community",
                  title: "Neighbors Helping",
                },
                {
                  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-08-20%20at%2013.41.14_d344feef.jpg-mcIi6Q8Bhyv3oa6RCFrakmOMpBe4Qw.jpeg",
                  alt: "Young girl receiving food assistance",
                  title: "Hope for Tomorrow",
                },
                {
                  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-08-20%20at%2013.41.13_c82c0093.jpg-ZFf4vYqHlQbRzWcTFhpxwvp2tHuue6.jpeg",
                  alt: "Elderly community members receiving food packages",
                  title: "Supporting Elders",
                },
                {
                  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-08-20%20at%2013.41.13_c8dca9e2.jpg-1vLaSPKBijvlC6dGXF5pRL5NXsmxc8.jpeg",
                  alt: "Young adults sharing food in community",
                  title: "Peer Support",
                },
              ].map((image, index) => (
                <div key={index} className="relative flex-shrink-0 w-48 sm:w-60 md:w-72 h-full group cursor-pointer">
                  <img
                    src={image.src || "/placeholder.svg"}
                    alt={image.alt}
                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-green-900/0 group-hover:bg-green-900/60 transition-all duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="text-white font-semibold text-sm sm:text-lg">{image.title}</h3>
                    </div>
                  </div>
                </div>
              ))}

              {/* Duplicate set for infinite scroll */}
              {[
                {
                  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20250525_164312.jpg-MJFVa01rTB8mymNZCsKI4FtgBajwiJ.jpeg",
                  alt: "Community food distribution",
                  title: "Community Distribution",
                },
                {
                  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-08-20%20at%2013.41.14_55426202.jpg-9PxEaKjKVoXaTCd4kAhM2Z9QasEjoI.jpeg",
                  alt: "Children receiving food packages",
                  title: "Supporting Children",
                },
                {
                  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-08-20%20at%2013.41.13_2b7569ca.jpg-9t2y6dAexfWdPmVvIKGD3C6aO9v7h8.jpeg",
                  alt: "Food sharing between community members",
                  title: "Sharing Together",
                },
                {
                  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20250525_164334.jpg-TzSVkmHRDmVl2Gr4ZtQyquSXw3np6Z.jpeg",
                  alt: "Food distribution to elderly",
                  title: "Caring for Elders",
                },
                {
                  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-08-20%20at%2013.41.11_d9861415.jpg-ppOKa8KOVFJrqHE6M4LXbkCkxU6do5.jpeg",
                  alt: "Happy child with food package",
                  title: "Bringing Joy",
                },
                {
                  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-08-20%20at%2013.41.16_467c9f6d.jpg-701GTrmNpuBzeiOMeiwhnPE98PlKap.jpeg",
                  alt: "Children holding food packages",
                  title: "Bright Futures",
                },
                {
                  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20250525_164512.jpg-JWLQVt58RbpV5DYcPdFWnKfen8t5pl.jpeg",
                  alt: "Boy with food package",
                  title: "Creating Change",
                },
                {
                  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-08-20%20at%2013.41.15_cdf5fd9b.jpg-Hxvbn45u0EUf8uX9PdeAaavPrkvKiy.jpeg",
                  alt: "Group of children with food",
                  title: "Strong Communities",
                },
                {
                  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1.jpg-EmjCRjRwPR0CHL8dymRa6jv6zaKLrR.jpeg",
                  alt: "Food distribution in community",
                  title: "Neighbors Helping",
                },
                {
                  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-08-20%20at%2013.41.14_d344feef.jpg-mcIi6Q8Bhyv3oa6RCFrakmOMpBe4Qw.jpeg",
                  alt: "Young girl receiving food assistance",
                  title: "Hope for Tomorrow",
                },
                {
                  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-08-20%20at%2013.41.13_c82c0093.jpg-ZFf4vYqHlQbRzWcTFhpxwvp2tHuue6.jpeg",
                  alt: "Elderly community members receiving food packages",
                  title: "Supporting Elders",
                },
                {
                  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-08-20%20at%2013.41.13_c8dca9e2.jpg-1vLaSPKBijvlC6dGXF5pRL5NXsmxc8.jpeg",
                  alt: "Young adults sharing food in community",
                  title: "Peer Support",
                },
              ].map((image, index) => (
                <div
                  key={`duplicate-${index}`}
                  className="relative flex-shrink-0 w-48 sm:w-60 md:w-72 h-full group cursor-pointer"
                >
                  <img
                    src={image.src || "/placeholder.svg"}
                    alt={image.alt}
                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-green-900/0 group-hover:bg-green-900/60 transition-all duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="text-white font-semibold text-sm sm:text-lg">{image.title}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mt-8 sm:mt-12">
          <p className="text-gray-600 mb-4 sm:mb-6 max-w-2xl mx-auto px-4 text-sm sm:text-base">
            Join our community and help create more stories of hope and connection.
          </p>
          <Button
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            asChild
          >
            <Link href="/auth/register">Get Started Today</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}