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
  title: 'CommunityBite - Food Sharing Platform',
  description: 'Connect food donors with receivers to reduce waste',
  generator: 'Next.js',
  manifest: '/manifest.json',
  themeColor: '#10b981', // Emerald color
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  other: {
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://res.cloudinary.com; connect-src 'self' https:; worker-src 'self' blob:;",
  },
  icons: {
    icon: '/main_logo.png',
    apple: '/main_logo.png',
  },
  openGraph: {
    type: 'website',
    url: 'https://yourdomain.com',
    title: 'CommunityBite',
    description: 'Food sharing platform',
    siteName: 'CommunityBite',
    images: [{
      url: '/placeholder-logo.png',
    }],
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
          html {
            font-family: ${GeistSans.style.fontFamily};
            --font-sans: ${GeistSans.variable};
            --font-mono: ${GeistMono.variable};
          }
          :root {
            color-scheme: light dark;
          }
        `}</style>
        
        {/* Preconnect to important origins */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        
        {/* Add PWA meta tags */}
        <meta name="application-name" content="CommunityBite" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CommunityBite" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#10b981" />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <AuthProvider>
          <NotificationsProvider>
            <ToasterProvider />
            {children}
            
            {/* Service Worker Registration */}
            <Script id="sw-registration" strategy="afterInteractive">
              {`
                if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
                  const registerSw = async () => {
                    try {
                      const registration = await navigator.serviceWorker.register('/sw.js', {
                        scope: '/',
                        type: 'classic'
                      });
                      
                      console.log('SW registered: ', registration);
                      
                      // Check for updates every hour
                      setInterval(() => {
                        registration.update().catch(err => {
                          console.log('SW update error: ', err);
                        });
                      }, 60 * 60 * 1000);
                      
                      // Handle push subscription
                      if ('PushManager' in window) {
                        const permission = await Notification.requestPermission();
                        if (permission === 'granted') {
                          const subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: '${process.env.NEXT_PUBLIC_VAPID_KEY}'
                          });
                          
                          // Send subscription to server
                          await fetch('/api/push/subscribe', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': \`Bearer \${localStorage.getItem('authToken')}\`
                            },
                            body: JSON.stringify(subscription)
                          });
                        }
                      }
                    } catch (error) {
                      console.error('SW registration failed: ', error);
                    }
                  };
                  
                  window.addEventListener('load', registerSw);
                  
                  // Re-register if auth state changes
                  if (typeof window !== 'undefined') {
                    window.addEventListener('authStateChanged', registerSw);
                  }
                }
              `}
            </Script>
          </NotificationsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}