/* ============================================================
   GEST'IMMO — Reveal au scroll (robuste, performant, fail-open)
   - Basé sur la position réelle au scroll (fiable même si l'IO est
     suspendu) ; rAF throttle pour les perfs.
   - Le contenu reste visible si le JS échoue (la classe reveal-ready
     n'est posée que par ce script).
   - On ne masque QUE des blocs de contenu (jamais de grands bandeaux
     pleine largeur) pour éviter tout « trou » visuel.
   ============================================================ */
(function () {
  function init() {
    var root = document.documentElement;

    var SELECTORS = [
      ".sect-head",
      ".invest-card", ".res-card", ".prop-card", ".sim-card",
      ".pillar", ".v-item", ".tl-step",
      ".two-col", ".timeline-wrap",
      ".bullets > li", ".testi", ".estimator"
    ];

    var nodes = [];
    SELECTORS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (el.closest(".home-hero") || el.closest(".page-hero")) return; // hero exclu
        if (nodes.indexOf(el) !== -1) return;
        nodes.push(el);
      });
    });
    if (!nodes.length) return;

    // Stagger doux selon la position parmi les frères de même type
    nodes.forEach(function (el) {
      el.setAttribute("data-reveal", "");
      var parent = el.parentElement;
      if (parent) {
        var sibs = Array.prototype.filter.call(parent.children, function (c) {
          return c.tagName === el.tagName && c.hasAttribute("data-reveal");
        });
        var i = sibs.indexOf(el);
        if (i > 0) el.style.transitionDelay = Math.min(i, 6) * 80 + "ms";
      }
    });

    root.classList.add("reveal-ready");

    var pending = nodes.slice();
    var ticking = false;

    function check() {
      ticking = false;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var still = [];
      for (var i = 0; i < pending.length; i++) {
        var el = pending[i];
        var r = el.getBoundingClientRect();
        // Révélé dès que le bloc entre dans les 92 % hauts du viewport
        if (r.top < vh * 0.92 && r.bottom > 0) {
          el.classList.add("in-view");
        } else {
          still.push(el);
        }
      }
      pending = still;
      if (!pending.length) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(check);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("load", onScroll, { passive: true });

    check(); // révèle immédiatement ce qui est déjà visible

    // Filet ultime anti-blanc : si quoi que ce soit reste masqué après 5 s
    setTimeout(function () {
      nodes.forEach(function (el) {
        if (!el.classList.contains("in-view")) {
          var r = el.getBoundingClientRect();
          if (r.top < (window.innerHeight || 0)) el.classList.add("in-view");
        }
      });
    }, 5000);
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();

/* ============================================================
   GEST'IMMO — Navigation mobile (tiroir hamburger)
   - Réutilise le <nav class="nav"> existant comme tiroir.
   - Crée le bouton hamburger s'il manque (14 pages n'en ont pas).
   - Clone les CTA du header en bas du tiroir.
   - Sous-menus déployés ; fermeture au lien / Échap / clic extérieur.
   ============================================================ */
(function () {
  function init() {
    var header = document.querySelector(".header");
    if (!header) return;
    var inner = header.querySelector(".inner");
    var nav = header.querySelector(".nav");
    if (!inner || !nav) return;
    if (!nav.id) nav.id = "site-nav";

    var trigger = inner.querySelector(".menu-trigger");
    if (!trigger) {
      trigger = document.createElement("button");
      trigger.className = "menu-trigger btn btn-ghost btn-sm";
      inner.appendChild(trigger);
    }
    trigger.type = "button";
    trigger.innerHTML = '<span class="mt-bars" aria-hidden="true"><span></span><span></span><span></span></span>';
    trigger.setAttribute("aria-controls", nav.id);
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-label", "Ouvrir le menu");

    // Clone des CTA du header, affichés en bas du tiroir sur mobile
    var cta = inner.querySelector(".header-cta");
    if (cta && !nav.querySelector(".nav-cta")) {
      var clone = cta.cloneNode(true);
      clone.className = "nav-cta";
      nav.appendChild(clone);
    }

    var root = document.documentElement;
    function setH() { root.style.setProperty("--header-h", header.offsetHeight + "px"); }
    setH();

    function open() {
      root.classList.add("nav-open");
      trigger.setAttribute("aria-expanded", "true");
      trigger.setAttribute("aria-label", "Fermer le menu");
    }
    function close() {
      root.classList.remove("nav-open");
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-label", "Ouvrir le menu");
    }
    function toggle() { root.classList.contains("nav-open") ? close() : open(); }

    trigger.addEventListener("click", function (e) { e.stopPropagation(); toggle(); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    document.addEventListener("click", function (e) {
      if (root.classList.contains("nav-open") && !nav.contains(e.target) && !trigger.contains(e.target)) close();
    });
    window.addEventListener("resize", function () { setH(); if (window.innerWidth > 1100) close(); });
  }
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
