/* Profile page */
(function () {
  const Store = RUFT.Store;
  const Utils = RUFT.Utils;
  const UI = RUFT.UI;

  const user = UI.requireAuth();
  if (!user) return;

  document.addEventListener("DOMContentLoaded", () => {
    render();

    document.getElementById("profileForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const patch = {
        firstName:
          document.getElementById("pfFirst").value.trim() || user.firstName,
        lastName:
          document.getElementById("pfLast").value.trim() || user.lastName,
        email: document.getElementById("pfEmail").value.trim(),
        dob: document.getElementById("pfDob").value,
        address: document.getElementById("pfAddress").value.trim(),
      };
      Store.updateUser(user.phone, patch);
      UI.toast("Profile updated", "success");
      render();
    });
  });

  function render() {
    const u = Store.currentUser();
    document.getElementById("profileAvatar").textContent = Utils.initials(
      u.firstName,
      u.lastName,
    );
    document.getElementById("profileName").textContent =
      u.firstName + " " + u.lastName;
    document.getElementById("profilePhone").textContent = u.phone;
    document.getElementById("profileDate").textContent = new Date(
      u.createdAt,
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const cards = Store.getCards(u.phone);
    document.getElementById("profileCards").textContent = cards.length;

    document.getElementById("pfFirst").value = u.firstName || "";
    document.getElementById("pfLast").value = u.lastName || "";
    document.getElementById("pfEmail").value = u.email || "";
    document.getElementById("pfDob").value = u.dob || "";
    document.getElementById("pfAddress").value = u.address || "";

    // Devices
    const dev = document.getElementById("devicesList");
    dev.innerHTML = `
      <li><div><i class="fa-solid fa-mobile-screen"></i><div><strong>iPhone 15 Pro</strong><small>Tashkent, UZ • Active now</small></div></div><span class="badge">Current</span></li>
      <li><div><i class="fa-solid fa-laptop"></i><div><strong>MacBook Pro</strong><small>Tashkent, UZ • 2h ago</small></div></div><button class="btn btn-ghost">Revoke</button></li>
      <li><div><i class="fa-solid fa-tablet-screen-button"></i><div><strong>iPad Air</strong><small>Samarkand, UZ • Yesterday</small></div></div><button class="btn btn-ghost">Revoke</button></li>
    `;

    // Cards list
    const host = document.getElementById("profileCardsList");
    host.innerHTML =
      cards
        .map(
          (c) => `
      <div class="mini-card ${c.color}">
        <div class="mini-card-top">
          <div class="mini-card-chip"></div>
          <div class="mini-card-brand"><i class="fa-brands fa-cc-${c.type === "mastercard" ? "mastercard" : "visa"}"></i></div>
        </div>
        <div class="mini-card-number">${Utils.maskCardNumber(c.number)}</div>
        <div class="mini-card-bottom">
          <div><small>Card Holder</small><div class="mini-card-name">${Utils.escapeHtml(u.firstName)} ${Utils.escapeHtml(u.lastName)}</div></div>
          <div><small>Expires</small><div>${c.month}/${String(c.year).slice(-2)}</div></div>
        </div>
      </div>
    `,
        )
        .join("") || '<p style="color:var(--text-3);">No cards yet</p>';
  }
})();
