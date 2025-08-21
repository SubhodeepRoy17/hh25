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
  Calendar,
  MapPin,
  Upload,
  Clock,
  Leaf,
  Coffee,
  Salad,
  Snowflake,
  Package2,
  Zap,
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

  const foodTypes = [
    { id: "cooked", label: "Cooked meals", icon: Utensils },
    { id: "produce", label: "Produce", icon: Leaf },
    { id: "bakery", label: "Bakery", icon: Coffee },
    { id: "packaged", label: "Packaged", icon: Package },
    { id: "beverages", label: "Beverages", icon: Coffee },
    { id: "mixed", label: "Mixed", icon: Salad },
    { id: "vegetarian", label: "Vegetarian", icon: Leaf },
    { id: "vegan", label: "Vegan", icon: Leaf },
  ]

  const freshnessOptions = [
    { id: "fresh-hot", label: "Fresh (hot)", icon: Zap },
    { id: "fresh-chilled", label: "Fresh (chilled)", icon: Thermometer },
    { id: "frozen", label: "Frozen", icon: Snowflake },
    { id: "room-temp", label: "Room temp", icon: Thermometer },
    { id: "packaged", label: "Packaged/Sealed", icon: Package2 },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Utensils className="h-4 w-4" />
            New listing
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-sans text-foreground mb-2">List surplus food</h1>
          <p className="text-lg text-muted-foreground font-serif">
            Canteens, hostels, and event organizers can share excess food with the community.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-8">
          {/* Left column: Form */}
          <form onSubmit={onSubmit} className="space-y-8">
            {/* Details Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-sans">
                  <Utensils className="h-5 w-5 text-primary" />
                  Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g. 60 hot vegetarian meals from campus canteen"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={cn(errors.title && "border-red-500")}
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                {/* Food Type */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Food type</Label>
                  <div className="flex flex-wrap gap-2">
                    {foodTypes.map((type) => {
                      const Icon = type.icon
                      const isSelected = types.includes(type.id as FoodType)
                      return (
                        <Button
                          key={type.id}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleType(type.id as FoodType)}
                          className="flex items-center gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </Button>
                      )
                    })}
                  </div>
                  {errors.types && <p className="text-red-500 text-sm mt-1">{errors.types}</p>}
                </div>

                {/* Quantity */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="quantity" className="text-sm font-medium">
                      Quantity
                    </Label>
                    <Input
                      id="quantity"
                      placeholder="e.g. 60"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                      className={cn(errors.quantity && "border-red-500")}
                    />
                    {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit" className="text-sm font-medium">
                      Unit
                    </Label>
                    <Select value={unit} onValueChange={(v) => setUnit(v as QuantityUnit)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meals">Meals</SelectItem>
                        <SelectItem value="kg">Kilograms</SelectItem>
                        <SelectItem value="trays">Trays</SelectItem>
                        <SelectItem value="boxes">Boxes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Freshness Status */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Freshness status</Label>
                  <div className="flex flex-wrap gap-2">
                    {freshnessOptions.map((option) => {
                      const Icon = option.icon
                      const isSelected = freshness === option.id
                      return (
                        <Button
                          key={option.id}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFreshness(option.id as Freshness)}
                          className="flex items-center gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Availability Window */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-sans">
                  <Calendar className="h-5 w-5 text-primary" />
                  Availability window
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="available-from" className="text-sm font-medium">
                      Available from
                    </Label>
                    <Input
                      id="available-from"
                      type="datetime-local"
                      value={availableFrom}
                      onChange={(e) => setAvailableFrom(e.target.value)}
                      className={cn(errors.availableFrom && "border-red-500")}
                    />
                    {errors.availableFrom && <p className="text-red-500 text-sm mt-1">{errors.availableFrom}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="available-until" className="text-sm font-medium">
                      Available until
                    </Label>
                    <Input
                      id="available-until"
                      type="datetime-local"
                      value={availableUntil}
                      onChange={(e) => setAvailableUntil(e.target.value)}
                      className={cn(errors.availableUntil && "border-red-500")}
                    />
                    {errors.availableUntil && <p className="text-red-500 text-sm mt-1">{errors.availableUntil}</p>}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex items-center space-x-2">
                    <Switch id="partial-pickup" checked={allowPartial} onCheckedChange={setAllowPartial} />
                    <Label htmlFor="partial-pickup" className="text-sm">
                      Allow partial pickups
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="insulated-transport"
                      checked={requireInsulated}
                      onCheckedChange={setRequireInsulated}
                    />
                    <Label htmlFor="insulated-transport" className="text-sm">
                      Require insulated transport
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pickup & Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-sans">
                  <MapPin className="h-5 w-5 text-primary" />
                  Pickup & instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2 relative">
                  <Label htmlFor="pickup-location" className="text-sm font-medium">
                    Pickup location
                  </Label>
                  <div className="relative">
                    <Input
                      id="pickup-location"
                      placeholder="Start typing to search locations..."
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value)
                        setShowSuggestions(true)
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className={cn(errors.location && "border-red-500")}
                    />
                    {showSuggestions && locationSuggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                        {locationSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="px-4 py-2 hover:bg-muted cursor-pointer text-sm"
                            onClick={() => handleLocationSelect(suggestion)}
                          >
                            {suggestion.display_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickup-notes" className="text-sm font-medium">
                    Notes for pickup
                  </Label>
                  <Textarea
                    id="pickup-notes"
                    placeholder="Bring insulated cambros. Call security at gate B. Avoid 2-3pm rush."
                    rows={4}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Photos (optional)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <Input
                      id="photos"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setFiles(e.target.files)}
                      className="hidden"
                    />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('photos')?.click()}>
                      Choose Files
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">PNG, JPG up to 5MB each</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Publish Button */}
            <Button type="submit" disabled={isSubmitting} size="lg" className="w-full text-lg py-6">
              {isSubmitting ? "Publishing..." : "Publish listing"}
            </Button>
          </form>

          {/* Right column: Preview */}
          <aside className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-sans">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Utensils className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{title || "New listing"}</span>
                    </div>
                    <Badge variant="secondary">Draft</Badge>
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span>
                        {quantity || 0} {unitLabel[unit]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4" />
                      <span>{freshnessLabel[freshness]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        {availableFrom ? new Date(availableFrom).toLocaleString() : "Start time"} —{" "}
                        {availableUntil ? new Date(availableUntil).toLocaleString() : "End Time"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{location || "Pickup location"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default function ListingFoodPage(){
  return (
    <ProtectedRoute requiredRole="donor">
      <ListingFoodPageContent/>
    </ProtectedRoute>
  )
}