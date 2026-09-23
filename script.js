(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hoverFine = function () { return window.matchMedia("(hover: hover) and (pointer: fine)").matches; };
  var isMobile = function () { return window.matchMedia("(max-width: 760px)").matches; };
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");
  var EMAIL = "Jeoffreysherren01@gmail.com";

  var SECTIONS = ["opening", "about", "work", "capability", "record", "engage", "contact"];

  /* ============================================================
     Keyboard-shortcut label: real platform detection, not a guess.
     ============================================================ */
  var kbdLabel = isMac ? "⌘K" : "Ctrl K";
  document.querySelectorAll("#paletteKbd, #kbdHintKey, #footerKbdKey").forEach(function (el) {
    el.textContent = kbdLabel;
  });
  if (isMobile()) {
    var kbdHint = document.getElementById("kbdHint");
    if (kbdHint) kbdHint.style.display = "none";
  }

  /* ============================================================
     Light / dark mode toggle. The inline script in <head> already set
     data-theme before first paint (from localStorage, or the OS
     preference); this just wires up the button, persists changes, and
     keeps the browser-chrome theme-color meta tag honest.
     ============================================================ */
  (function themeToggle() {
    var root = document.documentElement;
    var btn = document.getElementById("themeToggle");
    var meta = document.querySelector('meta[name="theme-color"]');

    function apply(theme) {
      root.setAttribute("data-theme", theme);
      if (meta) meta.setAttribute("content", theme === "light" ? "#FAFAF7" : "#111111");
      if (btn) btn.setAttribute("aria-label", theme === "light" ? "Switch to dark mode" : "Switch to light mode");
    }
    apply(root.getAttribute("data-theme") || "dark");

    if (btn) {
      btn.addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
        apply(next);
        try { localStorage.setItem("theme", next); } catch (e) { /* private mode: theme just won't persist */ }
      });
    }

    // Only follow a live OS theme change if the visitor never chose one
    // themselves here.
    var mql = window.matchMedia("(prefers-color-scheme: light)");
    var onSystemChange = function (e) {
      var hasSaved = false;
      try { hasSaved = !!localStorage.getItem("theme"); } catch (err) { /* ignore */ }
      if (!hasSaved) apply(e.matches ? "light" : "dark");
    };
    if (mql.addEventListener) mql.addEventListener("change", onSystemChange);
  })();

  /* ============================================================
     Scroll reveal
     ============================================================ */
  if (!reduceMotion && "IntersectionObserver" in window) {
    document.documentElement.classList.add("js-reveal");

    [
      document.querySelectorAll(".stack-card"),
      document.querySelectorAll(".log-entry"),
      document.querySelectorAll(".engage-card"),
      document.querySelectorAll(".client-card")
    ].forEach(function (group) {
      Array.prototype.forEach.call(group, function (el, i) {
        el.style.transitionDelay = (Math.min(i, 5) * 0.05) + "s";
      });
    });

    var revealTargets = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.01, rootMargin: "0px 0px -6% 0px" }
    );
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ============================================================
     Code panel: reveals the payrollCalc.js excerpt one line at a
     time the first time it scrolls into view.
     ============================================================ */
  if (!reduceMotion && "IntersectionObserver" in window) {
    var codePanel = document.querySelector(".code-panel");
    if (codePanel) {
      var codeLines = codePanel.querySelectorAll(".code-panel-line");
      Array.prototype.forEach.call(codeLines, function (line, i) {
        line.style.transitionDelay = (i * 0.035) + "s";
      });
      var codeObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-revealed");
              codeObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.01, rootMargin: "0px 0px -6% 0px" }
      );
      codeObserver.observe(codePanel);
    } else {
      var cp = document.querySelector(".code-panel");
    }
  }
  // No-JS/reduced-motion visitors, and the reveal-gate above, both leave the
  // code panel fully visible at rest since .js-reveal is never added.

  /* ============================================================
     Flagship / client / engagement card glow: soft gold highlight
     that tracks the pointer. Desktop-only, skipped under reduced motion.
     ============================================================ */
  (function panelGlow() {
    if (!hoverFine() || reduceMotion) return;
    var glowPanels = document.querySelectorAll(".svc-panel, .client-card, .engage-card, .stack-card");
    Array.prototype.forEach.call(glowPanels, function (panel) {
      panel.addEventListener("mousemove", function (e) {
        var rect = panel.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width) * 100;
        var y = ((e.clientY - rect.top) / rect.height) * 100;
        panel.style.setProperty("--mx", x + "%");
        panel.style.setProperty("--my", y + "%");
      });
    });
  })();

  /* ============================================================
     Header: scroll show/hide, scrolled shadow, progress bar,
     active-section tracking (drives nav pill + dock + mobile menu).
     ============================================================ */
  var header = document.getElementById("siteHeader");
  var headerProgress = document.getElementById("headerProgress");
  var lastScrollY = window.scrollY;
  var activeSection = "opening";
  var activeListeners = [];

  function onActiveSectionChange(fn) { activeListeners.push(fn); }

  function computeActiveSection() {
    var current = "opening";
    for (var i = 0; i < SECTIONS.length; i++) {
      var el = document.getElementById(SECTIONS[i]);
      if (el && el.getBoundingClientRect().top < window.innerHeight * 0.35) current = SECTIONS[i];
    }
    return current;
  }

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var progress = max > 0 ? doc.scrollTop / max : 0;
    if (headerProgress) headerProgress.style.transform = "scaleX(" + progress + ")";

    if (header) {
      var y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 4);
      if (y > lastScrollY && y > 120) {
        header.classList.add("is-hidden");
      } else {
        header.classList.remove("is-hidden");
      }
      lastScrollY = y;
    }

    var cur = computeActiveSection();
    if (cur !== activeSection) {
      activeSection = cur;
      activeListeners.forEach(function (fn) { fn(activeSection); });
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Nav link active-state classes, kept in sync across the header nav,
     mobile dock, and mobile overlay menu (three separate nav lists that
     all point at the same sections). */
  function syncNavActiveClasses(id) {
    document.querySelectorAll("[data-nav]").forEach(function (a) {
      var isActive = a.getAttribute("href") === "#" + id;
      a.classList.toggle("is-active", isActive);
    });
  }
  onActiveSectionChange(syncNavActiveClasses);
  syncNavActiveClasses(activeSection);

  /* ============================================================
     Sliding nav-pill indicator: follows the active link at rest,
     and previews under the pointer on hover (desktop only).
     ============================================================ */
  (function navPill() {
    var nav = document.getElementById("primaryNav");
    var pill = document.getElementById("navPill");
    if (!nav || !pill) return;

    function moveTo(link) {
      if (!link) { pill.style.opacity = "0"; return; }
      var navRect = nav.getBoundingClientRect();
      var linkRect = link.getBoundingClientRect();
      pill.style.width = linkRect.width + "px";
      pill.style.transform = "translateX(" + (linkRect.left - navRect.left) + "px)";
      pill.style.opacity = "1";
    }

    function moveToActive() {
      moveTo(nav.querySelector("a.is-active"));
    }

    onActiveSectionChange(function () {
      if (!nav.matches(":hover")) moveToActive();
    });

    Array.prototype.forEach.call(nav.querySelectorAll("a"), function (a) {
      a.addEventListener("mouseenter", function () { moveTo(a); });
    });
    nav.addEventListener("mouseleave", moveToActive);
    window.addEventListener("resize", moveToActive);
    // Fonts loading late can shift link widths/positions after first paint.
    window.addEventListener("load", moveToActive);
    setTimeout(moveToActive, 60);
  })();

  /* ============================================================
     Hover-scramble nav text: resolves back to the real label.
     Desktop pointer only, skipped under reduced motion.
     ============================================================ */
  (function scrambleHoverNav() {
    if (reduceMotion) return;
    var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    document.querySelectorAll("[data-scramble-hover]").forEach(function (el) {
      var real = el.textContent;
      var frame = 0;
      var raf = null;
      el.addEventListener("mouseenter", function () {
        if (!hoverFine()) return;
        if (raf) cancelAnimationFrame(raf);
        var steps = 8;
        frame = 0;
        (function tick() {
          frame++;
          var resolved = Math.floor((frame / steps) * real.length);
          var out = "";
          for (var i = 0; i < real.length; i++) {
            if (i < resolved || real[i] === " ") out += real[i];
            else out += CHARS[Math.floor(Math.random() * CHARS.length)];
          }
          el.textContent = out;
          if (frame < steps) raf = requestAnimationFrame(tick);
          else el.textContent = real;
        })();
      });
      el.addEventListener("mouseleave", function () {
        if (raf) cancelAnimationFrame(raf);
        el.textContent = real;
      });
    });
  })();

  /* ============================================================
     Scramble-in headings: resolves from noise to the real word the
     first time each heading scrolls into view.
     ============================================================ */
  (function scrambleHeadings() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var targets = document.querySelectorAll("[data-scramble]");
    if (!targets.length) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        var el = entry.target;
        var real = el.textContent;
        var steps = 10;
        var frame = 0;
        (function tick() {
          frame++;
          var resolved = Math.floor((frame / steps) * real.length);
          var out = "";
          for (var i = 0; i < real.length; i++) {
            out += i < resolved ? real[i] : CHARS[Math.floor(Math.random() * CHARS.length)];
          }
          el.textContent = out;
          if (frame < steps) requestAnimationFrame(tick);
          else el.textContent = real;
        })();
      });
    }, { threshold: 0.6 });
    targets.forEach(function (el) { obs.observe(el); });
  })();

  /* ============================================================
     Spinning logo mark: a quick full spin on click, plus once,
     gently, a beat after first load. Purely decorative, skipped
     under reduced motion.
     ============================================================ */
  (function spinningLogo() {
    if (reduceMotion) return;
    var mark = document.getElementById("brandMark");
    if (!mark) return;
    function spin() {
      mark.classList.remove("is-spinning");
      void mark.offsetWidth; // restart the CSS animation
      mark.classList.add("is-spinning");
    }
    mark.closest("a").addEventListener("click", function () { spin(); });
    setTimeout(spin, 900);
  })();

  /* ============================================================
     Count-up hero stats: animates from 0 to the real figure the
     first time the stats row scrolls into view.
     ============================================================ */
  (function countUp() {
    var stats = document.querySelectorAll("[data-count]");
    if (!stats.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      stats.forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        var el = entry.target;
        var target = parseInt(el.getAttribute("data-count"), 10) || 0;
        var start = performance.now();
        var duration = 900;
        (function tick(now) {
          var t = Math.min(1, (now - start) / duration);
          var eased = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(eased * target);
          if (t < 1) requestAnimationFrame(tick);
          else el.textContent = target;
        })(start);
      });
    }, { threshold: 0.4 });
    stats.forEach(function (el) { obs.observe(el); });
  })();

  /* ============================================================
     Typewriter: cycles the hero's "~/work $" phrase list. Skipped
     under reduced motion, where the first phrase is shown, static.
     ============================================================ */
  (function typewriter() {
    var el = document.getElementById("typewriterPhrase");
    if (!el) return;
    var phrases = (el.getAttribute("data-phrases") || "").split("|").filter(Boolean);
    if (reduceMotion || phrases.length < 2) return;
    var phraseIndex = 0;
    var charIndex = phrases[0].length;
    var deleting = false;

    function tick() {
      var current = phrases[phraseIndex];
      if (!deleting) {
        charIndex++;
        if (charIndex > current.length) {
          charIndex = current.length;
          deleting = true;
          setTimeout(tick, 1600);
          return;
        }
      } else {
        charIndex--;
        if (charIndex < 0) {
          charIndex = 0;
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          setTimeout(tick, 300);
          return;
        }
      }
      el.textContent = current.slice(0, charIndex);
      setTimeout(tick, deleting ? 28 : 42);
    }
    setTimeout(tick, 2200);
  })();

  /* ============================================================
     Magnetic hover: nudges [data-magnetic] buttons toward the
     pointer. Desktop pointer:fine only, skipped under reduced motion.
     ============================================================ */
  (function magnetic() {
    if (reduceMotion || !hoverFine()) return;
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var rect = el.getBoundingClientRect();
        var mx = (e.clientX - rect.left - rect.width / 2) * 0.25;
        var my = (e.clientY - rect.top - rect.height / 2) * 0.35;
        el.style.setProperty("--mx", mx.toFixed(1) + "px");
        el.style.setProperty("--my", my.toFixed(1) + "px");
      });
      el.addEventListener("mouseleave", function () {
        el.style.setProperty("--mx", "0px");
        el.style.setProperty("--my", "0px");
      });
    });
  })();

  /* ============================================================
     Hero photo: spotlight + gentle 3D tilt tracking the pointer.
     Desktop pointer:fine only, skipped under reduced motion.
     ============================================================ */
  (function heroTilt() {
    var card = document.getElementById("heroPhotoCard");
    if (!card || reduceMotion || !hoverFine()) return;
    card.addEventListener("mousemove", function (e) {
      var rect = card.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width;
      var py = (e.clientY - rect.top) / rect.height;
      card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
      card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      var rotY = (px - 0.5) * 10;
      var rotX = (0.5 - py) * 8;
      card.style.transform = "rotateX(" + rotX.toFixed(2) + "deg) rotateY(" + rotY.toFixed(2) + "deg)";
    });
    card.addEventListener("mouseleave", function () {
      card.style.transform = "rotateX(0deg) rotateY(0deg)";
    });
  })();

  /* ============================================================
     Hero particle canvas: a soft ambient drift of connected points.
     Skipped entirely under reduced motion. Paused while the tab is
     hidden. On hover-capable pointers, particles are gently pushed
     away from the cursor; on touch, they just drift.
     ============================================================ */
  (function heroParticles() {
    var canvas = document.getElementById("heroCanvas");
    var section = document.getElementById("opening");
    if (!canvas || !section || reduceMotion) { if (canvas) canvas.remove(); return; }

    var ctx = canvas.getContext("2d");
    var particles = [];
    var pointer = { x: -9999, y: -9999, active: false };
    var raf = null;
    var running = false;
    var width = 0, height = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      width = section.clientWidth;
      height = section.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round((width * height) / 22000);
      count = Math.max(18, Math.min(70, count));
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          r: 1 + Math.random() * 1.4
        });
      }
    }

    function step() {
      ctx.clearRect(0, 0, width, height);
      var canHover = hoverFine();
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        if (canHover && pointer.active) {
          var dx = p.x - pointer.x, dy = p.y - pointer.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90 && dist > 0.01) {
            var force = (90 - dist) / 90 * 0.04;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }
        p.vx *= 0.98; p.vy *= 0.98;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        p.x = Math.max(0, Math.min(width, p.x));
        p.y = Math.max(0, Math.min(height, p.y));
      }
      ctx.fillStyle = "rgba(200,145,74,0.55)";
      for (var j = 0; j < particles.length; j++) {
        ctx.beginPath();
        ctx.arc(particles[j].x, particles[j].y, particles[j].r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.lineWidth = 1;
      for (var a = 0; a < particles.length; a++) {
        for (var b = a + 1; b < particles.length; b++) {
          var ddx = particles[a].x - particles[b].x;
          var ddy = particles[a].y - particles[b].y;
          var d = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d < 120) {
            ctx.strokeStyle = "rgba(200,145,74," + ((1 - d / 120) * 0.16).toFixed(3) + ")";
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
      if (running) raf = requestAnimationFrame(step);
    }

    function start() { if (!running) { running = true; raf = requestAnimationFrame(step); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

    resize();
    start();
    window.addEventListener("resize", resize);
    section.addEventListener("mousemove", function (e) {
      var rect = section.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    });
    section.addEventListener("mouseleave", function () { pointer.active = false; });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });
  })();

  /* ============================================================
     Mobile hamburger -> full-screen overlay menu.
     ============================================================ */
  (function mobileMenu() {
    var toggle = document.getElementById("menuToggle");
    var menu = document.getElementById("mobileMenu");
    if (!toggle || !menu) return;

    function open() {
      menu.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
      document.body.classList.add("menu-open");
    }
    function close() {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      document.body.classList.remove("menu-open");
    }
    toggle.addEventListener("click", function () {
      if (menu.classList.contains("is-open")) close(); else open();
    });
    menu.querySelectorAll("a[data-mobile-menu-link]").forEach(function (a) {
      a.addEventListener("click", close);
    });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) close();
    });
    window.addEventListener("resize", function () {
      if (!isMobile() && menu.classList.contains("is-open")) close();
    });

    var copyBtn = document.getElementById("mobileMenuCopyBtn");
    if (copyBtn) copyBtn.addEventListener("click", function () { copyEmail(copyBtn, "copy email"); });
  })();

  /* ============================================================
     Mobile dock: shown only on small widths, hidden while the
     overlay menu, command palette, or case-study modal is open.
     ============================================================ */
  (function mobileDock() {
    var dock = document.getElementById("mobileDock");
    var spacer = document.getElementById("dockSpacer");
    if (!dock) return;

    function refresh() {
      var menuOpen = document.body.classList.contains("menu-open");
      var paletteOpen = document.body.classList.contains("palette-open");
      var modalOpen = document.body.classList.contains("modal-open");
      var show = isMobile() && !menuOpen && !paletteOpen && !modalOpen;
      dock.classList.toggle("is-visible", show);
      if (spacer) spacer.style.display = isMobile() ? "block" : "none";
    }
    onActiveSectionChange(function (id) {
      dock.querySelectorAll("a").forEach(function (a) {
        a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
      });
    });
    var mo = new MutationObserver(refresh);
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", refresh);
    refresh();
  })();

  /* ============================================================
     Skill-strength bars: fills the first N of 3 bars per row from
     the real level word already shown next to it (fluent = 3,
     working knowledge = 2, familiar = 1), no new data.
     ============================================================ */
  (function skillBars() {
    document.querySelectorAll(".skill-bars").forEach(function (row) {
      var level = parseInt(row.getAttribute("data-level"), 10) || 0;
      var bars = row.querySelectorAll("span");
      Array.prototype.forEach.call(bars, function (bar, i) {
        bar.classList.toggle("is-filled", i < level);
      });
    });
  })();

  /* ============================================================
     Client work: category filter pills + counts + card descriptions
     and live-site links, both populated from the same PROJECTS_DATA
     the case-study modal already uses, so nothing is duplicated or
     re-typed by hand.
     ============================================================ */
  (function clientWork() {
    var grid = document.getElementById("clientGrid");
    if (!grid) return;
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".client-card"));

    if (typeof PROJECTS_DATA !== "undefined") {
      cards.forEach(function (card) {
        var key = card.getAttribute("data-project");
        var data = PROJECTS_DATA[key];
        if (!data) return;
        var desc = card.querySelector("[data-desc]");
        if (desc) desc.textContent = data.overview;
        var footSlot = card.querySelector(".client-card-cta");
        var liveUrl = card.getAttribute("data-live");
        if (footSlot) {
          if (liveUrl) {
            var a = document.createElement("a");
            a.href = liveUrl;
            a.target = "_blank";
            a.rel = "noopener";
            a.className = "client-card-cta";
            a.textContent = "Visit Live Site →";
            a.addEventListener("click", function (e) { e.stopPropagation(); });
            footSlot.replaceWith(a);
          } else {
            footSlot.textContent = "View case study →";
          }
        }
      });
    }

    var filters = document.querySelectorAll(".filter-pill");
    filters.forEach(function (pill) {
      var cat = pill.getAttribute("data-filter");
      var count = cat === "All" ? cards.length : cards.filter(function (c) { return c.getAttribute("data-category") === cat; }).length;
      var span = pill.querySelector("span");
      if (span) span.textContent = count;
      pill.addEventListener("click", function () {
        filters.forEach(function (p) { p.classList.remove("is-active"); });
        pill.classList.add("is-active");
        cards.forEach(function (c) {
          var match = cat === "All" || c.getAttribute("data-category") === cat;
          c.classList.toggle("is-hidden", !match);
        });
      });
    });

    cards.forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;
        openCaseStudy(card.getAttribute("data-project"), card.getAttribute("data-title") || "", card.getAttribute("data-category") || "");
      });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openCaseStudy(card.getAttribute("data-project"), card.getAttribute("data-title") || "", card.getAttribute("data-category") || "");
        }
      });
    });
  })();

  /* ============================================================
     Interactive payroll calculator: the exact real formulas from
     the excerpt above (computeSSS / computePhilHealth / computePagIbig
     / computeTax), run live against the slider. Every number here
     stays labeled illustrative, never live payroll data.
     ============================================================ */
  (function payrollCalculator() {
    var slider = document.getElementById("calcSlider");
    if (!slider) return;

    function peso(n) {
      return "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function num(n) {
      return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    // Real, verbatim math from js/payrollCalc.js (see the excerpt above).
    function computeSSS(basic) { return Math.min(basic * 0.045, 1350); }
    function computePhilHealth(basic) { return Math.min(basic * 0.025, 2500); }
    function computePagIbig() { return 100; }
    function computeTax(taxable) {
      if (taxable <= 20833) return { tax: 0, bracket: 0 };
      if (taxable <= 33332) return { tax: (taxable - 20833) * 0.15, bracket: 1 };
      if (taxable <= 66666) return { tax: 1875 + (taxable - 33333) * 0.20, bracket: 2 };
      if (taxable <= 166666) return { tax: 8541.8 + (taxable - 66667) * 0.25, bracket: 3 };
      return { tax: 33541.8 + (taxable - 166667) * 0.30, bracket: 4 };
    }

    var els = {
      basicInline: document.getElementById("calcBasicInline"),
      basicValue: document.getElementById("calcBasicValue"),
      rowSss: document.getElementById("rowSss"),
      rowPh: document.getElementById("rowPh"),
      rowPi: document.getElementById("rowPi"),
      rowTax: document.getElementById("rowTax"),
      rowNet: document.getElementById("rowNet"),
      barNet: document.getElementById("barNet"),
      barSss: document.getElementById("barSss"),
      barPh: document.getElementById("barPh"),
      barPi: document.getElementById("barPi"),
      barTax: document.getElementById("barTax"),
      taxableRaw: document.getElementById("calcTaxableRaw"),
      taxRaw: document.getElementById("calcTaxRaw"),
      bracketNo: document.getElementById("calcBracketNo")
    };
    var presets = document.querySelectorAll(".calc-preset");
    var codePanel = document.getElementById("codePanel");

    function render(basic) {
      var sss = computeSSS(basic);
      var ph = computePhilHealth(basic);
      var pi = computePagIbig();
      var taxable = basic - sss - ph - pi;
      var taxResult = computeTax(taxable);
      var tax = Math.round(taxResult.tax * 100) / 100;
      var net = basic - sss - ph - pi - tax;

      if (els.basicInline) els.basicInline.textContent = peso(basic);
      if (els.basicValue) els.basicValue.textContent = peso(basic);
      if (els.rowSss) els.rowSss.textContent = "-" + peso(sss);
      if (els.rowPh) els.rowPh.textContent = "-" + peso(ph);
      if (els.rowPi) els.rowPi.textContent = "-" + peso(pi);
      if (els.rowTax) els.rowTax.textContent = "-" + peso(tax);
      if (els.rowNet) els.rowNet.textContent = peso(net);
      if (els.taxableRaw) els.taxableRaw.textContent = num(taxable);
      if (els.taxRaw) els.taxRaw.textContent = num(tax);
      if (els.bracketNo) els.bracketNo.textContent = taxResult.bracket + 1;

      var pct = function (v) { return (v / basic * 100).toFixed(2) + "%"; };
      if (els.barNet) els.barNet.style.width = pct(net);
      if (els.barSss) els.barSss.style.width = pct(sss);
      if (els.barPh) els.barPh.style.width = pct(ph);
      if (els.barPi) els.barPi.style.width = pct(pi);
      if (els.barTax) els.barTax.style.width = pct(tax);

      presets.forEach(function (btn) {
        btn.classList.toggle("is-active", parseInt(btn.getAttribute("data-preset"), 10) === basic);
      });

      if (codePanel) {
        var sssHit = basic * 0.045 > 1350;
        var phHit = basic * 0.025 > 2500;
        codePanel.querySelectorAll('[data-hl="sss"]').forEach(function (l) { l.classList.toggle("is-active", sssHit); });
        codePanel.querySelectorAll('[data-hl="ph"]').forEach(function (l) { l.classList.toggle("is-active", phHit); });
        [0, 1, 2, 3, 4].forEach(function (b) {
          codePanel.querySelectorAll('[data-hl="b' + b + '"]').forEach(function (l) {
            l.classList.toggle("is-active", taxResult.bracket === b);
          });
        });
      }
    }

    slider.addEventListener("input", function () { render(Number(slider.value)); });
    presets.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var v = Number(btn.getAttribute("data-preset"));
        slider.value = v;
        render(v);
      });
    });
    render(Number(slider.value));
  })();

  /* ============================================================
     Copy email to clipboard: shared by the contact.json widget,
     the mobile menu, and the command palette's "copy email" action.
     ============================================================ */
  function copyEmail(btn, restingLabel) {
    var done = function (ok) {
      if (!btn) return;
      var original = restingLabel || btn.textContent;
      btn.textContent = ok ? "copied ✓" : "copy failed";
      setTimeout(function () { btn.textContent = original; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(EMAIL).then(function () { done(true); }, function () { done(false); });
    } else {
      done(false);
    }
  }
  var copyEmailBtn = document.getElementById("copyEmailBtn");
  if (copyEmailBtn) copyEmailBtn.addEventListener("click", function () { copyEmail(copyEmailBtn, "copy email"); });

  /* ============================================================
     Command palette: real, page-derived actions only (sections,
     the same PROJECTS_DATA the case-study modal uses, and the real
     outbound links already present elsewhere on the page).
     ============================================================ */
  (function commandPalette() {
    var trigger = document.getElementById("paletteTrigger");
    var overlay = document.getElementById("paletteOverlay");
    var input = document.getElementById("paletteInput");
    var results = document.getElementById("paletteResults");
    if (!trigger || !overlay || !input || !results) return;

    var items = [];
    var activeIndex = 0;
    var lastFocused = null;

    function buildItems() {
      var list = [
        { label: "Top", group: "jump to", hint: "#opening", run: function () { goTo("opening"); } },
        { label: "About", group: "jump to", hint: "#about", run: function () { goTo("about"); } },
        { label: "Services", group: "jump to", hint: "#work", run: function () { goTo("work"); } },
        { label: "Client work", group: "jump to", hint: "#clients", run: function () { goTo("clients"); } },
        { label: "Stack", group: "jump to", hint: "#capability", run: function () { goTo("capability"); } },
        { label: "Log", group: "jump to", hint: "#record", run: function () { goTo("record"); } },
        { label: "Engagements", group: "jump to", hint: "#engage", run: function () { goTo("engage"); } },
        { label: "Contact", group: "jump to", hint: "#contact", run: function () { goTo("contact"); } }
      ];

      if (typeof PROJECTS_DATA !== "undefined") {
        document.querySelectorAll("[data-project]").forEach(function (el) {
          var key = el.getAttribute("data-project");
          var title = el.getAttribute("data-title");
          var category = el.getAttribute("data-category");
          if (!key || !title || list.some(function (i) { return i._key === key; })) return;
          list.push({
            _key: key, label: title, group: "case study", hint: category,
            run: function () { openCaseStudy(key, title, category); }
          });
        });
      }

      var open = function (url) { return function () { window.open(url, "_blank", "noopener"); }; };
      list.push(
        { label: "Copy email address", group: "action", hint: EMAIL, run: function () { copyEmail(null, ""); } },
        { label: "Open resume", group: "action", hint: "JSarmiento_RESUME.pdf", run: open("./assets/JSarmiento_RESUME.pdf") },
        { label: "Open JERSA ERP console", group: "link", hint: "yendevs.github.io/JersaERP", run: open("https://yendevs.github.io/JersaERP/") },
        { label: "GitHub", group: "link", hint: "yendevs", run: open("https://github.com/yendevs") },
        { label: "LinkedIn", group: "link", hint: "view profile", run: open("https://www.linkedin.com/in/jeoffrey-sherren-sarmiento-540438352") }
      );
      return list;
    }

    function goTo(id) {
      var el = document.getElementById(id);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: reduceMotion ? "auto" : "smooth" });
    }

    function filtered() {
      var q = input.value.trim().toLowerCase();
      if (!q) return items;
      return items.filter(function (i) {
        return (i.label + " " + i.hint + " " + i.group).toLowerCase().indexOf(q) !== -1;
      });
    }

    function renderResults() {
      var list = filtered();
      activeIndex = 0;
      results.innerHTML = "";
      if (!list.length) {
        var empty = document.createElement("p");
        empty.className = "command-palette-empty";
        empty.textContent = 'no matches for "' + input.value.trim() + '"';
        results.appendChild(empty);
        return;
      }
      list.forEach(function (item, i) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "command-palette-item" + (i === 0 ? " is-active" : "");
        btn.innerHTML =
          '<span class="left"><span class="group group--' + groupClass(item.group) + '">' + item.group + '</span>' +
          '<span class="label"></span></span><span class="hint"></span>';
        btn.querySelector(".label").textContent = item.label;
        btn.querySelector(".hint").textContent = item.hint || "";
        btn.addEventListener("mouseenter", function () { setActive(i); });
        btn.addEventListener("click", function () { runItem(item); });
        results.appendChild(btn);
      });
    }

    function groupClass(g) {
      if (g === "jump to") return "jump";
      if (g === "case study") return "case";
      if (g === "action") return "action";
      return "link";
    }

    function setActive(i) {
      var buttons = results.querySelectorAll(".command-palette-item");
      activeIndex = Math.max(0, Math.min(i, buttons.length - 1));
      buttons.forEach(function (b, idx) { b.classList.toggle("is-active", idx === activeIndex); });
    }

    function runItem(item) {
      close();
      setTimeout(function () { item.run(); }, 10);
    }

    function open_() {
      items = buildItems();
      input.value = "";
      overlay.classList.add("is-open");
      document.body.classList.add("palette-open");
      lastFocused = document.activeElement;
      renderResults();
      setTimeout(function () { input.focus(); }, 10);
      document.addEventListener("keydown", onKeydown);
    }
    function close() {
      overlay.classList.remove("is-open");
      document.body.classList.remove("palette-open");
      document.removeEventListener("keydown", onKeydown);
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    function onKeydown(e) {
      var buttons = results.querySelectorAll(".command-palette-item");
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(activeIndex + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(activeIndex - 1); }
      else if (e.key === "Enter") {
        e.preventDefault();
        var list = filtered();
        if (list[activeIndex]) runItem(list[activeIndex]);
      }
    }

    trigger.addEventListener("click", open_);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    input.addEventListener("input", renderResults);
    window.addEventListener("keydown", function (e) {
      var mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        overlay.classList.contains("is-open") ? close() : open_();
      } else if (e.key === "/" && !overlay.classList.contains("is-open") && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || "")) {
        e.preventDefault();
        open_();
      }
    });
  })();

  /* ============================================================
     Case study modal
     ============================================================ */
  var overlay = document.getElementById("csModalOverlay");
  var modal = document.getElementById("csModal");
  var modalClose = document.getElementById("csModalClose");
  var modalTitle = document.getElementById("csModalTitle");
  var modalCategory = document.getElementById("csModalCategory");
  var modalBody = document.getElementById("csModalBody");
  var modalActions = document.getElementById("csModalActions");
  var lastFocused = null;

  function openCaseStudy(key, titleText, categoryText) {
    if (typeof PROJECTS_DATA === "undefined" || !PROJECTS_DATA[key]) return;
    var data = PROJECTS_DATA[key];

    modalTitle.textContent = titleText;
    modalCategory.textContent = categoryText;

    var highlightsHtml = data.highlights
      .map(function (h) { return "<li>" + h + "</li>"; })
      .join("");

    var galleryHtml = "";
    if (data.gallery && data.gallery.length) {
      galleryHtml =
        '<div class="cs-block cs-gallery-block"><h4>Screens</h4><div class="cs-gallery">' +
        data.gallery
          .map(function (g) {
            return (
              '<figure class="cs-gallery-item">' +
              '<a href="' + g.src + '" target="_blank" rel="noopener">' +
              '<img src="' + g.src + '" alt="' + g.caption + '" loading="lazy">' +
              "</a>" +
              '<figcaption>' + g.caption + "</figcaption>" +
              "</figure>"
            );
          })
          .join("") +
        "</div></div>";
    }

    modalBody.innerHTML =
      '<div class="cs-block"><h4>Overview</h4><p>' + data.overview + "</p></div>" +
      galleryHtml +
      '<div class="cs-block"><h4>The problem</h4><p>' + data.challenge + "</p></div>" +
      '<div class="cs-block"><h4>What I built</h4><p>' + data.solution + "</p></div>" +
      '<div class="cs-meta-row">' +
      '<div><span class="cs-meta-label">Role</span><p>' + data.role + "</p></div>" +
      '<div><span class="cs-meta-label">Duration</span><p>' + data.duration + "</p></div>" +
      "</div>" +
      '<div class="cs-block"><h4>Highlights</h4><ul class="cs-highlights">' + highlightsHtml + "</ul></div>";

    var actionsHtml = "";
    if (data.liveUrl) {
      actionsHtml += '<a class="btn-inline-primary" href="' + data.liveUrl + '" target="_blank" rel="noopener">View live site &#8599;</a>';
    }
    if (data.sourceUrl) {
      actionsHtml += '<a class="btn-inline-ghost" href="' + data.sourceUrl + '" target="_blank" rel="noopener">View source &#8599;</a>';
    }
    modalActions.innerHTML = actionsHtml;

    lastFocused = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add("modal-open");
    modalClose.focus();
    document.addEventListener("keydown", onModalKeydown);
  }

  function closeCaseStudy() {
    overlay.hidden = true;
    document.body.classList.remove("modal-open");
    document.removeEventListener("keydown", onModalKeydown);
    if (lastFocused) lastFocused.focus();
  }

  function onModalKeydown(e) {
    if (e.key === "Escape") { closeCaseStudy(); return; }
    if (e.key === "Tab") {
      var focusable = modal.querySelectorAll('a[href], button:not([disabled])');
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  document.querySelectorAll("[data-project]").forEach(function (btn) {
    if (btn.classList.contains("client-card")) return; // handled by clientWork(), which also fills the card
    if (btn.classList.contains("gallery-strip-item")) {
      btn.addEventListener("click", function () {
        openCaseStudy(btn.getAttribute("data-project"), btn.getAttribute("data-title") || "", btn.getAttribute("data-category") || "");
      });
      return;
    }
    btn.addEventListener("click", function () {
      openCaseStudy(btn.getAttribute("data-project"), btn.getAttribute("data-title") || "", btn.getAttribute("data-category") || "");
    });
  });

  if (modalClose) modalClose.addEventListener("click", closeCaseStudy);
  if (overlay) {
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeCaseStudy(); });
  }

  /* ============================================================
     Contact form: Formspree submission with inline validation.

     GitHub Pages is static hosting, so the form is delivered by
     Formspree (free tier: 50 submissions / month). The <form> keeps
     a mailto action purely as a no-JS fallback; when JS runs we
     take over the submit here.

     SETUP: create a form at https://formspree.io, then paste its
     endpoint (https://formspree.io/f/xxxxxxxx) into FORMSPREE_ENDPOINT
     below. Until that is done, submitting hands off to the visitor's
     email client instead so the form still does something useful.
     ============================================================ */
  var contactForm = document.getElementById("contactForm");
  if (contactForm) {
    // TODO(jeoff): replace REPLACE_WITH_FORM_ID with your real Formspree form ID.
    var FORMSPREE_ENDPOINT = "https://formspree.io/f/REPLACE_WITH_FORM_ID";
    var CONTACT_EMAIL = "Jeoffreysherren01@gmail.com";
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    contactForm.setAttribute("novalidate", "");

    var statusEl = document.getElementById("formStatus");
    var submitBtn = contactForm.querySelector('button[type="submit"]');
    var projectEl = document.getElementById("project");

    var fields = {
      name: { el: document.getElementById("name"), err: document.getElementById("err-name") },
      email: { el: document.getElementById("email"), err: document.getElementById("err-email") },
      message: { el: document.getElementById("message"), err: document.getElementById("err-message") }
    };

    function setFieldError(f, message) {
      f.err.textContent = message;
      f.el.setAttribute("aria-invalid", "true");
    }
    function clearFieldError(f) {
      f.err.textContent = "";
      f.el.removeAttribute("aria-invalid");
    }
    function setStatus(kind, html) {
      statusEl.hidden = false;
      statusEl.className = "form-status form-status--" + kind;
      statusEl.innerHTML = html;
    }
    function clearStatus() {
      statusEl.hidden = true;
      statusEl.className = "form-status";
      statusEl.textContent = "";
    }

    Object.keys(fields).forEach(function (key) {
      fields[key].el.addEventListener("input", function () { clearFieldError(fields[key]); });
    });

    function validate() {
      var firstInvalid = null;

      if (!fields.name.el.value.trim()) {
        setFieldError(fields.name, "Please enter your name.");
        firstInvalid = firstInvalid || fields.name.el;
      } else { clearFieldError(fields.name); }

      var email = fields.email.el.value.trim();
      if (!email) {
        setFieldError(fields.email, "Please enter your email.");
        firstInvalid = firstInvalid || fields.email.el;
      } else if (!EMAIL_RE.test(email)) {
        setFieldError(fields.email, "That doesn't look like a valid email address.");
        firstInvalid = firstInvalid || fields.email.el;
      } else { clearFieldError(fields.email); }

      if (!fields.message.el.value.trim()) {
        setFieldError(fields.message, "Please include a short message.");
        firstInvalid = firstInvalid || fields.message.el;
      } else { clearFieldError(fields.message); }

      if (firstInvalid) { firstInvalid.focus(); return false; }
      return true;
    }

    function mailtoHref() {
      var subject = "Portfolio enquiry from " + (fields.name.el.value.trim() || "a visitor");
      var body =
        "Name: " + fields.name.el.value.trim() + "\n" +
        "Email: " + fields.email.el.value.trim() + "\n" +
        "Project type: " + projectEl.value + "\n\n" +
        fields.message.el.value.trim();
      return "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    }

    function showFailure() {
      setStatus("error", "Something went wrong sending that. Please try again in a moment, or " +
        '<a href="' + mailtoHref() + '">email it to me directly</a>.');
    }

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      clearStatus();
      if (!validate()) return;

      if (FORMSPREE_ENDPOINT.indexOf("REPLACE_WITH_FORM_ID") !== -1) {
        setStatus("notice", "Opening your email app so you can send this to me directly.");
        window.location.href = mailtoHref();
        return;
      }

      var originalLabel = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending";

      fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(contactForm)
      })
        .then(function (res) {
          if (res.ok) {
            contactForm.reset();
            setStatus("success", "Thanks. Your message is on its way, I'll reply within a day or two.");
            return;
          }
          return res.json().then(function (data) {
            if (data && Array.isArray(data.errors) && data.errors.length) {
              setStatus("error", data.errors.map(function (x) { return x.message; }).join(" "));
            } else { showFailure(); }
          });
        })
        .catch(showFailure)
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        });
    });
  }
})();
