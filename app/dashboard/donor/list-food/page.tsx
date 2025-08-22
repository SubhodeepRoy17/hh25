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
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mb-6">
          <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-100">New listing</Badge>
        </div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 md:gap-6 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">List surplus food</h1>
            <p className="text-gray-300 mt-1">
              Canteens, hostels, and event organizers can share excess food with the community.
            </p>
          </div>
        </div>

        {/* Wallet Connection Banner */}
        {!isWalletConnected && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-yellow-100">Connect your wallet</h3>
                <p className="text-yellow-200 text-sm">
                  To publish your food listing on the blockchain, please connect your MetaMask wallet.
                </p>
              </div>
              <Button
                onClick={handleConnectWallet}
                className="bg-yellow-500 hover:bg-yellow-400 text-black"
              >
                Connect Wallet
              </Button>
            </div>
          </div>
        )}

        {/* Blockchain Status */}
        {isWalletConnected && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-300 mr-2" />
              <span className="text-emerald-100">Wallet connected. Your listing will be published on the blockchain.</span>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-6">
          {/* Left column: Form */}
          <form onSubmit={onSubmit} className="space-y-6">
            <Card className="bg-black from-emerald-900/10 to-emerald-700/5 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Utensils className="h-5 w-5 text-emerald-300" />
                  Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 text-white">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., 60 hot vegetarian meals from campus canteen"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={cn("mt-1", errors.title && "border-red-500")}
                  />
                  {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
                </div>

                <div>
                  <Label>Food type</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {typeChips.map((t) => {
                      const active = types.includes(t.key)
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => toggleType(t.key)}
                          className={cn(
                            "px-3 py-1.5 rounded-full border text-sm inline-flex items-center gap-1.5",
                            active
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-100"
                              : "border-gray-700 hover:border-emerald-400 text-gray-200",
                          )}
                          aria-pressed={active}
                        >
                          {t.icon}
                          {t.label}
                        </button>
                      )
                    })}
                  </div>
                  {errors.types && <p className="text-red-400 text-sm mt-1">{errors.types}</p>}
                </div>

                <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="e.g., 60"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                      className={cn("mt-1", errors.quantity && "border-red-500")}
                    />
                    {errors.quantity && <p className="text-red-400 text-sm mt-1">{errors.quantity}</p>}
                  </div>

                  <div className="hidden sm:block text-center text-gray-400 pb-2">in</div>

                  <div>
                    <Label>Unit</Label>
                    <Select value={unit} onValueChange={(v) => setUnit(v as QuantityUnit)}>
                      <SelectTrigger className="mt-1">
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
                  <Label>Freshness status</Label>
                  <div className="mt-2 grid sm:grid-cols-3 gap-2">
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
                            "px-3 py-2 rounded-md border text-sm flex items-center gap-2 justify-center",
                            active
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-100"
                              : "border-gray-700 hover:border-emerald-400 text-gray-200",
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

            <Card className="bg-black from-emerald-900/10 to-emerald-700/5 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <CalendarRange className="h-5 w-5 text-white" />
                  Availability window
                </CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4 text-white">
                <div>
                  <Label htmlFor="from">Available from</Label>
                  <Input
                    id="from"
                    type="datetime-local"
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    className={cn("mt-1", errors.availableFrom && "border-red-500")}
                  />
                  {errors.availableFrom && <p className="text-red-400 text-sm mt-1">{errors.availableFrom}</p>}
                </div>
                <div>
                  <Label htmlFor="until">Available until</Label>
                  <Input
                    id="until"
                    type="datetime-local"
                    value={availableUntil}
                    onChange={(e) => setAvailableUntil(e.target.value)}
                    className={cn("mt-1", errors.availableUntil && "border-red-500")}
                  />
                  {errors.availableUntil && <p className="text-red-400 text-sm mt-1">{errors.availableUntil}</p>}
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between gap-4 py-2">
                    <div className="flex items-center gap-2">
                      <Switch id="allowPartial" checked={allowPartial} onCheckedChange={setAllowPartial} />
                      <Label htmlFor="allowPartial">Allow partial pickups</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="insulated" checked={requireInsulated} onCheckedChange={setRequireInsulated} />
                      <Label htmlFor="insulated">Require insulated transport</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black bg-gradient-to-br from-emerald-900/10 to-emerald-700/5 border border-gray-800 rounded-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white">
                  <MapPin className="h-5 w-5 text-emerald-300" />
                  <span className="text-lg font-semibold">Pickup & Instructions</span>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4 text-white">
                <div className="space-y-2 relative">
                  <Label htmlFor="location" className="text-sm font-medium text-gray-300">
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
                        "bg-gray-900/50 border-gray-700 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30",
                        errors.location && "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                      )}
                    />
                    {showSuggestions && locationSuggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                        {locationSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="px-4 py-2 hover:bg-gray-700 cursor-pointer text-sm"
                            onClick={() => handleLocationSelect(suggestion)}
                          >
                            {suggestion.display_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.location && (
                    <p className="text-red-400 text-xs mt-1">{errors.location}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="instructions" className="text-sm font-medium text-gray-300">
                    Notes for pickup
                  </Label>
                  <Textarea
                    id="instructions"
                    placeholder="Bring insulated cambros. Call security at gate B. Avoid 2–3pm rush."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="bg-gray-900/50 border-gray-700 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 min-h-[100px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="photos" className="text-sm font-medium text-gray-300">
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
                        className="file:mr-3 file:rounded-sm file:border-0 file:bg-emerald-500/90 file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-emerald-600 transition-colors cursor-pointer bg-gray-900/50 border-gray-700"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>PNG, JPG up to 5MB each</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              disabled={isSubmitting || !isWalletConnected}
              className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? "Publishing on Blockchain..." : "Publish listing"}
            </Button>
          </form>

          {/* Right column: Preview */}
          <aside className="space-y-6">
            <Card className="bg-white/5 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Utensils className="h-4 w-4 text-emerald-300" />
                      <p className="font-medium">{title || "Untitled listing"}</p>
                    </div>
                    <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-100">Draft</Badge>
                  </div>

                  <Separator className="my-3 bg-emerald-500/20" />

                  <div className="space-y-2 text-sm text-emerald-100/90">
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
                      <Clock4 className="h-4 w-4" />
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

                  {isWalletConnected && (
                    <div className="mt-3 pt-3 border-t border-emerald-500/20">
                      <div className="flex items-center gap-2 text-xs text-emerald-300">
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