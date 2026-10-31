/* Transfer page */
(function () {
  const Store = RUFT.Store;
  const Utils = RUFT.Utils;
  const UI = RUFT.UI;

  const user = UI.requireAuth();
  if (!user) return;

  document.addEventListener("DOMContentLoaded", () => {
    renderFavorites();
    renderRecent();

    document.getElementById("transferForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const recipient = document.getElementById("trRecipient").value.trim();
      const amount = parseFloat(document.getElementById("trAmount").value);
      const currency = document.getElementById("trCurrency").value;
      const desc = document.getElementById("trDescription").value.trim();
      const schedule = document.getElementById("trSchedule").value;
      const fav = document.getElementById("trFavorite").checked;

      if (!recipient) return UI.toast("Enter a recipient", "error");
      if (!amount || amount <= 0)
        return UI.toast("Enter a valid amount", "error");
      if (amount > (user.balance || 0))
        return UI.toast("Insufficient balance", "error");

      // Deduct balance
      const newBalance = (user.balance || 0) - amount;
      Store.updateUser(user.phone, { balance: newBalance });
      user.balance = newBalance;

      // Add transaction
      Store.addTransaction(user.phone, {
        id: "t_" + Date.now(),
        title: "Transfer to " + recipient,
        category: "Transfer",
        type: "transfer",
        amount,
        currency,
        description: desc,
        schedule,
        date: new Date().toISOString(),
        status: "completed",
      });

      // Favorite
      if (fav) {
        const favs = Store.getFavorites(user.phone);
        if (!favs.find((f) => f.name === recipient)) {
          favs.push({ name: recipient, phone: "" });
          Store.saveFavorites(user.phone, favs);
        }
      }

      UI.toast(
        "Transfer of " + Utils.formatMoney(amount, currency) + " sent!",
        "success",
      );
      e.target.reset();
      renderFavorites();
      renderRecent();
    });
  });

  function renderFavorites() {
    const host = document.getElementById("favList");
    if (!host) return;
    const favs = Store.getFavorites(user.phone);
    if (favs.length === 0) {
      host.innerHTML =
        '<p style="color:var(--text-3);font-size:.85rem;">No favorites yet</p>';
      return;
    }
    host.innerHTML = favs
      .map(
        (f) => `
      <div class="fav-chip">
        <div class="avatar">${Utils.escapeHtml(Utils.initials(f.name, ""))}</div>
        <span>${Utils.escapeHtml(f.name)}</span>
      </div>
    `,
      )
      .join("");
  }

  function renderRecent() {
    const host = document.getElementById("recentTransfers");
    if (!host) return;
    const txs = Store.getTransactions(user.phone)
      .filter((t) => t.type === "transfer")
      .slice(0, 5);
    if (txs.length === 0) {
      host.innerHTML =
        '<p style="color:var(--text-3);font-size:.85rem;padding:12px;">No transfers yet</p>';
      return;
    }
    host.innerHTML = txs
      .map((tx) => {
        const date = new Date(tx.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        return `
        <div class="tx-item">
          <div class="tx-icon transfer"><i class="fa-solid fa-paper-plane"></i></div>
          <div class="tx-info"><strong>${Utils.escapeHtml(tx.title)}</strong><small>${date}</small></div>
          <div class="tx-amount negative">-${Utils.formatMoney(tx.amount, tx.currency)}</div>
        </div>
      `;
      })
      .join("");
  }
})();
