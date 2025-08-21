"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/components/ui/use-toast"
import {
  Utensils,
  Package,
  Thermometer,
  CalendarRange,
  MapPin,
  Truck,
  CheckCircle2,
  Clock4,
  ImageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type QuantityUnit = "meals" | "kg" | "trays" | "boxes"
type Freshness = "fresh-hot" | "fresh-chilled" | "frozen" | "room-temp" | "packaged"
type FoodType = "cooked" | "produce" | "bakery" | "packaged" | "beverages" | "mixed" | "vegetarian" | "vegan"

function ListingFoodPageContent() {
  const router = useRouter()
  const { toast } = useToast()

  // Form state
  const [title, setTitle] = useState("")
  const [types, setTypes] = useState<FoodType[]>([])
  const [quantity, setQuantity] = useState<number | "">("")
  const [unit, setUnit] = useState<QuantityUnit>("meals")
  const [freshness, setFreshness] = useState<Freshness>("fresh-hot")
  const [availableFrom, setAvailableFrom] = useState("")
  const [availableUntil, setAvailableUntil] = useState("")
  const [location, setLocation] = useState("")
  const [locationCoords, setLocationCoords] = useState({ lat: 0, lng: 0 })
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [instructions, setInstructions] = useState("")
  const [allowPartial, setAllowPartial] = useState(true)
  const [requireInsulated, setRequireInsulated] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [files, setFiles] = useState<FileList | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { user } = useAuth()

  // Fetch location suggestions from OpenStreetMap Nominatim API
  const fetchLocationSuggestions = async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/nominatim?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      const data = await response.json();
      setLocationSuggestions(data);
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
      // Optionally show user-friendly error message
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (location) {
        fetchLocationSuggestions(location)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [location])

  const handleLocationSelect = (suggestion: any) => {
    setLocation(suggestion.display_name);
    setLocationCoords({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    });
    setShowSuggestions(false);
    
    // Log to verify
    console.log("Selected location:", {
      address: suggestion.display_name,
      coordinates: {
        lat: parseFloat(suggestion.lat),
        lng: parseFloat(suggestion.lon)
      },
      geoPoint: {
        type: "Point",
        coordinates: [parseFloat(suggestion.lon), parseFloat(suggestion.lat)]
      }
    });
  };

  const toggleType = (val: FoodType) => {
    setTypes((prev) => (prev.includes(val) ? prev.filter((t) => t !== val) : [...prev, val]))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (title.trim().length < 3) e.title = "Add a short, clear title."
    if (types.length === 0) e.types = "Select at least one food type."
    if (quantity === "" || Number(quantity) <= 0) e.quantity = "Enter a valid quantity."
    if (!availableFrom) e.availableFrom = "Required."
    if (!availableUntil) e.availableUntil = "Required."
    if (availableFrom && availableUntil && new Date(availableUntil) <= new Date(availableFrom)) {
      e.availableUntil = "Must be after start time."
    }
    if (location.trim().length < 3) e.location = "Enter pickup location."
    if (locationCoords.lat === 0 && locationCoords.lng === 0) e.location = "Please select a valid location from suggestions."
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a listing",
        variant: "destructive",
      })
      router.push("/auth/login")
      return
    }
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('types', JSON.stringify(types))
      formData.append('quantity', quantity.toString())
      formData.append('unit', unit)
      formData.append('freshness', freshness)
      formData.append('availableFrom', availableFrom)
      formData.append('availableUntil', availableUntil)
      formData.append('location', JSON.stringify({
        address: location,
        coordinates: locationCoords,
        geoPoint: {  // Add this
          type: "Point",
          coordinates: [locationCoords.lng, locationCoords.lat]  // Note: [lng, lat]
        }
      }))
      formData.append('instructions', instructions)
      formData.append('allowPartial', allowPartial.toString())
      formData.append('requireInsulated', requireInsulated.toString())
      formData.append('createdBy', user.userId)
      if (files) {
        Array.from(files).forEach((file) => {
          formData.append('photos', file)
        })
      }

      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit listing')
      }

      toast({
        title: "Listing published",
        description: "Receivers nearby will be notified.",
      })

      router.push("/dashboard/donor/list-food/success")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish listing",
        variant: "destructive",
      })
      console.error('Submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const unitLabel: Record<QuantityUnit, string> = {
    meals: "meals",
    kg: "kg",
    trays: "trays",
    boxes: "boxes",
  }

  const freshnessLabel: Record<Freshness, string> = {
    "fresh-hot": "Fresh (hot)",
    "fresh-chilled": "Fresh (chilled)",
    frozen: "Frozen",
    "room-temp": "Room temp",
    packaged: "Packaged/Sealed",
  }

  const typeChips: { key: FoodType; label: string; icon: React.ReactNode }[] = [
    { key: "cooked", label: "Cooked meals", icon: <Utensils className="h-4 w-4" /> },
    { key: "produce", label: "Produce", icon: <Package className="h-4 w-4" /> },
    { key: "bakery", label: "Bakery", icon: <Package className="h-4 w-4" /> },
    { key: "packaged", label: "Packaged", icon: <Package className="h-4 w-4" /> },
    { key: "beverages", label: "Beverages", icon: <Package className="h-4 w-4" /> },
    { key: "mixed", label: "Mixed", icon: <Package className="h-4 w-4" /> },
    { key: "vegetarian", label: "Vegetarian", icon: <Package className="h-4 w-4" /> },
    { key: "vegan", label: "Vegan", icon: <Package className="h-4 w-4" /> },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        <div className="mb-8">
          <Badge className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-100 text-emerald-700 border-emerald-200 font-medium">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            New listing
          </Badge>
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6 mb-10">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
              List surplus <span className="text-emerald-600">food</span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
              Canteens, hostels, and event organizers can share excess food with the community.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-8">
          {/* Left column: Form */}
          <form onSubmit={onSubmit} className="space-y-8">
            <Card className="bg-white border-gray-200 shadow-lg">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Utensils className="h-5 w-5 text-emerald-600" />
                  </div>
                  Food Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-gray-700 font-medium">
                    Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., 60 hot vegetarian meals from campus canteen"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={cn(
                      "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 h-12",
                      errors.title && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                    )}
                  />
                  {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
                </div>

                <div className="space-y-3">
                  <Label className="text-gray-700 font-medium">Food type</Label>
                  <div className="flex flex-wrap gap-3">
                    {typeChips.map((t) => {
                      const active = types.includes(t.key)
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => toggleType(t.key)}
                          className={cn(
                            "px-4 py-2.5 rounded-xl border text-sm font-medium inline-flex items-center gap-2 transition-all duration-200",
                            active
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md"
                              : "border-gray-300 bg-white hover:border-emerald-400 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700",
                          )}
                          aria-pressed={active}
                        >
                          {t.icon}
                          {t.label}
                        </button>
                      )
                    })}
                  </div>
                  {errors.types && <p className="text-red-500 text-sm">{errors.types}</p>}
                </div>

                <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-gray-700 font-medium">
                      Quantity
                    </Label>
                    <Input
                      id="quantity"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g., 60"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                      className={cn(
                        "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 h-12",
                        errors.quantity && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                      )}
                    />
                    {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity}</p>}
                  </div>

                  <div className="hidden sm:block text-center text-gray-500 pb-4 font-medium">in</div>

                  <div className="space-y-2">
                    <Label htmlFor="unit" className="text-gray-700 font-medium">
                      Unit
                    </Label>
                    <Select value={unit} onValueChange={(v) => setUnit(v as QuantityUnit)}>
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500/20 h-12">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="meals" className="text-gray-900 hover:bg-gray-50">
                          Meals
                        </SelectItem>
                        <SelectItem value="kg" className="text-gray-900 hover:bg-gray-50">
                          kg
                        </SelectItem>
                        <SelectItem value="trays" className="text-gray-900 hover:bg-gray-50">
                          Trays
                        </SelectItem>
                        <SelectItem value="boxes" className="text-gray-900 hover:bg-gray-50">
                          Boxes
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-gray-700 font-medium">Freshness status</Label>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {(
                      [
                        ["fresh-hot", "Fresh (hot)"],
                        ["fresh-chilled", "Fresh (chilled)"],
                        ["frozen", "Frozen"],
                        ["room-temp", "Room temp"],
                        ["packaged", "Packaged/Sealed"],
                      ] as [Freshness, string][]
                    ).map(([val, label]) => {
                      const active = freshness === val
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFreshness(val)}
                          className={cn(
                            "px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2 justify-center transition-all duration-200",
                            active
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md"
                              : "border-gray-300 bg-white hover:border-emerald-400 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700",
                          )}
                          aria-pressed={active}
                        >
                          <Thermometer className="h-4 w-4" />
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-lg">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CalendarRange className="h-5 w-5 text-blue-600" />
                  </div>
                  Availability Window
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="from" className="text-gray-700 font-medium">
                      Available from
                    </Label>
                    <Input
                      id="from"
                      type="datetime-local"
                      value={availableFrom}
                      onChange={(e) => setAvailableFrom(e.target.value)}
                      className={cn(
                        "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 h-12",
                        errors.availableFrom && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                      )}
                    />
                    {errors.availableFrom && <p className="text-red-500 text-sm">{errors.availableFrom}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="until" className="text-gray-700 font-medium">
                      Available until
                    </Label>
                    <Input
                      id="until"
                      type="datetime-local"
                      value={availableUntil}
                      onChange={(e) => setAvailableUntil(e.target.value)}
                      className={cn(
                        "bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 h-12",
                        errors.availableUntil && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                      )}
                    />
                    {errors.availableUntil && <p className="text-red-500 text-sm">{errors.availableUntil}</p>}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch
                        id="allowPartial"
                        checked={allowPartial}
                        onCheckedChange={setAllowPartial}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                      <Label htmlFor="allowPartial" className="text-gray-700 font-medium">
                        Allow partial pickups
                      </Label>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch
                        id="insulated"
                        checked={requireInsulated}
                        onCheckedChange={setRequireInsulated}
                        className="data-[state=checked]:bg-orange-500"
                      />
                      <Label htmlFor="insulated" className="text-gray-700 font-medium">
                        Require insulated transport
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-lg">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-gray-900 text-xl">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-orange-600" />
                  </div>
                  Pickup & Instructions
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-2 relative">
                  <Label htmlFor="location" className="text-gray-700 font-medium">
                    Pickup location
                  </Label>
                  <div className="relative">
                    <Input
                      id="location"
                      placeholder="Start typing to search locations..."
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value)
                        setShowSuggestions(true)
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className={cn(
                        "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 h-12",
                        errors.location && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                      )}
                    />
                    {showSuggestions && locationSuggestions.length > 0 && (
                      <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-auto">
                        {locationSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
                            onClick={() => handleLocationSelect(suggestion)}
                          >
                            {suggestion.display_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions" className="text-gray-700 font-medium">
                    Notes for pickup
                  </Label>
                  <Textarea
                    id="instructions"
                    placeholder="Bring insulated cambros. Call security at gate B. Avoid 2–3pm rush."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 min-h-[120px] resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="photos" className="text-gray-700 font-medium">
                    Photos (optional)
                  </Label>
                  <div className="space-y-3">
                    <Input
                      id="photos"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setFiles(e.target.files)}
                      className="file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-emerald-600 transition-colors cursor-pointer bg-white border-gray-300 text-gray-700 h-12"
                    />
                    <div className="flex items-center gap-2 text-gray-600 text-sm bg-gray-50 rounded-lg p-3">
                      <ImageIcon className="h-4 w-4" />
                      <span>PNG, JPG up to 5MB each</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Publishing...
                </div>
              ) : (
                "Publish listing"
              )}
            </Button>
          </form>

          {/* Right column: Preview */}
          <aside className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-lg sticky top-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-gray-900 text-xl">Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Utensils className="h-5 w-5 text-emerald-600" />
                      </div>
                      <p className="font-semibold text-gray-900 text-lg">{title || "Untitled listing"}</p>
                    </div>
                    <Badge className="border-emerald-300 bg-emerald-100 text-emerald-700 font-medium">Draft</Badge>
                  </div>

                  <Separator className="bg-emerald-200" />

                  <div className="space-y-3 text-gray-700">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-emerald-600" />
                      <span className="font-medium">
                        {quantity || 0} {unitLabel[unit]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Thermometer className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">{freshnessLabel[freshness]}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock4 className="h-5 w-5 text-orange-600" />
                      <span className="text-sm">
                        {availableFrom ? new Date(availableFrom).toLocaleString() : "Start time"} —{" "}
                        {availableUntil ? new Date(availableUntil).toLocaleString() : "End Time"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-orange-600" />
                      <span className="truncate text-sm">{location || "Pickup location"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default function ListingFoodPage(){
  return (
    <ProtectedRoute requiredRole="donor">
      <ListingFoodPageContent/>
    </ProtectedRoute>
  )
}