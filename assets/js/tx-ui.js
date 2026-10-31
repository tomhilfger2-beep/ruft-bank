/* Tranzaksiyalar sahifasi: animatsiyali select va qator animatsiyalari */
(function () {
  "use strict";
  var doc = document;

  function enhance(sel) {
    if (sel.dataset.fx) return;
    sel.dataset.fx = "1";
    var wrap = doc.createElement("div");
    wrap.className = "fx-select";
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    sel.classList.add("fx-native");
    sel.tabIndex = -1;

    var btn = doc.createElement("button");
    btn.type = "button";
    btn.className = "fx-select-btn";
    btn.setAttribute("aria-haspopup", "listbox");
    btn.innerHTML = '<span class="fx-label"></span><i class="fa-solid fa-chevron-down fx-caret"></i>';
    var menu = doc.createElement("ul");
    menu.className = "fx-select-menu";
    menu.setAttribute("role", "listbox");
    wrap.appendChild(btn);
    wrap.appendChild(menu);

    var items = [];
    function dotFor(v) { return v === "income" || v === "expense" || v === "transfer" ? '<span class="fx-dot ' + v + '"></span>' : ""; }

    function build() {
      menu.innerHTML = "";
      items = [];
      Array.prototype.forEach.call(sel.options, function (o, i) {
        var li = doc.createElement("li");
        li.setAttribute("role", "option");
        li.style.setProperty("--n", i);
        li.dataset.value = o.value;
        li.innerHTML = dotFor(o.value) + "<span></span>";
        li.lastChild.textContent = o.textContent;
        li.addEventListener("click", function (e) { e.stopPropagation(); choose(i); });
        menu.appendChild(li);
        items.push(li);
      });
      refresh();
    }
    function refresh() {
      var o = sel.options[sel.selectedIndex];
      var label = btn.querySelector(".fx-label");
      label.innerHTML = o ? dotFor(o.value) + "<span></span>" : "";
      if (o) label.lastChild.textContent = o.textContent;
      items.forEach(function (li, i) { li.classList.toggle("active", i === sel.selectedIndex); });
    }
    function choose(i) {
      sel.selectedIndex = i;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      refresh();
      close();
      btn.focus();
    }
    function open() {
      doc.querySelectorAll(".fx-select.open").forEach(function (e) { if (e !== wrap) e.classList.remove("open"); });
      wrap.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
    }
    function close() {
      wrap.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      items.forEach(function (li) { li.classList.remove("focus"); });
    }
    function move(d) {
      var cur = items.findIndex(function (li) { return li.classList.contains("focus"); });
      if (cur < 0) cur = sel.selectedIndex;
      var n = Math.max(0, Math.min(items.length - 1, cur + d));
      items.forEach(function (li) { li.classList.remove("focus"); });
      items[n].classList.add("focus");
      items[n].scrollIntoView({ block: "nearest" });
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      wrap.classList.contains("open") ? close() : open();
    });
    btn.addEventListener("keydown", function (e) {
      var isOpen = wrap.classList.contains("open");
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!isOpen) open();
        move(e.key === "ArrowDown" ? 1 : -1);
      } else if (e.key === "Enter" || e.key === " ") {
        var f = items.findIndex(function (li) { return li.classList.contains("focus"); });
        if (isOpen && f >= 0) { e.preventDefault(); choose(f); }
      } else if (e.key === "Escape") { close(); }
    });
    sel.addEventListener("change", refresh);
    build();
  }

  function animateRows(body) {
    function run() {
      body.querySelectorAll("tr").forEach(function (tr, i) {
        tr.style.setProperty("--r", i);
        tr.classList.remove("tx-row-in");
        void tr.offsetWidth;
        tr.classList.add("tx-row-in");
      });
    }
    new MutationObserver(run).observe(body, { childList: true });
    run();
  }

  function init() {
    doc.querySelectorAll(".filter-group select").forEach(enhance);
    doc.addEventListener("click", function () {
      doc.querySelectorAll(".fx-select.open").forEach(function (e) { e.classList.remove("open"); });
    });
    var body = doc.getElementById("txBody");
    if (body) animateRows(body);
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init);
  else init();
})();
