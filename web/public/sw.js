// Service worker minimale, SOLO per soddisfare i criteri di installabilità PWA.
// Nessuna cache: ogni richiesta passa dritta alla rete, sempre l'ultima versione
// pubblicata. Il banner "nuova versione disponibile" (non questo SW) gestisce
// l'aggiornamento dei tab già aperti — vedi UpdateBanner.tsx.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => event.respondWith(fetch(event.request)));
