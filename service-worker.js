// service-worker.js - VERSÃO ÚNICA E FUNCIONAL
const CACHE_VERSION = 'v3.1'; // MUDE ESTE NÚMERO SEMPRE QUE ATUALIZAR
const CACHE_NAME = `frequencia-${CACHE_VERSION}`;

self.addEventListener('install', event => {
  console.log('Service Worker: Instalado, versão', CACHE_VERSION);
  // Ativa a nova versão imediatamente, sem esperar todas as abas fecharem.
  // Isso evita ficar preso numa versão antiga (o problema que causava o
  // "não salva no mobile").
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
        .then(response => response || fetch(event.request))
    );
    return;
  }

  // Para outros recursos, busca na rede primeiro e cai pro cache se offline
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
