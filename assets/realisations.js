/* ============================================================
   GEST'IMMO — Carrousel « Réalisations » (vanilla, fail-open)
   - Les projets sont déclarés dans le HTML (data-* sur chaque
     .real-slide) : le contenu reste visible si le JS échoue.
   - Effet 3D (gauche/centre/droite), autoplay avec pause au survol
     et au focus, navigation flèches + points + clavier.
   - Respecte prefers-reduced-motion (pas d'autoplay).
   ============================================================ */
(function () {
  function init() {
    var root = document.getElementById("realCarousel");
    if (!root) return;

    var stage = root.querySelector(".real-stage");
    var slides = Array.prototype.slice.call(root.querySelectorAll(".real-slide"));
    var n = slides.length;
    if (!n) return;

    var panel = root.querySelector(".real-panel");
    var elMeta = root.querySelector(".real-meta");
    var elName = root.querySelector(".real-name");
    var elQuote = root.querySelector(".real-quote");
    var elResult = root.querySelector(".real-result");
    var dotsWrap = root.querySelector(".real-dots");

    var idx = 0;
    var timer = null;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var delay = parseInt(root.getAttribute("data-autoplay"), 10) || 6000;

    // Points de navigation
    var dots = [];
    if (dotsWrap) {
      for (var i = 0; i < n; i++) {
        var d = document.createElement("button");
        d.type = "button";
        d.className = "real-dot";
        d.setAttribute("aria-label", "Aller au projet " + (i + 1));
        (function (k) {
          d.addEventListener("click", function () { go(k); restart(); });
        })(i);
        dotsWrap.appendChild(d);
        dots.push(d);
      }
    }

    function applyText(s) {
      if (elMeta) elMeta.textContent = s.getAttribute("data-meta") || "";
      if (elName) elName.textContent = s.getAttribute("data-name") || "";
      if (elQuote) elQuote.textContent = s.getAttribute("data-quote") || "";
      if (elResult) elResult.textContent = s.getAttribute("data-result") || "";
    }

    function render(animate) {
      for (var i = 0; i < n; i++) {
        var s = slides[i];
        s.classList.remove("is-active", "is-prev", "is-next");
        if (i === idx) s.classList.add("is-active");
        else if (i === (idx - 1 + n) % n) s.classList.add("is-prev");
        else if (i === (idx + 1) % n) s.classList.add("is-next");
      }
      for (var j = 0; j < dots.length; j++) {
        dots[j].classList.toggle("is-active", j === idx);
      }
      var cur = slides[idx];
      if (!panel) return;
      if (animate && !reduce) {
        panel.classList.add("is-out");
        setTimeout(function () {
          applyText(cur);
          panel.classList.remove("is-out");
        }, 260);
      } else {
        applyText(cur);
      }
    }

    function go(i) { idx = (i % n + n) % n; render(true); }
    function next() { go(idx + 1); }
    function prev() { go(idx - 1); }

    function start() { if (reduce || timer) return; timer = setInterval(next, delay); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    // Flèches
    var arrows = root.querySelectorAll(".real-arrow");
    for (var a = 0; a < arrows.length; a++) {
      arrows[a].addEventListener("click", function () {
        if (this.getAttribute("data-dir") === "prev") prev();
        else next();
        restart();
      });
    }

    // Pause au survol / focus
    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", start);

    // Clavier (uniquement quand le focus est dans le carrousel)
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { prev(); restart(); }
      else if (e.key === "ArrowRight") { next(); restart(); }
    });

    // Navigation tactile (swipe)
    var startX = null;
    stage.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) { (dx < 0 ? next : prev)(); restart(); }
      startX = null;
    }, { passive: true });

    render(false);
    start();
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
