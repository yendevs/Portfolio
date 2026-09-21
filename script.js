(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     Status ribbon: mobile nav toggle
     ============================================================ */
  var navToggle = document.getElementById("navToggle");
  var siteNav = document.getElementById("siteNav");

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      var open = siteNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    siteNav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        siteNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ============================================================
     Scroll-spy: underlines the in-view section in the ribbon nav
     ============================================================ */
  var sections = Array.prototype.slice.call(document.querySelectorAll("main .section"));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));

  if (sections.length && "IntersectionObserver" in window) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.2) {
            var id = entry.target.id;
            navLinks.forEach(function (a) {
              a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
            });
          }
        });
      },
      { threshold: [0.2, 0.5], rootMargin: "-15% 0px -60% 0px" }
    );
    sections.forEach(function (s) {
      spy.observe(s);
    });
  }

  /* ============================================================
     Signature moment: the hero status board boots.
     The rows fade in via CSS (see .js-boot in style.css); this only
     swaps each row's status text from "booting" to its real value,
     flips its dot from amber to green, and pings it once. Skipped
     entirely under reduced motion, where the board is shown settled.
     ============================================================ */
  function pingDot(dot) {
    if (!dot || reduceMotion) return;
    dot.classList.remove("is-pinged");
    void dot.offsetWidth; // force reflow so the animation restarts
    dot.classList.add("is-pinged");
  }

  var booting = !reduceMotion && document.documentElement.classList.contains("js-boot");
  if (booting) {
    var bootRows = Array.prototype.slice.call(document.querySelectorAll(".board-row[data-boot]"));
    bootRows.forEach(function (row, i) {
      var statusEl = row.querySelector(".svc-status");
      var dot = row.querySelector(".dot");
      var finalStatus = statusEl ? statusEl.textContent : "";
      if (statusEl) statusEl.textContent = "booting";
      if (dot) dot.classList.add("dot--build");
      setTimeout(function () {
        if (statusEl) statusEl.textContent = finalStatus;
        if (dot) dot.classList.remove("dot--build");
        pingDot(dot);
      }, 300 + i * 150);
    });
    setTimeout(function () {
      document.documentElement.classList.add("is-booted");
    }, 300 + bootRows.length * 150 + 200);
  }

  /* ============================================================
     Hero infrastructure map.

     A small canvas-based diagram behind the headline and status
     board: the same three systems named on the board above (JERSA
     ERP, PawCare Pro, the client-site cluster), drawn as connected,
     gently pulsing nodes, with a small point of light traveling along
     each connection every few seconds. It is meant to read as a live
     sketch of the status board above it, not as decoration, so it
     stays low-opacity and the headline stays fully readable over it.

     Plain Canvas 2D, no external library. The render loop pauses
     whenever the hero scrolls out of view or the tab is hidden, and
     renders a single static frame under reduced motion.
     ============================================================ */
  (function heroNetwork() {
    var section = document.querySelector(".opening");
    var canvas = document.getElementById("openingCanvas");
    if (!section || !canvas || !canvas.getContext) return;

    var ctx = canvas.getContext("2d");
    var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // Reads the live palette from CSS custom properties instead of
    // hard-coding hex values, so the map always matches the site tokens.
    function cssVar(name, fallback) {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    }
    function hexToRgb(hex) {
      var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return m
        ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
        : { r: 31, g: 179, b: 94 };
    }
    var liveRgb = hexToRgb(cssVar("--live", "#1FB35E"));
    var inkRgb = hexToRgb(cssVar("--ink", "#12161C"));
    function rgba(rgb, a) {
      return "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + "," + a + ")";
    }

    // The three real systems from the status board above. bx/by are the
    // designed resting fractions of the canvas box (0 to 1); x/y are the
    // live positions actually used to draw, recomputed on every layout
    // pass (see layoutNodes below) so a node never lands on top of the
    // headline or lead paragraph, whatever the viewport width does to
    // their line count. peak/period set how strongly and how often each
    // node pulses, matching its real status: the client cluster (9 sites)
    // reads liveliest, PawCare Pro (shipped, not under daily active
    // change) reads calmest.
    var nodes = [
      { key: "jersa", label: "JERSA ERP", bx: 0.20, by: 0.26, r: 5, peak: 0.55, period: 2600 },
      { key: "pawcare", label: "PAWCARE PRO", bx: 0.82, by: 0.20, r: 5, peak: 0.30, period: 3600 },
      { key: "clients", label: "9 CLIENT SITES", bx: 0.55, by: 0.74, r: 6, peak: 0.60, period: 2100 }
    ];
    nodes.forEach(function (n) {
      n.x = n.bx; n.y = n.by;
      n.ox = 0; n.oy = 0; n.tx = 0; n.ty = 0;
    });

    // A handful of small, unlabeled satellites hung off the client-site
    // node: enough to read as "a cluster of sites," not individually
    // meaningful, so they stay tiny and undecorated. Angles are kept to an
    // arc above/beside the hub (never straight down) so none of them ever
    // land underneath the opaque status board below.
    var satellites = [];
    var SAT_COUNT = 6;
    for (var i = 0; i < SAT_COUNT; i++) {
      // Angles from PI (pointing left) to 2*PI (pointing right), passing
      // through 1.5*PI (straight up): the whole upper half, no downward.
      satellites.push({
        angle: Math.PI + (i / (SAT_COUNT - 1)) * Math.PI,
        x: 0, y: 0, ox: 0, oy: 0, tx: 0, ty: 0,
        phase: (i / SAT_COUNT) * Math.PI * 2
      });
    }

    // The three connections that matter: JERSA, PawCare, and the client
    // cluster all trace back to one operator, so this is a small
    // triangle, not a dense mesh. Each edge has its own travel timing so
    // the traveling pulses never sync up and read as real traffic rather
    // than a synchronized decoration.
    var edges = [
      { a: "jersa", b: "pawcare", cycle: 4200, travel: 1500, phase: 0 },
      { a: "jersa", b: "clients", cycle: 3600, travel: 1300, phase: 900 },
      { a: "pawcare", b: "clients", cycle: 5000, travel: 1700, phase: 2000 }
    ];

    function nodeByKey(key) {
      for (var j = 0; j < nodes.length; j++) {
        if (nodes[j].key === key) return nodes[j];
      }
      return null;
    }
    var clientsNode = nodeByKey("clients");
    var jersaNode = nodeByKey("jersa");
    var pawcareNode = nodeByKey("pawcare");

    var W = 0, H = 0;
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var showLabels = true;

    var headline = document.querySelector(".opening h1");
    var lead = document.querySelector(".opening-lead");
    var board = document.querySelector(".board");

    // Positions the three hub nodes so none of them ever sit on top of the
    // real headline or lead paragraph, and so the client-site cluster never
    // ends up hidden underneath the opaque status board. Runs on every
    // resize, using the actual rendered text and panel boxes rather than
    // guessed breakpoints, so it holds up at any width.
    function layoutNodes() {
      if (!W || !H) return;
      var sectionRect = section.getBoundingClientRect();
      function fracRect(el) {
        var r = el.getBoundingClientRect();
        return {
          top: (r.top - sectionRect.top) / H,
          bottom: (r.bottom - sectionRect.top) / H,
          left: (r.left - sectionRect.left) / W,
          right: (r.right - sectionRect.left) / W
        };
      }

      // Keep-out zone: the headline and lead paragraph, with a small margin.
      var pad = 0.03;
      var textZone = null;
      if (headline && lead) {
        var hr = fracRect(headline), lr = fracRect(lead);
        textZone = {
          top: Math.min(hr.top, lr.top) - pad,
          bottom: Math.max(hr.bottom, lr.bottom) + pad,
          left: Math.min(hr.left, lr.left) - pad,
          right: Math.max(hr.right, lr.right) + pad
        };
      }

      function inZone(x, y, zone) {
        return zone && x > zone.left && x < zone.right && y > zone.top && y < zone.bottom;
      }

      // Below roughly tablet width the hero text runs full-bleed with no
      // open margin beside it, so labels are dropped to keep the map from
      // reading as clutter; the dots, lines, and pulses stay. Decided here
      // (rather than only at draw time) because it also changes how much
      // room a pushed-right node needs to reserve for itself below.
      showLabels = W >= 640;
      ctx.font = "500 10px " + cssVar("--font-mono", "monospace");

      // JERSA and PawCare: start from their designed resting spot, but if
      // that lands on the text, slide right until clear of it. Clearing
      // the text always wins; a label is only kept if it still fits on
      // canvas at that position, otherwise that one node's label is
      // skipped rather than letting it drift back over the paragraph.
      [jersaNode, pawcareNode].forEach(function (n) {
        n.x = n.bx;
        n.y = n.by;
        n.labelFits = true;
        if (inZone(n.x, n.y, textZone)) {
          n.x = Math.min(0.98, textZone.right + 0.05);
          if (showLabels) {
            var labelWidth = ctx.measureText(n.label).width;
            n.labelFits = n.x * W + n.r + 8 + labelWidth + 6 <= W;
          }
        }
      });

      // Client cluster: always parked in the gap between the lead copy
      // and the status board, never on either, however tall that gap is.
      var gapTop = textZone ? textZone.bottom : clientsNode.by;
      var gapBottom = board ? fracRect(board).top - 0.02 : clientsNode.by + 0.1;
      clientsNode.x = clientsNode.bx;
      clientsNode.y = gapBottom > gapTop ? (gapTop + gapBottom) / 2 : gapBottom;
      clientsNode.labelFits = clientsNode.x * W + clientsNode.r + 8 +
        (showLabels ? ctx.measureText(clientsNode.label).width : 0) + 6 <= W;

      // The satellite ring needs real vertical room to read as a cluster.
      // If the gap is tight, shrink the ring instead of letting it spill
      // into the text above or the board below.
      var gapHeight = Math.max(0.02, gapBottom - gapTop);
      var satDist = Math.min(0.10, gapHeight * 0.9, (1 - clientsNode.x) * 0.5);
      satellites.forEach(function (s) {
        s.x = clientsNode.x + Math.cos(s.angle) * satDist * (W > H ? 1 : 0.6);
        s.y = clientsNode.y + Math.sin(s.angle) * satDist;
      });
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = Math.max(1, Math.round(W * DPR));
      canvas.height = Math.max(1, Math.round(H * DPR));
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      layoutNodes();
      draw(0, true); // repaint a static preview immediately so a resize never leaves a blank frame
    }

    // Pointer position in canvas-local pixels. Only tracked with a real
    // mouse, so touch devices never set this and never perturb nodes.
    var pointer = null;
    if (canHover && !reduceMotion) {
      section.addEventListener("mousemove", function (e) {
        var rect = canvas.getBoundingClientRect();
        pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      });
      section.addEventListener("mouseleave", function () {
        pointer = null;
      });
    }

    function updatePerturbation() {
      var reach = 90;   // px: how far a node feels the pointer
      var maxPush = 6;  // px: the largest nudge a node can receive
      var all = nodes.concat(satellites);
      all.forEach(function (n) {
        var nx = n.x * W, ny = n.y * H;
        if (pointer) {
          var dx = nx - pointer.x, dy = ny - pointer.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < reach && dist > 0.001) {
            var strength = (1 - dist / reach) * maxPush;
            n.tx = (dx / dist) * strength;
            n.ty = (dy / dist) * strength;
          } else {
            n.tx = 0; n.ty = 0;
          }
        } else {
          n.tx = 0; n.ty = 0;
        }
        // Ease toward the target instead of snapping, so nodes settle
        // back smoothly once the pointer moves away or leaves the hero.
        n.ox += (n.tx - n.ox) * 0.12;
        n.oy += (n.ty - n.oy) * 0.12;
      });
    }

    function drawEdge(x1, y1, x2, y2) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = rgba(inkRgb, 0.07);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    function drawTravelingPulse(x1, y1, x2, y2, elapsed, edge) {
      var pos = (elapsed + edge.phase) % edge.cycle;
      if (pos > edge.travel) return; // between trips: nothing to draw
      var t = pos / edge.travel;
      ctx.beginPath();
      ctx.arc(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = rgba(liveRgb, 0.75);
      ctx.fill();
    }

    // Drawn the same way the site's own .dot status indicator looks: a
    // solid core, a fixed thin ring, and (unless reduced motion) a slow
    // expanding ring. The hero art is the site's own status-dot language
    // rendered as a map, not an invented shape.
    function drawNode(n, elapsed, staticMode) {
      var x = n.x * W + n.ox;
      var y = n.y * H + n.oy;

      if (!staticMode) {
        var cyclePos = (elapsed % n.period) / n.period;
        var ringT = cyclePos < 0.6 ? cyclePos / 0.6 : 1;
        var ringOpacity = (1 - ringT) * n.peak;
        if (ringOpacity > 0.01) {
          ctx.beginPath();
          ctx.arc(x, y, n.r + 2 + ringT * 10, 0, Math.PI * 2);
          ctx.strokeStyle = rgba(liveRgb, ringOpacity);
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      ctx.beginPath(); // fixed ring
      ctx.arc(x, y, n.r + 3, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(liveRgb, 0.35);
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath(); // core
      ctx.arc(x, y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = rgba(liveRgb, 0.55);
      ctx.fill();

      // labelFits is decided in layoutNodes(): clearing the text always
      // wins, so on the rare width where there is not also room for the
      // label on canvas, that node draws as a plain dot instead of
      // letting its label drift back over the paragraph.
      if (showLabels && n.labelFits !== false) {
        ctx.font = "500 10px " + cssVar("--font-mono", "monospace");
        ctx.fillStyle = rgba(inkRgb, 0.28);
        ctx.textBaseline = "top";
        ctx.fillText(n.label, x + n.r + 8, y - 5);
      }
    }

    function drawSatellite(s, elapsed, staticMode) {
      var x = s.x * W + s.ox;
      var y = s.y * H + s.oy;
      var twinkle = staticMode ? 0.5 : 0.35 + 0.35 * Math.sin(elapsed / 900 + s.phase);
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = rgba(liveRgb, Math.max(0.15, twinkle * 0.5));
      ctx.fill();
    }

    function draw(elapsed, staticMode) {
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);

      satellites.forEach(function (s) {
        drawEdge(
          clientsNode.x * W + clientsNode.ox, clientsNode.y * H + clientsNode.oy,
          s.x * W + s.ox, s.y * H + s.oy
        );
      });

      edges.forEach(function (edge) {
        var a = nodeByKey(edge.a), b = nodeByKey(edge.b);
        var x1 = a.x * W + a.ox, y1 = a.y * H + a.oy;
        var x2 = b.x * W + b.ox, y2 = b.y * H + b.oy;
        drawEdge(x1, y1, x2, y2);
        if (!staticMode) drawTravelingPulse(x1, y1, x2, y2, elapsed, edge);
      });

      satellites.forEach(function (s) { drawSatellite(s, elapsed, staticMode); });
      nodes.forEach(function (n) { drawNode(n, elapsed, staticMode); });
    }

    // ---- Render loop: gated on visibility, tab state, and reduced motion ----
    var running = false;
    var rafId = null;
    var startTime = null;
    var sectionVisible = false;

    function frame(ts) {
      if (!running) return;
      if (startTime === null) startTime = ts;
      var elapsed = ts - startTime;
      updatePerturbation();
      draw(elapsed, false);
      rafId = requestAnimationFrame(frame);
    }
    function start() {
      if (running || reduceMotion) return;
      running = true;
      rafId = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }

    function debounce(fn, wait) {
      var t;
      return function () {
        clearTimeout(t);
        t = setTimeout(fn, wait);
      };
    }
    window.addEventListener("resize", debounce(resize, 150));

    resize();

    if (reduceMotion) return; // static frame already painted by resize(), no loop to run

    if ("IntersectionObserver" in window) {
      var vis = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            sectionVisible = entry.isIntersecting;
            if (sectionVisible && !document.hidden) start();
            else stop();
          });
        },
        { threshold: 0.01 }
      );
      vis.observe(section);
    } else {
      sectionVisible = true;
      start();
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else if (sectionVisible) start();
    });
  })();

  /* ============================================================
     Scroll reveal: section content fades, rises, and settles from a
     slight scale as it enters view, reading as focusing into place
     rather than sliding. Skipped entirely under reduced motion, where
     the .js-reveal gate in style.css is never added and everything is
     simply visible at rest.
     ============================================================ */
  if (!reduceMotion && "IntersectionObserver" in window) {
    document.documentElement.classList.add("js-reveal");

    // Small list-style groups get a short stagger so items that enter
    // the viewport together settle in sequence instead of popping in
    // all at once. Capped low so nothing feels slow.
    [
      document.querySelectorAll(".stack-item"),
      document.querySelectorAll(".log-entry")
    ].forEach(function (group) {
      Array.prototype.forEach.call(group, function (el, i) {
        el.style.transitionDelay = (Math.min(i, 3) * 0.07) + "s";
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
      // A low threshold so tall elements (the client work table, for
      // example) still trigger: a high threshold can never be reached by
      // an element taller than the viewport while it scrolls past.
      { threshold: 0.01, rootMargin: "0px 0px -6% 0px" }
    );
    revealTargets.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

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
      .map(function (h) {
        return "<li>" + h + "</li>";
      })
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
      actionsHtml += '<a class="btn btn-primary" href="' + data.liveUrl + '" target="_blank" rel="noopener">View live site</a>';
    }
    if (data.sourceUrl) {
      actionsHtml += '<a class="btn btn-ghost" href="' + data.sourceUrl + '" target="_blank" rel="noopener">View source</a>';
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
    if (e.key === "Escape") {
      closeCaseStudy();
      return;
    }
    if (e.key === "Tab") {
      var focusable = modal.querySelectorAll('a[href], button:not([disabled])');
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  document.querySelectorAll("[data-project]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openCaseStudy(
        btn.getAttribute("data-project"),
        btn.getAttribute("data-title") || "",
        btn.getAttribute("data-category") || ""
      );
    });
  });

  if (modalClose) modalClose.addEventListener("click", closeCaseStudy);
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeCaseStudy();
    });
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

    // JS owns validation now, so switch off the browser's native bubbles.
    // (If JS never runs, native `required` + the mailto action still apply.)
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

    // Clear a field's error as soon as the visitor starts correcting it.
    Object.keys(fields).forEach(function (key) {
      fields[key].el.addEventListener("input", function () {
        clearFieldError(fields[key]);
      });
    });

    function validate() {
      var firstInvalid = null;

      if (!fields.name.el.value.trim()) {
        setFieldError(fields.name, "Please enter your name.");
        firstInvalid = firstInvalid || fields.name.el;
      } else {
        clearFieldError(fields.name);
      }

      var email = fields.email.el.value.trim();
      if (!email) {
        setFieldError(fields.email, "Please enter your email.");
        firstInvalid = firstInvalid || fields.email.el;
      } else if (!EMAIL_RE.test(email)) {
        setFieldError(fields.email, "That doesn't look like a valid email address.");
        firstInvalid = firstInvalid || fields.email.el;
      } else {
        clearFieldError(fields.email);
      }

      if (!fields.message.el.value.trim()) {
        setFieldError(fields.message, "Please include a short message.");
        firstInvalid = firstInvalid || fields.message.el;
      } else {
        clearFieldError(fields.message);
      }

      if (firstInvalid) {
        firstInvalid.focus();
        return false;
      }
      return true;
    }

    // A pre-filled mailto, offered as a recovery link if the network send fails.
    function mailtoHref() {
      var subject = "Portfolio enquiry from " + (fields.name.el.value.trim() || "a visitor");
      var body =
        "Name: " + fields.name.el.value.trim() + "\n" +
        "Email: " + fields.email.el.value.trim() + "\n" +
        "Project type: " + projectEl.value + "\n\n" +
        fields.message.el.value.trim();
      return "mailto:" + CONTACT_EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
    }

    function showFailure() {
      setStatus(
        "error",
        "Something went wrong sending that. Please try again in a moment, or " +
        '<a href="' + mailtoHref() + '">email it to me directly</a>.'
      );
    }

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      clearStatus();
      if (!validate()) return;

      // Endpoint not configured yet: fall back to the visitor's mail client.
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
            setStatus(
              "success",
              "Thanks. Your message is on its way, I'll reply within a day or two."
            );
            return;
          }
          return res.json().then(function (data) {
            if (data && Array.isArray(data.errors) && data.errors.length) {
              setStatus("error", data.errors.map(function (x) { return x.message; }).join(" "));
            } else {
              showFailure();
            }
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
