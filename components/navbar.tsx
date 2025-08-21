"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Leaf,
  Users,
  Heart,
  Sprout,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

interface NavbarProps {
  isLoggedIn: boolean
  userType: "donor" | "receiver" | null
  setIsLoggedIn: (loggedIn: boolean) => void
  setUserType: (userType: "donor" | "receiver" | null) => void
}

export default function Navbar({ isLoggedIn, userType, setIsLoggedIn, setUserType }: NavbarProps) {
  const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false)
  const [programsDropdownOpen, setProgramsDropdownOpen] = useState(false)
  const [resourcesDropdownOpen, setResourcesDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-gray-900 text-white sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm sm:text-base">SMART SURPLUS</span>
          </div>

          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-white bg-transparent rounded-full transition duration-300 hover:bg-white/20"
            >
              Home
            </Button>
            <div
              className="relative"
              onMouseEnter={() => setFeaturesDropdownOpen(true)}
              onMouseLeave={() => setFeaturesDropdownOpen(false)}
            >
              <DropdownMenu open={featuresDropdownOpen} onOpenChange={setFeaturesDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:text-white bg-transparent rounded-full transition duration-300 hover:bg-white/20"
                  >
                    Features
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/features/real-time-matching" className="flex items-center">
                      <Bell className="w-4 h-4 mr-2" />
                      Real-time Matching
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/features/route-optimization" className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Route Optimization
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/features/impact-analytics" className="flex items-center">
                      <Heart className="w-4 h-4 mr-2" />
                      Impact Analytics
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/features" className="flex items-center">
                      <Sprout className="w-4 h-4 mr-2" />
                      All Features
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div
              className="relative"
              onMouseEnter={() => setProgramsDropdownOpen(true)}
              onMouseLeave={() => setProgramsDropdownOpen(false)}
            >
              <DropdownMenu open={programsDropdownOpen} onOpenChange={setProgramsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:text-white bg-transparent rounded-full transition duration-300 hover:bg-white/20"
                  >
                    Programs
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/programs/donor-onboarding" className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Donor Onboarding
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/programs/nonprofit-network" className="flex items-center">
                      <Heart className="w-4 h-4 mr-2" />
                      Nonprofit Network
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div
              className="relative"
              onMouseEnter={() => setResourcesDropdownOpen(true)}
              onMouseLeave={() => setResourcesDropdownOpen(false)}
            >
              <DropdownMenu open={resourcesDropdownOpen} onOpenChange={setResourcesDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:text-white bg-transparent rounded-full transition duration-300 hover:bg-white/20"
                  >
                    Resources
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/resources/blog" className="flex items-center">
                      <Sprout className="w-4 h-4 mr-2" />
                      Blog
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/resources/docs" className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Docs
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/resources/support" className="flex items-center">
                      <Heart className="w-4 h-4 mr-2" />
                      Support
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-white bg-transparent rounded-full transition duration-300 hover:bg-white/20"
            >
              Pricing
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-white bg-transparent rounded-full transition duration-300 hover:bg-white/20"
            >
              Contact Sales
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-white bg-transparent rounded-full transition duration-300 hover:bg-white/20"
            >
              Help
            </Button>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-white bg-transparent rounded-full transition duration-300 hover:bg-white/20"
                >
                  <Bell className="w-4 h-4 mr-1" />
                  <span className="hidden lg:inline">Notifications</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:text-white bg-transparent rounded-full transition duration-300 hover:bg-white/20"
                    >
                      <User className="w-4 h-4 mr-1" />
                      <span className="hidden lg:inline">Profile</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/notifications" className="flex items-center">
                        <Bell className="w-4 h-4 mr-2" />
                        Notifications
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${userType}/settings`} className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${userType}/settings`} className="flex items-center">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setIsLoggedIn(false)
                        setUserType(null)
                      }}
                      className="flex items-center text-red-600"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-white hover:text-white bg-transparent rounded-full transition duration-300 hover:bg-white/20 border-white/30 hover:border-white/50"
                asChild
              >
                <Link href="/auth/login">
                  <User className="w-4 h-4 mr-1" />
                  <span className="hidden lg:inline">Sign In</span>
                </Link>
              </Button>
            )}
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white hover:text-white bg-transparent rounded-full transition duration-300 hover:bg-white/20"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700 py-4">
            <div className="flex flex-col space-y-2">
              <Button variant="ghost" size="sm" className="text-white justify-start hover:bg-white/20">
                Home
              </Button>
              <Button variant="ghost" size="sm" className="text-white justify-start hover:bg-white/20">
                Features
              </Button>
              <Button variant="ghost" size="sm" className="text-white justify-start hover:bg-white/20">
                Programs
              </Button>
              <Button variant="ghost" size="sm" className="text-white justify-start hover:bg-white/20">
                Resources
              </Button>
              <Button variant="ghost" size="sm" className="text-white justify-start hover:bg-white/20">
                Pricing
              </Button>
              <Button variant="ghost" size="sm" className="text-white justify-start hover:bg-white/20">
                Help
              </Button>
              <div className="border-t border-gray-700 pt-2 mt-2">
                {isLoggedIn ? (
                  <>
                    <Button variant="ghost" size="sm" className="text-white justify-start hover:bg-white/20">
                      <Bell className="w-4 h-4 mr-2" />
                      Notifications
                    </Button>
                    <Button variant="ghost" size="sm" className="text-white justify-start hover:bg-white/20">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Button>
                    <Button variant="ghost" size="sm" className="text-white justify-start hover:bg-white/20">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 justify-start hover:bg-red-500/20"
                      onClick={() => {
                        setIsLoggedIn(false)
                        setUserType(null)
                        setMobileMenuOpen(false)
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Log out
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-white border-white/30 hover:bg-white/20 w-full justify-start bg-transparent"
                    asChild
                  >
                    <Link href="/auth/login">
                      <User className="w-4 h-4 mr-2" />
                      Sign In
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}