"use client"

import { useState } from "react"
import { MapPin, Search, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { InteractiveMap } from "@/components/interactive-map"
import { WeatherDashboard } from "@/components/weather-dashboard"
import { DateSelector } from "@/components/date-selector"
import { ChatbotPanel } from "@/components/chatbot-panel"

export default function Home() {
  const [location, setLocation] = useState<{ lat: number; lng: number; name: string } | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  const handleLocationSelect = (lat: number, lng: number, name: string) => {
    setLocation({ lat, lng, name })
  }

  const handleUseMyLocation = async () => {
    setIsGettingLocation(true)

    try {
      // First, try browser geolocation with a very short timeout
      const browserLocationPromise = new Promise<{ lat: number; lng: number }>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported"))
          return
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            })
          },
          (error) => {
            reject(error)
          },
          {
            enableHighAccuracy: false,
            timeout: 2000, // Very short timeout
            maximumAge: 60000,
          },
        )
      })

      // Fallback to IP-based geolocation
      const ipLocationPromise = fetch("https://ipapi.co/json/")
        .then((res) => res.json())
        .then((data) => ({
          lat: data.latitude,
          lng: data.longitude,
          city: data.city,
          region: data.region,
          country: data.country_name,
        }))

      // Try browser geolocation first, fall back to IP if it fails
      let lat: number, lng: number, locationName: string

      try {
        const coords = await Promise.race([
          browserLocationPromise,
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000)),
        ])
        lat = coords.lat
        lng = coords.lng

        // Reverse geocode to get location name
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
          {
            headers: {
              "User-Agent": "NASA-Weather-Dashboard",
            },
          },
        )
        const data = await response.json()
        const address = data.address || {}
        const city = address.city || address.town || address.village || address.county
        const state = address.state
        const country = address.country

        locationName =
          city && country
            ? state
              ? `${city}, ${state}, ${country}`
              : `${city}, ${country}`
            : country || `Location (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`
      } catch (browserError) {
        // Fallback to IP-based geolocation
        console.log("[v0] Browser geolocation failed, using IP-based location")
        const ipData = await ipLocationPromise
        lat = ipData.lat
        lng = ipData.lng
        locationName =
          ipData.city && ipData.country
            ? ipData.region
              ? `${ipData.city}, ${ipData.region}, ${ipData.country}`
              : `${ipData.city}, ${ipData.country}`
            : ipData.country || `Location (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`
      }

      handleLocationSelect(lat, lng, locationName)
    } catch (error) {
      console.error("[v0] Location detection error:", error)

      // Show user-friendly error message
      const errorMsg = document.createElement("div")
      errorMsg.className =
        "fixed bottom-20 right-6 bg-destructive text-destructive-foreground px-4 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-5"
      errorMsg.textContent = "Unable to detect location. Please use the search instead."
      document.body.appendChild(errorMsg)
      setTimeout(() => errorMsg.remove(), 4000)
    } finally {
      setIsGettingLocation(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            "User-Agent": "NASA-Weather-Dashboard",
          },
        },
      )
      const data = await response.json()

      if (data && data.length > 0) {
        const result = data[0]
        const lat = Number.parseFloat(result.lat)
        const lng = Number.parseFloat(result.lon)
        const name = result.display_name

        handleLocationSelect(lat, lng, name)
      } else {
        alert("Location not found. Please try a different search term.")
      }
    } catch (error) {
      console.error("Search error:", error)
      alert("Error searching for location. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-balance">AstroWeather</h1>
                <p className="text-sm text-muted-foreground">Personalised Weather Prediction</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Location Selection Section */}
        <Card className="p-6 mb-8 bg-card/80 backdrop-blur-sm border-border/50">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Select Location
          </h2>

          {/* Search Input */}
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search for a location (e.g., New York, London, Tokyo)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isSearching ? "Searching..." : "Search"}
            </Button>
            <Button
              onClick={handleUseMyLocation}
              disabled={isGettingLocation}
              variant="outline"
              className="border-primary/30 hover:bg-primary/10 bg-transparent"
            >
              <MapPin className="w-4 h-4 mr-2" />
              {isGettingLocation ? "Getting Location..." : "Use My Location"}
            </Button>
          </div>

          {/* Interactive Map - Now centered in a medium-sized container */}
          <div className="mb-6 flex justify-center">
            <InteractiveMap onLocationSelect={handleLocationSelect} selectedLocation={location} />
          </div>

          {/* Date Selection */}
          <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />

          {/* Selected Location Display - Shows full location name instead of coordinates */}
          {location && (
            <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-muted-foreground">Selected Location:</p>
              <p className="text-xl font-bold text-primary mt-1">{location.name}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Coordinates: {location.lat.toFixed(4)}°, {location.lng.toFixed(4)}°
              </p>
            </div>
          )}
        </Card>

        {/* Weather Dashboard */}
        {location && <WeatherDashboard location={location} selectedDate={selectedDate} />}
      </main>

      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 z-50"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      {/* Chatbot Panel */}
      <ChatbotPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} location={location} />
    </div>
  )
}
