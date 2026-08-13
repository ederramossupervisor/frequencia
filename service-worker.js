// service-worker.js - VERSÃO ÚNICA E FUNCIONAL
const CACHE_VERSION = 'v4.0'; // MUDE ESTE NÚMERO SEMPRE QUE ATUALIZAR
const CACHE_NAME = `frequencia-${CACHE_VERSION}`;

self.addEventListener('install', event => {
  console.log('Service Worker: Instalado, versão', CACHE_VERSION);
  // Ativa a nova versão imediatamente, sem esperar todas as abas fecharem.
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Ativando e limpando caches antigos');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Removendo cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Ativado! Versão:', CACHE_VERSION);
      return self.clients.claim(); // Assume o controle das abas já abertas
    })
  );
});

self.addEventListener('fetch', event => {
  // Não intercepta requisições para o Google (Apps Script) - vão direto pra rede
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  // Para páginas HTML, tenta cache primeiro
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html')
        .then(response => response || fetch(event.request, { cache: 'no-cache' }))
    );
    return;
  }

  // Para outros recursos, busca na rede SEM cache HTTP (no-cache)
  // e cai pro cache offline apenas se a rede falhar
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .catch(() => caches.match(event.request))
  );
});
