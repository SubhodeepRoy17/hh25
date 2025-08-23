"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, Building2, GraduationCap } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import PasswordStrength from "@/components/auth/password-strength"
import QrScannerModal from "@/components/receiver/qr-scanner-modal"
import { cn } from "@/lib/utils"

type Role = "donor" | "receiver"

export default function RegisterPage() {
  const [role, setRole] = useState<Role>("donor")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  // Donor fields
  const [donorCampusEmail, setDonorCampusEmail] = useState("")
  const [orgName, setOrgName] = useState("")
  const [orgType, setOrgType] = useState<"canteen" | "event">("canteen")
  const [phone, setPhone] = useState("")
  // Receiver fields
  const [receiverName, setReceiverName] = useState("")
  const [receiverEmail, setReceiverEmail] = useState("")
  const [studentId, setStudentId] = useState("")
  const [isNgo, setIsNgo] = useState(false)
  const [ngoName, setNgoName] = useState("")
  const [foodTags, setFoodTags] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [qrOpen, setQrOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const preferenceOptions = ["Vegetarian", "Vegan", "Halal", "Gluten‑free", "Dairy‑free", "Any"]

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email)
  const validateCampusEmail = (email: string) => /\.(edu|ac)(\.[a-z]{2,})?$/i.test(email)

  function validate() {
    const e: Record<string, string> = {}
    if (password.length < 8) e.password = "Use at least 8 characters."
    if (password !== confirmPassword) e.confirmPassword = "Passwords do not match."

    if (role === "donor") {
      if (!validateCampusEmail(donorCampusEmail)) e.donorCampusEmail = "Use a valid campus email (e.g., .edu)."
      if (orgName.trim().length < 2) e.orgName = "Organization name is required."
      if (!/^\+?[\d\s\-()]{7,}$/.test(phone)) e.phone = "Enter a valid phone number."
    } else {
      if (receiverName.trim().length < 2) e.receiverName = "Please enter your name."
      if (!validateEmail(receiverEmail)) e.receiverEmail = "Enter a valid email."
      if (!/^[A-Za-z0-9-]{4,}$/.test(studentId)) e.studentId = "Enter a valid student ID."
      if (isNgo && ngoName.trim().length < 2) e.ngoName = "NGO name is required."
      if (foodTags.length === 0) e.foodTags = "Select at least one preference."
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)

    try {
      // 1. First register the user
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          email: role === "donor" ? donorCampusEmail : receiverEmail,
          password,
          orgName,
          orgType,
          phone,
          campusEmail: donorCampusEmail,
          fullName: receiverName,
          studentId,
          isNgo,
          ngoName,
          foodPreferences: foodTags,
        }),
      })

      // Check if response is JSON
      const contentType = registerResponse.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await registerResponse.text()
        throw new Error(`Unexpected response: ${text.substring(0, 100)}`)
      }

      const registerData = await registerResponse.json()

      if (!registerResponse.ok) {
        throw new Error(registerData.error || "Registration failed")
      }

      // 2. Send verification email
      const emailResponse = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: role === "donor" ? donorCampusEmail : receiverEmail,
        }),
      })

      const emailData = await emailResponse.json()

      if (!emailResponse.ok) {
        throw new Error(emailData.error || "Failed to send verification email")
      }

      toast.success("Registration successful! Please check your email to verify your account.")
      router.push("/auth/login")
    } catch (error: any) {
      console.error("Registration error:", error)
      toast.error(error.message || "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTag = (tag: string) => {
    setFoodTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h1>
          <p className="text-slate-600">Join Smart Surplus and start making a difference</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
          <div className="mb-8">
            <Label className="text-sm font-medium text-slate-700 mb-3 block">I want to register as</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("donor")}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200",
                  role === "donor"
                    ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                    : "border-slate-200 hover:border-slate-300 text-slate-600",
                )}
              >
                <Building2 className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Donor</div>
                  <div className="text-xs opacity-75">Share surplus food</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setRole("receiver")}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200",
                  role === "receiver"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 hover:border-slate-300 text-slate-600",
                )}
              >
                <GraduationCap className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Receiver</div>
                  <div className="text-xs opacity-75">Access free food</div>
                </div>
              </button>
            </div>
          </div>

          <form className="space-y-6" onSubmit={onSubmit} noValidate>
            {role === "donor" ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="donor-campus-email" className="text-sm font-medium text-slate-700">
                      Campus Email
                    </Label>
                    <Input
                      id="donor-campus-email"
                      type="email"
                      placeholder="name@university.edu"
                      value={donorCampusEmail}
                      onChange={(e) => setDonorCampusEmail(e.target.value)}
                      className={cn(
                        "mt-1 h-12 rounded-xl border-slate-200 focus:border-cyan-500 focus:ring-cyan-500",
                        errors.donorCampusEmail && "border-red-500 focus:border-red-500 focus:ring-red-500",
                      )}
                    />
                    {errors.donorCampusEmail && <p className="text-red-600 text-sm mt-1">{errors.donorCampusEmail}</p>}
                  </div>

                  <div>
                    <Label htmlFor="org-name" className="text-sm font-medium text-slate-700">
                      Organization Name
                    </Label>
                    <Input
                      id="org-name"
                      placeholder="Campus Canteen"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className={cn(
                        "mt-1 h-12 rounded-xl border-slate-200 focus:border-cyan-500 focus:ring-cyan-500",
                        errors.orgName && "border-red-500 focus:border-red-500 focus:ring-red-500",
                      )}
                    />
                    {errors.orgName && <p className="text-red-600 text-sm mt-1">{errors.orgName}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="org-type" className="text-sm font-medium text-slate-700">
                        Organization Type
                      </Label>
                      <select
                        id="org-type"
                        value={orgType}
                        onChange={(e) => setOrgType(e.target.value as any)}
                        className="mt-1 block w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm focus:border-cyan-500 focus:ring-cyan-500"
                      >
                        <option value="canteen">Canteen</option>
                        <option value="event">Event</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 555 555 5555"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={cn(
                          "mt-1 h-12 rounded-xl border-slate-200 focus:border-cyan-500 focus:ring-cyan-500",
                          errors.phone && "border-red-500 focus:border-red-500 focus:ring-red-500",
                        )}
                      />
                      {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="receiver-name" className="text-sm font-medium text-slate-700">
                      Full Name
                    </Label>
                    <Input
                      id="receiver-name"
                      placeholder="Your name"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      className={cn(
                        "mt-1 h-12 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500",
                        errors.receiverName && "border-red-500 focus:border-red-500 focus:ring-red-500",
                      )}
                    />
                    {errors.receiverName && <p className="text-red-600 text-sm mt-1">{errors.receiverName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="receiver-email" className="text-sm font-medium text-slate-700">
                      Email Address
                    </Label>
                    <Input
                      id="receiver-email"
                      type="email"
                      placeholder="you@example.com"
                      value={receiverEmail}
                      onChange={(e) => setReceiverEmail(e.target.value)}
                      className={cn(
                        "mt-1 h-12 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500",
                        errors.receiverEmail && "border-red-500 focus:border-red-500 focus:ring-red-500",
                      )}
                    />
                    {errors.receiverEmail && <p className="text-red-600 text-sm mt-1">{errors.receiverEmail}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="student-id" className="text-sm font-medium text-slate-700">
                      Student ID
                    </Label>
                    <Input
                      id="student-id"
                      placeholder="e.g., A1234"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className={cn(
                        "mt-1 h-12 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500",
                        errors.studentId && "border-red-500 focus:border-red-500 focus:ring-red-500",
                      )}
                    />
                    {errors.studentId && <p className="text-red-600 text-sm mt-1">{errors.studentId}</p>}
                  </div>
                  <div className="flex items-center gap-3 pt-8">
                    <input
                      id="is-ngo"
                      type="checkbox"
                      checked={isNgo}
                      onChange={(e) => setIsNgo(e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <Label htmlFor="is-ngo" className="text-sm font-medium text-slate-700">
                      I represent an NGO
                    </Label>
                  </div>
                </div>

                {isNgo && (
                  <div>
                    <Label htmlFor="ngo-name" className="text-sm font-medium text-slate-700">
                      NGO Name
                    </Label>
                    <Input
                      id="ngo-name"
                      placeholder="CommunityBite"
                      value={ngoName}
                      onChange={(e) => setNgoName(e.target.value)}
                      className={cn(
                        "mt-1 h-12 rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500",
                        errors.ngoName && "border-red-500 focus:border-red-500 focus:ring-red-500",
                      )}
                    />
                    {errors.ngoName && <p className="text-red-600 text-sm mt-1">{errors.ngoName}</p>}
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-3 block">Food Preferences</Label>
                  <div className="flex flex-wrap gap-2">
                    {preferenceOptions.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                          foodTags.includes(tag)
                            ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-500"
                            : "bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200",
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  {errors.foodTags && <p className="text-red-600 text-sm mt-2">{errors.foodTags}</p>}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "mt-1 h-12 rounded-xl border-slate-200 focus:border-slate-400 focus:ring-slate-400",
                    errors.password && "border-red-500 focus:border-red-500 focus:ring-red-500",
                  )}
                />
                <PasswordStrength password={password} />
                {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
              </div>
              <div>
                <Label htmlFor="confirm" className="text-sm font-medium text-slate-700">
                  Confirm Password
                </Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "mt-1 h-12 rounded-xl border-slate-200 focus:border-slate-400 focus:ring-slate-400",
                    errors.confirmPassword && "border-red-500 focus:border-red-500 focus:ring-red-500",
                  )}
                />
                {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            <Button
              type="submit"
              className={cn(
                "w-full h-12 font-semibold text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl",
                role === "donor"
                  ? "bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700"
                  : "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700",
              )}
              disabled={isLoading}
            >
              {isLoading
                ? "Creating account..."
                : role === "donor"
                  ? "Create Donor Account"
                  : "Create Receiver Account"}
            </Button>

            <p className="text-xs text-slate-500 text-center leading-relaxed">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-slate-700 hover:underline">
                Terms of Service
              </Link>{" "}
              and acknowledge our{" "}
              <Link href="/privacy" className="text-slate-700 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-600 text-center">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-semibold text-slate-900 hover:text-cyan-600 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <QrScannerModal open={qrOpen} onOpenChange={setQrOpen} />
    </div>
  )
}