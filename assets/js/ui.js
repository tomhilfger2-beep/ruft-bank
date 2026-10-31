/* RUFT Bank — Shared UI: theme, sidebar, topbar, toast, guards */
(function () {
  const Store = RUFT.Store;
  const Utils = RUFT.Utils;

  // ===== Theme =====
  function applyTheme(theme) {
    let effective = theme;
    if (theme === "system") {
      effective = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    document.documentElement.setAttribute("data-theme", effective);
    document.querySelectorAll(".theme-toggle i").forEach((i) => {
      i.className =
        effective === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
    });
    document.querySelectorAll("[data-theme-picker] button").forEach((b) => {
      b.classList.toggle("active", b.dataset.theme === theme);
    });
  }
  function initTheme() {
    const settings = Store.getSettings();
    applyTheme(settings.theme || "light");
    document.querySelectorAll("#themeToggle, .auth-theme").forEach((btn) => {
      btn.addEventListener("click", () => {
        const s = Store.getSettings();
        const next = s.theme === "dark" ? "light" : "dark";
        s.theme = next;
        Store.saveSettings(s);
        applyTheme(next);
      });
    });
    const picker = document.getElementById("themePicker");
    if (picker) {
      picker.querySelectorAll("button").forEach((b) => {
        b.addEventListener("click", () => {
          const s = Store.getSettings();
          s.theme = b.dataset.theme;
          Store.saveSettings(s);
          applyTheme(b.dataset.theme);
          picker
            .querySelectorAll("button")
            .forEach((x) => x.classList.toggle("active", x === b));
        });
      });
      picker.querySelectorAll("button").forEach((b) => {
        b.classList.toggle(
          "active",
          b.dataset.theme === (Store.getSettings().theme || "light"),
        );
      });
    }
  }

  // ===== Sidebar =====
  function renderSidebar() {
    const sb = document.getElementById("sidebar");
    if (!sb) return;
    const user = Store.currentUser();
    const current = location.pathname.split("/").pop() || "dashboard.html";
    const links = [
      { section: "Main" },
      { href: "dashboard.html", icon: "fa-house", label: "Dashboard" },
      { href: "cards.html", icon: "fa-credit-card", label: "Cards" },
      { href: "transfer.html", icon: "fa-paper-plane", label: "Transfer" },
      { href: "transactions.html", icon: "fa-receipt", label: "Transactions" },
      { section: "Finance" },
      { href: "deposit.html", icon: "fa-piggy-bank", label: "Deposits" },
      { section: "Account" },
      { href: "profile.html", icon: "fa-user", label: "Profile" },
      { href: "settings.html", icon: "fa-gear", label: "Settings" },
    ];
    const adminLink = {
      href: "admin.html",
      icon: "fa-user-shield",
      label: "Admin Panel",
    };

    let html = `<a href="dashboard.html" class="logo"><div class="logo-mark"><i class="fa-solid fa-vault"></i></div><span>RUFT<span class="logo-accent">Bank</span></span></a>`;
    html += `<nav class="sidebar-nav">`;
    links.forEach((l) => {
      if (l.section) html += `<div class="sidebar-section">${l.section}</div>`;
      else
        html += `<a href="${l.href}" class="sidebar-link ${current === l.href ? "active" : ""}"><i class="fa-solid ${l.icon}"></i><span>${l.label}</span></a>`;
    });
    html += `<a href="${adminLink.href}" class="sidebar-link ${current === adminLink.href ? "active" : ""}"><i class="fa-solid ${adminLink.icon}"></i><span>${adminLink.label}</span></a>`;
    html += `</nav>`;
    if (user) {
      html += `<div class="sidebar-foot">
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="avatar">${Utils.escapeHtml(Utils.initials(user.firstName, user.lastName))}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${Utils.escapeHtml(user.firstName)} ${Utils.escapeHtml(user.lastName)}</div>
            <div style="font-size:.7rem;color:var(--text-3);">Premium</div>
          </div>
        </div>
      </div>`;
    }
    sb.innerHTML = html;
  }

  // ===== Topbar =====
  function renderTopbar() {
    const tb = document.getElementById("topbar");
    if (!tb) return;
    const user = Store.currentUser();
    tb.innerHTML = `
      <button class="icon-btn sidebar-toggle" id="sidebarToggle"><i class="fa-solid fa-bars"></i></button>
      <div class="topbar-search">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" placeholder="Search transactions, cards, people..." id="globalSearch" />
      </div>
      <div class="topbar-actions">
        <button class="icon-btn" id="notifBtn" title="Notifications">
          <i class="fa-solid fa-bell"></i><span class="dot"></span>
        </button>
        <button class="theme-toggle" id="themeToggleTop"><i class="fa-solid fa-moon"></i></button>
        <a href="profile.html" class="topbar-user">
          <div class="avatar">${user ? Utils.escapeHtml(Utils.initials(user.firstName, user.lastName)) : "U"}</div>
          <div class="topbar-user-info">
            <strong>${user ? Utils.escapeHtml(user.firstName) : "User"}</strong>
            <small>Premium</small>
          </div>
        </a>
      </div>
    `;
    document.getElementById("themeToggleTop").addEventListener("click", () => {
      const s = Store.getSettings();
      const next = s.theme === "dark" ? "light" : "dark";
      s.theme = next;
      Store.saveSettings(s);
      applyTheme(next);
    });
    document.getElementById("sidebarToggle").addEventListener("click", () => {
      document.getElementById("sidebar").classList.toggle("open");
    });
    document.getElementById("notifBtn").addEventListener("click", () => {
      RUFT.UI.toast("You have 3 new notifications", "info");
    });
    const gs = document.getElementById("globalSearch");
    if (gs)
      gs.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && gs.value.trim()) {
          location.href =
            "transactions.html?q=" + encodeURIComponent(gs.value.trim());
        }
      });
  }

  // ===== Toast =====
  function ensureToastWrap() {
    let w = document.querySelector(".toast-wrap");
    if (!w) {
      w = document.createElement("div");
      w.className = "toast-wrap";
      document.body.appendChild(w);
    }
    return w;
  }
  function toast(message, type = "info", duration = 3000) {
    const w = ensureToastWrap();
    const t = document.createElement("div");
    t.className = "toast " + type;
    const icon =
      type === "success"
        ? "fa-circle-check"
        : type === "error"
          ? "fa-circle-xmark"
          : "fa-circle-info";
    t.innerHTML = `<i class="fa-solid ${icon}"></i><span>${Utils.escapeHtml(message)}</span>`;
    w.appendChild(t);
    setTimeout(() => {
      t.style.opacity = "0";
      t.style.transform = "translateX(30px)";
      t.style.transition = "all .3s";
    }, duration - 300);
    setTimeout(() => t.remove(), duration);
  }

  // ===== Modal helpers =====
  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.hidden = false;
    m.querySelectorAll("[data-close]").forEach((b) =>
      b.addEventListener("click", () => closeModal(id)),
    );
    m.querySelector(".modal-backdrop")?.addEventListener("click", () =>
      closeModal(id),
    );
  }
  function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.hidden = true;
  }

  // ===== Password toggle =====
  function initPasswordToggles() {
    document.querySelectorAll(".input-eye").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = document.getElementById(btn.dataset.target);
        if (!target) return;
        const isPwd = target.type === "password";
        target.type = isPwd ? "text" : "password";
        btn.querySelector("i").className = isPwd
          ? "fa-solid fa-eye-slash"
          : "fa-solid fa-eye";
      });
    });
  }

  // ===== Auth guard =====
  function requireAuth(redirectTo = "login.html") {
    const user = Store.currentUser();
    if (!user) {
      location.href = redirectTo;
      return null;
    }
    return user;
  }

  // ===== Init =====
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    renderSidebar();
    renderTopbar();
    initPasswordToggles();
  });

  RUFT.UI = { toast, openModal, closeModal, requireAuth, applyTheme };
})();
