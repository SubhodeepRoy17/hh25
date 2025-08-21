"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const SQRT_5000 = Math.sqrt(5000)

// Smart Surplus–themed student/NGO quotes
const testimonials = [
  {
    tempId: 0,
    testimonial: "Saved 500 meals last semester! Our campus pantry is thriving.",
    by: "Maya, Student Volunteer at Campus Food Rescue",
    imgSrc: "https://i.pravatar.cc/150?img=1",
  },
  {
    tempId: 1,
    testimonial: "Cut cafeteria waste by 40% in 3 months. Students notice the difference.",
    by: "James, Sustainability Coordinator at Northview High",
    imgSrc: "https://i.pravatar.cc/150?img=2",
  },
  {
    tempId: 2,
    testimonial: "2,300 meals delivered this month with Smart Surplus routing.",
    by: "Lina, Logistics Lead at City Food Bank",
    imgSrc: "https://i.pravatar.cc/150?img=3",
  },
  {
    tempId: 3,
    testimonial: "Donors love the transparency and instant tax receipts.",
    by: "Priya, Executive Director at CommunityBite",
    imgSrc: "https://i.pravatar.cc/150?img=4",
  },
  {
    tempId: 4,
    testimonial: "Route planning shaved 25% off fuel costs for our volunteers.",
    by: "Ahmed, Driver Lead at Neighborhood Kitchens",
    imgSrc: "https://i.pravatar.cc/150?img=5",
  },
  {
    tempId: 5,
    testimonial: "Blockchain rewards keep our volunteer turnout high every week.",
    by: "Rosa, Program Manager at GreenPlate Initiative",
    imgSrc: "https://i.pravatar.cc/150?img=6",
  },
  {
    tempId: 6,
    testimonial: "Setup took one afternoon; impact was immediate.",
    by: "Ben, Operations at Meals4All",
    imgSrc: "https://i.pravatar.cc/150?img=7",
  },
  {
    tempId: 7,
    testimonial: "Temperature alerts protect food safety on every trip.",
    by: "Dr. Park, Food Safety Advisor",
    imgSrc: "https://i.pravatar.cc/150?img=8",
  },
]

interface TestimonialCardProps {
  position: number
  testimonial: (typeof testimonials)[0]
  handleMove: (steps: number) => void
  cardSize: number
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ position, testimonial, handleMove, cardSize }) => {
  const isCenter = position === 0
  return (
    <div
      onClick={() => handleMove(position)}
      className={cn(
        "absolute left-1/2 top-1/2 cursor-pointer border-2 p-8 transition-all duration-500 ease-in-out rounded-md",
        isCenter
          ? "z-10 bg-primary text-primary-foreground border-primary"
          : "z-0 bg-card text-card-foreground border-border hover:border-primary/50",
      )}
      style={{
        width: cardSize,
        height: cardSize,
        clipPath:
          "polygon(50px 0%, calc(100% - 50px) 0%, 100% 50px, 100% 100%, calc(100% - 50px) 100%, 50px 100%, 0 100%, 0 0)",
        transform: `translate(-50%, -50%) translateX(${(cardSize / 1.5) * position}px) translateY(${
          isCenter ? -65 : position % 2 ? 15 : -15
        }px) rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)`,
        boxShadow: isCenter ? "0px 8px 0px 4px hsl(var(--border))" : "0px 0px 0px 0px transparent",
      }}
    >
      <span
        className="absolute block origin-top-right rotate-45 bg-border"
        style={{
          right: -2,
          top: 48,
          width: SQRT_5000,
          height: 2,
        }}
      />
      <img
        src={testimonial.imgSrc || "/placeholder.svg"}
        alt={`${testimonial.by.split(",")[0]}`}
        className="mb-4 h-14 w-12 bg-muted object-cover object-top"
        style={{
          boxShadow: "3px 3px 0px hsl(var(--background))",
        }}
      />
      <h3 className={cn("text-base sm:text-xl font-medium", isCenter ? "text-primary-foreground" : "text-foreground")}>
        "{testimonial.testimonial}"
      </h3>
      <p
        className={cn(
          "absolute bottom-8 left-8 right-8 mt-2 text-sm italic",
          isCenter ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        - {testimonial.by}
      </p>
    </div>
  )
}

export const StaggerTestimonials: React.FC = () => {
  const [cardSize, setCardSize] = useState(365)
  const [testimonialsList, setTestimonialsList] = useState(testimonials)

  const handleMove = (steps: number) => {
    const newList = [...testimonialsList]
    if (steps > 0) {
      for (let i = steps; i > 0; i--) {
        const item = newList.shift()
        if (!item) return
        newList.push({ ...item, tempId: Math.random() })
      }
    } else {
      for (let i = steps; i < 0; i++) {
        const item = newList.pop()
        if (!item) return
        newList.unshift({ ...item, tempId: Math.random() })
      }
    }
    setTestimonialsList(newList)
  }

  useEffect(() => {
    const updateSize = () => {
      const { matches } = window.matchMedia("(min-width: 640px)")
      setCardSize(matches ? 365 : 290)
    }
    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  return (
    <div
      className="relative w-full overflow-hidden bg-muted/30 rounded-2xl border border-gray-800"
      style={{ height: 600 }}
    >
      {testimonialsList.map((testimonial, index) => {
        const position =
          testimonialsList.length % 2 ? index - (testimonialsList.length + 1) / 2 : index - testimonialsList.length / 2
        return (
          <TestimonialCard
            key={testimonial.tempId}
            testimonial={testimonial}
            handleMove={handleMove}
            position={position}
            cardSize={cardSize}
          />
        )
      })}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        <button
          onClick={() => handleMove(-1)}
          className={cn(
            "flex h-14 w-14 items-center justify-center text-2xl rounded-md",
            "bg-black border-2 border-gray-700",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
          )}
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="text-white" />
        </button>
        <button
          onClick={() => handleMove(1)}
          className={cn(
            "flex h-14 w-14 items-center justify-center text-2xl rounded-md",
            "bg-black border-2 border-gray-700",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
          )}
          aria-label="Next testimonial"
        >
          <ChevronRight className="text-white" />
        </button>
      </div>
    </div>
  )
}
