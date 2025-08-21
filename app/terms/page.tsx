// app/terms/page.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield, FileText, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <Button
          asChild
          variant="outline"
          className="mb-6 border-emerald-500/40 bg-transparent text-emerald-100"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <FileText className="h-8 w-8 text-emerald-300" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Terms of Service</h1>
            <p className="text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5 text-emerald-300" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p>
                Welcome to FoodShare, a platform dedicated to reducing food waste by connecting donors with surplus food to receivers in need. These Terms of Service govern your use of our website and services.
              </p>
              <p>
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the Service.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p>
                When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
              </p>
              <p>
                You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Food Donation Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p>
                As a donor, you agree to:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Only list food that is safe for consumption and within its expiry date</li>
                <li>Accurately describe the quantity, type, and condition of food being donated</li>
                <li>Properly store and handle food according to food safety standards</li>
                <li>Clearly communicate any allergens or special handling requirements</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Food Receiving Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p>
                As a receiver, you agree to:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Only claim food that you intend to consume or distribute appropriately</li>
                <li>Arrive on time for scheduled pickups or communicate delays</li>
                <li>Handle and store received food according to food safety guidelines</li>
                <li>Respect donor's property and instructions during pickup</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <AlertTriangle className="h-5 w-5 text-amber-300" />
                Disclaimer of Warranties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p>
                The Service is provided on an "AS IS" and "AS AVAILABLE" basis. FoodShare makes no representations or warranties of any kind regarding:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>The quality, safety, or suitability of any food items exchanged through the platform</li>
                <li>The accuracy or completeness of any information provided by users</li>
                <li>The conduct of any users of the Service</li>
              </ul>
              <p>
                Users assume all responsibility and risk for the use of food obtained through the platform.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p>
                To the fullest extent permitted by applicable law, FoodShare shall not be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Your access to or use of or inability to access or use the Service</li>
                <li>Any conduct or content of any third party on the Service</li>
                <li>Any food obtained through the Service</li>
                <li>Unauthorized access, use or alteration of your transmissions or content</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will provide at least 30 days' notice prior to any new terms taking effect.
              </p>
              <p>
                What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <p>
                Email: legal@foodshare.app<br />
                Address: FoodShare Inc., 123 Sustainability Street, Green City, EC 12345
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}