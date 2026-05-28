#!/usr/bin/env python3
"""Serveur de dev GEST'IMMO — statique, SANS cache.

Le serveur http.server standard n'envoie pas d'en-tetes de cache : les
navigateurs gardent alors d'anciennes versions de styles.css / ui.js et il
faut vider le cache a chaque modif. Ici on force le rechargement a chaque
requete (no-cache), donc un simple F5 suffit toujours.

Lancement : python serve.py   (sert le dossier courant sur http://127.0.0.1:8777)
"""
import http.server

PORT = 8777
HOST = "127.0.0.1"


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


# bons types MIME (certaines installs Windows renvoient le mauvais pour .js)
NoCacheHandler.extensions_map.update({
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".css": "text/css",
})

# ThreadingHTTPServer : gere les requetes en parallele (sinon le navigateur,
# qui ouvre plusieurs connexions, bloque et expire).
http.server.ThreadingHTTPServer.allow_reuse_address = True

if __name__ == "__main__":
    with http.server.ThreadingHTTPServer((HOST, PORT), NoCacheHandler) as httpd:
        print(f"GEST'IMMO dev (no-cache) -> http://{HOST}:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
