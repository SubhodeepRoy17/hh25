// app/privacy/page.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield, Lock, Eye, Database, Mail } from "lucide-react"
import Link from "next/link"

export default function PrivacyPolicyPage() {
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
                <Shield className="h-8 w-8 text-emerald-300" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Lock className="h-5 w-5 text-emerald-300" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p>
                At FoodShare, we take your privacy seriously. This Privacy Policy describes how we collect, use, and share your personal information when you use our platform to connect food donors with receivers.
              </p>
              <p>
                By using our Service, you agree to the collection and use of information in accordance with this policy.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Database className="h-5 w-5 text-emerald-300" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p className="font-medium">Personal Information:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Name, email address, and phone number</li>
                <li>Account credentials</li>
                <li>Profile information (organization details, preferences)</li>
                <li>Location data to facilitate food exchanges</li>
                <li>Communication preferences</li>
              </ul>

              <p className="font-medium mt-4">Food Listing Information:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Details about food items being donated</li>
                <li>Pickup location and availability</li>
                <li>Food type, quantity, and condition</li>
              </ul>

              <p className="font-medium mt-4">Usage Data:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>IP address, browser type, and device information</li>
                <li>Pages visited and features used</li>
                <li>Interaction data with other users</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white">How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p>We use the information we collect for various purposes, including:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>To provide and maintain our Service</li>
                <li>To facilitate connections between food donors and receivers</li>
                <li>To notify you about changes to our Service</li>
                <li>To allow you to participate in interactive features of our Service</li>
                <li>To provide customer support</li>
                <li>To gather analysis or valuable information to improve our Service</li>
                <li>To monitor the usage of our Service</li>
                <li>To detect, prevent and address technical issues</li>
                <li>To fulfill any other purpose for which you provide it</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Information Sharing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p>We may share your personal information in the following situations:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>With Other Users:</strong> When you create a food listing or claim food, necessary information (name, contact details) is shared to facilitate the exchange.
                </li>
                <li>
                  <strong>With Service Providers:</strong> We may share information with third-party vendors who perform services on our behalf.
                </li>
                <li>
                  <strong>For Legal Reasons:</strong> We may disclose information where required by law or to protect our rights.
                </li>
                <li>
                  <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Eye className="h-5 w-5 text-emerald-300" />
                Your Data Rights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p>Depending on your location, you may have the following rights regarding your personal information:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Access and receive a copy of your personal data</li>
                <li>Rectify or update inaccurate personal data</li>
                <li>Request erasure of your personal data</li>
                <li>Restrict or object to processing of your personal data</li>
                <li>Data portability (receiving your data in a structured format)</li>
                <li>Withdraw consent at any time where we rely on consent to process your information</li>
              </ul>
              <p>To exercise these rights, please contact us using the information provided below.</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Data Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p>
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized or unlawful processing, accidental loss, destruction, or damage.
              </p>
              <p>
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p>
                Our Service is not intended for use by children under the age of 13. We do not knowingly collect personally identifiable information from children under 13.
              </p>
              <p>
                If you become aware that a child under 13 has provided us with personal information, please contact us. If we become aware that we have collected personal information from children without verification of parental consent, we take steps to remove that information from our servers.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
              <p>
                We will also notify you via email and/or a prominent notice on our Service, prior to the change becoming effective and update the "last updated" date at the top of this Privacy Policy.
              </p>
              <p>
                You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-emerald-900/10 to-emerald-700/5 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Mail className="h-5 w-5 text-emerald-300" />
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p>
                Email: privacy@foodshare.app<br />
                Address: FoodShare Inc., 123 Sustainability Street, Green City, EC 12345
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}