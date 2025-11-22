// Service Worker للعمل بدون اتصال
const CACHE_NAME = 'vehicle-expenses-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/js/utils.js',
    '/js/vehicles.js',
    '/js/fuel.js',
    '/js/maintenance.js',
    '/js/parts.js',
    '/js/reminders.js',
    '/js/reports.js',
    '/js/dashboard.js',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching files');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Service Worker: Installed successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Installation failed', error);
            })
    );
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated successfully');
                return self.clients.claim();
            })
    );
});

// استراتيجية Cache First للملفات الثابتة
self.addEventListener('fetch', (event) => {
    // تجاهل الطلبات غير HTTP/HTTPS
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // إذا وجد في الكاش، أرجعه
                if (response) {
                    console.log('Service Worker: Serving from cache', event.request.url);
                    return response;
                }

                // إذا لم يوجد، جلبه من الشبكة
                console.log('Service Worker: Fetching from network', event.request.url);
                return fetch(event.request)
                    .then((response) => {
                        // تحقق من صحة الاستجابة
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }

                        // استنساخ الاستجابة
                        const responseToCache = response.clone();

                        // حفظ في الكاش للمرات القادمة
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch((error) => {
                        console.error('Service Worker: Fetch failed', error);

                        // يمكن إرجاع صفحة offline مخصصة هنا
                        return new Response('التطبيق يعمل بدون اتصال. البيانات المحفوظة متاحة.', {
                            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                        });
                    });
            })
    );
});

// معالجة رسائل من التطبيق الرئيسي
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME)
            .then(() => {
                console.log('Service Worker: Cache cleared');
                event.ports[0].postMessage({ success: true });
            });
    }
});

// معالجة التحديثات في الخلفية
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        console.log('Service Worker: Background sync triggered');
        // يمكن إضافة منطق المزامنة هنا
    }
});

// معالجة الإشعارات (اختياري)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'إشعار جديد',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        dir: 'rtl',
        lang: 'ar'
    };

    event.waitUntil(
        self.registration.showNotification('تتبع مصروفات المركبة', options)
    );
});

// معالجة النقر على الإشعارات
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow('/')
    );
});

console.log('Service Worker: Loaded');
