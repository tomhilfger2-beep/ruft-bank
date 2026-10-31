/* Login 3D — kartalar sahnasi va sichqoncha parallaksi (faqat login.html) */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  function shape(html, css, d, delay) {
    var el = document.createElement("div");
    el.className = "l3d-shape";
    el.style.cssText = css + ";--d:" + d + ";--delay:" + delay + "s";
    el.innerHTML = html;
    return el;
  }

  function init() {
    var side = document.querySelector(".auth-side");
    if (side) {
      var scene = document.createElement("div");
      scene.className = "l3d-scene";
      scene.innerHTML =
        '<span class="l3d-ring"></span>' +
        '<div class="l3d-stack">' +
        '<div class="l3d-card c-humo"><span class="l3d-chip"></span><b>HUMO</b><em>9860 •••• •••• 4821</em></div>' +
        '<div class="l3d-card c-uz"><span class="l3d-chip"></span><b>UZCARD</b><em>8600 •••• •••• 3947</em></div>' +
        '<div class="l3d-card c-visa"><span class="l3d-chip"></span><b>VISA</b><em>4821 •••• •••• 1290</em></div>' +
        "</div>";
      scene.appendChild(shape('<div class="l3d-cube"><i></i><i></i><i></i><i></i><i></i><i></i></div>', "top:-18px;left:-26px", 26, 0));
      scene.appendChild(shape('<div class="l3d-coin">$</div>', "bottom:-8px;right:8px", 30, -2));
      side.insertBefore(scene, side.querySelector(".auth-side-blob"));

      if (!reduce && fine) {
        var stack = scene.querySelector(".l3d-stack");
        side.addEventListener("pointermove", function (e) {
          var r = side.getBoundingClientRect();
          var px = ((e.clientX - r.left) / r.width - 0.5) * 2;
          var py = ((e.clientY - r.top) / r.height - 0.5) * 2;
          [scene, stack].forEach(function (t) {
            t.style.setProperty("--px", px.toFixed(3));
            t.style.setProperty("--py", py.toFixed(3));
            t.style.setProperty("--rx", (-py * 12).toFixed(2) + "deg");
            t.style.setProperty("--ry", (px * 16).toFixed(2) + "deg");
          });
        });
        side.addEventListener("pointerleave", function () {
          [scene, stack].forEach(function (t) {
            t.style.setProperty("--px", "0"); t.style.setProperty("--py", "0");
            t.style.setProperty("--rx", "0deg"); t.style.setProperty("--ry", "0deg");
          });
        });
      }
    }

    var wrap = document.querySelector(".auth-form-wrap");
    var card = document.querySelector(".auth-form-card");
    if (wrap && card && !reduce && fine) {
      wrap.addEventListener("pointermove", function (e) {
        var r = wrap.getBoundingClientRect();
        var px = ((e.clientX - r.left) / r.width - 0.5) * 2;
        var py = ((e.clientY - r.top) / r.height - 0.5) * 2;
        card.style.setProperty("--frx", (-py * 3).toFixed(2) + "deg");
        card.style.setProperty("--fry", (px * 4).toFixed(2) + "deg");
        var cr = card.getBoundingClientRect();
        card.style.setProperty("--gx", e.clientX - cr.left + "px");
        card.style.setProperty("--gy", e.clientY - cr.top + "px");
        card.classList.add("l3d-hover");
      });
      wrap.addEventListener("pointerleave", function () {
        card.style.setProperty("--frx", "0deg");
        card.style.setProperty("--fry", "0deg");
        card.classList.remove("l3d-hover");
      });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
