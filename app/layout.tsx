// app/layout.tsx
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { ToasterProvider } from "@/components/toaster-provider"
import { AuthProvider } from "@/context/AuthContext"
import { NotificationsProvider } from "@/context/NotificationsContext"
import './globals.css'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
  other: {
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://res.cloudinary.com; connect-src 'self' https:; worker-src 'self' blob:;"
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
          html {
            font-family: ${GeistSans.style.fontFamily};
            --font-sans: ${GeistSans.variable};
            --font-mono: ${GeistMono.variable};
          }
        `}</style>
        
        {/* Add manifest for PWA */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <AuthProvider>
          <NotificationsProvider>
            <ToasterProvider />
            {children}
            
            {/* Service Worker Registration Script */}
            <Script id="service-worker-registration" strategy="afterInteractive">
              {`
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', async () => {
                    try {
                      const registration = await navigator.serviceWorker.register('/sw.js', {
                        scope: '/',
                        type: 'module'
                      });
                      console.log('ServiceWorker registration successful with scope: ', registration.scope);
                      
                      // Check for existing subscription
                      const existingSubscription = await registration.pushManager?.getSubscription();
                      if (existingSubscription) {
                        console.log('Existing push subscription found');
                      }
                    } catch (err) {
                      console.error('ServiceWorker registration failed: ', err);
                    }
                  });
                }
              `}
            </Script>
          </NotificationsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}