import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Bell, BarChart3, Award } from "lucide-react"

export default function Features() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-4">
          <Badge variant="secondary" className="mb-4 bg-green-100 text-green-800 hover:bg-green-200">
            Platform Features
          </Badge>
        </div>

        <div className="text-center space-y-4 mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
            Built for <span className="text-green-600">food rescue</span> at{" "}
            <span className="text-green-500">scale</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-4">
            Four pillars that reduce waste, increase transparency, and maximize impact.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <Card className="text-center border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 hover:scale-105 border border-green-100">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <CardTitle className="text-base sm:text-lg font-bold text-gray-900 mb-3">Real-Time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm leading-relaxed text-gray-700">
                Live GPS across donors, drivers, and drop-off sites to keep every rescue on schedule.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 hover:scale-105 border border-green-100">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <CardTitle className="text-base sm:text-lg font-bold text-gray-900 mb-3">Dynamic Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm leading-relaxed text-gray-700">
                Instant notifications for pick-up windows, delays, and temperature thresholds.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 hover:scale-105 border border-green-100">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <CardTitle className="text-base sm:text-lg font-bold text-gray-900 mb-3">Impact Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm leading-relaxed text-gray-700">
                Track meals delivered, CO2e saved, donors engaged, and zero‑waste milestones.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300 hover:scale-105 border border-green-100">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Award className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <CardTitle className="text-base sm:text-lg font-bold text-gray-900 mb-3">Blockchain Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm leading-relaxed text-gray-700">
                Transparent, tokenized incentives for verified deliveries and donor participation.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}