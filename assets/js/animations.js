/* ==========================================================================
   RUFT BANK — Pro Motion & 3D controller
   Faqat qo'shimcha: mavjud JS fayllarga tegilmagan. Hech qanday kutubxona yo'q.
   ========================================================================== */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function clamp(v, a, b) {
    return Math.min(b, Math.max(a, v));
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function ensureHost(el) {
    var cs = getComputedStyle(el);
    if (cs.position === "static") el.style.position = "relative";
    if (cs.overflow !== "hidden") el.style.overflow = "hidden";
  }

  /* ---------------------------------------------------------------- Ripple */
  var RIPPLE_SEL =
    ".btn, .btn-add-card, .btn-save, .btn-cancel, .action-btn, .icon-btn, .theme-toggle, .qa, .type-option";

  function spawnRipple(el, x, y) {
    ensureHost(el);
    var r = el.getBoundingClientRect();
    var size = Math.max(r.width, r.height) * 2.2;
    var s = doc.createElement("span");
    s.className = "fx-ripple";
    s.style.width = s.style.height = size + "px";
    s.style.left = x - r.left - size / 2 + "px";
    s.style.top = y - r.top - size / 2 + "px";
    el.appendChild(s);
    var kill = function () {
      if (s.parentNode) s.parentNode.removeChild(s);
    };
    s.addEventListener("animationend", kill);
    setTimeout(kill, 1000);
  }

  function initRipple() {
    doc.addEventListener(
      "pointerdown",
      function (e) {
        if (e.button > 0 || !e.target.closest) return;
        var el = e.target.closest(RIPPLE_SEL);
        if (!el || el.disabled || el.getAttribute("aria-disabled") === "true")
          return;
        spawnRipple(el, e.clientX, e.clientY);
      },
      { passive: true },
    );
    // Klaviatura (Enter / Space) uchun
    doc.addEventListener(
      "click",
      function (e) {
        if (e.detail !== 0 || !e.target.closest) return;
        var el = e.target.closest(RIPPLE_SEL);
        if (!el || el.disabled) return;
        var r = el.getBoundingClientRect();
        spawnRipple(el, r.left + r.width / 2, r.top + r.height / 2);
      },
      { passive: true },
    );
  }

  /* ------------------------------------------------ Theme toggle effects */
  function initTheme() {
    doc.addEventListener(
      "click",
      function (e) {
        if (!e.target.closest) return;
        var t = e.target.closest(".theme-toggle");
        var picker = e.target.closest("#themePicker button");
        if (!t && !picker) return;
        root.classList.add("fx-theme-switch");
        setTimeout(function () {
          root.classList.remove("fx-theme-switch");
        }, 650);
        if (t) {
          t.classList.remove("fx-spin");
          void t.offsetWidth;
          t.classList.add("fx-spin");
          setTimeout(function () {
            t.classList.remove("fx-spin");
          }, 800);
        }
      },
      true,
    );
  }

  /* ---------------------------------------------- Tilt + magnet (pointer) */
  var TILT = [
    [".showcase-card", { max: 14, lift: -10, sc: 1.03 }],
    [".feature-card", { max: 8, lift: -6, sc: 1.02 }],
    [".credit-card", { max: 14, lift: -8, sc: 1.03 }],
    [".mini-card", { max: 12, lift: -6, sc: 1.03 }],
    [".stat-card", { max: 6, lift: -4, sc: 1.015 }],
    [".bank-card", { max: 12, lift: -6, sc: 1.03 }],
    [".preview-card", { max: 12, lift: -4, sc: 1.02 }],
  ];
  var TILT_SEL = TILT.map(function (t) {
    return t[0];
  }).join(",");
  var MAGNET_SEL =
    ".btn-lg, .nav-actions .btn, .btn-add-card, .cta-card .btn";

  var cur = null,
    curCfg = null,
    curRect = null,
    lastEv = null,
    tiltRaf = 0,
    mag = null;

  function cfgFor(el) {
    for (var i = 0; i < TILT.length; i++) if (el.matches(TILT[i][0])) return TILT[i][1];
    return TILT[0][1];
  }
  function addGlare(el) {
    if (el.querySelector(":scope > .fx-glare")) return;
    var g = doc.createElement("span");
    g.className = "fx-glare";
    g.setAttribute("aria-hidden", "true");
    el.appendChild(g);
  }
  var VARS = ["--rx", "--ry", "--px", "--py", "--gx", "--gy", "--lift", "--sc"];

  function tiltLeave() {
    if (!cur) return;
    cur.classList.remove("is-tilting");
    VARS.forEach(function (v) {
      cur.style.removeProperty(v);
    });
    cur = curRect = curCfg = null;
  }
  function tiltEnter(el) {
    curCfg = cfgFor(el);
    if (!el.classList.contains("fx-tilt")) {
      el.classList.add("fx-tilt");
      if (getComputedStyle(el).position === "static")
        el.style.position = "relative";
      addGlare(el);
    }
    curRect = el.getBoundingClientRect();
    el.style.setProperty("--lift", curCfg.lift + "px");
    el.style.setProperty("--sc", curCfg.sc);
    el.classList.add("is-tilting");
    cur = el;
  }
  function applyTilt() {
    tiltRaf = 0;
    if (!cur || !lastEv) return;
    var r = curRect;
    var px = clamp((lastEv.clientX - r.left) / r.width, 0, 1);
    var py = clamp((lastEv.clientY - r.top) / r.height, 0, 1);
    var nx = px * 2 - 1,
      ny = py * 2 - 1;
    var m = curCfg.max;
    var s = cur.style;
    s.setProperty("--rx", (-ny * m).toFixed(2) + "deg");
    s.setProperty("--ry", (nx * m).toFixed(2) + "deg");
    s.setProperty("--px", nx.toFixed(3));
    s.setProperty("--py", ny.toFixed(3));
    s.setProperty("--gx", (px * 100).toFixed(1) + "%");
    s.setProperty("--gy", (py * 100).toFixed(1) + "%");
  }
  function tiltMove(e) {
    var el = e.target.closest(TILT_SEL);
    if (el && el.classList.contains("frozen")) el = null;
    if (el !== cur) {
      tiltLeave();
      if (el) tiltEnter(el);
    }
    if (!cur) return;
    lastEv = e;
    if (!tiltRaf) tiltRaf = requestAnimationFrame(applyTilt);
  }

  function magnetReset() {
    if (!mag) return;
    mag.style.removeProperty("--mx");
    mag.style.removeProperty("--my");
    mag = null;
  }
  function magnetMove(e) {
    var el = e.target.closest(MAGNET_SEL);
    if (mag && mag !== el) magnetReset();
    if (!el || el.disabled) return;
    mag = el;
    var r = el.getBoundingClientRect();
    var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
    var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
    el.style.setProperty("--mx", clamp(dx * 14, -8, 8).toFixed(1) + "px");
    el.style.setProperty("--my", clamp(dy * 14, -6, 6).toFixed(1) + "px");
  }

  function initPointerFx() {
    if (!fine) return;
    doc.addEventListener(
      "pointermove",
      function (e) {
        if (e.pointerType && e.pointerType === "touch") return;
        if (!e.target.closest) return;
        tiltMove(e);
        magnetMove(e);
      },
      { passive: true },
    );
    root.addEventListener("mouseleave", function () {
      tiltLeave();
      magnetReset();
    });
    window.addEventListener("blur", function () {
      tiltLeave();
      magnetReset();
    });
    window.addEventListener(
      "scroll",
      function () {
        if (cur) curRect = cur.getBoundingClientRect();
      },
      { passive: true },
    );
  }

  /* -------------------------------------- Hero: 3D parallax + particles */
  function initHero() {
    var hero = doc.querySelector(".hero");
    var stack = doc.querySelector(".hero-card-stack");
    var bg = doc.querySelector(".hero-bg");
    if (!hero) return;

    if (stack)
      stack.querySelectorAll(".hero-card").forEach(function (c) {
        addGlare(c);
      });

    // Canvas 3D particle network
    var cv = null,
      ctx = null,
      w = 0,
      h = 0,
      pts = [];
    if (bg) {
      cv = doc.createElement("canvas");
      cv.className = "fx-canvas";
      cv.setAttribute("aria-hidden", "true");
      bg.appendChild(cv);
      ctx = cv.getContext("2d");
      var N = window.innerWidth < 700 ? 36 : 68;
      var COLORS = ["99,102,241", "236,72,153", "6,182,212"];
      for (var i = 0; i < N; i++) {
        pts.push({
          x: Math.random() * 2 - 1,
          y: Math.random() * 2 - 1,
          z: Math.random() * 2 - 1,
          vx: (Math.random() - 0.5) * 0.0006,
          vy: (Math.random() - 0.5) * 0.0006,
          vz: (Math.random() - 0.5) * 0.0006,
          c: COLORS[i % 3],
        });
      }
    }
    function resize() {
      if (!cv) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = hero.getBoundingClientRect();
      w = r.width;
      h = r.height;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(hero);
    else window.addEventListener("resize", resize);

    var tx = 0,
      ty = 0,
      cx = 0,
      cy = 0,
      inside = false,
      raf = 0,
      t0 = performance.now(),
      visible = true;

    if (fine) {
      hero.addEventListener(
        "pointermove",
        function (e) {
          var r = hero.getBoundingClientRect();
          tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
          ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
          inside = true;
        },
        { passive: true },
      );
      hero.addEventListener("pointerleave", function () {
        inside = false;
      });
    }

    function drawParticles(time) {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      var dark = root.getAttribute("data-theme") === "dark";
      var line = dark ? "165,180,255" : "99,102,241";
      var ang = time * 0.00012 + cx * 0.5;
      var angX = cy * 0.3;
      var ca = Math.cos(ang),
        sa = Math.sin(ang),
        cb = Math.cos(angX),
        sb = Math.sin(angX);
      var proj = [];
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        if (p.x > 1 || p.x < -1) p.vx *= -1;
        if (p.y > 1 || p.y < -1) p.vy *= -1;
        if (p.z > 1 || p.z < -1) p.vz *= -1;
        var x = p.x * ca - p.z * sa;
        var z = p.x * sa + p.z * ca;
        var y = p.y * cb - z * sb;
        z = p.y * sb + z * cb;
        var k = 2.2 / (z + 2.2 + 0.4);
        proj.push({
          x3: x,
          y3: y,
          z3: z,
          sx: w / 2 + x * w * 0.55 * k,
          sy: h / 2 + y * h * 0.55 * k,
          k: k,
          c: p.c,
        });
      }
      ctx.lineWidth = 1;
      for (var a = 0; a < proj.length; a++) {
        for (var b = a + 1; b < proj.length; b++) {
          var dx = proj[a].x3 - proj[b].x3,
            dy = proj[a].y3 - proj[b].y3,
            dz = proj[a].z3 - proj[b].z3;
          var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (d < 0.55) {
            var al = (1 - d / 0.55) * 0.28 * ((proj[a].k + proj[b].k) / 2);
            ctx.strokeStyle = "rgba(" + line + "," + al.toFixed(3) + ")";
            ctx.beginPath();
            ctx.moveTo(proj[a].sx, proj[a].sy);
            ctx.lineTo(proj[b].sx, proj[b].sy);
            ctx.stroke();
          }
        }
      }
      for (var j = 0; j < proj.length; j++) {
        var q = proj[j];
        var alpha = clamp(0.2 + (q.k - 0.7) * 0.9, 0.12, 0.85);
        ctx.fillStyle = "rgba(" + q.c + "," + alpha.toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(q.sx, q.sy, 1 + q.k * 2.2, 0, 6.2832);
        ctx.fill();
      }
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      var time = now - t0;
      var gx = inside ? tx : Math.sin(time * 0.0005) * 0.45;
      var gy = inside ? ty : Math.cos(time * 0.0004) * 0.3;
      cx = lerp(cx, gx, 0.06);
      cy = lerp(cy, gy, 0.06);
      if (stack) {
        var s = stack.style;
        s.setProperty("--sx", (-cy * 9).toFixed(2) + "deg");
        s.setProperty("--sy", (cx * 13).toFixed(2) + "deg");
        s.setProperty("--gx", (50 + cx * 45).toFixed(1) + "%");
        s.setProperty("--gy", (50 + cy * 45).toFixed(1) + "%");
      }
      drawParticles(time);
    }
    function start() {
      if (!raf && visible && !doc.hidden) raf = requestAnimationFrame(frame);
    }
    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        function (en) {
          visible = en[0].isIntersecting;
          visible ? start() : stop();
        },
        { threshold: 0 },
      ).observe(hero);
    }
    doc.addEventListener("visibilitychange", function () {
      doc.hidden ? stop() : start();
    });
    start();
  }

  /* ------------------------------------------------- Scroll reveal (3D) */
  var REVEAL = [
    [".section-head", "up"],
    [".feature-card", "up"],
    [".showcase-card", "flip"],
    [".security-text", "left"],
    [".security-visual", "right"],
    [".cta-card", "zoom"],
    [".footer-grid > div", "up"],
    [".stat-card", "up"],
    [".mini-card", "up"],
  ];
  var REVEAL_SEL = REVEAL.map(function (r) {
    return r[0];
  }).join(",");
  var revealIO = null;
  var groupCount = new Map();

  function setupReveal(el) {
    if (el._fxDone || el.closest(".modal, .modal-overlay")) return;
    el._fxDone = true;
    var type = "up";
    for (var i = 0; i < REVEAL.length; i++)
      if (el.matches(REVEAL[i][0])) {
        type = REVEAL[i][1];
        break;
      }
    var parent = el.parentNode;
    var n = groupCount.get(parent) || 0;
    groupCount.set(parent, n + 1);
    var delay = Math.min(n, 6) * 90;
    el.classList.add("fx-reveal");
    el.setAttribute("data-fx", type);
    el.style.setProperty("--fx-d", delay + "ms");
    revealIO.observe(el);
  }
  function initReveal() {
    if (!("IntersectionObserver" in window)) return;
    revealIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          revealIO.unobserve(el);
          el.classList.add("is-in");
          var d = parseInt(el.style.getPropertyValue("--fx-d"), 10) || 0;
          // Animatsiya tugagach yordamchi klasslarni olib tashlaymiz,
          // shunda asl hover/transition qoidalari qaytadan ishlaydi.
          setTimeout(function () {
            el.classList.remove("fx-reveal", "is-in");
            el.removeAttribute("data-fx");
            el.style.removeProperty("--fx-d");
          }, 1100 + d);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    root.classList.add("js-anim");
    doc.querySelectorAll(REVEAL_SEL).forEach(setupReveal);

    // Dinamik render qilingan elementlar uchun (faqat dastlabki 3 soniya)
    if ("MutationObserver" in window) {
      var mo = new MutationObserver(function (muts) {
        muts.forEach(function (m) {
          m.addedNodes.forEach(function (n) {
            if (n.nodeType !== 1) return;
            if (n.matches && n.matches(REVEAL_SEL)) setupReveal(n);
            if (n.querySelectorAll)
              n.querySelectorAll(REVEAL_SEL).forEach(setupReveal);
          });
        });
      });
      mo.observe(doc.body, { childList: true, subtree: true });
      setTimeout(function () {
        mo.disconnect();
      }, 3000);
    }
  }

  /* ----------------------------------------------------------- Counters */
  function initCounters() {
    var els = Array.prototype.slice.call(
      doc.querySelectorAll(".hero-stats .stat strong, .hero-balance .balance-amount"),
    );
    if (!els.length || !("IntersectionObserver" in window)) return;
    function fmt(d, v) {
      return (
        d.pre +
        v.toLocaleString("en-US", {
          minimumFractionDigits: d.dec,
          maximumFractionDigits: d.dec,
          useGrouping: d.comma,
        }) +
        d.suf
      );
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          io.unobserve(en.target);
          var el = en.target,
            d = el._fx,
            t0 = performance.now(),
            dur = 1800;
          (function step(now) {
            var p = clamp((now - t0) / dur, 0, 1);
            var e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
            el.textContent = fmt(d, d.num * e);
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = d.txt;
          })(t0);
        });
      },
      { threshold: 0.6 },
    );
    els.forEach(function (el) {
      var txt = el.textContent.trim();
      var m = txt.match(/^([^\d]*)([\d,]*\.?\d+)(.*)$/);
      if (!m) return;
      el._fx = {
        pre: m[1],
        num: parseFloat(m[2].replace(/,/g, "")),
        dec: (m[2].split(".")[1] || "").length,
        comma: m[2].indexOf(",") > -1,
        suf: m[3],
        txt: txt,
      };
      el.textContent = fmt(el._fx, 0);
      io.observe(el);
    });
  }

  /* ----------------------------- Scroll progress / navbar / parallax */
  function initScroll() {
    if (!doc.body.classList.contains("landing-body")) return;
    var bar = doc.createElement("div");
    bar.className = "fx-progress";
    doc.body.appendChild(bar);
    var nav = doc.querySelector(".landing-nav");
    var tick = false;
    function update() {
      tick = false;
      var y = window.scrollY || root.scrollTop;
      var max = root.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
      if (nav) nav.classList.toggle("is-scrolled", y > 24);
      if (!reduce && y < 1200) root.style.setProperty("--fx-scroll", y);
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!tick) {
          tick = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true },
    );
    update();
  }

  /* --------------------------------------------------- Page transition */
  function initPageTransition() {
    doc.addEventListener("click", function (e) {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        !e.target.closest
      )
        return;
      var a = e.target.closest("a[href]");
      if (!a || a.target || a.hasAttribute("download")) return;
      var raw = a.getAttribute("href");
      if (!raw || raw.charAt(0) === "#" || /^(mailto:|tel:|javascript:)/i.test(raw))
        return;
      var url;
      try {
        url = new URL(a.href, location.href);
      } catch (_) {
        return;
      }
      if (url.protocol !== location.protocol || url.host !== location.host) return;
      if (url.pathname === location.pathname) return;
      e.preventDefault();
      doc.body.classList.add("fx-leaving");
      setTimeout(function () {
        location.href = url.href;
      }, 230);
    });
    // Orqaga qaytganda (bfcache) sahifa ko'rinadigan bo'lib qolsin
    window.addEventListener("pageshow", function () {
      doc.body.classList.remove("fx-leaving");
    });
  }

  /* ----------------------------------------------------------------- Boot */
  function boot() {
    initRipple();
    initTheme();
    initPageTransition();
    if (reduce) return;
    initPointerFx();
    initHero();
    initReveal();
    initCounters();
    initScroll();
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
