/* Cards 3D — flip, yangi/o'chirilgan/muzlagan karta animatsiyalari (faqat cards.html) */
(function () {
  "use strict";
  var doc = document;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var known = {}, frozen = {}, nums = {}, rects = {}, initDone = false;
  var grid;

  function cardsData() {
    try {
      var u = RUFT.Store.currentUser();
      return (u && RUFT.Store.getCards(u.phone)) || [];
    } catch (e) { return []; }
  }
  function cvvFor(cc) {
    var item = cc.closest(".card-item");
    if (item) {
      var list = cardsData();
      for (var i = 0; i < list.length; i++) if (list[i].id === item.dataset.id) return list[i].cvv || "";
      return "";
    }
    var inp = doc.getElementById("cardCVV");
    return inp ? inp.value : "";
  }
  function brandOf(cc) {
    var b = cc.querySelector(".card-brand, .preview-brand");
    if (!b) return "";
    if (b.querySelector(".wm-humo")) return "Humo";
    if (b.querySelector(".wm-uzcard")) return "Uzcard";
    if (b.querySelector(".fa-cc-mastercard")) return "Mastercard";
    return "Visa";
  }
  function holderOf(cc) {
    var h = cc.querySelector(".card-holder span, .preview-holder span");
    return h ? h.textContent : "";
  }

  function ensureParts(cc, idx) {
    if (idx !== undefined) cc.style.setProperty("--cx-i", idx);
    if (!cc.querySelector(":scope > .cx-sheen")) {
      var s = doc.createElement("span");
      s.className = "cx-sheen";
      s.setAttribute("aria-hidden", "true");
      cc.appendChild(s);
    }
    if (!cc.querySelector(":scope > .cx-back")) {
      var b = doc.createElement("div");
      b.className = "cx-back";
      b.innerHTML =
        '<div class="cx-strip"></div><div class="cx-sign"><span class="cx-sig"></span><b class="cx-cvv" title="CVV">•••</b></div><div class="cx-note"><span class="cx-brand"></span><span>RUFT Bank</span></div>';
      cc.appendChild(b);
      var cv = b.querySelector(".cx-cvv");
      var show = function (e) {
        e.stopPropagation();
        cv.textContent = cvvFor(cc) || "•••";
      };
      var hide = function () { cv.textContent = "•••"; };
      cv.addEventListener("pointerdown", show);
      cv.addEventListener("pointerup", hide);
      cv.addEventListener("pointerleave", hide);
      cv.addEventListener("click", function (e) { e.stopPropagation(); });
    }
  }
  function refreshBack(cc) {
    var b = cc.querySelector(":scope > .cx-back");
    if (!b) return;
    b.querySelector(".cx-sig").textContent = holderOf(cc);
    b.querySelector(".cx-brand").textContent = brandOf(cc);
  }

  function flip(cc, want) {
    if (cc.classList.contains("frozen") || cc._cxBusy) return;
    var isBack = cc.classList.contains("cx-flipped");
    if (want !== undefined && want === isBack) return;
    ensureParts(cc);
    refreshBack(cc);
    if (reduce) { cc.classList.toggle("cx-flipped"); return; }
    cc._cxBusy = true;
    cc.classList.add("cx-a");
    setTimeout(function () {
      cc.classList.remove("cx-a");
      cc.classList.toggle("cx-flipped");
      cc.classList.add("cx-b");
      setTimeout(function () { cc.classList.remove("cx-b"); cc._cxBusy = false; }, 350);
    }, 260);
  }

  function scramble(el, text) {
    if (!el || reduce) return;
    var t0 = performance.now(), dur = 900;
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur), out = "";
      for (var i = 0; i < text.length; i++) {
        var ch = text.charAt(i);
        out += ch === " " || i < p * text.length ? ch : Math.floor(Math.random() * 10);
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = text;
    })(t0);
  }

  function tempClass(el, cls, ms) {
    el.classList.add(cls);
    setTimeout(function () { el.classList.remove(cls); }, ms);
  }

  function snapshot() {
    rects = {};
    var sx = window.scrollX, sy = window.scrollY;
    grid.querySelectorAll(".card-item").forEach(function (it) {
      var r = it.getBoundingClientRect();
      rects[it.dataset.id] = { l: r.left + sx, t: r.top + sy, w: r.width };
    });
  }

  function ghost(node, id) {
    var r = rects[id];
    if (!r || reduce) return;
    var g = node.cloneNode(true);
    g.classList.add("cx-ghost");
    g.classList.remove("cx-static", "cx-new");
    g.style.cssText = "left:" + r.l + "px;top:" + r.t + "px;width:" + r.w + "px";
    doc.body.appendChild(g);
    setTimeout(function () { g.remove(); }, 800);
  }

  function onGrid(records) {
    var removed = {};
    (records || []).forEach(function (rec) {
      rec.removedNodes.forEach(function (n) {
        if (n.nodeType === 1 && n.classList.contains("card-item")) removed[n.dataset.id] = n;
      });
    });
    var seen = {}, idx = 0;
    grid.querySelectorAll(".card-item").forEach(function (it) {
      var id = it.dataset.id, cc = it.querySelector(".credit-card");
      if (!cc) return;
      seen[id] = 1;
      ensureParts(cc, idx++);
      var isFrozen = cc.classList.contains("frozen");
      var numEl = cc.querySelector(".card-number");
      var num = numEl ? numEl.textContent : "";
      if (initDone) {
        if (known[id]) {
          it.classList.add("cx-static");
          if (frozen[id] !== isFrozen) tempClass(it, isFrozen ? "cx-freeze" : "cx-thaw", 1000);
          if (nums[id] && nums[id] !== num) scramble(numEl, num);
        } else {
          it.classList.add("cx-new");
        }
      }
      known[id] = 1; frozen[id] = isFrozen; nums[id] = num;
    });
    var empty = grid.querySelector(".empty-card");
    if (empty && initDone) empty.classList.add("cx-static");
    Object.keys(known).forEach(function (id) {
      if (!seen[id]) {
        if (removed[id]) ghost(removed[id], id);
        delete known[id]; delete frozen[id]; delete nums[id];
      }
    });
    initDone = true;
    requestAnimationFrame(snapshot);
  }

  function initPreview() {
    var pv = doc.getElementById("previewCard");
    if (!pv) return;
    ensureParts(pv, 1);
    var cvv = doc.getElementById("cardCVV");
    if (cvv) {
      cvv.addEventListener("focus", function () { flip(pv, true); });
      cvv.addEventListener("blur", function () { flip(pv, false); });
      cvv.addEventListener("input", function () {
        var el = pv.querySelector(".cx-cvv");
        if (el) el.textContent = cvv.value ? cvv.value : "•••";
      });
    }
    var modal = doc.getElementById("addCardModal");
    if (modal) {
      new MutationObserver(function () {
        if (modal.classList.contains("active")) {
          pv.classList.remove("cx-flipped", "cx-a", "cx-b");
          pv._cxBusy = false;
          var el = pv.querySelector(".cx-cvv");
          if (el) el.textContent = "•••";
          if (!reduce) tempClass(pv, "cx-spinin", 950);
        }
      }).observe(modal, { attributes: true, attributeFilter: ["class"] });
    }
  }

  function init() {
    grid = doc.getElementById("cardsGrid");
    if (!grid) return;
    new MutationObserver(onGrid).observe(grid, { childList: true });
    onGrid();
    initPreview();

    doc.addEventListener("click", function (e) {
      var cc = e.target.closest && e.target.closest(".credit-card, .preview-card");
      if (cc && !e.target.closest(".action-btn")) flip(cc);
      var copy = e.target.closest && e.target.closest('.action-btn[data-action="copy"]');
      if (copy) {
        var card = copy.closest(".card-item");
        var c = card && card.querySelector(".credit-card");
        if (c) tempClass(c, "cx-copied", 750);
      }
    });
    window.addEventListener("resize", function () { requestAnimationFrame(snapshot); });
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init);
  else init();
})();
