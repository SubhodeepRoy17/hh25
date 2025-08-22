import { Button } from "@/components/ui/button"
import { Leaf } from "lucide-react"
import Link from "next/link"

export default function HeroSection() {
  return (
    <section className="relative min-h-[500px] sm:min-h-[600px] lg:min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/food-redistribution-video.mp4" type="video/mp4" />
          {/* Fallback image if video doesn't load */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('/food-surplus-basket.png')`,
            }}
          ></div>
        </video>
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      <div className="relative z-10 text-center text-white px-4 w-full max-w-6xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 sm:px-4 sm:py-2 mb-4 sm:mb-6">
          <Leaf className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-xs sm:text-sm">Zero-Waste Campus Initiative</span>
        </div>
        
        {/* Wider background box */}
        <div className="bg-black/40 backdrop-blur-sm rounded-lg p-6 mb-8 w-full max-w-full mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6">
            WELCOME TO SMART SURPLUS
          </h1>

          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-4 sm:mb-6 text-blue-200">
            Smart Food Redistribution for Zero-Waste Campus
          </h2>

          <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
            Connect surplus food from campus canteens, hostels, and events with students and staff in need. Track,
            redistribute, and manage food waste through our intelligent platform.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 rounded-full px-6 sm:px-8 w-full sm:w-auto"
            asChild
          >
            <Link href="/auth/register?type=donor">List Surplus Food</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-gray-900 rounded-full px-6 sm:px-8 bg-transparent w-full sm:w-auto"
            asChild
          >
            <Link href="/auth/register?type=receiver">Find Available Food</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}