/* RUFT Bank — i18n (uz / ru / en). Head'da, i18n-dict.js dan keyin yuklanadi. */
(function () {
  "use strict";
  window.RUFT = window.RUFT || {};
  var DICT = RUFT.I18N_DICT || {};
  var LANGS = { uz: { name: "O'zbekcha", code: "UZ", locale: "uz-UZ", idx: 0 }, ru: { name: "Русский", code: "RU", locale: "ru-RU", idx: 1 }, en: { name: "English", code: "EN", locale: "en-US" } };
  var KEY = "ruft_lang";

  function detect() {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (saved && LANGS[saved]) return saved;
    var nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    return LANGS[nav] ? nav : "en";
  }
  var lang = detect();
  var L = LANGS[lang];
  document.documentElement.lang = lang;

  /* ---- qidiruv jadvallari ---- */
  var exact = {}, lower = {}, patterns = [];
  Object.keys(DICT).forEach(function (k) {
    var tr = DICT[k][L.idx];
    if (tr === undefined) return;
    if (k.indexOf("{0}") > -1) {
      var esc = k.replace(/[.*+?^$()|[\]\\]/g, "\\$&").replace(/\{(\d+)\}/g, "(.+?)");
      patterns.push({ re: new RegExp("^" + esc + "$", "s"), tr: tr, len: k.length });
    } else {
      exact[k] = tr;
      var lk = k.toLowerCase();
      if (!(lk in lower)) lower[lk] = tr;
    }
  });
  patterns.sort(function (a, b) { return b.len - a.len; });

  function fill(tr, args) {
    return tr.replace(/\{(\d+)\}/g, function (m, i) { return args && args[i] !== undefined ? args[i] : m; });
  }
  function matchCase(src, out) {
    return src === src.toLowerCase() ? out.charAt(0).toLowerCase() + out.slice(1) : out;
  }

  /* t("English text", [vars]) — shablon yoki oddiy matn */
  function t(s, vars) {
    if (typeof s !== "string") return s;
    if (lang === "en") return vars ? fill(s, vars) : s;
    var tr = exact[s];
    if (tr !== undefined) return vars ? fill(tr, vars) : tr;
    if (vars) {
      var key = DICT[s];
      if (key && key[L.idx] !== undefined) return fill(key[L.idx], vars);
      return fill(s, vars);
    }
    return s;
  }

  function translate(str) {
    if (lang === "en" || !str) return str;
    var m = str.match(/^(\s*)([\s\S]*?)(\s*)$/);
    var core = m[2];
    if (!core || !/[A-Za-z]{2}/.test(core)) return str;
    var out = exact[core];
    if (out === undefined) {
      var lc = lower[core.toLowerCase()];
      if (lc !== undefined) out = matchCase(core, lc);
    }
    if (out === undefined) {
      for (var i = 0; i < patterns.length; i++) {
        var r = patterns[i].re.exec(core);
        if (r) { out = fill(patterns[i].tr, r.slice(1)); break; }
      }
    }
    return out === undefined ? str : m[1] + out + m[3];
  }

  /* ---- DOM tarjimasi ---- */
  var ATTRS = ["placeholder", "title", "aria-label", "alt"];
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CODE: 1, NOSCRIPT: 1 };

  function doText(node) {
    var p = node.parentNode;
    if (!p || SKIP[p.nodeName] || (p.closest && p.closest("[data-no-i18n]"))) return;
    var v = node.nodeValue, o = translate(v);
    if (o !== v) node.nodeValue = o;
  }
  function doAttrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = el.getAttribute && el.getAttribute(ATTRS[i]);
      if (a) { var o = translate(a); if (o !== a) el.setAttribute(ATTRS[i], o); }
    }
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1 || SKIP[root.nodeName]) return;
    doAttrs(root);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null);
    var n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) doText(n);
      else if (!SKIP[n.nodeName]) doAttrs(n);
    }
  }

  function translateTitle() {
    var o = translate(document.title);
    if (o !== document.title) document.title = o;
  }

  /* ---- tanlagich (switcher) ---- */
  function buildSwitcher(extraClass) {
    var wrap = document.createElement("div");
    wrap.className = "lang-switch " + (extraClass || "");
    wrap.setAttribute("data-no-i18n", "");
    wrap.innerHTML =
      '<button type="button" class="lang-btn" aria-haspopup="true" aria-label="Language"><i class="fa-solid fa-globe"></i><span>' + L.code + '</span><i class="fa-solid fa-chevron-down lang-caret"></i></button>' +
      '<ul class="lang-menu" role="menu">' +
      Object.keys(LANGS).map(function (k) {
        return '<li><button type="button" role="menuitem" data-lang="' + k + '" class="' + (k === lang ? "active" : "") + '"><b>' + LANGS[k].code + "</b>" + LANGS[k].name + "</button></li>";
      }).join("") + "</ul>";
    var btn = wrap.querySelector(".lang-btn");
    btn.addEventListener("click", function (e) { e.stopPropagation(); wrap.classList.toggle("open"); });
    wrap.querySelectorAll("[data-lang]").forEach(function (b) {
      b.addEventListener("click", function () { setLang(b.getAttribute("data-lang")); });
    });
    return wrap;
  }

  function mountSwitchers() {
    var spots = [
      [".nav-actions", "#themeToggle", ""],
      [".auth-form-wrap", ".auth-theme", "auth-lang"],
      [".topbar-actions", "#themeToggleTop", ""],
    ];
    spots.forEach(function (s) {
      var host = document.querySelector(s[0]);
      if (!host || host.querySelector(".lang-switch")) return;
      var sw = buildSwitcher(s[2]);
      var ref = host.querySelector(s[1]);
      if (ref && ref.parentNode === host) host.insertBefore(sw, ref);
      else host.insertBefore(sw, host.firstChild);
    });
  }
  document.addEventListener("click", function () {
    document.querySelectorAll(".lang-switch.open").forEach(function (e) { e.classList.remove("open"); });
  });

  /* ---- til almashtirish ---- */
  function syncSettings(l) {
    try {
      var raw = localStorage.getItem("ruft_settings");
      var s = raw ? JSON.parse(raw) : {};
      if (s && typeof s === "object") { s.language = l; localStorage.setItem("ruft_settings", JSON.stringify(s)); }
    } catch (e) {}
  }
  function setLang(l, noReload) {
    if (!LANGS[l]) return;
    try { localStorage.setItem(KEY, l); } catch (e) {}
    syncSettings(l);
    if (l === lang) return;
    if (!noReload) setTimeout(function () { location.reload(); }, 350);
  }

  /* ---- alert / confirm / prompt ---- */
  ["alert", "confirm", "prompt"].forEach(function (fn) {
    var orig = window[fn];
    window[fn] = function (msg) {
      var a = Array.prototype.slice.call(arguments);
      if (typeof a[0] === "string") a[0] = translate(a[0]);
      return orig.apply(window, a);
    };
  });

  /* ---- sana formati (en-US → joriy til) ---- */
  var origDate = Date.prototype.toLocaleDateString;
  Date.prototype.toLocaleDateString = function (loc, opts) {
    return origDate.call(this, !loc || loc === "en-US" ? L.locale : loc, opts);
  };

  /* ---- ishga tushirish ---- */
  RUFT.i18n = { lang: lang, locale: L.locale, t: t, translate: translate, setLang: setLang, langs: LANGS };

  if (lang !== "en") {
    new MutationObserver(function (records) {
      records.forEach(function (r) {
        if (r.type === "characterData") doText(r.target);
        else if (r.type === "attributes") doAttrs(r.target);
        else r.addedNodes.forEach(walk);
      });
      mountSwitchers();
      translateTitle();
    }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  } else {
    new MutationObserver(mountSwitchers).observe(document.documentElement, { childList: true, subtree: true });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (lang !== "en") { walk(document.body); translateTitle(); }
    mountSwitchers();
  });
  window.addEventListener("load", function () {
    var sel = document.getElementById("langSelect");
    if (sel) {
      sel.value = lang;
      sel.addEventListener("change", function () { setLang(sel.value); });
    }
  });
})();
