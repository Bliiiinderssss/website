# Sécurité — GEST'IMMO

Récapitulatif des mesures de sécurité appliquées au site et des actions
recommandées pour aller plus loin côté serveur.

## ✅ Déjà appliqué (dans le code)

- **Content-Security-Policy (CSP)** via `<meta http-equiv>` sur toutes les pages :
  restreint les sources de scripts, styles, images, polices et empêche le
  chargement de code tiers non autorisé, l'`<object>`/`<embed>`, et force le
  HTTPS (`upgrade-insecure-requests`).
- **Referrer-Policy** `strict-origin-when-cross-origin` via `<meta name="referrer">` :
  limite les informations d'URL transmises aux sites tiers.
- **Suppression du code tiers inutilisé** : les bibliothèques GSAP, ScrollTrigger
  et Lenis (servies localement pour l'ancienne intro animée) ont été retirées →
  moins de surface d'attaque et de dépendances à maintenir.
- **Aucun lien `target="_blank"` non sécurisé** : pas de risque de *tabnabbing*
  (et les liens externes ajoutés portent `rel="noopener noreferrer"`).
- **Aucun contenu mixte** (`http://`) : toutes les ressources externes sont en HTTPS.

## ⚠️ À faire côté serveur / hébergeur

Certains en-têtes de sécurité **ne peuvent pas** être posés via `<meta>` et
doivent être envoyés en en-têtes HTTP par l'hébergeur. Le fichier
[`vercel.json`](vercel.json) les configure déjà **si le site est déployé sur Vercel**.
Pour un autre hébergeur, utilisez l'un des équivalents ci-dessous.

En-têtes recommandés :

| En-tête | Valeur | Rôle |
|---|---|---|
| `Content-Security-Policy` | *(voir vercel.json — inclut `frame-ancestors 'none'`)* | Anti-XSS / anti-injection |
| `X-Frame-Options` | `DENY` | Anti-*clickjacking* |
| `X-Content-Type-Options` | `nosniff` | Empêche le *MIME sniffing* |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Confidentialité |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Bloque les API sensibles |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS (HSTS) |

> `frame-ancestors` et `X-Content-Type-Options` sont **ignorés** s'ils sont mis
> via `<meta>` : ils doivent impérativement venir d'un en-tête HTTP serveur.

### Apache — `.htaccess`
```apache
<IfModule mod_headers.c>
  Header always set X-Frame-Options "DENY"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
  Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
  Header always set Content-Security-Policy "default-src 'self'; base-uri 'self'; object-src 'none'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests"
</IfModule>
```

### Nginx
```nginx
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; object-src 'none'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests" always;
```

### Netlify — fichier `_headers`
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
```

## 🔜 Pistes d'amélioration

1. **RGPD / Google Fonts** : les polices sont chargées depuis `fonts.googleapis.com`.
   La CNIL considère ce chargement comme un transfert d'adresse IP vers Google.
   Pour une conformité totale, **auto-héberger les polices** (télécharger les
   fichiers `.woff2` et les servir depuis `/assets/fonts/`), puis retirer
   `fonts.googleapis.com` / `fonts.gstatic.com` de la CSP.

2. **Durcir la CSP** : la directive `'unsafe-inline'` (scripts et styles) est
   nécessaire à cause des scripts et styles en ligne actuels. Pour la supprimer :
   externaliser les `<script>`/`<style>` en ligne et les gestionnaires `onclick`/
   `onsubmit`/`onerror`, puis passer à une CSP par **nonce** ou **hash**.

3. **Formulaires** : les formulaires de contact/recherche sont actuellement
   gérés côté client uniquement (aucun envoi serveur). Lors du branchement d'un
   back-end, ajouter une protection **anti-CSRF**, une **validation serveur** et
   un **anti-spam** (honeypot ou captcha), et étendre `connect-src`/`form-action`
   en conséquence.
