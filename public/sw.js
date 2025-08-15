// Service Worker for push notifications
self.addEventListener('push', (event) => {
  const payload = event.data?.json() || { 
    title: 'New update', 
    body: 'You have new notifications' 
  };
  
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/main_logo.png',
      data: { url: payload.url || '/' }
    })
  );
});

self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
});

self.addEventListener('push', (event) => {
  const data = event.data?.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', {
      body: data.body,
      icon: '/main_logo.png'
    })
  )
})

self.addEventListener('push', (event) => {
  const data = event.data?.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'New message', {
      body: data.body,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  )
})