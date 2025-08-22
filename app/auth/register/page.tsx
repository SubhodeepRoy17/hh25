"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, QrCode, Smartphone } from "lucide-react"
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

  const green = "#2ECC71"
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
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          email: role === 'donor' ? donorCampusEmail : receiverEmail,
          password,
          orgName,
          orgType,
          phone,
          campusEmail: donorCampusEmail,
          fullName: receiverName,
          studentId,
          isNgo,
          ngoName,
          foodPreferences: foodTags
        }),
      })

      // Check if response is JSON
      const contentType = registerResponse.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await registerResponse.text()
        throw new Error(`Unexpected response: ${text.substring(0, 100)}`)
      }

      const registerData = await registerResponse.json()

      if (!registerResponse.ok) {
        throw new Error(registerData.error || 'Registration failed')
      }

      // 2. Send verification email
      const emailResponse = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: role === 'donor' ? donorCampusEmail : receiverEmail
        }),
      })

      const emailData = await emailResponse.json()

      if (!emailResponse.ok) {
        throw new Error(emailData.error || 'Failed to send verification email')
      }

      toast.success('Registration successful! Please check your email to verify your account.')
      router.push('/auth/login')

    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error(error.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTag = (tag: string) => {
    setFoodTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(1200px_600px_at_10%_10%,rgba(16,185,129,0.08),transparent_60%),#0a0a0f] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] bg-white text-zinc-900 shadow-2xl p-8 md:p-10">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">Create account</span>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <Segmented
            options={[
              { key: "donor", label: "Donor" },
              { key: "receiver", label: "Receiver" },
            ]}
            value={role}
            onChange={(v) => setRole(v as Role)}
            green={green}
            small
          />
        </div>

        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          {role === "donor" ? (
            <>
              <div>
                <Label htmlFor="donor-campus-email">Campus email</Label>
                <Input
                  id="donor-campus-email"
                  type="email"
                  placeholder="name@university.edu"
                  value={donorCampusEmail}
                  onChange={(e) => setDonorCampusEmail(e.target.value)}
                  className={cn(errors.donorCampusEmail && "border-red-500")}
                />
                {errors.donorCampusEmail && <p className="text-red-600 text-sm mt-1">{errors.donorCampusEmail}</p>}
              </div>

              <div>
                <Label htmlFor="org-name">Organization</Label>
                <Input
                  id="org-name"
                  placeholder="Campus Canteen"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className={cn(errors.orgName && "border-red-500")}
                />
                {errors.orgName && <p className="text-red-600 text-sm mt-1">{errors.orgName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="org-type">Type</Label>
                  <select
                    id="org-type"
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value as any)}
                    className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="canteen">Canteen</option>
                    <option value="event">Event</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 555 555 5555"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={cn(errors.phone && "border-red-500")}
                  />
                  {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="receiver-name">Full name</Label>
                  <Input
                    id="receiver-name"
                    placeholder="Your name"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className={cn(errors.receiverName && "border-red-500")}
                  />
                  {errors.receiverName && <p className="text-red-600 text-sm mt-1">{errors.receiverName}</p>}
                </div>
                <div>
                  <Label htmlFor="receiver-email">Email</Label>
                  <Input
                    id="receiver-email"
                    type="email"
                    placeholder="you@example.com"
                    value={receiverEmail}
                    onChange={(e) => setReceiverEmail(e.target.value)}
                    className={cn(errors.receiverEmail && "border-red-500")}
                  />
                  {errors.receiverEmail && <p className="text-red-600 text-sm mt-1">{errors.receiverEmail}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="student-id">Student ID</Label>
                  <Input
                    id="student-id"
                    placeholder="e.g., A1234"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className={cn(errors.studentId && "border-red-500")}
                  />
                  {errors.studentId && <p className="text-red-600 text-sm mt-1">{errors.studentId}</p>}
                </div>
                <div className="flex items-end gap-2">
                  <input
                    id="is-ngo"
                    type="checkbox"
                    checked={isNgo}
                    onChange={(e) => setIsNgo(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="is-ngo" className="text-sm">
                    I represent an NGO
                  </Label>
                </div>
              </div>

              {isNgo && (
                <div>
                  <Label htmlFor="ngo-name">NGO Name</Label>
                  <Input
                    id="ngo-name"
                    placeholder="CommunityBite"
                    value={ngoName}
                    onChange={(e) => setNgoName(e.target.value)}
                    className={cn(errors.ngoName && "border-red-500")}
                  />
                  {errors.ngoName && <p className="text-red-600 text-sm mt-1">{errors.ngoName}</p>}
                </div>
              )}

              <div>
                <Label>Food preferences</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {preferenceOptions.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        "px-3 py-1.5 rounded-full border text-sm",
                        foodTags.includes(tag)
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-zinc-300 hover:border-emerald-400",
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {errors.foodTags && <p className="text-red-600 text-sm mt-1">{errors.foodTags}</p>}
              </div>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(errors.password && "border-red-500")}
              />
              <PasswordStrength password={password} />
              {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
            </div>
            <div>
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={cn(errors.confirmPassword && "border-red-500")}
              />
              {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 font-semibold"
            disabled={isLoading}
            style={{ backgroundColor: green, color: "#0b1411" }}
          >
            {isLoading ? "Creating account..." : role === "donor" ? "Create donor account" : "Create receiver account"}
          </Button>

          <p className="text-xs text-zinc-600 text-center">
            By creating an account, you agree to our Terms and acknowledge our Privacy Policy.
          </p>
        </form>

        <p className="mt-6 text-sm text-zinc-600 text-center">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-emerald-700 hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>

      <QrScannerModal open={qrOpen} onOpenChange={setQrOpen} />
    </div>
  )
}

function Segmented({
  options,
  value,
  onChange,
  green,
  small = false,
}: {
  options: { key: string; label: string }[]
  value: string
  onChange: (val: string) => void
  green: string
  small?: boolean
}) {
  return (
    <div className="inline-flex rounded-full border border-zinc-200 bg-white p-1 shadow-inner">
      {options.map((opt) => {
        const active = value === opt.key
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={cn(
              "px-3 py-1 rounded-full transition-colors",
              active ? "text-black" : "text-zinc-600",
              small ? "text-xs" : "text-sm"
            )}
            style={{
              backgroundColor: active ? "#E7FFF1" : "transparent",
              border: active ? `1px solid ${green}` : "1px solid transparent",
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}