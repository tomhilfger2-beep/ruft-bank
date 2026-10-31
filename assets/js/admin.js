/* Admin panel */
(function () {
  const Store = RUFT.Store;
  const Utils = RUFT.Utils;
  const UI = RUFT.UI;

  document.addEventListener("DOMContentLoaded", () => {
    const users = Store.getUsers();
    const allCards = Object.values(Store.get(Store.KEYS.CARDS, {})).reduce(
      (a, b) => a.concat(b),
      [],
    );
    const allTx = Object.values(Store.get(Store.KEYS.TRANSACTIONS, {})).reduce(
      (a, b) => a.concat(b),
      [],
    );
    const volume = allTx.reduce((a, b) => a + (b.amount || 0), 0);

    document.getElementById("adUsers").textContent = users.length || 1;
    document.getElementById("adTx").textContent = allTx.length;
    document.getElementById("adCards").textContent = allCards.length;
    document.getElementById("adVol").textContent = Utils.formatMoney(volume);

    const tb = document.getElementById("adUsersTable");
    if (users.length === 0) {
      tb.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-3);">No registered users yet</td></tr>`;
    } else {
      tb.innerHTML = users
        .map((u) => {
          const cards = Store.getCards(u.phone);
          return `
          <tr>
            <td><div style="display:flex;align-items:center;gap:10px;"><div class="avatar">${Utils.escapeHtml(Utils.initials(u.firstName, u.lastName))}</div><strong>${Utils.escapeHtml(u.firstName)} ${Utils.escapeHtml(u.lastName)}</strong></div></td>
            <td>${Utils.escapeHtml(u.phone)}</td>
            <td>${new Date(u.createdAt).toLocaleDateString()}</td>
            <td>${cards.length}</td>
            <td>${Utils.formatMoney(u.balance || 0)}</td>
            <td><span class="badge">Active</span></td>
          </tr>
        `;
        })
        .join("");
    }

    if (window.RUFTCharts) {
      RUFTCharts.renderAdminUsersChart("adUsersChart");
      RUFTCharts.renderAdminVolChart("adVolChart");
    }
  });
})();
