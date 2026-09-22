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
      document.querySelectorAll(".log-entry"),
      document.querySelectorAll(".engage-card")
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
     Code panel: reveals the payrollCalc.js excerpt one line at a time
     the first time it scrolls into view. Reuses the exact gating pattern
     as the rest of the reveal system (.js-reveal only, low IO threshold
     so a panel taller than the viewport still triggers), so no-JS and
     reduced-motion visitors just see the finished code block at rest.
     ============================================================ */
  if (!reduceMotion && "IntersectionObserver" in window) {
    var codePanel = document.querySelector(".code-panel");
    if (codePanel) {
      var codeLines = codePanel.querySelectorAll(".code-line");
      Array.prototype.forEach.call(codeLines, function (line, i) {
        line.style.transitionDelay = (i * 0.045) + "s";
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
    }
  }

  /* ============================================================
     Flagship panel glow: a soft radial highlight that tracks the
     pointer over the JERSA ERP / PawCare Pro panels. Desktop-only
     (a real mouse, not touch) and skipped under reduced motion, same
     gating as the hero canvas's own pointer perturbation.
     ============================================================ */
  (function panelGlow() {
    var canHoverFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!canHoverFine || reduceMotion) return;
    var glowPanels = document.querySelectorAll(".svc-panel");
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
