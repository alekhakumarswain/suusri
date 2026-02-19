/* eslint-disable no-restricted-globals */

// Cache configuration
const CACHE_NAME = 'suusri-cache-v1';
const FLASH_IMAGE = '/suu4.png';

// Assets to cache
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  FLASH_IMAGE,
  '/manifest.json'
];

// Install event - caching assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching files');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch event - serving from cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Push event - handling notifications with the "flash image"
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const title = data.title || 'SuuSri';
  const options = {
    body: data.body || 'New update from SuuSri!',
    icon: '/suu4.png',
    badge: '/suu4.png',
    image: FLASH_IMAGE, // Use suu4.png as the large flashy image in notifications
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
