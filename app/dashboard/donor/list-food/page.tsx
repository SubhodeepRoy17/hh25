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
  ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { connectWallet } from "@/lib/blockchain"

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
  const [isWalletConnected, setIsWalletConnected] = useState(false)

  // Check if wallet is connected on component mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setIsWalletConnected(true);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkWalletConnection();
  }, []);

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      setIsWalletConnected(true);
      toast({
        title: "Wallet Connected",
        description: "Your MetaMask wallet is now connected.",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Wallet Connection Failed",
        description: "Please install MetaMask or check your connection.",
        variant: "destructive",
      });
    }
  };

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

    if (!isWalletConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to publish on blockchain",
        variant: "destructive",
      })
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
        geoPoint: {
          type: "Point",
          coordinates: [locationCoords.lng, locationCoords.lat]
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
        description: "Your food listing has been published on the blockchain!",
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
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Back Button for Mobile */}
        <div className="lg:hidden mb-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        
        <div className="mb-6">
          <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800">New listing</Badge>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 md:gap-6 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">List surplus food</h1>
            <p className="text-gray-600 mt-1">
              Canteens, hostels, and event organizers can share excess food with the community.
            </p>
          </div>
        </div>

        {/* Wallet Connection Banner */}
        {!isWalletConnected && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-yellow-800">Connect your wallet</h3>
                <p className="text-yellow-700 text-sm">
                  To publish your food listing on the blockchain, please connect your MetaMask wallet.
                </p>
              </div>
              <Button
                onClick={handleConnectWallet}
                className="bg-yellow-500 hover:bg-yellow-600 text-white whitespace-nowrap"
              >
                Connect Wallet
              </Button>
            </div>
          </div>
        )}

        {/* Blockchain Status */}
        {isWalletConnected && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mr-2" />
              <span className="text-emerald-800">Wallet connected. Your listing will be published on the blockchain.</span>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-6">
          {/* Left column: Form */}
          <form onSubmit={onSubmit} className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Utensils className="h-5 w-5 text-emerald-600" />
                  Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label htmlFor="title" className="text-gray-700">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., 60 hot vegetarian meals from campus canteen"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={cn("mt-1 bg-white", errors.title && "border-red-500")}
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                <div>
                  <Label className="text-gray-700">Food type</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {typeChips.map((t) => {
                      const active = types.includes(t.key)
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => toggleType(t.key)}
                          className={cn(
                            "px-3 py-1.5 rounded-full border text-sm inline-flex items-center gap-1.5 transition-colors",
                            active
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-700"
                              : "border-gray-300 hover:border-emerald-400 text-gray-600 hover:text-emerald-700 bg-white",
                          )}
                          aria-pressed={active}
                        >
                          {t.icon}
                          {t.label}
                        </button>
                      )
                    })}
                  </div>
                  {errors.types && <p className="text-red-500 text-sm mt-1">{errors.types}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
                  <div>
                    <Label htmlFor="quantity" className="text-gray-700">Quantity</Label>
                    <Input
                      id="quantity"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g., 60"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                      className={cn("mt-1 bg-white", errors.quantity && "border-red-500")}
                    />
                    {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
                  </div>

                  <div className="hidden sm:block text-center text-gray-500 pb-2">in</div>

                  <div>
                    <Label className="text-gray-700">Unit</Label>
                    <Select value={unit} onValueChange={(v) => setUnit(v as QuantityUnit)}>
                      <SelectTrigger className="mt-1 bg-white">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meals">Meals</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="trays">Trays</SelectItem>
                        <SelectItem value="boxes">Boxes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700">Freshness status</Label>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                            "px-3 py-2 rounded-md border text-sm flex items-center gap-2 justify-center transition-colors",
                            active
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-700"
                              : "border-gray-300 hover:border-emerald-400 text-gray-600 hover:text-emerald-700 bg-white",
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

            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <CalendarRange className="h-5 w-5 text-gray-700" />
                  Availability window
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="from" className="text-gray-700">Available from</Label>
                  <Input
                    id="from"
                    type="datetime-local"
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    className={cn("mt-1 bg-white", errors.availableFrom && "border-red-500")}
                  />
                  {errors.availableFrom && <p className="text-red-500 text-sm mt-1">{errors.availableFrom}</p>}
                </div>
                <div>
                  <Label htmlFor="until" className="text-gray-700">Available until</Label>
                  <Input
                    id="until"
                    type="datetime-local"
                    value={availableUntil}
                    onChange={(e) => setAvailableUntil(e.target.value)}
                    className={cn("mt-1 bg-white", errors.availableUntil && "border-red-500")}
                  />
                  {errors.availableUntil && <p className="text-red-500 text-sm mt-1">{errors.availableUntil}</p>}
                </div>

                <div className="sm:col-span-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                    <div className="flex items-center gap-2">
                      <Switch id="allowPartial" checked={allowPartial} onCheckedChange={setAllowPartial} />
                      <Label htmlFor="allowPartial" className="text-gray-700 cursor-pointer">Allow partial pickups</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="insulated" checked={requireInsulated} onCheckedChange={setRequireInsulated} />
                      <Label htmlFor="insulated" className="text-gray-700 cursor-pointer">Require insulated transport</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  <span className="text-lg font-semibold">Pickup & Instructions</span>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2 relative">
                  <Label htmlFor="location" className="text-sm font-medium text-gray-700">
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
                        "bg-white border-gray-300 focus:border-emerald-500",
                        errors.location && "border-red-500 focus:border-red-500"
                      )}
                    />
                    {showSuggestions && locationSuggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {locationSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => handleLocationSelect(suggestion)}
                          >
                            {suggestion.display_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.location && (
                    <p className="text-red-500 text-xs mt-1">{errors.location}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="instructions" className="text-sm font-medium text-gray-700">
                    Notes for pickup
                  </Label>
                  <Textarea
                    id="instructions"
                    placeholder="Bring insulated cambros. Call security at gate B. Avoid 2–3pm rush."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="bg-white border-gray-300 focus:border-emerald-500 min-h-[100px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="photos" className="text-sm font-medium text-gray-700">
                    Photos (optional)
                  </Label>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Input
                        id="photos"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => setFiles(e.target.files)}
                        className="file:mr-3 file:rounded-sm file:border-0 file:bg-emerald-500 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-emerald-600 transition-colors cursor-pointer bg-white border-gray-300"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>PNG, JPG up to 5MB each</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="sticky bottom-0 bg-white py-4 border-t border-gray-200 lg:static lg:py-0 lg:border-t-0">
              <Button
                type="submit"
                disabled={isSubmitting || !isWalletConnected}
                className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSubmitting ? "Publishing on Blockchain..." : "Publish listing"}
              </Button>
            </div>
          </form>

          {/* Right column: Preview */}
          <aside className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Utensils className="h-4 w-4 text-emerald-600" />
                      <p className="font-medium text-gray-900">{title || "Untitled listing"}</p>
                    </div>
                    <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800">Draft</Badge>
                  </div>

                  <Separator className="my-3 bg-emerald-200" />

                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-emerald-600" />
                      <span>
                        {quantity || 0} {unitLabel[unit]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-emerald-600" />
                      <span>{freshnessLabel[freshness]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock4 className="h-4 w-4 text-emerald-600" />
                      <span>
                        {availableFrom ? new Date(availableFrom).toLocaleString() : "Start time"} —{" "}
                        {availableUntil ? new Date(availableUntil).toLocaleString() : "End Time"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      <span className="truncate">{location || "Pickup location"}</span>
                    </div>
                  </div>

                  {isWalletConnected && (
                    <div className="mt-3 pt-3 border-t border-emerald-200">
                      <div className="flex items-center gap-2 text-xs text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Will be published on blockchain</span>
                      </div>
                    </div>
                  )}
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