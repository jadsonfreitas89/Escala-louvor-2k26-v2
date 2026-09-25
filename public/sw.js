// Service Worker - Escala Louvor (Web Notifications, Offline Caching & PWA)
try {
  importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js');
} catch (e) {
  console.warn('[SW] Aviso: Scripts do Firebase não puderam ser carregados externamente no SW:', e);
}

const firebaseConfig = {
  apiKey: "AIzaSyBy56kEmfcHWNQ7t15bF2RtLb5CkdHwLK4",
  authDomain: "escala-louvor-2.firebaseapp.com",
  projectId: "escala-louvor-2",
  messagingSenderId: "979295298532",
  appId: "1:979295298532:web:8093b4212b9fff6d0b9df1"
};


if (!firebase.apps || !firebase.apps.length) {
  try {
    firebase.initializeApp(firebaseConfig);
  } catch (e) {
    console.error('[SW] Erro ao inicializar Firebase no Service Worker:', e);
  }
}

let messaging = null;
try {
  messaging = firebase.messaging();
} catch (e) {
  console.warn('[SW] Firebase Messaging não suportado neste contexto:', e);
}

const DB_NAME = 'NotificationDedupDB';
const STORE_NAME = 'seenNotifications';

function openDB() {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = () => resolve(null);
  });
}

async function isDuplicate(notificationId) {
  if (!notificationId) return false;
  try {
    const db = await openDB();
    if (!db) return false;
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const now = Date.now();
      const cursorRequest = store.openCursor();
      cursorRequest.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          if (now - cursor.value.timestamp > 120000) {
            cursor.delete();
          }
          cursor.continue();
        }
      };

      const getRequest = store.get(notificationId);
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          resolve(true);
        } else {
          store.put({ id: notificationId, timestamp: now });
          resolve(false);
        }
      };
      getRequest.onerror = () => resolve(false);
    });
  } catch (err) {
    return false;
  }
}

const CACHE_NAME = 'escala-louvor-v1.1.0';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manifest.webmanifest',
  '/icons/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png'
];

// Instalação do Service Worker e pré-cache do App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[SW] Aviso ao pré-carregar assets no cache:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Interceptação de requisições (Offline & PWA)
self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // 1. Requisições de API interna e Google APIs sempre vão para a rede
  if (
    url.pathname.startsWith('/api/') || 
    url.pathname === '/sw.js' ||
    url.hostname.includes('script.google.com') || 
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseio.com')
  ) {
    return;
  }

  // 2. Navegação (HTML / Rotas do SPA): Network-first com fallback para index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const indexFallback = await caches.match('/index.html');
          if (indexFallback) return indexFallback;
          return new Response('Offline - Escala Louvor', {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        })
    );
    return;
  }

  // 3. Arquivos estáticos (JS, CSS, Imagens, Fontes): Cache-First com Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (networkResponse.type === 'basic' || url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('fonts.googleapis.com'))
        ) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return networkResponse;
      });
    })
  );
});

// Listener para exibição de notificações enviadas via postMessage
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options, id } = event.data;
    if (id && await isDuplicate(id)) return;
    
    event.waitUntil(
      self.registration.showNotification(title || 'Escala Louvor', {
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data: { id, ...(options && options.data) },
        ...options
      })
    );
  }
});

// Listener do Firebase Messaging em Background
if (messaging) {
  messaging.onBackgroundMessage(async (payload) => {
    console.log('[SW] Received background message ', payload);
    const title = payload.notification?.title || payload.data?.title || 'Escala Louvor';
    const body = payload.notification?.body || payload.data?.body || '';
    const notificationId = payload.data?.id || payload.data?.eventoId;
    const targetUrl = payload.data?.url || '/notificacoes';

    if (notificationId && await isDuplicate(notificationId)) {
      console.log('[SW] Notificação duplicada ignorada no background:', notificationId);
      return;
    }

    const notificationOptions = {
      body: body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: {
        id: notificationId,
        url: targetUrl,
        ...payload.data
      }
    };

    return self.registration.showNotification(title, notificationOptions);
  });
}

// Listener para clique na notificação nativa do sistema
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickAction = event.notification.data?.url || '/notificacoes';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus().then(() => {
            if ('navigate' in client && clickAction) {
              return client.navigate(clickAction);
            }
          });
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(clickAction);
      }
    })
  );
});
