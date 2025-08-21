"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react"

export default function Testimonials() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Campus Canteen Manager",
      image: "/asian-woman-smiling.png",
      quote:
        "Smart Surplus helped us reduce food waste by 75% while feeding 200+ students weekly. The platform is incredibly easy to use.",
    },
    {
      name: "Marcus Johnson",
      role: "Student Council President",
      image: "/black-male-student.png",
      quote:
        "As a student, I've saved over $300 on meals this semester. The real-time notifications are a game-changer.",
    },
    {
      name: "Dr. Priya Sharma",
      role: "Sustainability Coordinator",
      image: "/indian-woman-professional.png",
      quote:
        "Our campus carbon footprint decreased by 40% since implementing Smart Surplus. The environmental impact is remarkable.",
    },
    {
      name: "Alex Rivera",
      role: "Event Organizer",
      image: "/hispanic-person-smiling.png",
      quote:
        "Event surplus food now reaches students within minutes instead of going to waste. Setup took only 15 minutes.",
    },
    {
      name: "Emma Thompson",
      role: "NGO Volunteer Coordinator",
      image: "/blonde-woman-volunteer.png",
      quote: "We've distributed 5,000+ meals to food-insecure students. The pickup coordination system is flawless.",
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [testimonials.length])

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 bg-gray-900 text-white relative overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-green-500/20 backdrop-blur-sm rounded-full px-3 py-1.5 sm:px-4 sm:py-2 mb-4 sm:mb-6">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-xs sm:text-sm text-green-300">What partners are saying</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            Impact felt in every community
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto px-4">
            Students, nonprofits, and campus programs use Smart Surplus to turn excess into meals.
          </p>
        </div>

        <div className="relative">
          <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
            <div className="absolute inset-0 flex items-center justify-center">
              {testimonials.map((testimonial, index) => {
                const isActive = index === currentTestimonial
                const isPrev = index === (currentTestimonial - 1 + testimonials.length) % testimonials.length
                const isNext = index === (currentTestimonial + 1) % testimonials.length

                let position = "opacity-0 scale-75"
                let zIndex = 1

                if (isActive) {
                  position = "opacity-100 scale-100 z-30"
                  zIndex = 30
                } else if (isPrev) {
                  position = "opacity-60 scale-90 -translate-x-32 sm:-translate-x-64 z-20 hidden sm:block"
                  zIndex = 20
                } else if (isNext) {
                  position = "opacity-60 scale-90 translate-x-32 sm:translate-x-64 z-20 hidden sm:block"
                  zIndex = 20
                }

                return (
                  <div
                    key={index}
                    className={`absolute transition-all duration-1000 ease-in-out ${position}`}
                    style={{ zIndex }}
                  >
                    <Card
                      className={`w-80 sm:w-96 mx-4 ${isActive ? "bg-gray-800 border-gray-700" : "bg-gray-700 border-gray-600"} text-white hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 hover:border-green-400/50 transition-all duration-300 ease-out cursor-pointer group`}
                    >
                      <CardContent className="p-6 sm:p-8">
                        <div className="flex items-start gap-4 mb-6">
                          <img
                            src={testimonial.image || "/placeholder.svg"}
                            alt={testimonial.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover group-hover:scale-110 group-hover:ring-2 group-hover:ring-green-400/50 transition-all duration-300"
                          />
                          <div>
                            <h4 className="font-semibold text-white group-hover:text-green-300 transition-colors duration-300 text-sm sm:text-base">
                              {testimonial.name}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-300 group-hover:text-gray-200 transition-colors duration-300">
                              {testimonial.role}
                            </p>
                          </div>
                        </div>
                        <blockquote className="text-sm sm:text-lg leading-relaxed group-hover:text-gray-100 transition-colors duration-300">
                          "{testimonial.quote}"
                        </blockquote>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-6 sm:mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 hover:scale-150 hover:shadow-lg hover:shadow-green-400/50 ${
                  index === currentTestimonial ? "bg-green-400 w-6 sm:w-8" : "bg-gray-600 hover:bg-green-500"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}