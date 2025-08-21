import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { ToasterProvider } from "@/components/toaster-provider"
import { AuthProvider } from "@/context/AuthContext"
import { CalendarProvider } from '@/context/CalendarContext';
import { NotificationsProvider } from "@/context/NotificationsContext"
import './globals.css'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'CommunityBite - Food Sharing Platform',
  description: 'Connect food donors with receivers to reduce waste',
  generator: 'Next.js',
  manifest: '/manifest.json',
  icons: {
    icon: '/main_logo.png',
    apple: '/main_logo.png',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
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

export const viewport: Viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover'
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
        
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        
        <meta name="application-name" content="CommunityBite" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CommunityBite" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <AuthProvider>
          <CalendarProvider>
            <NotificationsProvider>
              <ToasterProvider />
              {children}
              
              <Script 
                id="expiration-checker" 
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                  __html: `
                    // Start expiration checker after app loads
                    setTimeout(() => {
                      console.log('Starting expiration checker...');
                      fetch('/api/listings/check-expirations', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        }
                      }).catch(err => console.log('Expiration check request failed:', err));
                    }, 5000);
                    
                    // Set up interval for regular checks (every 30 minutes)
                    setInterval(() => {
                      fetch('/api/listings/check-expirations', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        }
                      }).catch(err => console.log('Expiration check request failed:', err));
                    }, 30 * 60 * 1000);
                  `
                }}
              />
              
              <Script id="sw-registration" strategy="afterInteractive">
                {`
                  if ('serviceWorker' in navigator) {
                    const registerSw = async () => {
                      try {
                        const registration = await navigator.serviceWorker.register('/sw.js', {
                          scope: '/',
                          type: 'classic'
                        });
                        
                        console.log('SW registered: ', registration);
                        
                        setInterval(() => {
                          registration.update().catch(err => {
                            console.log('SW update error: ', err);
                          });
                        }, 60 * 60 * 1000);
                        
                        if ('PushManager' in window) {
                          const permission = await Notification.requestPermission();
                          if (permission === 'granted') {
                            const subscription = await registration.pushManager.subscribe({
                              userVisibleOnly: true,
                              applicationServerKey: '${process.env.NEXT_PUBLIC_VAPID_KEY}'
                            });
                            
                            // Only try to subscribe if user is authenticated
                            const token = localStorage.getItem('authToken');
                            if (token) {
                              await fetch('/api/push/subscribe', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': \`Bearer \${token}\`
                                },
                                body: JSON.stringify(subscription)
                              }).catch(err => console.log('Push subscription failed:', err));
                            }
                          }
                        }
                      } catch (error) {
                        console.error('SW registration failed: ', error);
                      }
                    };
                    
                    window.addEventListener('load', registerSw);
                    
                    // Re-register when auth state changes
                    if (typeof window !== 'undefined') {
                      const originalSetItem = localStorage.setItem;
                      localStorage.setItem = function(key, value) {
                        originalSetItem.apply(this, arguments);
                        if (key === 'authToken' && value) {
                          setTimeout(registerSw, 1000);
                        }
                      };
                    }
                  }
                `}
              </Script>
            </NotificationsProvider>
          </CalendarProvider>
        </AuthProvider>
      </body>
    </html>
  )
}