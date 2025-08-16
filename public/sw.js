// public/sw.js
const CACHE_NAME = 'communitybite-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/main_logo.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('push', (event) => {
  const payload = event.data?.json() || {};
  const { title, body, icon, data } = payload;

  event.waitUntil(
    self.registration.showNotification(title || 'New Notification', {
      body: body || 'You have a new notification',
      icon: icon || '/main_logo.png',
      data: data || {},
      badge: '/main_logo.png',
      vibrate: [200, 100, 200, 100],
      actions: data?.url ? [
        {
          action: 'view',
          title: 'View'
        }
      ] : []
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  let urlToOpen = '/dashboard';
  
  // Handle action button click
  if (event.action === 'view' && event.notification.data?.url) {
    urlToOpen = event.notification.data.url;
  } else if (event.notification.data?.url) {
    urlToOpen = event.notification.data.url;
  }

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  // You can add analytics tracking here if needed
  console.log('Notification closed', event.notification);
});